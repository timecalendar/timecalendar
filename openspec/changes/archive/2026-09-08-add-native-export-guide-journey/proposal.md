## Why

Students can currently reach the manual QR/iCal selector without first receiving the native,
provider-specific instructions needed to obtain an iCal URL. With the validated server catalogue
and resolver now available in mobile, onboarding can enforce the approved guide journey without a
WebView, generated content, or a client release for future schema-v1 content-only providers.

## What Changes

- Add a native provider selector for unlisted institutions and native guide pages backed only by a
  validated, journey-pinned export-guide snapshot.
- Extend the Stack-scoped import context with discriminated journey states, completion
  invalidation, and production-capable route legality for guide, manual, QR, and iCal routes.
- Preserve the listed Programme and Connect gates, skip missing or unsafe required Connect URLs
  with a sanitized diagnostic, and keep Connect unavailable to unlisted institutions.
- Give each guide page its own Stack entry, deterministic Next-only forward navigation, ordinary
  native Back behavior, blocking retry/error recovery, text-only image degradation, and complete
  accessible FR/EN shell UI.
- Emit only bounded export-guide Analytics and Crashlytics fields through the existing Firebase
  seam, excluding institution/programme data, URLs, payload copy, raw errors, and route parameters.
- Update ADR 047, navigation and feature guidance, and the Architecture Book changelog to describe
  the implemented production route-legality and ephemeral snapshot contract.

## Capabilities

### New Capabilities

- `mobile-export-guide-journey`: Native provider selection, pinned guide pages, guards, recovery,
  accessibility, localization, image degradation, and privacy-bounded observability.

### Modified Capabilities

- `mobile-onboarding-flow`: Institution and programme decisions now resolve through the required
  export guide before manual import, with server-owned Programme/Connect gates and protected route
  recovery.

## Impact

- Affects `mobile/src/features/export-guides/ui/`, the onboarding draft/context and UI transitions,
  thin `mobile/src/app/onboarding/` route exports, typed FR/EN resources, `@/firebase` consumers,
  and focused journey/navigation/component/privacy tests.
- Updates the binding current-state documentation under `docs/mobile/architecture-book/`, including
  ADR 047 and `CHANGELOG.md`.
- Does not change the OpenAPI contract, generated API client, server, storage schema, dependencies,
  native/store configuration, workflows, Flutter, web, deployment state, catalogue activation, or
  the production feature flag.
