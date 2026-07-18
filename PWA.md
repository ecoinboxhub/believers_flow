# BelieversFlow Progressive Web App Guide

Guide to PWA features, configuration, and testing.

---

## PWA Features

- **Service Worker** — Custom `injectManifest` strategy for fine-grained caching control.
- **Web App Manifest** — Enables Add to Home Screen (A2HS) and standalone display.
- **Offline support** — App shell and previously accessed content available without network.
- **Push notifications** — VAPID-based push messaging.
- **Installable** — Prompts install on supported browsers.
- **Standalone display** — Runs without browser chrome when installed.

---

## Manifest Configuration

```json
{
  "name": "BelieversFlow",
  "short_name": "BelieversFlow",
  "display": "standalone",
  "theme_color": "#1a1a2e",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- **192px** — Standard home screen icon.
- **512px** — Splash screen and store listing.
- **Maskable** — Adapts to Android adaptive icon shapes.

---

## Service Worker Strategies

| Resource | Strategy | Details |
|----------|----------|---------|
| `bible-api.com` | Network-first | Falls back to cached response for offline Bible reading |
| Images / Fonts | Cache-first | Static assets cached indefinitely after first load |
| App shell | Cache-first | SPA shell cached; navigations fall back to `index.html` |
| Push events | Event-driven | Parses JSON payload, falls back to text content |

---

## Cache Management

| Setting | Value |
|---------|-------|
| Cache name | `believersflow-v1` |
| Auto-update | `registerType: 'autoUpdate'` |
| Old cache cleanup | Deleted on service worker `activate` event |
| Max file size | 4 MB |

When a new service worker version activates, all previous caches are deleted and the app refreshes on next visit.

---

## Offline Capabilities

| Content | Availability |
|---------|--------------|
| App shell | Always available (cached on install) |
| Bible text | Stored in `localStorage`; chapters cached via service worker |
| Hymns (lyrics + tunes) | Bundled as local data |
| Previously-read Bible chapters | Cached by service worker after first read |

The app remains fully navigable offline. Bible content that has been read at least once is available without a network connection.

---

## Push Notifications

### Authentication

Uses VAPID (Voluntary Application Server Identification) key-based authentication.

### Flow

1. User triggers an action that requests notification permission.
2. Browser displays native permission prompt.
3. On grant, a push subscription is created and sent to the backend.
4. Backend stores the subscription for future push messages.

### Subscription Management

- **Subscribe:** Register push endpoint with the backend on permission grant.
- **Unsubscribe:** Remove endpoint from backend on permission revoke or user opt-out.

### Notification Click

Clicking a notification opens the app window or focuses it if already open.

---

## Installation

### Automatic

Supported browsers (Chrome, Edge, Samsung Internet) may show an install prompt automatically based on engagement heuristics.

### Manual

1. Open the app in a supported browser.
2. Click the browser menu (three dots / settings).
3. Select **"Install BelieversFlow"** or **"Add to Home Screen"**.

### iOS (Safari)

1. Open the app in Safari.
2. Tap the **Share** button.
3. Select **"Add to Home Screen"**.

> Note: iOS does not support push notifications for PWAs.

---

## Testing PWA

```bash
npm run build && npm run preview
```

Then in Chrome:

1. Open DevTools (`F12`).
2. Go to the **Application** tab.
3. Inspect **Service Workers** — verify registration, status, and cache storage.
4. Inspect **Manifest** — verify name, icons, display mode, and theme color.
5. Use the **Service Worker** → **Offline** checkbox to test offline behavior.
6. Use **Application** → **Cache Storage** to inspect cached resources.
