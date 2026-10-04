# 3 — First preview release: TestFlight and Play internal

## 3.1 Chosen path

The first preview goes through the existing stores:

- **iOS:** App Store Connect → TestFlight → internal group **The team**;
- **Android:** Play Console → internal testing → **The team** tester list/group.

This rehearses the production identity, signing, upload and install path. It also means an installed
preview replaces the public TimeCalendar app on the same phone; the two builds share the same bundle
ID/package and cannot coexist.

## 3.2 The config now matches the chosen path

`mobile/eas.json` has:

- `preview`: `distribution: "store"`, store `.ipa` + Android `.aab`, `autoIncrement`, OTA
  channel `preview`, with a matching `submit.preview` targeting public App Store Connect app
  `1479613630` and Play's internal track;
- `production`: `distribution: "store"`, store `.ipa`/`.aab`, OTA channel `production`.

TestFlight accepts only a store-distribution build and Play internal testing needs an `.aab`, so
`preview` is store-distributed too (ADR [040](../architecture-book/decisions/040-local-store-builds-and-store-preview.md)).
It keeps its own `preview` channel, so it never bakes in the production OTA channel.

An earlier design kept `preview` as a direct-install profile and added a separate `internal-store`
profile beside it. That was dropped: there is no audience for a direct-install `.apk` or ad hoc
`.ipa`, so a second profile was pure bookkeeping. `development` remains the only non-store
profile, and it is a dev-client artifact rather than a release.

The committed iOS app identifier is public destination metadata, not a credential. Preview's Apple
account/team inputs and all signing material remain outside git. Binding the destination neither
authorizes nor performs a build, signing operation, upload, or submission; those remain explicit
operator acts using the exact approved artifact.

## 3.3 One-time owner bootstrap

Complete these in order:

1. **Inventory the live stores.** Record the highest Android version code and iOS build number,
   current Apple team/app IDs, package/bundle ID and Play signing fingerprints.
2. **Wire up Android signing.** Play App Signing is enabled and the upload key is held and backed
   up in three places. Record the public app-signing and upload-certificate fingerprints, then
   import the held upload key into EAS-managed credentials per
   [document 2](./02-signing-and-credentials.md). **Do not request an upload-key reset** — nothing
   is lost.
3. **Initialize EAS remote versions.** The repo uses `appVersionSource: "remote"`; initialize each
   platform from the highest live-store value with `eas build:version:set`, then let `preview`
   auto-increment. Flutter's repo says `3.1.0+134`, but the live consoles—not that historical
   file—are authoritative.
4. **Configure EAS-managed signing.** For iOS, authenticate to the correct Apple team and let EAS
   create or select a distribution certificate/profile. For Android, import/select the accepted
   upload key; never create an unrelated replacement unless a Play reset is in progress.
5. **Configure submission identities.** Record Apple ID/team/app IDs. Create a least-privilege Play
   service account for EAS Submit and keep its JSON in EAS or the password manager, or ephemeral operator
   storage, never in git.
6. **Create tester groups.** TestFlight internal testers must be App Store Connect users; Apple
   supports up to 100 internal testers. Create **The team** and enable the desired distribution
   behavior. Create the Play internal tester list/group with the same human-facing name.
7. **Build both platforms from one recorded, green SHA with a passing [Calendar paging release gate](./06-calendar-paging-gate.md)** when the new paging owner is present. Build iOS locally on the macOS host and Android on the Windows PC through `ssh pc`/WSL. Record the SHA, profile, version/build numbers, runtime fingerprint, artifact paths and toolchain versions on each build host. A local build ignores the toolchain fields in `eas.json`, so record Xcode/CocoaPods for iOS and JDK/Android SDK for Android along with Node and EAS CLI where used.
8. **Submit those exact artifacts** with `eas submit --profile preview --path <artifact>`. Do not
   run a second build during submission.
