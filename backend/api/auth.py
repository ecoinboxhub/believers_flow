import os
import json
import secrets
import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, Field

from api.database import get_pool, get_connection, DATABASE_URL
from api.redis_client import check_brute_force, record_failed_attempt, clear_failed_attempts, block_token, is_token_blocked, MAX_LOGIN_ATTEMPTS

logger = logging.getLogger("beliversflow.auth")

SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is required. Generate with: python -c \"import secrets; print(secrets.token_urlsafe(64))\"")
if len(SECRET_KEY) < 32:
    raise ValueError("JWT_SECRET_KEY must be at least 32 characters long for security")
if SECRET_KEY.startswith("local-dev") or SECRET_KEY.startswith("test"):
    import warnings
    warnings.warn("JWT_SECRET_KEY appears to be a development key. Use a secure key in production.")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # Short-lived access token
REFRESH_TOKEN_EXPIRE_DAYS = 30    # Long-lived refresh token

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token


class LegalAcceptRequest(BaseModel):
    version: str
    accepted_at: str
    documents: dict


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=128)


class DeleteAccountRequest(BaseModel):
    password: str
    confirm: str = Field(..., pattern="^DELETE MY ACCOUNT$")


class AuthResponse(BaseModel):
    token: str
    refresh_token: str
    user: dict


def hash_password(password: str) -> str:
    truncated = password[:72].encode("utf-8").decode("utf-8")
    return pwd_context.hash(truncated)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(user_id: int, email: str) -> str:
    import uuid
    jti = str(uuid.uuid4())
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "email": email, "exp": expire, "jti": jti}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def decode_token_secure(token: str) -> dict:
    """Decode token and check blocklist."""
    payload = decode_token(token)
    # Check blocklist (jti or sub as fallback)
    token_id = payload.get("jti") or payload.get("sub", "")
    if token_id and await is_token_blocked(str(token_id)):
        raise HTTPException(status_code=401, detail="Token has been revoked")
    return payload


async def create_refresh_token(user_id: int, email: str) -> str:
    token_value = secrets.token_urlsafe(64)
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
            user_id, token_value, expire
        )
    return token_value


async def revoke_refresh_token(token_value: str) -> bool:
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM refresh_tokens WHERE token = $1", token_value)
        return result.endswith("1")


async def revoke_all_user_tokens(user_id: int) -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM refresh_tokens WHERE user_id = $1", user_id)


async def refresh_access_token(refresh_token: str) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT user_id, expires_at FROM refresh_tokens WHERE token = $1",
            refresh_token
        )
        if not row:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        if row["expires_at"] < datetime.now(timezone.utc):
            await conn.execute("DELETE FROM refresh_tokens WHERE token = $1", refresh_token)
            raise HTTPException(status_code=401, detail="Refresh token expired")
        user_row = await conn.fetchrow("SELECT id, email, name, plan FROM users WHERE id = $1", row["user_id"])
        if not user_row:
            await conn.execute("DELETE FROM refresh_tokens WHERE token = $1", refresh_token)
            raise HTTPException(status_code=401, detail="User not found")
        new_access = create_token(user_row["id"], user_row["email"])
        return {"access_token": new_access, "user": dict(user_row)}


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = await decode_token_secure(credentials.credentials)
    user_id = int(payload.get("sub", 0))
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return {"id": user_id, "email": payload.get("email", "")}


async def optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials is None:
        return None
    try:
        payload = await decode_token_secure(credentials.credentials)
        user_id = int(payload.get("sub", 0))
        if user_id:
            return {"id": user_id, "email": payload.get("email", "")}
    except HTTPException:
        pass
    return None


async def register(req: RegisterRequest) -> AuthResponse:
    conn = await get_connection()
    try:
        existing = await conn.fetchrow("SELECT id FROM users WHERE email = $1", req.email.lower().strip())
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")
        hashed = hash_password(req.password)
        row = await conn.fetchrow(
            "INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name",
            req.email.lower().strip(), req.name.strip(), hashed
        )
        token = create_token(row["id"], row["email"])
        refresh = await create_refresh_token(row["id"], row["email"])
        return AuthResponse(token=token, refresh_token=refresh, user={"id": row["id"], "email": row["email"], "name": row["name"], "plan": "free"})
    finally:
        await conn.close()


