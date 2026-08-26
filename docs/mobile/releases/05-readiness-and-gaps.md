# 5 — Readiness and gaps

## 5.1 Current facts

| Area | Status on 2026-08-26 | Evidence / consequence |
| --- | --- | --- |
| v4 store identity | **Ready in source** | iOS and Android use `fr.samuelprak.timecalendar` outside the dev variant |
| User-facing version | **Ready in source** | `4.0.0`; live store build counters still need synchronization |
| EAS project link | **Ready** | `@samuelprak/timecalendar`, project ID `3b427ef6-1aae-4175-8217-ea447ee6df6b` |
| EAS ownership | **Decision made** | personal Expo account for now; recovery inventory still needs recording |
| Current preview profile | **Wrong distribution for chosen preview** | creates direct-install APK/ad hoc IPA, not Play/TestFlight builds |
| Production build profile | **Configured, unproved** | store IPA/AAB, production OTA channel, remote auto-increment |
| Submission config | **Skeleton only** | iOS IDs are environment references; Android points to an absent local service-account path and internal track |
| Apple access | **Owner confirmed** | Apple Developer + App Store Connect access available |
| Legacy iOS custody | **Located** | private Fastlane Match repository exists and is accessible; keep for rollback, do not bridge into EAS |
| Android Play App Signing | **Unknown / first gate** | supplied console text was Play protection, not the Play app-signing page |
| Legacy Android keystore | **Not found** | absent from known TimeCalendar workspaces and git history; may be recoverable elsewhere or resettable depending on Play state |
| EAS-managed credentials | **Unverified** | no live credential mutation or inspection was performed for this docs task |
| Store tester groups | **Unverified** | create/confirm **The team** in TestFlight and Play |
| Signed build/install | **Not done in this task** | first store-internal preview remains a controlled rollout action |
| Build automation/Mac runner | **Future work** | not required for the first manual EAS preview |
| OTA infrastructure | **Separate programme** | first native preview can proceed before publishing automation; OTA verification follows when its runtime is ready |

## 5.2 Gates to the first preview

Do these in order:

1. **Owner — confirm Play App Signing** on the specific Play app-signing page and record public
   app-signing/upload fingerprints.
2. **Engineering ticket — implement the store-preview profile** and submit routing described in
   [document 3](./03-first-preview.md), with no credential material in the diff.
3. **Owner — resolve Android upload-key custody** by importing the matching key or completing a
   Play upload-key reset.
4. **Owner — inventory Apple/EAS identifiers and recovery** in Vaultwarden and add the trusted
   account recovery owner.
5. **Owner — initialize EAS remote version counters** from the live consoles, not the historical
   Flutter `+134` alone.
6. **Owner — configure EAS-managed Apple signing and least-privilege store submission access.**
7. **Owner — create/confirm The team tester groups** in both stores.
8. **Release operator — build, submit and physically install** both recorded store-preview builds.

Only item 2 is a repository implementation. Account login, key reset, credential creation, build,
submission and tester distribution are explicit operator/deploy acts.

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
- If Play App Signing is enabled—as is common for existing Play apps—the missing Android file is
  likely an upload-key recovery/reset problem rather than loss of the user-facing signing key.
- Store-internal previews do not require the future Mac runner, CI release pipeline or completed OTA
  automation. The owner can bootstrap them manually through EAS, then automate the proven path.
- No secret needs to be committed to finish this plan.

## 5.5 The one uncomfortable fact

Do not schedule the first Android preview until Play App Signing is positively confirmed. That one
console fact changes the recovery path from “reset/import an upload key” to “find the original
app-signing key.” Everything else is normal setup work with known owners and finite steps.
