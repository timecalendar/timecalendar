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
  `.keystore`. Both were deliberately gitignored, and correctly so.
- No production keystore, `key.properties`, `.p12` or `.p8` is in the repository or its git
  history, which is the intended state. **The upload key itself is held by the owner and backed
  up in three separate locations** (confirmed 2026-08-26). Dependency debug keystores are
  irrelevant and must not be used.
- the old Play service-account file is likewise not in this checkout; it is rotatable and is not
  an app-signing key.
- Flutter iOS used Fastlane Match with the private repository
  `samuelprak/app-certificates-and-profiles`; the current GitHub identity still has access to that
  repository. It is legacy Flutter custody, not the planned React Native signing source.

No secret value was opened during this audit.

## 2.3 Android: the recovery decision tree

**There is no recovery problem.** Play App Signing is enabled — Google holds the user-facing
app-signing key — and the owner holds the upload key, backed up in three places. Both halves of
the Android signing chain are accounted for. What remains is import and proof:

1. Record the public SHA-256 fingerprints for the **app-signing certificate** and **upload
   certificate** from Play Console. Public fingerprints are metadata, not private keys.
2. Import the held upload key into EAS-managed credentials, and confirm its fingerprint matches
   the upload certificate Play expects.
3. Prove it with one Play internal-track upload before relying on it for a release.

**Do not request an upload-key reset.** A reset is the remedy for a lost key; we have not lost
it, and resetting would invalidate working backups for no gain. If step 2's fingerprints ever
disagree, stop and investigate before touching anything in Play Console.

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
