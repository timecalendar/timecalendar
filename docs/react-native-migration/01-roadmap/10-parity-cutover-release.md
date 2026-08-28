# Phase 10 — Parity, cutover & release

> **Goal:** prove full parity, harden via real-user beta, and execute the **one-shot clean cutover** that replaces the Flutter app in the stores.
>
> **Depends on:** all prior phases. **Modules:** all (sweep) + release infra.

## Rough steps

1. **Parity sweep** — verify every Flutter feature has a DoD-complete RN equivalent. Close gaps.
2. **Maestro parity suite** — e2e flows mirroring the Flutter `integration_test` regression set: onboarding (school/QR/iCal), calendar render/scroll, personal-event CRUD, hide-event, notification tap-through, assistant, **and the data migration**.
3. **Internal hardening** — widen TestFlight internal + Play internal testing on the `preview` channel; run real upgrades from a Flutter install (exercises Phase 09 for real). A public beta programme is deliberately **post-cutover**.
4. **Cutover prep** — reuse the existing **bundle ID / package name** + Firebase config so stores treat it as an update; bump version over the current Flutter `3.1.0+134`. Signing: Play App Signing holds the Android app-signing key and the upload key is held with three backups; iOS uses EAS-managed credentials on the same Apple team, **not** the Flutter `match` repo. Store binaries build with `eas build --local` on the owner's macOS host (ADR [040](../../mobile/architecture-book/decisions/040-local-store-builds-and-store-preview.md)). Release candidates are annotated tags on `main`; the legacy `production` branch is not part of the mobile release path.
5. **OTA client wiring ✅** — preview/production native config points at signed self-hosted xprem on Cloudflare R2 with explicit `OTA_CHANNEL`, embedded public trust root and measured per-lane SDK 56 fingerprints (ADR [037](../../mobile/architecture-book/decisions/037-self-hosted-ota-runtime.md)). Rollout/rollback discipline and **never promoting a build across channels** remain operator rules; actual publish/rollback and physical-device signed delivery/rejection proof remain later work. A `beta` channel for opted-in students lands **after** the cutover, since 4.0 ships to everyone at parity. Binding rules: [`architecture-book/eas.md`](../../mobile/architecture-book/eas.md). The exploration that produced them is [`docs/mobile/ota/`](../../mobile/ota/README.md) (TIM-170) — not maintained, not authoritative.
   5b. **Preview backend selector ✅** — development and store-preview use an independent explicit
   backend capability with fixed choices, destructive journaled reset/recovery and an unmistakable
   non-production marker; production remains locked. All four release fingerprints moved, so the
   next artifacts require fresh native builds. This status records source readiness only, not a
   build, submission, OTA publish, promotion or rollout.
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
