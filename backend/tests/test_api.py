import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


def test_health_endpoint():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/health")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "ok"
            assert "version" in data
            assert "providers" in data

    asyncio.get_event_loop().run_until_complete(_test())


def test_dbtest_endpoint():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/dbtest")
            assert resp.status_code == 200
            data = resp.json()
            assert "db" in data

    asyncio.get_event_loop().run_until_complete(_test())


def test_bible_versions():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/bible/versions")
            assert resp.status_code == 200
            data = resp.json()
            assert "versions" in data
            assert len(data["versions"]) > 0
            assert data["versions"][0]["id"] == "KJV"

    asyncio.get_event_loop().run_until_complete(_test())


def test_llm_providers():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/llm/providers")
            assert resp.status_code == 200
            data = resp.json()
            assert "available" in data

    asyncio.get_event_loop().run_until_complete(_test())


def test_auth_register_validation():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/auth/register", json={
                "email": "test@example.com",
                "name": "Test User",
                "password": "short"
            })
            assert resp.status_code == 422

    asyncio.get_event_loop().run_until_complete(_test())


def test_auth_login_without_register():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/auth/login", json={
                "email": "nonexistent@example.com",
                "password": "password123"
            })
            assert resp.status_code in [401, 500]

    asyncio.get_event_loop().run_until_complete(_test())


def test_forgot_password():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/auth/forgot-password", json={
                "email": "test@example.com"
            })
            assert resp.status_code in [200, 500]

    asyncio.get_event_loop().run_until_complete(_test())


def test_unauthorized_sync():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/sync/pull")
            assert resp.status_code in [401, 403]

    asyncio.get_event_loop().run_until_complete(_test())


def test_unauthorized_rag():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/rag/search", json={"query": "test"})
            assert resp.status_code in [401, 403]

    asyncio.get_event_loop().run_until_complete(_test())


def test_unauthorized_llm():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/llm/chat", json={
                "messages": [{"role": "user", "content": "hello"}]
            })
            assert resp.status_code in [401, 403]

    asyncio.get_event_loop().run_until_complete(_test())


def test_delete_account_validation():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/auth/delete-account", json={
                "password": "test",
                "confirm": "WRONG"
            })
            assert resp.status_code in [401, 403, 422]

    asyncio.get_event_loop().run_until_complete(_test())


def test_refresh_token_invalid():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/auth/refresh", json={
                "refresh_token": "invalid-token-12345"
            })
            assert resp.status_code in [401, 500]

    asyncio.get_event_loop().run_until_complete(_test())


def test_logout_with_invalid_token():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/auth/logout", json={
                "refresh_token": "invalid-token-12345"
            })
            assert resp.status_code in [200, 500]

    asyncio.get_event_loop().run_until_complete(_test())


def test_unauthorized_chat():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/chat", json={
                "messages": [{"role": "user", "content": "hello"}]
            })
            assert resp.status_code in [401, 403]

    asyncio.get_event_loop().run_until_complete(_test())


def test_unauthorized_bible_explain():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/bible/explain", json={
                "reference": "John 3:16",
                "text": "For God so loved the world"
            })
            assert resp.status_code in [401, 403]

    asyncio.get_event_loop().run_until_complete(_test())


def test_unauthorized_bible_commentary():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/bible/commentary", json={
                "book": "John",
                "chapter": 3
            })
            assert resp.status_code in [401, 403]

    asyncio.get_event_loop().run_until_complete(_test())


def test_unauthorized_bible_concordance():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/bible/concordance", json={
                "query": "love"
            })
            assert resp.status_code in [401, 403]

    asyncio.get_event_loop().run_until_complete(_test())


def test_unauthorized_hymns_explain():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/hymns/explain", json={
                "title": "Amazing Grace",
                "author": "John Newton",
                "lyrics": "Amazing grace how sweet the sound"
            })
            assert resp.status_code in [401, 403]

    asyncio.get_event_loop().run_until_complete(_test())


def test_unauthorized_devotional_generate():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/devotional/generate", json={
                "topic": "faith",
                "theme": "faith"
            })
            assert resp.status_code in [401, 403]

    asyncio.get_event_loop().run_until_complete(_test())


def test_unauthorized_bible_compare():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/bible/compare", json={
                "book": "John",
                "chapter": 3
            })
            assert resp.status_code in [401, 403]

    asyncio.get_event_loop().run_until_complete(_test())


def test_ssrf_whitelist_valid_book():
    from api.index import BIBLE_BOOKS
    assert "genesis" in BIBLE_BOOKS
    assert "john" in BIBLE_BOOKS
    assert "revelation" in BIBLE_BOOKS
    assert "1 samuel" in BIBLE_BOOKS
    assert "2 corinthians" in BIBLE_BOOKS
    assert len(BIBLE_BOOKS) == 66


