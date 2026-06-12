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

## Exit criteria

- Full feature parity, all DoD-complete.
- Maestro parity suite green on both platforms, including migration-from-Flutter.
- Production release out; migration success + crash-free rates within target on real upgrades.

## Risks & decisions

- **The cutover is one-shot for existing users** — a bad release degrades every user at once. Staged rollout + close migration-metric watch + the Phase 09 safety net are the guardrails.
- Have a **rollback plan**: if the RN release misbehaves, can we re-ship Flutter? (Store + signing implications — decide before release.)
</content>
