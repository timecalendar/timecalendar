## Why

Internal store-preview testers currently need a rebuilt binary to exercise preprod, while the mobile API URL is compiled as one global value and backend-owned SQLite, MMKV, query, notification, and sync state has no safe cross-environment reset path. TimeCalendar needs the already-approved visible preview switch now so testers can move between the canonical preprod and production APIs without contaminating either environment, while production store binaries remain locked to production.

## What Changes

- Add an explicit, build-resolved runtime capability independent of `APP_VARIANT`, app identity, Firebase project, scheme, `__DEV__`, and OTA channel: development is switchable, preview is switchable and defaults to preprod, and production is locked to production. Missing or malformed release capability fails closed.
- Replace the compile-time singleton API URL with a typed runtime environment resolver over the exact allowlist: developer-configured local URL in development, `https://preprod-api.timecalendar.app`, and `https://api-v2.timecalendar.app`; no free-text/custom URL input.
- Add an ordinary localized and accessible Settings environment selector in development and preview only, plus a persistent, screenshot-visible marker whenever the active environment is not production. Production renders neither selector nor non-production state and ignores malformed/stale persistence.
- Require explicit destructive confirmation before switching. A single reset orchestrator retains only the target environment, blocks startup during an incomplete switch, clears every backend-bound SQLite table, MMKV key, query persister/in-memory query, calendar sync/mutation, notification-registration, and present/future authentication participant, and reloads only after completion into an empty coherent state.
- Classify persisted data: global UI/device preferences may survive only when environment-independent; backend-bound identifiers, source tokens, hidden-event state, notification preferences/registration state, remembered feedback identity, and all database rows are cleared. The selected environment and reset-recovery marker are the only reset-control survivors.
- Include the effective backend environment in Feedback and privacy-safe Firebase diagnostic context; record an analytics event only after a successful switch.
- Add focused config, resolver, UI, persistence, cancellation, reset-ordering, and partial-failure tests; update binding release/Architecture Book/roadmap documentation and record fresh SDK 56 preview/production fingerprints and whether new native builds are required.

## Capabilities

### New Capabilities

- `mobile-backend-environments`: allowed environments, fail-closed runtime resolution, non-production visibility, destructive switch semantics, persistence classification, reset recovery, and diagnostic behavior.

### Modified Capabilities

- `mobile-distribution`: release profiles expose an explicit preview-versus-production backend capability without changing production identity, Firebase selection, or OTA routing, and their fingerprints are re-measured.
- `mobile-api-client`: every request resolves the effective allowlisted backend at call time instead of using one compile-time singleton URL.
- `mobile-settings-hub`: development and preview gain a visible environment control while production remains selector-free and inert.
- `mobile-storage`: the owned MMKV and SQLite seams gain explicit backend-reset operations and a documented global-versus-backend-bound data classification.
- `mobile-feedback`: diagnostic enrichment identifies the effective backend environment without adding secrets or personal data.
- `mobile-firebase`: Crashlytics/Analytics receive privacy-safe environment context and a successful-switch event through the owned seam.

## Impact

- Mobile config and release surfaces: `mobile/app.config.ts`, `mobile/app.config.test.ts`, `mobile/eas.json`, resolved config helpers, and SDK 56 fingerprint evidence. These are sensitive; app identity, Firebase files, signing, OTA endpoint/channel headers, submission behavior, and credentials must remain unchanged.
- Runtime and UI: `mobile/src/config/`, `mobile/src/api/`, a new environment-owned feature/store/reset seam, root startup/readiness composition, Settings UI/routes, persistent app chrome marker, EN/FR catalogs, Feedback, and Firebase diagnostics.
- State: all four current SQLite tables (`personal_events`, `user_calendars`, `calendar_events`, `checklist_items`), the TanStack Query client and MMKV persister, school/group selection, hidden-event identifiers, notification preferences/registration state, remembered feedback e-mail, and calendar sync/mutation state. The RN tree has no auth/session store today; the reset contract explicitly records that fact and provides the mandatory participant seam future auth must implement.
- Documentation: binding Architecture Book pages (`runtime.md`, `data.md`, `storage.md`, `eas.md`, `features.md`), `CHANGELOG.md`, an ADR for the runtime-capability/reset protocol, release/operator guidance, and the Phase 10 roadmap.
- No server, schema migration, OpenAPI, generated API, deployment, Flutter, store submission, build, OTA publish, promotion, or rollout change. No dependency on TIM-243 or TIM-244.