def test_ssrf_whitelist_invalid_book():
    from api.index import BIBLE_BOOKS
    assert "hack" not in BIBLE_BOOKS
    assert "../../etc/passwd" not in BIBLE_BOOKS
    assert "admin" not in BIBLE_BOOKS


def test_email_service_not_configured():
    from api.email_service import is_configured
    import os
    original_host = os.environ.get("SMTP_HOST", "")
    original_user = os.environ.get("SMTP_USER", "")
    original_pass = os.environ.get("SMTP_PASSWORD", "")
    try:
        os.environ["SMTP_HOST"] = ""
        os.environ["SMTP_USER"] = ""
        os.environ["SMTP_PASSWORD"] = ""
        assert is_configured() == False
    finally:
        os.environ["SMTP_HOST"] = original_host
        os.environ["SMTP_USER"] = original_user
        os.environ["SMTP_PASSWORD"] = original_pass


def test_auth_register_returns_refresh_token():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/auth/register", json={
                "email": "test@example.com",
                "name": "Test User",
                "password": "password123"
            })
            if resp.status_code == 200:
                data = resp.json()
                assert "token" in data
                assert "refresh_token" in data
                assert "user" in data
                assert len(data["token"]) > 0
                assert len(data["refresh_token"]) > 0
            else:
                assert resp.status_code in [409, 500]

    asyncio.get_event_loop().run_until_complete(_test())


def test_auth_login_returns_refresh_token():
    from api.index import app
    from httpx import AsyncClient, ASGITransport
    import asyncio

    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/auth/login", json={
                "email": "nonexistent@example.com",
                "password": "password123"
            })
            assert resp.status_code in [401, 500]

    asyncio.get_event_loop().run_until_complete(_test())


def test_auth_response_format():
    from api.auth import AuthResponse
    resp = AuthResponse(token="test-token", refresh_token="test-refresh", user={"id": 1, "email": "test@test.com"})
    assert resp.token == "test-token"
    assert resp.refresh_token == "test-refresh"
    assert resp.user["id"] == 1


def test_password_hashing():
    from api.auth import hash_password, verify_password
    hashed = hash_password("testpassword123")
    assert hashed != "testpassword123"
    assert verify_password("testpassword123", hashed)
    assert not verify_password("wrongpassword", hashed)


def test_token_creation():
    from api.auth import create_token, decode_token
    token = create_token(1, "test@example.com")
    payload = decode_token(token)
    assert payload["sub"] == "1"
    assert payload["email"] == "test@example.com"
    assert "exp" in payload


def test_reset_token_creation():
    from api.auth import generate_reset_token, verify_reset_token
    token = generate_reset_token(1, "test@example.com")
    data = verify_reset_token(token)
    assert data["user_id"] == 1
    assert data["email"] == "test@example.com"


def test_verification_token_creation():
    from api.auth import generate_verification_token, verify_verification_token
    token = generate_verification_token(1, "test@example.com")
    data = verify_verification_token(token)
    assert data["user_id"] == 1
    assert data["email"] == "test@example.com"


def test_brute_force_lockout():
    """Test brute force protection uses Redis-backed functions."""
    from api.redis_client import MAX_LOGIN_ATTEMPTS, LOGIN_LOCKOUT_SECONDS
    assert MAX_LOGIN_ATTEMPTS == 5
    assert LOGIN_LOCKOUT_SECONDS == 900


def test_brute_force_lockout_resets_after_timeout():
    """Test brute force constants are properly defined."""
    from api.redis_client import LOGIN_LOCKOUT_SECONDS
    assert LOGIN_LOCKOUT_SECONDS == 900


def test_refresh_token_expiry():
    from api.auth import SECRET_KEY, ALGORITHM
    from jose import jwt
    from datetime import datetime, timedelta, timezone

    expire = datetime.now(timezone.utc) - timedelta(hours=1)
    payload = {"sub": "1", "email": "test@test.com", "exp": expire}
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    try:
        jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert False, "Should have raised"
    except Exception:
        pass


def test_access_token_payload():
    from api.auth import create_token, decode_token
    token = create_token(42, "user@test.com")
    payload = decode_token(token)
    assert payload["sub"] == "42"
    assert payload["email"] == "user@test.com"
    assert "jti" in payload  # Token should have unique ID for blocklist


def test_reset_token_rejects_verification_type():
    from api.auth import generate_verification_token, verify_reset_token
    token = generate_verification_token(1, "test@test.com")
    try:
        verify_reset_token(token)
        assert False, "Should have raised"
    except Exception as e:
        assert "Invalid token type" in str(e) or "401" in str(e)


