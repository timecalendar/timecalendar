# 1 — The release mental model

## 1.1 The assembly line

```text
approved git SHA
  → EAS Build signs an iOS .ipa and Android .aab
  → EAS Submit uploads those exact files
  → TestFlight / Play internal testing distributes them to the team
  → store review and staged rollout distribute a production candidate to users
  → compatible OTA updates may update JavaScript later
```

There are four separate approvals hidden in the old phrase “publish the app”:

1. **The code is releasable.** CI and Reviewer prove the selected commit.
2. **The binary is authentic.** Apple/Android signing credentials prove who built it.
3. **The store accepts the upload.** App Store Connect or Play Console checks identity, version,
   policy and metadata.
4. **Someone starts distribution.** Internal testing, App Review and public rollout are explicit
   store actions.

Expo can automate steps 2 and 3. It does not become the app store and it must not silently perform
step 4.

## 1.2 What changed since Flutter v3

| Flutter v3                                                    | React Native v4                                                         |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Flutter/Fastlane built the native binaries                    | EAS Build is the planned signed-build service                           |
| Android read a local gitignored `key.properties` and keystore | EAS can hold/import the Android key used for uploads                    |
| iOS Fastlane Match synchronized certificates/profiles         | EAS can manage a fresh valid certificate/profile on the same Apple team |
| Fastlane Supply/Pilot uploaded builds                         | EAS Submit uploads the selected EAS build                               |
| Store consoles controlled testers and rollout                 | Still true; Expo does not replace them                                  |

The important continuity is the **store identity**, not the JavaScript framework:

- iOS bundle identifier: `fr.samuelprak.timecalendar` on the same Apple team;
- Android package: `fr.samuelprak.timecalendar` with valid signing continuity;
- store build numbers greater than every build already uploaded;
- existing Firebase production configuration for the production identity.

## 1.3 Build, submit and release are deliberately separate

EAS Build produces an artifact and records its build ID. EAS Submit can upload that exact artifact.
The upload does not publish iOS to customers: it becomes a processed TestFlight/App Store Connect
build. On Android, the selected Play track and release status control where the upload lands.

TimeCalendar's future automation must preserve this separation:

- build automatically only from an approved exact SHA;
- submit only the recorded build ID after the submission gate;
- start or widen production rollout as a separate human-owned act;
- never rebuild between approval and submission.

## 1.4 Preview still needs signing

The chosen previews use TestFlight and Play internal testing. They are real store binaries with the
real production app identity, so **yes, they need store-compatible signing**.

This is different from Expo “internal distribution”:

- EAS internal distribution creates an Android APK and an iOS ad hoc build installed from a URL;
- TestFlight requires an App Store-signed build (`distribution: "store"`);
- Play internal testing requires an Android App Bundle (`.aab`) signed with the accepted upload
  key.

The current `preview` profile is the first kind. The owner selected the second kind. The required
profile change is called out in [document 3](./03-first-preview.md).

## 1.5 OTA is the fast lane after a native build exists

TimeCalendar uses a native fingerprint as its OTA runtime version. A JavaScript-only fix can reach
an installed compatible preview or production build. A new native dependency, Expo SDK change,
permission, entitlement or config plugin changes the fingerprint and needs a new signed store
build.

OTA therefore complements the release process; it never replaces the first store build, signing,
review or a native upgrade.

## Official references

- [Expo: submit to app stores](https://docs.expo.dev/deploy/submit-to-app-stores/)
- [Expo: TestFlight and the difference from internal distribution](https://docs.expo.dev/submit/testflight/)
- [Expo: app version management](https://docs.expo.dev/build-reference/app-versions/)
