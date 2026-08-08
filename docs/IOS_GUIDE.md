# iOS Development Guide

## Prerequisites

- macOS 14+ (Sonoma)
- Xcode 16+
- CocoaPods (`sudo gem install cocoapods`)
- Node.js 20+
- Apple Developer account ($99/year)

## Setup

### 1. Install iOS Capacitor Platform

```bash
cd frontend
npm install @capacitor/ios
npx cap add ios
```

### 2. Configure capacitor.config.json

```json
{
  "appId": "com.believersguidelite.app",
  "appName": "BelieversFlow",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https",
    "iosScheme": "https"
  },
  "ios": {
    "contentInset": "always",
    "preferredContentMode": "mobile",
    "allowsLinkPreview": true,
    "scrollEnabled": true
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#0a0a1a",
      "androidSplashResourceName": "splash",
      "androidScaleType": "CENTER_CROP",
      "iosSplashResourceName": "Splash",
      "iosSplashContentMode": "scaleToFill"
    }
  }
}
```

### 3. Sync and Open Xcode

```bash
npm run build
npx cap sync ios
npx cap open ios
```

### 4. Xcode Configuration

#### Signing & Capabilities

1. Open `ios/App/App.xcodeproj` in Xcode
2. Select the `App` target
3. Go to **Signing & Capabilities**
4. Select your team from the dropdown
5. Set Bundle Identifier: `com.believersguidelite.app`
6. Enable **Push Notifications** capability
7. Enable **Background Modes** > **Remote notifications**

#### App Icons

1. In Xcode, go to `App/Assets.xcassets/AppIcon`
2. Drag and drop the appropriate icon sizes:
   - iPhone: 1024x1024 (App Store), 180x180, 120x120, etc.
   - iPad: 167x167, 152x152, 76x76
   - macOS: 1024x1024, 512x512, 256x256
3. Use the icon generator:
   ```bash
   node scripts/generate-icons.cjs ios
   ```

#### Splash Screen

1. In Xcode, go to `App/Assets.xcassets/Splash.imageset`
2. Add splash images at 1242x2688 (iPhone) and 2048x2732 (iPad)
3. Configure in `capacitor.config.json` as shown above

#### Permissions

Add to `ios/App/App/Info.plist`:

```xml
<key>UIRequiredDeviceCapabilities</key>
<array>
    <string>arm64</string>
</array>
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>believersflow.vercel.app</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
        <key>api.believersflow.com</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
    </dict>
</dict>
```

## Apple Developer Setup

### 1. Enroll in Apple Developer Program

1. Go to https://developer.apple.com/programs/
2. Enroll as an individual ($99/year) or organization
3. Complete the enrollment process (may take 24-48 hours)

### 2. Create Certificates

1. Go to https://developer.apple.com/account/
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create a **Certificate**:
   - Type: Apple Distribution (App Store)
   - Type: iOS App Development (testing)
4. Follow the CSR process:
   ```bash
   openssl req -new -newkey rsa:2048 -keyout ios_dev.key -out ios_dev.csr
   ```
5. Upload CSR to Apple Developer portal
6. Download the certificate (.cer) and double-click to install

### 3. Register App Identifier

1. In **Certificates, Identifiers & Profiles**
2. Go to **Identifiers** > **Register**
3. App ID Description: BelieversFlow
4. Bundle ID: com.believersguidelite.app
5. Capabilities: Push Notifications

### 4. Create Provisioning Profiles

1. Go to **Profiles** > **Register**
2. **App Store Distribution** profile:
   - Type: App Store
   - App ID: com.believersguidelite.app
   - Certificate: Apple Distribution
3. **Development** profile:
   - Type: iOS App Development
   - App ID: com.believersguidelite.app
   - Certificate: iOS App Development
   - Devices: Add test device UDIDs

### 5. Set Up Push Notifications

1. Go to **Certificates, Identifiers & Profiles**
2. Select your App ID: com.believersguidelite.app
3. Configure **Push Notifications**
4. Create a **Apple Push Notification service SSL (Sandbox)** certificate
5. Create a **Apple Push Notification service SSL (Production)** certificate
6. Export as .p12 and convert to .pem:
   ```bash
   openssl pkcs12 -in apns.p12 -out apns.pem -nodes -clcerts
   ```

### 6. Generate Signing Placeholder

For CI/CD, generate signing certificates and export as .p12:

```bash
# From Keychain Access, export the certificate
# Convert to base64 for GitHub secrets
base64 -i Distribution.p12 | pbcopy
```