9. **Install and verify on physical devices.** Confirm launch, API environment, authentication,
   migration behavior available at this phase, push/Crashlytics expectations, displayed version
   and OTA channel/runtime fingerprint.

The operator selects the explicit profile and the recorded artifact path, never “latest.” The
exact commands are in [`mobile/EAS.md`](../../../mobile/EAS.md).

## 3.4 What Expo needs from the owner

| Need                                                  | Why                                    | Once or recurring?   |
| ----------------------------------------------------- | -------------------------------------- | -------------------- |
| Login to the personal Expo account owning the project | Run/configure EAS                      | Initial + recovery   |
| Authorized Apple Developer access                     | Create/select iOS signing credentials  | Initial/rotation     |
| App Store Connect app/team identifiers                | Target the existing app                | Initial, then stable |
| The held Android upload key, imported into EAS        | Sign an upload Play accepts            | Initial/rotation     |
| Play service-account authorization                    | Let EAS Submit upload                  | Initial/rotation     |
| Live store version counters                           | Avoid duplicate/lower build rejection  | Initial sync         |
| Tester membership                                     | Deliver internal builds                | As team changes      |
| Explicit submit/rollout approval                      | A store upload/release is a deploy act | Every release        |

Expo does **not** need the owner's Apple password stored in git or CI. It does not need the Android
app-signing private key when Google already holds it under Play App Signing. It does not need
production infrastructure, a CI pipeline, or a paid plan — local builds use the macOS host for iOS and the Windows PC/WSL host for Android.

## 3.5 Preview acceptance evidence

The first preview is complete only when:

- both stores accepted a build for the existing app identity;
- a named physical iPhone and Android phone installed it through the store testing path;
- the recorded build numbers exceed previous uploads;
- the recorded host toolchain versions are attached to the release record;
- Play-delivered signing fingerprint matches the expected app-signing certificate;
- the build identifies the approved SHA/profile/channel without relying on “latest”;
- a compatible preview OTA and a deliberately incompatible fingerprint case are exercised when
  the OTA service is ready;
- no secret or private key appears in git, build logs or issue comments.

## 3.6 Shipped record — iOS internal preview, 2026-08-28

The iOS half of the first preview shipped. The Android half shipped on 2026-09-07 — see §3.8.

| Field               | Value                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| Source SHA          | `20cadefff9b328accf5ce2420b1858894b3fe469` on `main`                                           |
| Version / build     | `4.0.0` / `142`                                                                                |
| Runtime fingerprint | `7db7c8dbe3b26b05c50d92899e5ee586968cfff7`                                                     |
| Artifact SHA-256    | `b71bb9476721440705e9fda970f7b215cf199c3e2692f2b88c15f14e14e452d0` (26,733,857 bytes)          |
| Bundle ID           | `fr.samuelprak.timecalendar`, `UIDeviceFamily` `[1, 2]`, `MinimumOSVersion` `16.4`             |
| OTA channel         | `expo-channel-name = preview`, `EXUpdatesRuntimeVersion = file:fingerprint`                    |
| Signing             | `iPhone Distribution: <owner> (9629G25NH7)`, App Store profile, `aps-environment` `production` |
| Host toolchain      | macOS 26.5.1, Xcode 26.6 (17F113), Node 24.13.0, eas-cli 22.5.0, CocoaPods 1.17.0              |
| Destination         | App Store Connect app `1479613630`, internal group **The Team**                                |

Apple-side state, read back from the App Store Connect API rather than from the submit log:
`processingState = VALID`, `internalBuildState = IN_BETA_TESTING`, and build 142 is attached to
the internal group **The Team**. `externalBuildState` remains `READY_FOR_BETA_SUBMISSION` and the
external group **Alpha** does not carry build 142 — nothing was submitted for Beta App Review,
App Store review or production release.

Two caveats belong on this record:

- **The E2E exception.** `20cadeff` is green on `CI mobile checks` and `CI build & deploy`, but
  `CI mobile E2E` fails there. The board owner waived that gate for this preview; the failures are
  E2E-harness concerns owned separately, not preview-build defects.
