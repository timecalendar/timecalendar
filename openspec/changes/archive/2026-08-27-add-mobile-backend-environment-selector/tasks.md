## 1. Resolve the build capability and allowlist

- [x] 1.1 Add a typed backend-capability parser to `mobile/app.config.ts`, expose its normalized value through `extra`, and make missing/malformed runtime data production-locked without consulting app identity, Firebase, scheme, `__DEV__`, or OTA metadata.
- [x] 1.2 Set the explicit development/preview/production backend-capability inputs in local npm scripts and `mobile/eas.json` while preserving the existing identity, Firebase, OTA header/signing, store artifact, and submission contracts.
- [x] 1.3 Extend `mobile/app.config.test.ts` with the full development/preview/production/missing/malformed matrix and assertions that backend capability stays independent from `APP_VARIANT`, `OTA_CHANNEL`, EAS project id, identity, and Firebase selection.
- [x] 1.4 Create the environment feature's pure types/parser/resolver with the exact canonical preprod/production constants, development-only compiled local URL validation, capability-aware defaults, and no URL-valued public setter; cover the exact allowlist and malformed inputs at the 90% logic threshold.

## 2. Persist and resolve the effective backend

- [x] 2.1 Add a typed selected-environment MMKV store and reactive accessor whose total parser rejects malformed/disallowed values and forces production in production-locked builds.
- [x] 2.2 Change the API config/mutator seam to resolve the effective base URL at request time, update focused mutator/config tests for all allowed defaults and production inertness, and leave `openapi/openapi.json` plus `mobile/src/api/generated/` untouched.
- [x] 2.3 Add restart-style tests proving an allowed committed selection survives module/runtime restart and a stale non-production selection cannot affect production.

## 3. Build the reset and recovery protocol

- [x] 3.1 Extend `@/db` with one synchronous transaction that deletes `checklist_items`, `calendar_events`, `user_calendars`, and `personal_events`; add focused complete-wipe, ordering, and thrown-transaction tests using the shared fake DB.
- [x] 3.2 Extend `@/storage` with versioned reset-journal operations, backend-bound clearing, and an enumerated key classification that preserves only theme, language, display-timezone, Changelog acknowledgement, and reset controls; add coverage that fails for an unclassified known key.
- [x] 3.3 Expose/query-wire reset participants that cancel in-flight TanStack queries and mutations, remove the MMKV persisted-query record, clear the in-memory QueryClient, and verify persister data cannot be restored after switching.
- [x] 3.4 Add explicit idempotent reset participants for calendar sync/mutation state and notification-registration/preferences/state; clear all current backend identifiers including durable calendar tokens, school/group selection, hidden events, notification values, and remembered feedback e-mail.
- [x] 3.5 Add the session/auth reset participant registry, document and test that it is intentionally empty in the current RN tree, and encode a guard/test requiring any future auth/session store to join it.
- [x] 3.6 Implement the single-flight environment-switch orchestrator with target revalidation, journal-first quiescence, ordered participants, commit-after-clear, success telemetry, and injected reload adapter; add ordering, cancellation/no-op, retained-target, duplicate-request, and full destructive-invariant tests.
- [x] 3.7 Gate root readiness on reset-journal recovery before mounting Query, sync, notifications, routes, or API consumers; add failure-injection and cold-restart tests proving a partial reset retains the journal/prior selection, performs no reload/request, and retries idempotently to an empty target state.

## 4. Add visible, accessible product surfaces

- [x] 4.1 Add the ordinary Settings environment control for development/preview only, with capability-specific fixed choices, current value, localized destructive confirmation, cancellation, progress/disabled state, and recovery UI; production/malformed capability must render nothing and remain behaviorally inert.
- [x] 4.2 Add a localized, safe-area-aware, high-contrast root marker for `local` and `preprod` that persists across tab/stack routes and is absent in production; test screenshot-visible text, accessibility semantics, large-text behavior, and production absence.
- [x] 4.3 Add complete typed EN/FR strings for environment labels, hints, confirmation, progress, marker, and recovery states; update Settings component/route tests for visibility, allowed choices, cancel/no-write behavior, and confirmed orchestration.
- [x] 4.4 Add or update a stable Maestro flow for Settings selection/confirmation/non-production marker when practical; do not add `run-e2e` by default on this no-KVM host.

## 5. Add support and diagnostics context

- [x] 5.1 Extend Feedback device information with the effective environment enum and focused formatting/DTO tests while keeping URLs, tokens, secrets, and additional personal data out of the generated contact contract.
- [x] 5.2 Set the effective environment as a Crashlytics attribute through `@/firebase` after readiness and emit one privacy-safe successful-switch Analytics event; test that cancellation/failure emits no success event and logs no backend URL or identifiers.

## 6. Update binding architecture and release guidance

- [x] 6.1 Add an Architecture Book ADR for the independent backend capability, destructive reset journal/roll-forward protocol, state classification, and future-auth participant invariant; index it under `docs/mobile/architecture-book/decisions/`.
- [x] 6.2 Update binding `runtime.md`, `data.md`, `storage.md`, `eas.md`, and `features.md` to describe the implemented current-state contracts and enforcing tests, and record the rule change in `docs/mobile/architecture-book/CHANGELOG.md`.
- [x] 6.3 Update `docs/mobile/releases/` operator guidance and Phase 10 roadmap status without treating the exploratory OTA document as binding; explicitly preserve identity/OTA/backend independence and prohibit build, submission, publish, promotion, or rollout in this issue.
- [x] 6.4 If native reload/banner/accessibility behavior cannot be proven on this host, add a non-blocking `docs/react-native-migration/inbox/` note tagged `(HUMAN: …)` with iOS/Android confirmation, recovery, screenshot marker, restart, and assistive-technology checks.

## 7. Verification and CI proof

- [x] 7.1 Run Prettier/format checks, `npx tsc --noEmit`, `npm run lint`, focused Jest suites, and `npm test -- --coverage` from `mobile/`; resolve all local failures without bypassing hooks or thresholds.
- [x] 7.2 Run the targeted `app.config` matrix suite and clean Expo config renders for development, preview, and production, verifying production identity/Firebase/OTA/signing and no custom URL path.
- [x] 7.3 Recompute the four SDK 56 fingerprints (preview/production × iOS/Android), record old/new hashes and source differences, and state exactly which lanes require fresh native builds; do not run a build or release act.
- [x] 7.4 Run `openspec validate add-mobile-backend-environment-selector`, verify `git diff` leaves server, deployment, Flutter, OpenAPI/generated client, secrets, credentials, and unrelated tickets untouched, and ensure the PR's CI proof covers the full reset invariant rather than only UI rendering.
