# Phase 10 — Parity, cutover & release

> **Goal:** prove full parity, harden via real-user beta, and execute the **one-shot clean cutover** that replaces the Flutter app in the stores.
>
> **Depends on:** all prior phases. **Modules:** all (sweep) + release infra.

## Rough steps

1. **Parity sweep** — verify every Flutter feature has a DoD-complete RN equivalent. Close gaps.
2. **Maestro parity suite** — e2e flows mirroring the Flutter `integration_test` regression set: onboarding (school/QR/iCal), calendar render/scroll, personal-event CRUD, hide-event, notification tap-through, assistant, **and the data migration**.
3. **Beta hardening** — widen internal/TestFlight + Play internal testing; dogfood real upgrades from a Flutter install (exercises Phase 09 for real).
4. **Cutover prep** — reuse existing **bundle ID / package name / signing keys** + Firebase config so stores treat it as an update; bump version over the current Flutter `3.1.0+134`.
5. **OTA** — EAS Update channels (`preview`, `production`), rollout/rollback discipline. Investigated in [`docs/mobile/ota/`](../../mobile/ota/README.md) (TIM-170): the option landscape, costs, a recommendation (paid Starter plan — **not** the free tier, whose 1,000-MAU hard stop would disable hotfixes mid-term) and the day-one runbook.
6. **Release** — submit via EAS; staged store rollout; watch Crashlytics + migration success metrics closely.
7. **Retire Flutter** — once stable in production, stop Flutter maintenance ([R-5](../00-exploration/migration-approach.md#6-working-rules-seed-of-the-architecture-book)); archive `app/`.

## Human prerequisites — credentials, signing & store accounts

The EAS config half is landed, but account access, credentials, store-console work and real-device
verification remain operator-owned. None of those actions blocks source checks; they gate actual
builds, installs and store submission.

The [mobile release guide](../../mobile/releases/README.md) owns the explanation and current gaps;
the [(HUMAN: mobile release bootstrap) inbox note](../inbox/2026-08-26-mobile-release-bootstrap.md)
owns the executable checklist.

The separate `.dev` Firebase prerequisite remains owned by
[`mobile/firebase/README.md`](../../../mobile/firebase/README.md).

## Exit criteria

- Full feature parity, all DoD-complete.
- Maestro parity suite green on both platforms, including migration-from-Flutter.
- Production release out; migration success + crash-free rates within target on real upgrades.

## Risks & decisions

- **The cutover is one-shot for existing users** — a bad release degrades every user at once. Staged rollout + close migration-metric watch + the Phase 09 safety net are the guardrails.
- Have a **rollback plan**: if the RN release misbehaves, can we re-ship Flutter? (Store + signing implications — decide before release.)
</content>