async def login(req: LoginRequest) -> AuthResponse:
    email = req.email.lower().strip()

    # Check lockout via Redis
    if await check_brute_force(email):
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")

    conn = await get_connection()
    try:
        row = await conn.fetchrow(
            "SELECT id, email, name, password_hash FROM users WHERE email = $1",
            email
        )
        if not row or not verify_password(req.password, row["password_hash"]):
            count = await record_failed_attempt(email)
            remaining = MAX_LOGIN_ATTEMPTS - count
            if remaining <= 0:
                raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
            raise HTTPException(status_code=401, detail="Invalid email or password")

        await clear_failed_attempts(email)
        token = create_token(row["id"], row["email"])
        refresh = await create_refresh_token(row["id"], row["email"])
        plan = row.get("plan", "free") if "plan" in row.keys() else "free"
        return AuthResponse(token=token, refresh_token=refresh, user={"id": row["id"], "email": row["email"], "name": row["name"], "plan": plan})
    finally:
        await conn.close()


async def verify_google_token(id_token: str) -> dict:
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth not configured")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token}
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google token")
            data = resp.json()
            if data.get("aud") != GOOGLE_CLIENT_ID:
                raise HTTPException(status_code=401, detail="Invalid Google token audience")
            return {
                "email": data["email"],
                "name": data.get("name", ""),
                "picture": data.get("picture", ""),
            }
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Failed to verify Google token")


async def google_auth(req: GoogleAuthRequest) -> AuthResponse:
    google_user = await verify_google_token(req.credential)
    email = google_user["email"].lower().strip()
    name = google_user["name"] or email.split("@")[0]

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id, email, name FROM users WHERE email = $1", email)
        if row:
            plan = "free"
            try:
                plan = row["plan"]
            except Exception:
                pass
            token = create_token(row["id"], row["email"])
            refresh = await create_refresh_token(row["id"], row["email"])
            return AuthResponse(token=token, refresh_token=refresh, user={"id": row["id"], "email": row["email"], "name": row["name"], "plan": plan})

        row = await conn.fetchrow(
            "INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name",
            email, name, hash_password(os.urandom(32).hex())
        )
        token = create_token(row["id"], row["email"])
        refresh = await create_refresh_token(row["id"], row["email"])
        return AuthResponse(token=token, refresh_token=refresh, user={"id": row["id"], "email": row["email"], "name": row["name"], "plan": "free"})


async def accept_legal(user_id: int, req: LegalAcceptRequest) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        data = json.dumps({
            "version": req.version,
            "accepted_at": req.accepted_at,
            "documents": req.documents
        })
        await conn.execute("""
            INSERT INTO user_data (user_id, data_type, data)
            VALUES ($1, 'legal_acceptance', $2::jsonb)
            ON CONFLICT (user_id, data_type) DO UPDATE SET data = $2::jsonb, updated_at = NOW()
        """, user_id, data)
        return {"status": "ok", "version": req.version}


async def get_legal_acceptance(user_id: int) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT data FROM user_data WHERE user_id = $1 AND data_type = 'legal_acceptance'",
            user_id
        )
        if row:
            data = row["data"]
            # Handle both dict and JSON string cases
            if isinstance(data, str):
                data = json.loads(data)
            elif not isinstance(data, dict):
                data = dict(data) if hasattr(data, 'items') else {}
            return {"accepted": True, "data": data}
        return {"accepted": False}


