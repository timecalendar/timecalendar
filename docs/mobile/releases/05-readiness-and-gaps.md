# 5 — Readiness and gaps

## 5.1 Current facts

| Area                     | Status on 2026-08-26                    | Evidence / consequence                                                                                                                                                                                |
| ------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v4 store identity        | **Ready in source**                     | iOS and Android use `fr.samuelprak.timecalendar` outside the dev variant                                                                                                                              |
| User-facing version      | **Ready in source**                     | `4.0.0`; live store build counters still need synchronization                                                                                                                                         |
| EAS project link         | **Ready**                               | `@samuelprak/timecalendar`, project ID `3b427ef6-1aae-4175-8217-ea447ee6df6b`                                                                                                                         |
| EAS ownership            | **Decision made**                       | personal Expo account for now; recovery inventory still needs recording                                                                                                                               |
| `preview` build profile  | **Ready in source**                     | store-distributed (`.aab` + store `.ipa`), `preview` channel, remote auto-increment (ADR 040)                                                                                                         |
| Production build profile | **Configured, unproved**                | store IPA/AAB, production OTA channel, remote auto-increment                                                                                                                                          |
| Submission config        | **Preview destination proved, both platforms** | `submit.preview.ios.ascAppId` commits public app ID `1479613630`; Android `serviceAccountKeyPath` resolves on the build host and submitted versionCode 138 on 2026-09-07 ([document 3](./03-first-preview.md) §3.8) |
| Apple access             | **Owner confirmed**                     | Apple Developer + App Store Connect access available                                                                                                                                                  |
| Legacy iOS custody       | **Located**                             | private Fastlane Match repository exists and is accessible; keep for rollback, do not bridge into EAS                                                                                                 |
| Android Play App Signing | **Owner confirmed enabled**             | Play signs releases; the app-signing key is in use and an upload-key certificate exists                                                                                                               |
| Android upload key       | **Imported into EAS**                   | held key (alias `upload`, SHA-1 `99f82ae8…`) imported and set as default build credentials, 2026-08-28; **no upload-key reset requested** — see [document 3](./03-first-preview.md) §3.7               |
| EAS-managed credentials  | **iOS + Android signing live**          | iOS proved by shipped build 142 (§3.6); Android proved by shipped versionCode 138 signed with the upload key (§3.8). Play service account `eas-submit@…` authenticates `eas submit` from the build host |
| EAS remote versions      | **Both initialized**                    | iOS `buildNumber` is `142`; Android `versionCode` set to `137` from the live production track on 2026-09-07, first preview build took `138` (§3.8)                                                     |
| Store tester groups      | **iOS confirmed, Play unverified**      | TestFlight internal group **The Team** carries build 142 (§3.6); the Play internal tester list still needs creating/confirming — no Google group is attached to the internal track (Play API)          |
| Signed build/install     | **Both uploaded, no device install yet** | iOS 142 on TestFlight (§3.6), Android 138 on the Play internal track (§3.8); physical-device installs remain operator items                                                                           |
| Build host               | **Ready**                               | store binaries build with `eas build --local`; iOS uses macOS and Android uses the Windows PC through `ssh pc`/WSL, proved in §3.8 with three host caveats. Native Calendar paging releases also need the exact-revision device gate. No EAS build quota, free plan sufficient |
| OTA infrastructure       | **Separate programme**                  | first native preview can proceed before publishing automation; OTA verification follows when its runtime is ready                                                                                     |

## 5.2 Gates to the first preview

~~Engineering — implement the store-distributed `preview` profile.~~ **Done**: `preview` is
`distribution: "store"` with `app-bundle`/store `.ipa`, `autoIncrement` and a `submit.preview`
profile (ADR 040). The native Calendar paging owner adds an exact-revision [device evidence gate](./06-calendar-paging-gate.md) before any preview carrying it.

The iOS preview profile deterministically targets existing App Store Connect app `1479613630`.
That public destination metadata is not a credential: Apple account/team authentication, signing,
and submission access remain operator-managed outside git. This source correction did not build,
sign, upload, or submit anything; the exact-artifact and explicit-authorization gates below still
apply.

The remaining operator and device-evidence work follows:

1. ~~Owner — record the public Play app-signing fingerprint.~~ **Done** 2026-09-07 (§3.8):
   SHA-256 `4646f746…`; Play's expected upload certificate matches §3.7.
2. ~~Owner — import the held Android upload key.~~ **Done** 2026-08-28 (§3.7); no reset was
   requested. Confirmed 2026-09-07 against Play Console's expected upload certificate.
3. ~~Owner — configure least-privilege Play submission access.~~ **Done** 2026-09-07 (§3.8):
   service account `eas-submit@…`, testing-track rights only, key on the build host.
4. ~~Owner — initialize the EAS remote Android version counter.~~ **Done** 2026-09-07 (§3.8): set
   to `137` from the live production track; iOS is at `142`.
5. **Owner — inventory Apple/EAS identifiers and recovery** in the password manager and add the trusted
   account recovery owner. Include the Play service-account identity (email + project), never its JSON.
6. **Owner — create/confirm the Play internal tester list.** The TestFlight side is done: internal
   group **The Team** received build 142 (§3.6). The Play internal track has release 138 but no
   tester list attached yet.
7. **Release operator — record the Calendar paging evidence and owner verdict for the exact SHA
   before any preview carrying it, then build iOS on macOS and Android on the Windows PC/WSL,
   submit and physically install.** Build and submit are done for the recorded first previews
   (iOS 142 §3.6, Android 138 §3.8); physical installs remain.

Account login, credential creation, build, submission and tester distribution are explicit
operator/deploy acts.

## 5.3 Additional gates before public v4

- Phase 10 parity and Maestro/migration checks are complete.
- A real v3→v4 upgrade succeeds on iOS and Android with representative data.
- The production-channel candidate is internally rehearsed and is the exact artifact promoted.
- store metadata, privacy declarations, screenshots, review credentials/notes and support links are
  current for v4.
- Crashlytics, analytics and migration-success observability are verified on release builds.
- OTA production signing, rollout and rollback are rehearsed if OTA will be available at launch.
- the Flutter fallback can still be built/signed or is explicitly retired after v4 stability.
- the rollout record names percentages, watch periods, stop thresholds and the human operator.

## 5.4 What is reassuring

- The React Native app already has the correct existing-store identity and a real EAS project.
- Apple access is available, so losing an old local Xcode certificate is not by itself a blocker.
- Android signing is fully accounted for: Google holds the app-signing key under Play App
  Signing, and the owner holds the upload key with three backups. Nothing is lost and nothing
  needs resetting, so Google's activation queue is not on the critical path.
- iOS and Android build on the designated macOS and Windows PC/WSL hosts, respectively.
- Store-internal previews do not require completed OTA automation. The
  owner can bootstrap them by hand, then automate the proven path.
- No secret needs to be committed to finish this plan.

## 5.5 Android signing is settled

Both halves of the chain are accounted for: Play App Signing is enabled so Google holds the
user-facing app-signing key, and the owner holds the upload key backed up in three places. The
remaining work is import and proof — record the public fingerprints, import the key into
EAS-managed credentials, and prove one internal-track upload. **No upload-key reset is required**,
and requesting one would invalidate working backups for nothing.
