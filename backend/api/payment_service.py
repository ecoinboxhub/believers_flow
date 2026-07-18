"""
Flutterwave Payment Service — Handles checkout, verification, and webhooks.
"""
import os
import hashlib
import hmac
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

# Pricing in USD (Flutterwave supports multi-currency)
PLAN_PRICES = {
    "monthly": 2.99,
    "annual": 29.99,
}


def is_configured() -> bool:
    """Check if Flutterwave credentials are configured."""
    return bool(FLUTTERWAVE_SECRET_KEY and FLUTTERWAVE_PUBLIC_KEY)


async def create_checkout(
    email: str,
    user_id: str,
    plan: str,
    currency: str = "USD",
    callback_url: str = "",
) -> dict:
    """
    Create a Flutterwave checkout link.

    Args:
        email: User email address
        user_id: Internal user ID
        plan: 'monthly' or 'annual'
        currency: Currency code (default: USD)
        callback_url: URL to redirect after payment

    Returns:
        dict with checkout_url and reference
    """
    if not is_configured():
        raise HTTPException(
            status_code=503,
            detail="Payment system not configured"
        )

    if plan not in PLAN_PRICES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid plan: {plan}. Must be 'monthly' or 'annual'"
        )

    amount = PLAN_PRICES[plan]
    reference = f"bf_{user_id[:8]}_{plan}_{int(datetime.now(timezone.utc).timestamp())}"

    payload = {
        "tx_ref": reference,
        "amount": str(amount),
        "currency": currency,
        "email": email,
        "meta": {
            "user_id": user_id,
            "plan": plan,
        },
        "redirect_url": callback_url or f"{os.environ.get('FRONTEND_URL', 'https://christian-task-manager.vercel.app')}/settings?payment=success",
        "customer": {
            "email": email,
        },
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
                logger.info(f"Checkout created: {reference} for {email}")
                return {
                    "checkout_url": data["data"]["link"],
                    "reference": reference,
                    "amount": amount,
                    "currency": currency,
                    "plan": plan,
                }
            else:
                logger.error(f"Flutterwave checkout failed: {data}")
                raise HTTPException(
                    status_code=400,
                    detail=data.get("message", "Payment initialization failed")
                )
    except httpx.HTTPStatusError as e:
        logger.error(f"Flutterwave API error: {e}")
        raise HTTPException(
            status_code=502,
            detail="Payment service error"
        )
    except httpx.RequestError as e:
        logger.error(f"Flutterwave connection error: {e}")
        raise HTTPException(
            status_code=503,
            detail="Payment service unavailable"
        )


async def verify_transaction(reference: str) -> dict:
    """
    Verify a Flutterwave transaction.

    Args:
        reference: Transaction reference (tx_ref or transaction_id)

    Returns:
        dict with transaction details
    """
    if not is_configured():
        raise HTTPException(
            status_code=503,
            detail="Payment system not configured"
        )

    headers = {
        "Authorization": f"Bearer {FLUTTERWAVE_SECRET_KEY}",
    }

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
                }
            else:
                logger.error(f"Transaction verification failed: {data}")
                return {
                    "verified": False,
                    "successful": False,
                    "reference": reference,
                    "error": data.get("message", "Verification failed"),
                }
    except httpx.HTTPStatusError as e:
        logger.error(f"Flutterwave API error during verification: {e}")
        raise HTTPException(
            status_code=502,
            detail="Payment verification service error"
        )
    except httpx.RequestError as e:
        logger.error(f"Flutterwave connection error during verification: {e}")
        raise HTTPException(
            status_code=503,
            detail="Payment verification service unavailable"
        )


def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """
    Verify Flutterwave webhook signature.

    Args:
        payload: Raw request body bytes
        signature: X-Flutterwave-Signature header value

    Returns:
        True if signature is valid

    Raises:
        ValueError: If webhook secret is not configured (fail-closed)
    """
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


def get_public_key() -> str:
    """Return the public key for frontend use."""
    return FLUTTERWAVE_PUBLIC_KEY


def get_plan_price(plan: str) -> Optional[float]:
    """Get price for a given plan."""
    return PLAN_PRICES.get(plan)
