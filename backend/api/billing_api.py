"""
Billing API — Subscription management endpoints.
"""
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel

from .auth import get_current_user
from .database import get_pool
from .payment_service import (
    create_checkout,
    verify_transaction,
    verify_webhook_signature,
    get_public_key,
    get_plan_price,
    is_configured,
)

logger = logging.getLogger("beliversflow.billing")
router = APIRouter(prefix="/api/billing")


class CheckoutRequest(BaseModel):
    plan: str  # 'monthly' or 'annual'
    currency: str = "USD"


class WebhookPayload(BaseModel):
    event: str
    data: dict


@router.get("/status")
async def billing_status():
    """Check if billing is configured."""
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
    """Create a checkout session for subscription."""
    result = await create_checkout(
        email=user["email"],
        user_id=user["id"],
        plan=req.plan,
        currency=req.currency,
    )
    return result


@router.post("/verify")
async def billing_verify(
    reference: str,
    user=Depends(get_current_user),
):
    """Verify a payment transaction."""
    result = await verify_transaction(reference)

    # Compare as strings to prevent type confusion
    if result.get("successful") and str(result.get("user_id", "")) == str(user["id"]):
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE users
                SET plan = 'premium',
                    plan_expires_at = NOW() + INTERVAL '1 month',
                    updated_at = NOW()
                WHERE id = $1
                """,
                user["id"],
            )
        logger.info(f"User {user['id']} upgraded to premium")

    return result


@router.get("/subscription")
async def billing_subscription(
    user=Depends(get_current_user),
):
    """Get current subscription status."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT plan, plan_expires_at, created_at
            FROM users
            WHERE id = $1
            """,
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
            is_active = True  # Lifetime premium

    return {
        "plan": plan if is_active else "free",
        "is_active": is_active,
        "expires_at": expires_at.isoformat() if expires_at else None,
    }


@router.post("/webhook")
async def billing_webhook(request: Request):
    """Handle Flutterwave webhook events."""
    body = await request.body()
    signature = request.headers.get("X-Flutterwave-Signature", "")

    if not verify_webhook_signature(body, signature):
        logger.warning("Invalid webhook signature")
        raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        import json
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event = payload.get("event")
    data = payload.get("data", {})

    logger.info(f"Webhook received: {event}")

    if event == "charge.completed":
        status = data.get("status")
        reference = data.get("tx_ref")
        user_id = data.get("meta", {}).get("user_id")
        plan = data.get("meta", {}).get("plan")

        if status == "successful" and user_id and plan:
            # Validate plan to prevent SQL injection
            if plan not in ("monthly", "annual"):
                logger.warning(f"Invalid plan in webhook: {plan}")
                return {"status": "ok"}
            
            interval = "1 month" if plan == "monthly" else "1 year"
            pool = await get_pool()
            async with pool.acquire() as conn:
                # Use parameterized query with validated interval
                await conn.execute(
                    """
                    UPDATE users
                    SET plan = 'premium',
                        plan_expires_at = NOW() + ($1::text)::interval,
                        updated_at = NOW()
                    WHERE id = $2
                    """,
                    interval,
                    user_id,
                )
            logger.info(f"User {user_id} upgraded via webhook: {plan}")
        else:
            logger.warning(f"Webhook charge not successful: {reference}")

    return {"status": "ok"}
