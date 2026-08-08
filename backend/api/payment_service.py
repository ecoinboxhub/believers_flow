"""
Flutterwave Payment Service — Handles checkout, verification, webhooks,
idempotency, and transaction logging.
"""
import os
import json
import hashlib
import hmac
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import HTTPException

logger = logging.getLogger("beliversflow.payment")

FLUTTERWAVE_SECRET_KEY = os.environ.get("FLUTTERWAVE_SECRET_KEY", "")
FLUTTERWAVE_PUBLIC_KEY = os.environ.get("FLUTTERWAVE_PUBLIC_KEY", "")
FLUTTERWAVE_WEBHOOK_SECRET = os.environ.get("FLUTTERWAVE_WEBHOOK_SECRET", "")
FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3"

PLAN_PRICES = {
    "monthly": 2.99,
    "annual": 29.99,
}

PLAN_INTERVALS = {
    "monthly": "1 month",
    "annual": "1 year",
}


def is_configured() -> bool:
    return bool(FLUTTERWAVE_SECRET_KEY and FLUTTERWAVE_PUBLIC_KEY)


async def _log_transaction(
    user_id: str,
    reference: str,
    plan: str,
    amount: float = None,
    currency: str = "USD",
    status: str = "pending",
    flutterwave_id: str = None,
    idempotency_key: str = None,
    error_message: str = None,
    metadata: dict = None,
):
    """Log a payment transaction to the database."""
    from api.database import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO payment_transactions
                (user_id, reference, plan, amount, currency, status,
                 flutterwave_id, idempotency_key, error_message, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (reference)
            DO UPDATE SET
                status = EXCLUDED.status,
                flutterwave_id = COALESCE(EXCLUDED.flutterwave_id, payment_transactions.flutterwave_id),
                error_message = COALESCE(EXCLUDED.error_message, payment_transactions.error_message),
                metadata = payment_transactions.metadata || EXCLUDED.metadata,
                updated_at = NOW()
        """, int(user_id) if user_id else None, reference, plan,
            amount, currency, status, flutterwave_id,
            idempotency_key, error_message,
            json.dumps(metadata) if metadata else '{}')


async def _check_idempotency(idempotency_key: str) -> Optional[dict]:
    """Check if an idempotency key has been used already."""
    from api.database import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT reference, status, plan FROM payment_transactions
            WHERE idempotency_key = $1 AND status IN ('completed', 'processing')
        """, idempotency_key)
    if row:
        return {
            "reference": row["reference"],
            "status": row["status"],
            "plan": row["plan"],
        }
    return None


