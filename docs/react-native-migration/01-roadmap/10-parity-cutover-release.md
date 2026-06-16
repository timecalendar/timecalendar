# Phase 10 — Parity, cutover & release

> **Goal:** prove full parity, harden via real-user beta, and execute the **one-shot clean cutover** that replaces the Flutter app in the stores.
>
> **Depends on:** all prior phases. **Modules:** all (sweep) + release infra.

## Rough steps

1. **Parity sweep** — verify every Flutter feature has a DoD-complete RN equivalent. Close gaps.
2. **Maestro parity suite** — e2e flows mirroring the Flutter `integration_test` regression set: onboarding (school/QR/iCal), calendar render/scroll, personal-event CRUD, hide-event, notification tap-through, assistant, **and the data migration**.
3. **Beta hardening** — widen internal/TestFlight + Play internal testing; dogfood real upgrades from a Flutter install (exercises Phase 09 for real).
4. **Cutover prep** — reuse existing **bundle ID / package name / signing keys** + Firebase config so stores treat it as an update; bump version over the current Flutter `3.1.0+134`.
5. **OTA** — EAS Update channels (`preview`, `production`), rollout/rollback discipline.
6. **Release** — submit via EAS; staged store rollout; watch Crashlytics + migration success metrics closely.
7. **Retire Flutter** — once stable in production, stop Flutter maintenance ([R-5](../00-exploration/migration-approach.md#6-working-rules-seed-of-the-architecture-book)); archive `app/`.

## Human prerequisites — credentials, signing & store accounts

The EAS **config half is landed** (`mobile/eas.json`, `expo-updates` wiring, channel/profile
mapping; `eas init` done — the real `projectId` `3b427ef6-1aae-4175-8217-ea447ee6df6b` is
committed in `app.config.ts`, not a secret). What remains is irreducibly human — account access
+ credentials + real-device/console steps — and was carried here from the EAS setup inbox note.
None of it blocks `tsc`/lint/test; it unlocks actual builds, installs, and store submission.

1. **Apple Developer credentials + signing (iOS).** On the first
   `eas build --profile preview --platform ios` (or `eas credentials`), link the Apple Developer
   account and let **EAS manage signing** (dist cert + provisioning profile for
   `fr.samuelprak.timecalendar`). Provide `$EXPO_APPLE_ID` / `$EXPO_ASC_APP_ID` /
   `$EXPO_APPLE_TEAM_ID` for `submit.production.ios` — never commit them. We do **not** bridge the
   Flutter Fastlane `match` repo into EAS (it stays with `app/` — R-5); same bundle id → it targets
   the existing App Store record (RN ships as an update).
2. **Google Play service account (Android submit).** Supply a Play service-account JSON key and
   point `submit.production.android.serviceAccountKeyPath` at it (outside git, e.g. `ci/keys/…`).
3. **Real-device install + internal-distribution channels.** `eas build --profile preview` for both
   platforms; install on a real device from the EAS internal URL (iOS: register UDID / TestFlight
   internal; Android: `.apk` / Play internal testing). Stand up the **TestFlight internal** group +
   the **Play Console internal testing** track so dogfooders get builds (feeds step 3 above).
4. **`.dev` Firebase apps** — owned by `mobile/firebase/README.md`; the `development` EAS profile
   builds the `.dev` identity and needs those config files present (already tracked).

## Exit criteria

- Full feature parity, all DoD-complete.
- Maestro parity suite green on both platforms, including migration-from-Flutter.
- Production release out; migration success + crash-free rates within target on real upgrades.

## Risks & decisions

- **The cutover is one-shot for existing users** — a bad release degrades every user at once. Staged rollout + close migration-metric watch + the Phase 09 safety net are the guardrails.
- Have a **rollback plan**: if the RN release misbehaves, can we re-ship Flutter? (Store + signing implications — decide before release.)
</content>
