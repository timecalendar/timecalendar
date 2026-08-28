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
| Submission config        | **Preview destination ready in source** | `submit.preview.ios.ascAppId` commits public app ID `1479613630`; Apple account/team credentials and production IDs remain environment-backed; Android points to an absent local service-account path |
| Apple access             | **Owner confirmed**                     | Apple Developer + App Store Connect access available                                                                                                                                                  |
| Legacy iOS custody       | **Located**                             | private Fastlane Match repository exists and is accessible; keep for rollback, do not bridge into EAS                                                                                                 |
| Android Play App Signing | **Owner confirmed enabled**             | Play signs releases; the app-signing key is in use and an upload-key certificate exists                                                                                                               |
| Android upload key       | **Imported into EAS**                   | held key (alias `upload`, SHA-1 `99f82ae8…`) imported and set as default build credentials, 2026-08-28; **no upload-key reset requested** — see [document 3](./03-first-preview.md) §3.7               |
| EAS-managed credentials  | **iOS + Android signing live**          | iOS proved by shipped build 142 (§3.6); Android upload keystore imported and read back (§3.7). **No Play service account** — `eas submit --platform android` cannot authenticate                        |
| EAS remote versions      | **iOS initialized, Android not**        | iOS `buildNumber` is `142`; Android `versionCode` is still `1` against a live Play counter far above it — must be set from the live console before any Android build                                    |
| Store tester groups      | **Unverified**                          | create/confirm **The team** in TestFlight and Play                                                                                                                                                    |
| Signed build/install     | **Not done in this task**               | first store-internal preview remains a controlled rollout action                                                                                                                                      |
| Build host               | **Ready**                               | store binaries build with `eas build --local` on the owner's macOS host; no EAS build quota, free plan sufficient (ADR 040)                                                                           |
| OTA infrastructure       | **Separate programme**                  | first native preview can proceed before publishing automation; OTA verification follows when its runtime is ready                                                                                     |

## 5.2 Gates to the first preview

~~Engineering — implement the store-distributed `preview` profile.~~ **Done**: `preview` is
`distribution: "store"` with `app-bundle`/store `.ipa`, `autoIncrement` and a `submit.preview`
profile (ADR 040). No repository implementation now blocks the first preview.

The iOS preview profile deterministically targets existing App Store Connect app `1479613630`.
That public destination metadata is not a credential: Apple account/team authentication, signing,
and submission access remain operator-managed outside git. This source correction did not build,
sign, upload, or submit anything; the exact-artifact and explicit-authorization gates below still
apply.

Everything remaining is an operator act, in order:

1. **Owner — record the public Play app-signing fingerprint.** The upload-certificate fingerprint is
   already recorded in [document 3](./03-first-preview.md) §3.7.
2. ~~Owner — import the held Android upload key.~~ **Done** 2026-08-28 (§3.7); no reset was
   requested. Confirming it against Play's expected upload certificate still needs gate 3.
3. **Owner — configure least-privilege Play submission access** (a Play service account for EAS
   Submit). Apple signing and the App Store Connect API key are done and proved by build 142.
   This is the single item gating the entire Android half.
4. **Owner — initialize the EAS remote Android version counter** from the live console; it is still
   `1`. iOS is initialized at `142`. The historical Flutter `+134` is not authoritative.
5. **Owner — inventory Apple/EAS identifiers and recovery** in Vaultwarden and add the trusted
   account recovery owner.
6. **Owner — create/confirm The team tester groups** in both stores.
7. **Release operator — build both platforms locally, submit and physically install.**

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
- Store binaries build on hardware we already own with `eas build --local`, consuming no EAS
  build quota — the free Expo plan carries the whole release process.
- Store-internal previews do not require a CI release pipeline or completed OTA automation. The
  owner can bootstrap them by hand, then automate the proven path.
- No secret needs to be committed to finish this plan.

## 5.5 Android signing is settled

Both halves of the chain are accounted for: Play App Signing is enabled so Google holds the
user-facing app-signing key, and the owner holds the upload key backed up in three places. The
remaining work is import and proof — record the public fingerprints, import the key into
EAS-managed credentials, and prove one internal-track upload. **No upload-key reset is required**,
and requesting one would invalidate working backups for nothing.