Store the following in GitHub Secrets:
- `IOS_CERTIFICATE` — Base64-encoded .p12
- `IOS_CERTIFICATE_PASSWORD` — Certificate password
- `IOS_PROVISIONING_PROFILE` — Base64-encoded .mobileprovision
- `IOS_TEAM_ID` — Apple Developer Team ID
- `IOS_KEYCHAIN_PASSWORD` — Temporary keychain password

## TestFlight

### 1. Prepare for Upload

1. In Xcode, select **Product > Archive**
2. Once archived, the Organizer window opens
3. Select the archive and click **Distribute App**

### 2. Upload to App Store Connect

1. Choose **App Store Connect** as distribution method
2. Select **Upload** (not Export)
3. Choose **Automatically manage signing**
4. Wait for validation and upload
5. Go to https://appstoreconnect.apple.com/

### 3. TestFlight Configuration

1. In App Store Connect, go to **My Apps** > **BelieversFlow**
2. Go to **TestFlight** tab
3. Enable **TestFlight Beta Testing**
4. Add testers (up to 100 internal, 10,000 external)
5. Internal testers must be added in **Users and Access**
6. Submit for Beta Review (external testing only)

### 4. Build Management

```bash
# Increment build number
xcrun agvtool next-version -all
# Commit and push
git add .
git commit -m "chore: bump iOS build number"
git tag v4.5.0+build5
git push --tags
```

## App Store

### 1. Prepare App Listing

In App Store Connect, configure:

- **App Information**: Name (BelieversFlow), Bundle ID, SKU, Primary Language
- **Pricing**: Free or Paid (subscription via IAP or Flutterwave)
- **App Privacy**: Complete privacy questionnaire
- **Rating**: 4+
- **Copyright**: 2025 BelieversFlow

### 2. App Store Screenshots

Required sizes:
- 6.5" iPhone: 1284x2778 (4 screenshots)
- 5.5" iPhone: 1242x2208 (4 screenshots)
- 12.9" iPad: 2048x2732 (4 screenshots)

Generate using Playwright:
```bash
npm run test:e2e:ui -- --project=tablet
```

### 3. App Review Information

- Sign-in required: Yes (optional, app works offline)
- Contact: support@believersflow.app
- Demo account: demo@believersflow.app / demo123

### 4. Submit for Review

1. Complete all app listing fields
2. Select the build from TestFlight
3. Click **Submit for Review**
4. Typical review time: 24-48 hours

## Build Script (CI/CD)

Add to `.github/workflows/build-ios.yml`:

```yaml
name: Build iOS

on:
  push:
    tags: ['v*']
  workflow_dispatch:

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      - name: Install dependencies
        working-directory: frontend
        run: npm ci
      - name: Build web
        working-directory: frontend
        run: npm run build
      - name: Sync Capacitor
        working-directory: frontend
        run: npx cap sync ios
      - name: Install CocoaPods
        working-directory: ios/App
        run: pod install
      - name: Decode certificates
        run: |
          echo ${{ secrets.IOS_CERTIFICATE }} | base64 -d > ios_cert.p12
          echo ${{ secrets.IOS_PROVISIONING_PROFILE }} | base64 -d > ios_profile.mobileprovision
      - name: Build and archive
        run: |
          xcodebuild -workspace ios/App/App.xcworkspace \
            -scheme App \
            -sdk iphoneos \
            -configuration Release \
            -archivePath BelieversFlow.xcarchive \
            -allowProvisioningUpdates \
            archive
      - name: Export IPA
        run: |
          xcodebuild -exportArchive \
            -archivePath BelieversFlow.xcarchive \
            -exportOptionsPlist exportOptions.plist \
            -exportPath ipa
      - name: Upload IPA
        uses: actions/upload-artifact@v4
        with:
          name: BelieversFlow.ipa
          path: ipa/BelieversFlow.ipa
```

## Troubleshooting

### Code Signing Errors
- Ensure certificate is installed in Keychain
- Verify provisioning profile includes the device
- Check Bundle ID matches across all configs

### Push Notifications Not Working
- Verify APNS certificate is valid
- Check entitlements file includes push capability
- Test with development build first

### App Crashes on Launch
- Check Xcode console for errors
- Verify web assets were synced: `npx cap sync ios`
- Check Info.plist for required keys

### TestFlight Rejection
- Verify app completes without crashing
- Check for placeholder content
- Ensure all URLs are HTTPS