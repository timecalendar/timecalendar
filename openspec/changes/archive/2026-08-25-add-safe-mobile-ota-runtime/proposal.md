## Why

TimeCalendar can download compatible OTA bundles today, but it neither controls when a downloaded bundle replaces the running JavaScript nor identifies that bundle in crash reports. Before the self-hosted endpoint and signing inputs arrive, the app needs a non-blocking apply policy, bundle-level observability, and a durable architecture decision that keeps later OTA work on the ratified path.

## What Changes

- Make the existing zero-wait launch posture explicit with `updates.fallbackToCacheTimeout: 0`; cold launch continues without OTA progress UI, prompts, or splash blocking.
- Add one owned `expo-updates` runtime component that observes downloaded updates and requests one silent reload only on a real background-to-active transition.
- Guard the runtime against duplicate AppState listeners, repeated reload attempts, and reload rejection; report the latter through `@/firebase` without personal data.
- Extend the Firebase seam to install the running OTA update id, channel, runtime version, creation time, and embedded-bundle flag as Crashlytics custom keys once per JavaScript runtime, with deterministic development/embedded fallbacks.
- Add focused Jest proof tests for Firebase attribute forwarding and the OTA background-to-foreground state machine while preserving the existing top-level FCM registration proof.
- Record ADR 036 for the self-hosted xprem + Cloudflare R2 architecture, Postgres control plane without ClickHouse, signed updates, fingerprint compatibility, silent foreground apply, and deliberately imperative channel pointers/rollout percentages; index it, update the current EAS/Firebase guidance plus the existing `CHANGELOG.md`, and reconcile `architecture.md` with that canonical changelog.
- Keep endpoint, request-header/channel stamping, EAS channel/profile changes, signing material, publish CI, credentials, native-device verification, and the legacy Flutter app out of scope.

## Capabilities

### New Capabilities

- `mobile-ota-runtime`: Silent, non-blocking application of a downloaded compatible OTA bundle at a natural foreground boundary.

### Modified Capabilities

- `mobile-distribution`: Make the zero-wait OTA launch policy explicit while retaining fingerprint runtime compatibility and the existing distribution configuration.
- `mobile-firebase`: Attach deterministic OTA bundle identity to Crashlytics through the modular RNFirebase seam exactly once per JavaScript runtime.
- `mobile-architecture-book`: Ratify the self-hosted OTA architecture in ADR 036 and use the repository's existing `CHANGELOG.md` as the rule-change log.

## Impact

- Runtime code: `mobile/src/` gains one owned OTA runtime boundary mounted once by the root layout; `mobile/src/firebase/index.ts` gains the corresponding Crashlytics attribute seam.
- Tests: focused Jest coverage for the AppState/reload state machine and modular `setAttributes` forwarding; Jest's Firebase and Expo Updates mocks remain deterministic.
- Native configuration: `mobile/app.config.ts` explicitly adds `updates.fallbackToCacheTimeout: 0`. This is a sensitive native/store-config surface, but it does not alter the update URL, headers, channel mapping, runtime-version policy, plugins, credentials, or Firebase files.
- Architecture documentation: `architecture.md`, ADR 036, the ADR index, `eas.md`, `firebase.md`, and `CHANGELOG.md`. `runtime.md` changes only if implementation reveals a reusable runtime contract not already owned by EAS/Firebase guidance.
- Contracts and data: no OpenAPI/generated-client, database schema/migration, server, infrastructure, CI workflow, store credential, or Flutter legacy changes.
