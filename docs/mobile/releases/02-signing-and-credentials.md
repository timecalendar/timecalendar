# 2 — Signing and credential recovery

## 2.1 Three things commonly called “the Android key”

| Item                          | Purpose                                         | Can it be replaced?                                                                                            |
| ----------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **App-signing key**           | Google signs APKs delivered to users            | Google retains it when Play App Signing is enabled; otherwise loss is normally fatal for updating the same app |
| **Upload key**                | EAS/developer signs the `.aab` uploaded to Play | Resettable when Play App Signing is enabled                                                                    |
| **Play service-account JSON** | Lets EAS Submit call the Play Developer API     | Rotatable; it is not an app-signing key                                                                        |

That distinction decides whether the missing Flutter file is a nuisance or a blocker.

## 2.2 What the repository audit found

- Flutter Android expected `app/android/key.properties`, which pointed at a `.jks` or
  `.keystore`. Both were deliberately gitignored.
- No production keystore, `key.properties`, `.p12` or `.p8` was found in the known TimeCalendar
  workspaces or git history. Dependency debug keystores are irrelevant and must not be used.
- the old Play service-account file is also absent from this checkout.
- Flutter iOS used Fastlane Match with the private repository
  `samuelprak/app-certificates-and-profiles`; the current GitHub identity still has access to that
  repository. It is legacy Flutter custody, not the planned React Native signing source.

No secret value was opened during this audit.

## 2.3 Android: the recovery decision tree

The owner has confirmed Play App Signing is enabled for TimeCalendar: Play signs releases, the
app-signing key is in use and an upload-key certificate exists. The remaining recovery path is:

1. Record the public SHA-256 fingerprints for the **app-signing certificate** and **upload
   certificate**. Public fingerprints are metadata, not private keys.
2. Compare the upload-certificate fingerprint with any existing EAS/legacy credential.
3. If the old upload keystore is unavailable, generate a new upload key under controlled custody
   and request an upload-key reset in Play Console.
4. After Google activates it, configure EAS-managed credentials with that key and prove one
   internal-track upload.

Do not reset, revoke or delete an old key merely because a likely replacement was found. Compare
fingerprints and complete a Play internal upload first.

## 2.4 iOS: continuity is account/team based

For iOS, the old Xcode certificate can expire or be replaced. With access to the same Apple
Developer team and existing `fr.samuelprak.timecalendar` identifier, EAS can create/manage a valid
distribution certificate and provisioning profile. The same App Store Connect record receives the
new build.

The first EAS credential setup needs an authorized Apple Developer login. Later, EAS can reuse the
managed signing credentials without every developer having Apple portal access. Before changing
anything, inspect certificate limits and avoid revoking credentials still used by Flutter rollback
or another app.

The Fastlane Match repository remains a useful legacy rollback asset. Do not copy its encrypted
contents into this repository and do not turn it into EAS's live source of truth.

## 2.5 What Expo should manage

For the selected model, EAS may remotely manage:

- the Android upload keystore accepted by Play;
- the iOS distribution certificate and provisioning profile;
- an App Store Connect API key for non-interactive submission;
- the Play service-account key used by EAS Submit.

“EAS-managed” does not mean “no recovery plan.” The current EAS project is linked as
`@samuelprak/timecalendar` (`3b427ef6-1aae-4175-8217-ea447ee6df6b`) and will remain personally
owned for now. Vaultwarden should record:

- Expo account owner, MFA/recovery path and at least one trusted recovery owner;
- EAS project URL/name/ID and who has collaborator access;
- Apple team ID, App Store Connect app ID, API-key issuer/key IDs and expiry/rotation owner;
- Play developer account, package, Play App Signing state, public signing/upload fingerprints and
  service-account identity;
- where each private key or allowed backup is held—never the value in git;
- last recovery test and next rotation/review date.

## 2.6 Keep these credentials separate

- Signing keys prove artifact identity.
- App Store Connect and Play service credentials authorize uploads.
- APNs/FCM credentials deliver push notifications.
- OTA code-signing credentials authenticate OTA updates.

One working credential does not imply the others exist. Never commit private keys, service-account
JSON, certificates with private material, recovery codes or passwords.

## Official references

- [Google Play: Play App Signing and upload-key reset](https://support.google.com/googleplay/android-developer/answer/9842756)
- [Expo: automatically managed credentials](https://docs.expo.dev/app-signing/managed-credentials/)
- [Expo: importing existing credentials](https://docs.expo.dev/app-signing/existing-credentials/)
