# BelieversFlow Release Guide

Step-by-step process for shipping new versions.

## Versioning

BelieversFlow follows [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

| Level | When to Increment | Example |
|-------|-------------------|---------|
| MAJOR | Breaking changes | 4.0.0 -> 5.0.0 |
| MINOR | New features (backward-compatible) | 4.1.0 -> 4.2.0 |
| PATCH | Bug fixes | 4.1.0 -> 4.1.1 |

**Current version:** 4.1.0

### Android Versioning

Android uses two separate version fields in `android/app/build.gradle`:

| Field | Format | Purpose |
|-------|--------|---------|
| `versionCode` | Integer (auto-increment) | Internal Play Store identifier |
| `versionName` | String (matches SemVer) | User-visible version |

Both must be updated for every release.

---

## Release Checklist

### Pre-Release

- [ ] All unit tests passing (83 tests)
- [ ] All E2E tests passing (171 tests)
- [ ] All screenshot tests passing (216 tests)
- [ ] No lint errors (`npm run lint`)
- [ ] Production build succeeds (`npm run build`)
- [ ] CHANGELOG.md updated with release notes
- [ ] Version bumped in `package.json`
- [ ] Version bumped in `android/app/build.gradle` (versionCode + versionName)

### Build

```bash
# 1. Update version numbers
#    - package.json: "version": "X.Y.Z"
#    - android/app/build.gradle: versionCode N, versionName "X.Y.Z"

# 2. Run all tests
npm test
npm run test:e2e

# 3. Build web app
npm run build

# 4. Build Android APK
npx cap sync android
cd android
KEYSTORE_PASSWORD=xxx KEY_ALIAS_PASSWORD=xxx ./gradlew assembleRelease

# 5. Verify APK signature
apksigner verify --verbose app/build/outputs/apk/release/app-release.apk

# 6. Copy artifacts
cp app/build/outputs/apk/release/app-release.apk ../../BelieversFlow-vX.Y.Z-release-signed.apk
```

### Post-Release

- [ ] Git tag created: `git tag vX.Y.Z`
- [ ] Changes pushed: `git push origin main --tags`
- [ ] GitHub Release created with release notes
- [ ] APK uploaded to the GitHub Release
- [ ] Vercel deployment triggered (auto on push to main)
- [ ] Documentation updated if needed

---

## APK Signing

Release APKs are signed for Play Store distribution and security.

### Keystore Details

| Property | Value |
|----------|-------|
| Keystore file | `android/app/believers-flow-release.jks` |
| Key alias | `believersflow` |

### Signing Configuration

You can provide signing credentials in two ways:

**Option 1: Environment Variables**

```bash
export KEYSTORE_PASSWORD=your-keystore-password
export KEY_ALIAS_PASSWORD=your-key-password
./gradlew assembleRelease
```

**Option 2: signing.properties file**

Create `android/app/signing.properties`:

```properties
storePassword=your-keystore-password
keyAlias=believersflow
keyPassword=your-key-password
storeFile=believers-flow-release.jks
```

> **Note:** Never commit `signing.properties` or keystore files to version control. They are included in `.gitignore`.

---

## Hotfix Process

For critical issues that cannot wait for a regular release:

```bash
# 1. Create a hotfix branch from main
git checkout main
git checkout -b hotfix/issue-description

# 2. Fix the issue and commit
git add .
git commit -m "fix: description of the hotfix"

# 3. Bump the patch version
#    - Update package.json
#    - Update android/app/build.gradle

# 4. Test thoroughly
npm test
npm run test:e2e
npm run build

# 5. Merge to main
git checkout main
git merge hotfix/issue-description

# 6. Tag and release
git tag vX.Y.Z
git push origin main --tags
```

Follow the full Build and Post-Release steps after merging.

---

## Deployment

### Web (Vercel)

- Connected to the `main` branch
- Every push to `main` triggers an automatic deployment
- Preview deployments are created for pull requests

### Android

- Release APKs are attached to GitHub Releases
- For Play Store distribution, upload the signed APK through the Play Console