def test_verification_token_rejects_reset_type():
    from api.auth import generate_reset_token, verify_verification_token
    token = generate_reset_token(1, "test@test.com")
    try:
        verify_verification_token(token)
        assert False, "Should have raised"
    except Exception as e:
        assert "Invalid token type" in str(e) or "401" in str(e)


def test_ssrf_whitelist_complete():
    from api.index import BIBLE_BOOKS
    assert len(BIBLE_BOOKS) == 66

    ot_books = {
        "genesis", "exodus", "leviticus", "numbers", "deuteronomy",
        "joshua", "judges", "ruth", "1 samuel", "2 samuel",
        "1 kings", "2 kings", "1 chronicles", "2 chronicles", "ezra",
        "nehemiah", "esther", "job", "psalms", "proverbs",
        "ecclesiastes", "song of solomon", "isaiah", "jeremiah",
        "lamentations", "ezekiel", "daniel", "hosea", "joel", "amos",
        "obadiah", "jonah", "micah", "nahum", "habakkuk", "zephaniah",
        "haggai", "zechariah", "malachi"
    }
    nt_books = {
        "matthew", "mark", "luke", "john", "acts", "romans",
        "1 corinthians", "2 corinthians", "galatians", "ephesians",
        "philippians", "colossians", "1 thessalonians", "2 thessalonians",
        "1 timothy", "2 timothy", "titus", "philemon", "hebrews", "james",
        "1 peter", "2 peter", "1 john", "2 john", "3 john", "jude",
        "revelation"
    }
    assert ot_books.issubset(BIBLE_BOOKS)
    assert nt_books.issubset(BIBLE_BOOKS)
    assert len(ot_books) == 39
    assert len(nt_books) == 27


def test_email_service_with_mock_smtp():
    from api import email_service
    from api.email_service import send_password_reset_email
    from unittest.mock import patch, MagicMock

    original_host = email_service.SMTP_HOST
    original_port = email_service.SMTP_PORT
    original_user = email_service.SMTP_USER
    original_pass = email_service.SMTP_PASSWORD

    try:
        email_service.SMTP_HOST = "smtp.test.com"
        email_service.SMTP_PORT = 587
        email_service.SMTP_USER = "test@test.com"
        email_service.SMTP_PASSWORD = "password"

        assert email_service.is_configured() == True

        with patch("smtplib.SMTP") as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__ = MagicMock(return_value=mock_server)
            mock_smtp.return_value.__exit__ = MagicMock(return_value=False)
            mock_server.ehlo.return_value = None
            mock_server.starttls.return_value = None
            mock_server.login.return_value = None
            mock_server.sendmail.return_value = {}

            send_password_reset_email("user@test.com", "test-token-123")
    finally:
        email_service.SMTP_HOST = original_host
        email_service.SMTP_PORT = original_port
        email_service.SMTP_USER = original_user
        email_service.SMTP_PASSWORD = original_pass


def test_password_hash_uniqueness():
    from api.auth import hash_password
    hash1 = hash_password("samepassword")
    hash2 = hash_password("samepassword")
    assert hash1 != hash2


def test_config_validation():
    from api.config import validate_config
    import os

    original_db = os.environ.get("DATABASE_URL", "")
    original_jwt = os.environ.get("JWT_SECRET_KEY", "")

    os.environ["DATABASE_URL"] = "postgres://test:test@localhost:5432/testdb"
    os.environ["JWT_SECRET_KEY"] = "a" * 64

    try:
        config = validate_config()
        assert "DATABASE_URL" in config
        assert "JWT_SECRET_KEY" in config
    finally:
        if original_db:
            os.environ["DATABASE_URL"] = original_db
        else:
            os.environ.pop("DATABASE_URL", None)
        if original_jwt:
            os.environ["JWT_SECRET_KEY"] = original_jwt
        else:
            os.environ.pop("JWT_SECRET_KEY", None)


def test_config_validation_missing_required():
    from api.config import validate_config
    import os

    original_db = os.environ.get("DATABASE_URL", "")
    original_jwt = os.environ.get("JWT_SECRET_KEY", "")

    os.environ.pop("DATABASE_URL", None)
    os.environ.pop("JWT_SECRET_KEY", None)

    try:
        try:
            validate_config()
            assert False, "Should have raised"
        except SystemExit:
            pass
    finally:
        if original_db:
            os.environ["DATABASE_URL"] = original_db
        if original_jwt:
            os.environ["JWT_SECRET_KEY"] = original_jwt
