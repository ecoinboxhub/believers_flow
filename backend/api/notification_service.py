"""
Push Notification Service — Firebase Cloud Messaging integration.
"""
import os
import logging
import json
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from enum import Enum

import httpx
from fastapi import HTTPException

logger = logging.getLogger("beliversflow.notifications")

FCM_SERVER_KEY = os.environ.get("FCM_SERVER_KEY", "")
FCM_API_URL = "https://fcm.googleapis.com/v1/projects/{project_id}/messages:send"


class NotificationType(str, Enum):
    TASK_REMINDER = "task_reminder"
    VERSE_OF_DAY = "verse_of_day"
    DEVOTIONAL = "devotional"
    PRAYER_REMINDER = "prayer_reminder"
    CUSTOM = "custom"


class NotificationPreferences:
    """Default notification preferences."""
    DEFAULT = {
        "task_reminders": True,
        "verse_of_day": True,
        "devotional": True,
        "prayer_reminder": True,
        "quiet_hours_start": 22,
        "quiet_hours_end": 7,
    }


async def subscribe_device(
    user_id: str,
    fcm_token: str,
    device_type: str = "android",
    preferences: Optional[dict] = None,
) -> dict:
    """
    Register a device for push notifications.

    Args:
        user_id: Internal user ID
        fcm_token: FCM registration token
        device_type: 'android' or 'web'
        preferences: Notification preferences

    Returns:
        dict with subscription status
    """
    from api.database import get_pool

    prefs = {**NotificationPreferences.DEFAULT, **(preferences or {})}

    pool = await get_pool()
    async with pool.acquire() as conn:
        # Upsert device subscription
        await conn.execute("""
            INSERT INTO notification_devices (user_id, fcm_token, device_type, preferences, active)
            VALUES ($1, $2, $3, $4::jsonb, TRUE)
            ON CONFLICT (user_id, fcm_token)
            DO UPDATE SET
                device_type = $3,
                preferences = $4::jsonb,
                active = TRUE,
                updated_at = NOW()
        """, int(user_id), fcm_token, device_type, json.dumps(prefs))

    logger.info(f"Device subscribed: user={user_id}, type={device_type}")
    return {"status": "subscribed", "preferences": prefs}


async def unsubscribe_device(user_id: str, fcm_token: str) -> dict:
    """Remove a device from notifications."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            UPDATE notification_devices
            SET active = FALSE, updated_at = NOW()
            WHERE user_id = $1 AND fcm_token = $2
        """, int(user_id), fcm_token)

    return {"status": "unsubscribed"}


async def update_preferences(user_id: str, preferences: dict) -> dict:
    """Update notification preferences for all user devices."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            UPDATE notification_devices
            SET preferences = preferences || $2::jsonb,
                updated_at = NOW()
            WHERE user_id = $1 AND active = TRUE
        """, int(user_id), json.dumps(preferences))

    return {"status": "updated", "preferences": preferences}


async def send_notification(
    user_id: str,
    title: str,
    body: str,
    notification_type: NotificationType = NotificationType.CUSTOM,
    data: Optional[dict] = None,
) -> dict:
    """
    Send a push notification to all active devices of a user.

    Args:
        user_id: Target user ID
        title: Notification title
        body: Notification body
        notification_type: Type of notification
        data: Optional data payload

    Returns:
        dict with send results
    """
    from api.database import get_pool

    if not FCM_SERVER_KEY:
        logger.warning("FCM not configured — notification not sent")
        return {"status": "not_configured", "sent": 0}

    pool = await get_pool()
    async with pool.acquire() as conn:
        devices = await conn.fetch("""
            SELECT fcm_token, device_type, preferences
            FROM notification_devices
            WHERE user_id = $1 AND active = TRUE
        """, int(user_id))

    if not devices:
        return {"status": "no_devices", "sent": 0}

    sent = 0
    failed_tokens = []

    for device in devices:
        prefs = device["preferences"] or {}

        # Check quiet hours
        now = datetime.now(timezone.utc)
        quiet_start = prefs.get("quiet_hours_start", 22)
        quiet_end = prefs.get("quiet_hours_end", 7)
        hour = now.hour

        if quiet_start > quiet_end:
            in_quiet = hour >= quiet_start or hour < quiet_end
        else:
            in_quiet = quiet_start <= hour < quiet_end

        if in_quiet and notification_type != NotificationType.CUSTOM:
            continue

        # Check notification type preference
        type_pref_map = {
            NotificationType.TASK_REMINDER: "task_reminders",
            NotificationType.VERSE_OF_DAY: "verse_of_day",
            NotificationType.DEVOTIONAL: "devotional",
            NotificationType.PRAYER_REMINDER: "prayer_reminder",
        }
        pref_key = type_pref_map.get(notification_type)
        if pref_key and not prefs.get(pref_key, True):
            continue

        # Send notification
        try:
            success = await _send_fcm_message(
                device["fcm_token"],
                device["device_type"],
                title,
                body,
                data or {},
            )
            if success:
                sent += 1
            else:
                failed_tokens.append(device["fcm_token"])
        except Exception as e:
            logger.error(f"Failed to send notification: {e}")
            failed_tokens.append(device["fcm_token"])

    # Deactivate failed tokens
    if failed_tokens:
        async with pool.acquire() as conn:
            await conn.execute("""
                UPDATE notification_devices
                SET active = FALSE, updated_at = NOW()
                WHERE fcm_token = ANY($1)
            """, failed_tokens)

    logger.info(f"Notifications sent: {sent}/{len(devices)} for user {user_id}")
    return {"status": "sent", "sent": sent, "total": len(devices)}


async def send_bulk_notification(
    user_ids: List[str],
    title: str,
    body: str,
    notification_type: NotificationType = NotificationType.CUSTOM,
    data: Optional[dict] = None,
) -> dict:
    """Send notification to multiple users."""
    results = []
    for uid in user_ids:
        result = await send_notification(uid, title, body, notification_type, data)
        results.append({"user_id": uid, **result})

    total_sent = sum(r.get("sent", 0) for r in results)
    return {"status": "sent", "total_sent": total_sent, "results": results}


async def _send_fcm_message(
    token: str,
    device_type: str,
    title: str,
    body: str,
    data: dict,
) -> bool:
    """Send a single FCM message."""
    if device_type == "web":
        # Web push via FCM
        message = {
            "token": token,
            "notification": {"title": title, "body": body},
            "data": {k: str(v) for k, v in data.items()},
        }
    else:
        # Android
        message = {
            "token": token,
            "notification": {"title": title, "body": body},
            "data": {k: str(v) for k, v in data.items()},
            "android": {"priority": "high"},
        }

    headers = {
        "Authorization": f"Bearer {FCM_SERVER_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                FCM_API_URL.format(project_id=os.environ.get("FCM_PROJECT_ID", "")),
                json={"message": message},
                headers=headers,
                timeout=10,
            )
            resp.raise_for_status()
            return True
    except Exception as e:
        logger.error(f"FCM send failed: {e}")
        return False


async def get_user_devices(user_id: str) -> List[dict]:
    """Get all active devices for a user."""
    from api.database import get_pool

    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT fcm_token, device_type, preferences, created_at
            FROM notification_devices
            WHERE user_id = $1 AND active = TRUE
            ORDER BY created_at DESC
        """, int(user_id))

    return [
        {
            "token": r["fcm_token"],
            "device_type": r["device_type"],
            "preferences": r["preferences"],
            "registered_at": r["created_at"].isoformat(),
        }
        for r in rows
    ]
