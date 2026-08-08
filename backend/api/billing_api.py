"""
Billing API — Subscription management, transaction history, webhook processing.
"""
import logging
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional

from .auth import get_current_user
from .database import get_pool
from .payment_service import (
    create_checkout,
    verify_transaction,
    verify_webhook_signature,
    process_webhook_event,
    get_transaction_history,
    get_public_key,
    get_plan_price,
    is_configured,
)

logger = logging.getLogger("beliversflow.billing")
router = APIRouter(prefix="/api/billing")


class CheckoutRequest(BaseModel):
    plan: str
    currency: str = "USD"
    idempotency_key: Optional[str] = None


@router.get("/status")
async def billing_status():
    """Check if billing is configured and return available plans."""
    return {
        "configured": is_configured(),
        "public_key": get_public_key() if is_configured() else None,
        "plans": {
            "monthly": {"price": get_plan_price("monthly"), "currency": "USD"},
            "annual": {"price": get_plan_price("annual"), "currency": "USD"},
        },
    }


@router.post("/checkout")
async def billing_checkout(
    req: CheckoutRequest,
    user=Depends(get_current_user),
):
    """Create a checkout session for subscription (idempotent)."""
    return await create_checkout(
        email=user["email"],
        user_id=str(user["id"]),
        plan=req.plan,
        currency=req.currency,
        idempotency_key=req.idempotency_key,
    )


@router.post("/verify")
async def billing_verify(
    reference: str = Query(..., description="Transaction reference"),
    user=Depends(get_current_user),
):
    """Verify a payment transaction and upgrade user if successful."""
    result = await verify_transaction(reference)

    if result.get("successful") and str(result.get("user_id", "")) == str(user["id"]):
        plan = result.get("plan", "monthly")
        interval = "1 month" if plan == "monthly" else "1 year"
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE users
                SET plan = 'premium',
                    plan_expires_at = NOW() + ($1::text)::interval,
                    updated_at = NOW()
                WHERE id = $2
                """,
                interval,
                user["id"],
            )
        logger.info(f"User {user['id']} upgraded to premium via verification")
        result["upgraded"] = True

    return result


@router.get("/subscription")
async def billing_subscription(user=Depends(get_current_user)):
    """Get current subscription status."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT plan, plan_expires_at, created_at FROM users WHERE id = $1",
            user["id"],
        )

    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    plan = row["plan"] or "free"
    expires_at = row["plan_expires_at"]
    is_active = False

    if plan == "premium":
        if expires_at:
            is_active = expires_at > datetime.now(timezone.utc)
        else:
            is_active = True

    return {
        "plan": plan if is_active else "free",
        "is_active": is_active,
        "expires_at": expires_at.isoformat() if expires_at else None,
    }


@router.get("/transactions")
async def billing_transactions(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user=Depends(get_current_user),
):
    """Get payment transaction history for the current user."""
    return await get_transaction_history(str(user["id"]), limit=limit, offset=offset)


@router.post("/webhook")
async def billing_webhook(request: Request):
    """Handle Flutterwave webhook events with signature verification and duplicate protection."""
    body = await request.body()
    signature = request.headers.get("X-Flutterwave-Signature", "")

    try:
        is_valid = verify_webhook_signature(body, signature)
    except ValueError as e:
        logger.critical(f"Webhook misconfiguration: {e}")
        raise HTTPException(status_code=503, detail="Webhook not configured")

    if not is_valid:
        logger.warning("Invalid webhook signature rejected")
        raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    result = await process_webhook_event(payload)
    logger.info(f"Webhook processed: event={payload.get('event')}, result={result}")
    return result