- **§3.5 is not yet satisfied.** Physical-device install and verification, the Android half, and
  the OTA fingerprint-compatibility cases all remain open. This record covers upload and internal
  TestFlight availability only.

## 3.7 Android preview — prerequisite state, 2026-08-28

The Android half was attempted and stopped before building. §3.3 step 2–5 was only partly done, and
building on top of the state that was there would have produced an upload Play rejects. What the
three Android prerequisites actually looked like, read back from the Expo API rather than assumed:

| Prerequisite                        | State found                                                                     | State now                                     |
| ----------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------- |
| Upload key in EAS credentials       | An unrelated EAS-generated keystore, alias `aa6e0585…`, SHA-1 `135a8d77…`       | **Fixed** — the held upload key is imported   |
| EAS remote `versionCode`            | `1`                                                                             | **Fixed 2026-09-07** — set to `137` from the live production track (§3.8) |
| Play service account for EAS Submit | `googleServiceAccountKeyForSubmissions = null`                                   | **Fixed 2026-09-07** — `eas-submit@timecalendar-samuelprak.iam.gserviceaccount.com`, key on the build host only (§3.8) |

### The keystore that was there was not the upload key

EAS app credentials `b275bfa0` held a keystore auto-generated on 2026-06-16 (alias
`aa6e0585cc9509022841fb151be2dddc`, SHA-1 `135a8d77bfa841dc0a09f594b3d56db667b9dbc7`). That
certificate has never signed anything for this app identity: it is not the held upload key, and the
EAS Android submission history is empty, so nothing had ever proved otherwise. An `.aab` signed with
it would have been rejected by Play as signed with the wrong upload key.

Do **not** use `mobile/firebase/google-services.json` as the test here. That file registers four
SHA-1 hashes for `fr.samuelprak.timecalendar`, and the _accepted_ upload certificate `99f82ae8…` is
absent from them too — under Play App Signing those hashes track the app-signing and debug
certificates, not the upload certificate, so the check rejects the correct key as readily as the
wrong one. The decisive evidence is the two facts above.

The accepted upload key is the one the Flutter release build used
(`app/android/key.properties` → `keyAlias=upload`, `storeFile=~/upload-keystore.jks` on the owner's
macOS host) — the config that signed every `.aab` Play has accepted for this package. It is now
imported into EAS-managed credentials and attached as the default build credentials, per
[document 2](./02-signing-and-credentials.md) §2.3 step 2. **No upload-key reset was requested;
nothing was lost.** Read back from the Expo API after the import:

| Field               | Value                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| Keystore            | `af4cc224-cc07-40ac-9907-3e8571f8eb73`, type `JKS`, alias `upload`                               |
| Upload cert SHA-1   | `99f82ae836448f35ed388a0f305bbea409839a9e`                                                       |
| Upload cert SHA-256 | `1a04470a148208644775d1f09692fa75de7baddd20b5fbe32afbcca5a4e1491c`                               |
| Subject / validity  | `CN=<owner>, O=<owner>, L=Paris, C=FR`, 2023-09-01 → 2051-01-16                                  |
| Attached to         | app credentials `b275bfa0` (`fr.samuelprak.timecalendar`), build credentials `6c76a474`, default |

Only public certificate metadata appears here. The keystore, its passwords and the owner's
`key.properties` stayed on the owner's host; nothing private was copied into this repository, a log
or a ticket.

### Why the build was not run

Two prerequisites are still open, and both need Play Console access an agent does not have:

- **EAS remote `versionCode` is `1`.** `preview` carries `autoIncrement`, so the next Android build
  would be `versionCode 2`. Play's live counter is far above that — the Flutter repo records
  `3.1.0+134`, and §3.3 step 3 is explicit that the live console, not that historical file, is
  authoritative. Building now would burn a build on a guaranteed "version code already used"
  rejection. Guessing a safely-high number instead of reading the console is exactly the
  improvisation this document forbids.
