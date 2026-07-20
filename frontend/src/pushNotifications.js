const VAPID_PUBLIC_KEY = 'BIoaxvi6-YHu6_fcIR1vrMl6LY-Mr7PntYtBvO1O4IMFpLNTG600tRJ9dAi2qqTrZcGwv6LwmU3vxF3wo4mazo8'

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Push notifications not supported')
    return false
  }
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export async function subscribeToPush(apiUrl, token) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push API not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const existingSubscription = await registration.pushManager.getSubscription()
    if (existingSubscription) {
      await sendSubscriptionToBackend(existingSubscription, apiUrl, token)
      return existingSubscription
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    await sendSubscriptionToBackend(subscription, apiUrl, token)
    return subscription
  } catch (err) {
    console.warn('Push subscription failed:', err)
    return null
  }
}

export async function unsubscribeFromPush(apiUrl, token) {
  if (!('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
      if (token) {
        await fetch(`/api/notifications/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }
    }
  } catch (err) {
    console.warn('Push unsubscription failed:', err)
  }
}

async function sendSubscriptionToBackend(subscription, apiUrl, token) {
  if (!token) return
  try {
    await fetch(`/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        fcm_token: subscription.endpoint,
        device_type: 'web',
        subscription: subscription.toJSON(),
      }),
    })
  } catch (err) {
    console.warn('Failed to register push subscription:', err)
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(ch => ch.charCodeAt(0)))
}
