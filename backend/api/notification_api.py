"""
Notification API — Push notification management endpoints.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from .auth import get_current_user
from .notification_service import (
    subscribe_device,
    unsubscribe_device,
    update_preferences,
    send_notification,
    get_user_devices,
    NotificationType,
)

logger = logging.getLogger("beliversflow.notification_api")
router = APIRouter(prefix="/api/notifications")


class SubscribeRequest(BaseModel):
    fcm_token: str
    device_type: str = "android"
    preferences: Optional[dict] = None
    subscription: Optional[dict] = None


class UpdatePreferencesRequest(BaseModel):
    preferences: dict


class SendNotificationRequest(BaseModel):
    title: str
    body: str
    notification_type: str = "custom"
    data: Optional[dict] = None


@router.post("/subscribe")
async def notifications_subscribe(
    req: SubscribeRequest,
    user=Depends(get_current_user),
):
    """Register a device for push notifications."""
    return await subscribe_device(
        user_id=user["id"],
        fcm_token=req.fcm_token,
        device_type=req.device_type,
        preferences=req.preferences,
    )


class UnsubscribeRequest(BaseModel):
    fcm_token: Optional[str] = None
    endpoint: Optional[str] = None


@router.post("/unsubscribe")
async def notifications_unsubscribe(
    req: UnsubscribeRequest = None,
    fcm_token: str = None,
    user=Depends(get_current_user),
):
    """Remove a device from notifications."""
    token = req.fcm_token if req else fcm_token
    if not token:
        return {"status": "no_token", "message": "No token provided"}
    return await unsubscribe_device(user_id=user["id"], fcm_token=token)


@router.get("/devices")
async def notifications_devices(
    user=Depends(get_current_user),
):
    """Get all active devices for the user."""
    devices = await get_user_devices(user["id"])
    return {"devices": devices}


@router.put("/preferences")
async def notifications_preferences(
    req: UpdatePreferencesRequest,
    user=Depends(get_current_user),
):
    """Update notification preferences."""
    return await update_preferences(user_id=user["id"], preferences=req.preferences)


@router.post("/test")
async def notifications_test(
    user=Depends(get_current_user),
):
    """Send a test notification."""
    return await send_notification(
        user_id=user["id"],
        title="BelieversFlow",
        body="Notifications are working! You will receive task reminders, verse of the day, and prayer prompts.",
        notification_type=NotificationType.CUSTOM,
    )
