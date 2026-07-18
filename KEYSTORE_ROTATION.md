# Keystore Rotation — 2026-07-06

## New Keystore Generated

- **File:** `believers-flow.jks` (replaced old compromised keystore)
- **Alias:** `believersflow`
- **Algorithm:** RSA 2048-bit
- **Validity:** 10,000 days (~27 years)
- **Certificate:** Self-signed (CN=BelieversFlow)

## Password

The new keystore password was generated randomly. Set these environment variables:

```
KEYSTORE_PASSWORD=<your-generated-password>
KEYSTORE_ALIAS_PASSWORD=<same-password>
```

**⚠️ IMPORTANT:** The password was displayed during generation above. 
Set it as an environment variable on your build machine and Vercel.

## Build Config Updated

- `capacitor.config.json` — alias changed to `believersflow`
- `android/app/build.gradle` — alias changed to `believersflow`, passwords read from env vars

## Notes

- The old `believers-flow.jks` with password `password123` has been deleted
- The old keystore is still in git history — anyone who downloaded it can sign APKs
- Consider this keystore compromised for any previously signed APKs
- The new keystore is NOT in git (`.gitignore` covers `*.jks`)