async def _handle_duplicate_webhook(reference: str, flutterwave_id: str) -> bool:
    """Check if a webhook event has already been processed (duplicate protection)."""
    from api.database import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT status FROM payment_transactions
            WHERE reference = $1 AND flutterwave_id = $2 AND status = 'completed'
        """, reference, flutterwave_id)
    return row is not None


async def create_checkout(
    email: str,
    user_id: str,
    plan: str,
    currency: str = "USD",
    callback_url: str = "",
    idempotency_key: str = None,
) -> dict:
    if not is_configured():
        raise HTTPException(status_code=503, detail="Payment system not configured")

    if plan not in PLAN_PRICES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid plan: {plan}. Must be 'monthly' or 'annual'"
        )

    # Check idempotency
    if idempotency_key:
        existing = await _check_idempotency(idempotency_key)
        if existing:
            logger.info(f"Idempotent checkout: {idempotency_key} -> {existing['reference']}")
            return {
                "checkout_url": None,
                "reference": existing["reference"],
                "amount": PLAN_PRICES[plan],
                "currency": currency,
                "plan": plan,
                "status": existing["status"],
            }

    amount = PLAN_PRICES[plan]
    timestamp = int(datetime.now(timezone.utc).timestamp())
    reference = f"bf_{user_id[:8]}_{plan}_{timestamp}"

    await _log_transaction(
        user_id=user_id,
        reference=reference,
        plan=plan,
        amount=amount,
        currency=currency,
        status="pending",
        idempotency_key=idempotency_key,
        metadata={"email": email},
    )

    payload = {
        "tx_ref": reference,
        "amount": str(amount),
        "currency": currency,
        "email": email,
        "meta": {"user_id": user_id, "plan": plan},
        "redirect_url": callback_url or (
            f"{os.environ.get('FRONTEND_URL', 'https://christian-task-manager.vercel.app')}"
            f"/settings?payment={reference}"
        ),
        "customer": {"email": email},
        "customizations": {
            "title": "BelieversFlow Premium",
            "description": f"Premium subscription - {plan}",
        },
    }

    headers = {
        "Authorization": f"Bearer {FLUTTERWAVE_SECRET_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{FLUTTERWAVE_BASE_URL}/payments",
                json=payload,
                headers=headers,
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()

            if data.get("status") == "success":
                flutterwave_id = str(data["data"].get("id", ""))
                await _log_transaction(
                    user_id=user_id,
                    reference=reference,
                    plan=plan,
                    amount=amount,
                    currency=currency,
                    status="processing",
                    flutterwave_id=flutterwave_id,
                    idempotency_key=idempotency_key,
                    metadata={"flutterwave_response": data},
                )
                logger.info(f"Checkout created: {reference} for {email}")
                return {
                    "checkout_url": data["data"]["link"],
                    "reference": reference,
                    "amount": amount,
                    "currency": currency,
                    "plan": plan,
                    "status": "processing",
                }
            else:
                await _log_transaction(
                    user_id=user_id, reference=reference, plan=plan,
                    amount=amount, currency=currency, status="failed",
                    error_message=data.get("message", "Payment initialization failed"),
                    idempotency_key=idempotency_key,
                )
                raise HTTPException(
                    status_code=400,
                    detail=data.get("message", "Payment initialization failed")
                )
    except httpx.HTTPStatusError as e:
        await _log_transaction(
            user_id=user_id, reference=reference, plan=plan,
            amount=amount, currency=currency, status="failed",
            error_message=f"Flutterwave API error: {e}",
            idempotency_key=idempotency_key,
        )
        raise HTTPException(status_code=502, detail="Payment service error")
    except httpx.RequestError as e:
        await _log_transaction(
            user_id=user_id, reference=reference, plan=plan,
            amount=amount, currency=currency, status="failed",
            error_message=f"Connection error: {e}",
            idempotency_key=idempotency_key,
        )
        raise HTTPException(status_code=503, detail="Payment service unavailable")


async def verify_transaction(reference: str) -> dict:
    if not is_configured():
        raise HTTPException(status_code=503, detail="Payment system not configured")

    headers = {"Authorization": f"Bearer {FLUTTERWAVE_SECRET_KEY}"}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{FLUTTERWAVE_BASE_URL}/transactions/verify",
                params={"tx_ref": reference},
                headers=headers,
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()

            if data.get("status") == "success":
                tx_data = data["data"]
                is_successful = tx_data.get("status") == "successful"
                flutterwave_id = str(tx_data.get("id", ""))

                await _log_transaction(
                    user_id=str(tx_data.get("meta", {}).get("user_id", "")),
                    reference=reference,
                    plan=tx_data.get("meta", {}).get("plan", "monthly"),
                    amount=tx_data.get("amount"),
                    currency=tx_data.get("currency", "USD"),
                    status="completed" if is_successful else "failed",
                    flutterwave_id=flutterwave_id,
                    metadata={"verification_response": tx_data},
                )

                logger.info(f"Transaction verified: {reference} - {'success' if is_successful else 'failed'}")
                return {
                    "verified": True,
                    "successful": is_successful,
                    "reference": reference,
                    "amount": tx_data.get("amount"),
                    "currency": tx_data.get("currency"),
                    "status": tx_data.get("status"),
                    "plan": tx_data.get("meta", {}).get("plan"),
                    "user_id": tx_data.get("meta", {}).get("user_id"),
                    "created_at": tx_data.get("created_at"),
                    "flutterwave_id": flutterwave_id,
                }
            else:
                return {
                    "verified": False, "successful": False,
                    "reference": reference,
                    "error": data.get("message", "Verification failed"),
                }
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail="Payment verification service error")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail="Payment verification service unavailable")


async def process_webhook_event(payload: dict) -> dict:
    """Process a verified webhook event with duplicate protection and idempotency."""
    event = payload.get("event")
    data = payload.get("data", {})

    logger.info(f"Webhook processing: {event}")

    if event == "charge.completed":
        status = data.get("status")
        reference = data.get("tx_ref")
        flutterwave_id = str(data.get("id", ""))
        user_id = data.get("meta", {}).get("user_id")
        plan = data.get("meta", {}).get("plan")

        if not reference:
            logger.warning("Webhook missing tx_ref")
            return {"status": "skipped", "reason": "missing_reference"}

        # Duplicate webhook protection
        if flutterwave_id:
            already_processed = await _handle_duplicate_webhook(reference, flutterwave_id)
            if already_processed:
                logger.info(f"Duplicate webhook suppressed: {reference}")
                return {"status": "duplicate", "reference": reference}

        if status == "successful" and user_id and plan:
            if plan not in ("monthly", "annual"):
                logger.warning(f"Invalid plan in webhook: {plan}")
                return {"status": "ok"}

            interval = PLAN_INTERVALS.get(plan, "1 month")
            from api.database import get_pool
            pool = await get_pool()
            async with pool.acquire() as conn:
                async with conn.transaction():
                    await conn.execute("""
                        UPDATE users
                        SET plan = 'premium',
                            plan_expires_at = NOW() + ($1::text)::interval,
                            updated_at = NOW()
                        WHERE id = $2
                    """, interval, int(user_id))

                    await _log_transaction(
                        user_id=user_id,
                        reference=reference,
                        plan=plan,
                        amount=data.get("amount"),
                        currency=data.get("currency", "USD"),
                        status="completed",
                        flutterwave_id=flutterwave_id,
                        metadata={"webhook_event": event},
                    )

            logger.info(f"User {user_id} upgraded via webhook: {plan}")
            return {"status": "completed", "reference": reference, "plan": plan, "user_id": user_id}
        else:
            await _log_transaction(
                user_id=user_id or "0",
                reference=reference,
                plan=plan or "unknown",
                status="failed",
                flutterwave_id=flutterwave_id,
                error_message=f"Webhook status: {status}",
            )
            logger.warning(f"Webhook charge not successful: {reference}, status: {status}")

    elif event == "charge.failed":
        reference = data.get("tx_ref")
        user_id = data.get("meta", {}).get("user_id")
        plan = data.get("meta", {}).get("plan")
        if reference:
            await _log_transaction(
                user_id=user_id or "0",
                reference=reference,
                plan=plan or "unknown",
                status="failed",
                flutterwave_id=str(data.get("id", "")),
                error_message=data.get("processor_response", "Payment failed"),
            )
            logger.info(f"Payment failed webhook: {reference}")

    elif event == "charge.cancelled":
        reference = data.get("tx_ref")
        user_id = data.get("meta", {}).get("user_id")
        if reference:
            await _log_transaction(
                user_id=user_id or "0",
                reference=reference,
                plan=data.get("meta", {}).get("plan", "unknown"),
                status="cancelled",
                flutterwave_id=str(data.get("id", "")),
            )
            logger.info(f"Payment cancelled webhook: {reference}")

    return {"status": "ok"}


def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    if not FLUTTERWAVE_WEBHOOK_SECRET:
        logger.critical("WEBHOOK SECRET NOT CONFIGURED — rejecting all webhooks (fail-closed)")
        raise ValueError("Webhook secret not configured. Set FLUTTERWAVE_WEBHOOK_SECRET.")

    if not signature:
        logger.warning("Webhook signature missing")
        return False

    expected_hash = hmac.new(
        FLUTTERWAVE_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected_hash, signature)


async def get_transaction_history(user_id: str, limit: int = 20, offset: int = 0) -> dict:
    """Get payment transaction history for a user."""
    from api.database import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT reference, plan, amount, currency, status,
                   flutterwave_id, error_message, created_at, updated_at
            FROM payment_transactions
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        """, int(user_id), limit, offset)

        total = await conn.fetchval("""
            SELECT COUNT(*) FROM payment_transactions WHERE user_id = $1
        """, int(user_id))

    return {
        "transactions": [
            {
                "reference": r["reference"],
                "plan": r["plan"],
                "amount": float(r["amount"]) if r["amount"] else None,
                "currency": r["currency"],
                "status": r["status"],
                "error_message": r["error_message"],
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                "updated_at": r["updated_at"].isoformat() if r["updated_at"] else None,
            }
            for r in rows
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


def get_public_key() -> str:
    return FLUTTERWAVE_PUBLIC_KEY


def get_plan_price(plan: str) -> Optional[float]:
    return PLAN_PRICES.get(plan)