- **No Play service account.** `submit.preview.android.serviceAccountKeyPath` points at
  `../ci/keys/eas-android-sa-key.json` — repo-root `ci/keys/`, which is correctly absent from git —
  and EAS holds no service account key for this project. `eas submit --platform android` cannot
  authenticate.

The second one also blocks the read-back: confirming the **Play-delivered app-signing fingerprint**
requires the Play Developer API, which needs that same service account. That §3.5 line therefore
stays open rather than being answered from a submit log.

Once the service account exists, the rest is agent work — it lets EAS read the live version counter,
submit, and read Play-side state back. It is filed as one operator item in
[`inbox/2026-08-28-android-preview-play-access.md`](../../react-native-migration/inbox/2026-08-28-android-preview-play-access.md),
together with the physical-device verification §3.5 requires on both platforms. **Done on
2026-09-07 — see §3.8.**

### §3.5 scoreboard after this pass

| §3.5 line                                         | iOS                        | Android                    |
| ------------------------------------------------- | -------------------------- | -------------------------- |
| Store accepted a build for the existing identity  | ✅ build 142               | ❌ not built               |
| Named physical device installed it                | ❌ operator item           | ❌ operator item           |
| Build numbers exceed previous uploads             | ✅ 142                     | ❌ remote counter is `1`   |
| Host toolchain recorded                           | ✅ §3.6                    | ➖ no build                |
| Play-delivered signing fingerprint matches        | n/a                        | ❌ needs the Play API      |
| Build identifies the approved SHA/profile/channel | ✅                         | ➖ no build                |
| OTA compatible + incompatible cases               | ⏸ waits on the OTA service | ⏸ waits on the OTA service |
| No secret or private key in git/logs/comments     | ✅                         | ✅                         |

## 3.8 Shipped record — Android internal preview, 2026-09-07

The Android half of the first preview shipped to the Play **internal** track.

| Field                 | Value                                                                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Source SHA            | `664f85d41637dafa54d84dd42d8afc9f65b3dfa4` on `main`, working tree clean                                                                      |
| Version / versionCode | `4.0.0` / `138`                                                                                                                               |
| Runtime fingerprint   | `0b71cb05a04b24b9c15ea7ccfbf6934ff41f3070`                                                                                                    |
| Artifact SHA-256      | `6e414ce8ce9bc12779e51c2ce3379b2b7115a6fedc34c9296ee5ae359a5cebc2` (98,492,146 bytes, `.aab`)                                                 |
| Package               | `fr.samuelprak.timecalendar`, minSdk `24`, targetSdk/compileSdk `36`                                                                          |
| OTA channel           | `expo-channel-name = preview`, `backendEnvironmentCapability = preview`, `updates.url = https://ota.timecalendar.app/manifest`                |
| Upload signing        | upload cert SHA-1 `99f82ae8…` / SHA-256 `1a04470a…` — `keytool -printcert -jarfile` on the `.aab`; EAS default build credentials (§3.7)         |
| Host toolchain        | WSL2 Ubuntu 22.04, Node 24.13.0 / npm 11.6.2, eas-cli 23.2.0 (local build plugin 23.1.0), Temurin JDK 21+35, Gradle 9.3.1, NDK 27.1.12297006 |
| Destination           | Play internal track, EAS submission `3df4f9c5-c62e-428e-b460-aac51914ebe7`                                                                    |

Play-side state, read back from the Play Developer API rather than from the submit log: the internal
track carries release `4.0.0` with versionCode `138`, status `completed`, and Play's bundle `138`
SHA-256 equals the local artifact hash above. Production remains `137 (3.1.0)`; alpha and beta are
untouched. Nothing was promoted.

### Prerequisites cleared this pass

