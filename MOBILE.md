# BelieversFlow Mobile Development Guide

Guide for building and maintaining the Android mobile application.

---

## Overview

- **Capacitor 8.4.0** wraps the React SPA into a native Android shell.
- **Android-only** — no iOS target.
- **Zero custom native code** — uses `BridgeActivity` from Capacitor.
- **Single permission:** `INTERNET`.

---

## Setup

```bash
npm install
npm run build
npx cap sync android
```

`cap sync` copies the built web assets into the Android project and updates native dependencies.

---

## Build Commands

### Open in Android Studio

```bash
npx cap open android
```

### Debug APK

```bash
cd android
./gradlew assembleDebug
```

### Signed Release APK

```bash
cd android
./gradlew assembleRelease
```

Release builds require signing credentials (see below).

---

## Signing Configuration

Dual-mode signing: use environment variables **or** a `signing.properties` file.

| Property | Value |
|----------|-------|
| Keystore file | `believers-flow-release.jks` |
| Key alias | `believersflow` |
| Signature scheme | APK Signature Scheme v2 |

### Option 1: Environment Variables

```bash
KEYSTORE_PASSWORD=<password>
KEY_ALIAS_PASSWORD=<password>
```

### Option 2: signing.properties

Place `signing.properties` in the `android/` directory (git-ignored).

---

## Configuration Files

### capacitor.config.json

- `appId` — Application package identifier.
- `webDir` — Build output directory (`dist`).
- `androidScheme` — URL scheme for the WebView.

### android/variables.gradle

Centralizes SDK version numbers for easy updates across the project.

### android/app/build.gradle

- Signing configuration (debug and release).
- ProGuard rules for release builds.

---

## Feature Parity with Web

### Full Parity

| Feature | Status |
|---------|--------|
| Bible | Full |
| Devotional | Full |
| Tasks | Full |
| Diary | Full |
| Faith | Full |
| Music | Full |
| Settings | Full |
| Themes | Full |
| Navigation | Full |

### Partial Parity

| Feature | Limitation |
|---------|------------|
| External links | Open in WebView instead of external browser |
| Push notifications | No Capacitor push plugin configured |
| Data export | May require platform-specific file handling |

---

## Debugging

### Chrome DevTools (Remote Debugging)

1. Enable USB debugging on the Android device.
2. Connect via USB and open `chrome://inspect` in desktop Chrome.
3. Select the BelieversFlow WebView target.

### Capacitor Dev Mode

```bash
npx cap run android
```

Runs the app on a connected device or emulator with live-reload against the dev server.

### Logcat

View native Android logs:

```bash
adb logcat | grep -i believersflow
```

Or use the Logcat panel in Android Studio.

---

## Performance

| Metric | Value |
|--------|-------|
| Release APK size | ~1.75 MB |
| Debug APK size | ~4.73 MB |
| ProGuard | `minifyEnabled` + `shrinkResources` |
| Signing | APK Signature Scheme v2 |

ProGuard strips unused code and shrinks resources for release builds, reducing APK size by over 60% compared to debug.