def generate_reset_token(user_id: int, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    payload = {"sub": str(user_id), "email": email, "exp": expire, "type": "reset"}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_reset_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "reset":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return {"user_id": int(payload["sub"]), "email": payload["email"]}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired reset token")


def _hash_token(token: str) -> str:
    """Hash a token with SHA-256 for safe DB storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_verification_token(user_id: int, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    payload = {"sub": str(user_id), "email": email, "exp": expire, "type": "verify"}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_verification_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "verify":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return {"user_id": int(payload["sub"]), "email": payload["email"]}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired verification token")


async def request_password_reset(req: PasswordResetRequest) -> dict:
    from api.email_service import send_password_reset_email, is_configured
    email = req.email.lower().strip()
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id, email FROM users WHERE email = $1", email)
        if not row:
            return {"status": "ok", "message": "If the email exists, a reset link has been sent"}

        token = generate_reset_token(row["id"], row["email"])
        token_hash = _hash_token(token)
        await conn.execute("""
            INSERT INTO user_data (user_id, data_type, data)
            VALUES ($1, 'password_reset', $2::jsonb)
            ON CONFLICT (user_id, data_type) DO UPDATE SET data = $2::jsonb, updated_at = NOW()
        """, row["id"], json.dumps({"token_hash": token_hash, "created_at": datetime.now(timezone.utc).isoformat()}))

        if is_configured():
            send_password_reset_email(email, token)
        else:
            logger.warning(f"SMTP not configured — password reset token for {email}: {token}")

        logger.info(f"Password reset requested for {email}")
        return {"status": "ok", "message": "If the email exists, a reset link has been sent"}


async def reset_password(req: PasswordResetConfirm) -> dict:
    data = verify_reset_token(req.token)
    user_id = data["user_id"]
    token_hash = _hash_token(req.token)

    pool = await get_pool()
    async with pool.acquire() as conn:
        stored = await conn.fetchrow(
            "SELECT data FROM user_data WHERE user_id = $1 AND data_type = 'password_reset'",
            user_id
        )
        if not stored:
            raise HTTPException(status_code=400, detail="Reset token not found")

        stored_data = dict(stored["data"])
        if stored_data.get("token_hash") != token_hash:
            raise HTTPException(status_code=400, detail="Invalid reset token")

        hashed = hash_password(req.new_password)
        await conn.execute("UPDATE users SET password_hash = $1 WHERE id = $2", hashed, user_id)
        await conn.execute("DELETE FROM user_data WHERE user_id = $1 AND data_type = 'password_reset'", user_id)
        # Block current token to force re-login
        await block_token(str(user_id), ttl_seconds=ACCESS_TOKEN_EXPIRE_MINUTES * 60)

        return {"status": "ok", "message": "Password updated successfully"}


async def change_password(user_id: int, req: ChangePasswordRequest, token_jti: str = "") -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT password_hash FROM users WHERE id = $1", user_id)
        if not row or not verify_password(req.current_password, row["password_hash"]):
            raise HTTPException(status_code=401, detail="Current password is incorrect")

        hashed = hash_password(req.new_password)
        await conn.execute("UPDATE users SET password_hash = $1 WHERE id = $2", hashed, user_id)
        # Revoke ALL refresh tokens (force re-login everywhere)
        await conn.execute("DELETE FROM refresh_tokens WHERE user_id = $1", user_id)
        # Block the current access token using its actual jti
        if token_jti:
            await block_token(token_jti, ttl_seconds=ACCESS_TOKEN_EXPIRE_MINUTES * 60)
        return {"status": "ok", "message": "Password changed successfully"}


async def request_email_verification(user_id: int, email: str) -> dict:
    from api.email_service import send_verification_email, is_configured
    token = generate_verification_token(user_id, email)
    token_hash = _hash_token(token)
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO user_data (user_id, data_type, data)
            VALUES ($1, 'email_verification', $2::jsonb)
            ON CONFLICT (user_id, data_type) DO UPDATE SET data = $2::jsonb, updated_at = NOW()
        """, user_id, json.dumps({"token_hash": token_hash, "created_at": datetime.now(timezone.utc).isoformat()}))

    if is_configured():
        send_verification_email(email, token)
    else:
        logger.warning(f"SMTP not configured — verification token for {email}: {token}")

    logger.info(f"Email verification requested for {email}")
    return {"status": "ok", "message": "Verification email sent"}


async def verify_email(user_id: int, token: str) -> dict:
    data = verify_verification_token(token)
    if data["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Token does not belong to this user")

    token_hash = _hash_token(token)
    pool = await get_pool()
    async with pool.acquire() as conn:
        stored = await conn.fetchrow(
            "SELECT data FROM user_data WHERE user_id = $1 AND data_type = 'email_verification'",
            user_id
        )
        if not stored:
            raise HTTPException(status_code=400, detail="Verification token not found")

        stored_data = dict(stored["data"])
        if stored_data.get("token_hash") != token_hash:
            raise HTTPException(status_code=400, detail="Invalid verification token")

        await conn.execute("UPDATE users SET email_verified = TRUE WHERE id = $1", user_id)
        await conn.execute("DELETE FROM user_data WHERE user_id = $1 AND data_type = 'email_verification'", user_id)

        return {"status": "ok", "message": "Email verified successfully"}


async def delete_account(user_id: int, req: DeleteAccountRequest) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT password_hash FROM users WHERE id = $1", user_id)
        if not row:
            raise HTTPException(status_code=404, detail="User not found")

        if not verify_password(req.password, row["password_hash"]):
            raise HTTPException(status_code=401, detail="Incorrect password")

        await conn.execute("DELETE FROM refresh_tokens WHERE user_id = $1", user_id)
        await conn.execute("DELETE FROM user_data WHERE user_id = $1", user_id)
        await conn.execute("DELETE FROM users WHERE id = $1", user_id)
        # Block the current token
        await block_token(str(user_id), ttl_seconds=ACCESS_TOKEN_EXPIRE_MINUTES * 60)

        return {"status": "ok", "message": "Account deleted successfully"}