- **Play service account.** `eas-submit@timecalendar-samuelprak.iam.gserviceaccount.com`, created
  with no Google Cloud role; granted in Play Console only *release to testing tracks* and *view app
  information* for `fr.samuelprak.timecalendar`. The JSON key lives at repo-root `ci/keys/` on the
  build host (gitignored), not in EAS and not in git.
- **EAS remote `versionCode`.** Set to `137`, the live production value read through the Play API
  (`edits.tracks`). Three failed local builds each consumed the `autoIncrement`; the counter was
  reset to `137` before every retry, so the shipped build is `138` with no gap.
- **App-signing certificate (public).** Read by the owner from Play Console → *App integrity*:
  SHA-256 `4646f746ddff4189c372e0e5fae619b7816cafa94a2bea12164fca516b578685`, SHA-1
  `df64f86481e27c41691f6473027087930c74d3ea`. Play Console's expected upload certificate matches
  §3.7 exactly. The Play Developer API does **not** expose the app-signing certificate, so the §3.5
  "Play-delivered fingerprint matches" line closes on-device: compare the installed APK's signer
  against this value.
- That app-signing SHA-1 is **not** among the four `certificate_hash` values in
  `mobile/firebase/google-services.json`. The RN app has no Google Sign-In dependency and
  Crashlytics/Analytics do not gate on SHA-1, so this is informational; revisit before adding any
  SHA-1-gated Firebase feature.

### Host caveats (build ran on WSL, not the macOS host)

ADR 040 names the macOS host; this build ran on the owner's WSL host with the same `eas build
--local` path and EAS-managed credentials, producing a correctly signed artifact. Three
host-specific issues were cleared, none touching the repository:

1. The build's fresh `npm ci` fails under npm 11.8 (`Missing: @emnapi/core`/`runtime`); the
   `.nvmrc` Node 24.13.0 (npm 11.6.2) installs the committed lockfile unchanged.
2. Local `node_modules` must be installed by that same npm before building, or the fingerprint
   eas-cli computes locally differs from the one computed in the build copy and the
   `CONFIGURE_EXPO_UPDATES` phase aborts with "Runtime version mismatch".
3. Gradle 9.3.1 exhausted the project-default JVM metaspace; `~/.gradle/gradle.properties` with
   `org.gradle.jvmargs=-Xmx8g -XX:MaxMetaspaceSize=2g` (user-home overrides project) fixed it.

`expo doctor` reported non-blocking warnings during the build (Hermes V1 memory regression on
`expo@56.0.11`, minor dependency version drift, a `react-doctor` script/bin name conflict). They are
dependency-maintenance items, not preview-build defects, and are not addressed by this record.

### §3.5 scoreboard after this pass

| §3.5 line                                         | iOS                        | Android                                   |
| ------------------------------------------------- | -------------------------- | ----------------------------------------- |
| Store accepted a build for the existing identity  | ✅ build 142               | ✅ versionCode 138, internal track        |
| Named physical device installed it                | ❌ operator item           | ❌ operator item                          |
| Build numbers exceed previous uploads             | ✅ 142                     | ✅ 138 > 137                              |
| Host toolchain recorded                           | ✅ §3.6                    | ✅ §3.8                                   |
| Play-delivered signing fingerprint matches        | n/a                        | ⏳ expected value recorded; verify on-device |
| Build identifies the approved SHA/profile/channel | ✅                         | ✅                                        |
| OTA compatible + incompatible cases               | ⏸ waits on the OTA service | ⏸ waits on the OTA service                |
| No secret or private key in git/logs/comments     | ✅                         | ✅                                        |

Still open: the Play **The team** internal tester list (no API for email lists — Play Console act),
the physical-device installs on both platforms, and the OTA cases.

## Official references

- [Expo: TestFlight distribution](https://docs.expo.dev/submit/testflight/)
- [Apple: add TestFlight internal testers](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers/)
- [Expo: submit to Google Play](https://docs.expo.dev/submit/android/)
