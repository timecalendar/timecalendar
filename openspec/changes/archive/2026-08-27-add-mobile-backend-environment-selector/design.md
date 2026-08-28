## Context

`mobile/src/api/config.ts` currently exports one build-inlined `API_BASE_URL`. `APP_VARIANT` distinguishes the co-installable development identity from the production identity, while `OTA_CHANNEL` independently selects signed xprem delivery. Preview and production deliberately share the production bundle/package id and Firebase project, so neither existing input is a correct runtime authorization boundary for backend switching.

The application currently persists backend-related state in four SQLite tables, one default MMKV instance, a TanStack Query in-memory cache plus MMKV persister, calendar sync/mutation hooks, and notification registration. There is no React Native user authentication/session store today. `user_calendars.token` is a durable backend source credential; selected school/group values, hidden-event identifiers, notification preferences, remembered feedback e-mail, and persisted query DTOs can also identify or describe one backend. A switch spanning SQLite, MMKV, and memory cannot be made atomically by one storage engine.

The owned deployment configuration establishes the only fixed release endpoints: preprod is `https://preprod-api.timecalendar.app`; production is `https://api-v2.timecalendar.app`. Development's `local` choice is the build's existing `EXPO_PUBLIC_API_URL`, never runtime input.

## Goals / Non-Goals

**Goals:**

- Give development and store-preview builds an explicit, visible, allowlisted backend selector with safe defaults.
- Make production builds both visibly and behaviorally incapable of selecting a non-production backend.
- Change environments through one restart-safe, idempotent reset protocol that cannot resume normal work with mixed backend state.
- Make non-production use obvious in screenshots and include the effective environment in privacy-safe support/diagnostic context.
- Keep backend selection independent from application identity, Firebase ownership, and OTA routing.
- Create an explicit reset participant contract that future authentication must join, while accurately documenting that no auth/session participant exists today.

**Non-Goals:**

- Adding endpoints, server behavior, schema migrations, arbitrary URLs, a beta lane, or a second app identity.
- Changing Firebase projects, OTA channel selection, signing, build/submission automation, store rollout, or publishing an OTA.
- Preserving or migrating user data between backends; a confirmed switch is intentionally destructive.
- Modifying legacy Flutter, `openapi/openapi.json`, or generated API code.

## Decisions

## Decision 1: Resolve a dedicated fail-closed backend capability at build time

`app.config.ts` will parse a dedicated build input (for example `BACKEND_ENVIRONMENT_CAPABILITY`) into exactly `development`, `preview`, or `production`, and expose the normalized result in `extra`. `eas.json` and local development scripts set it explicitly for their matching profiles. The runtime parser treats any missing, unknown, or structurally malformed value as `production`; it does not consult `appVariant`, OTA headers/channel, scheme, Firebase config, or `__DEV__` as a fallback.

The normalized capability determines allowed choices and default:

| Capability | Allowed choices | Default | Selector |
| --- | --- | --- | --- |
| `development` | `local`, `preprod`, `production` | `local` | visible |
| `preview` | `preprod`, `production` | `preprod` | visible |
| `production` or invalid | `production` | `production` | absent/inert |

Release config tests will prove the capability variable is separate from `OTA_CHANNEL` even though the preview and production EAS profiles set both inputs. Production identity/Firebase/OTA values remain byte-for-byte governed by their existing inputs.

Alternatives rejected:

- `APP_VARIANT`: preview and production intentionally share it.
- OTA channel or update metadata: backend routing must remain independent and runtime OTA metadata is not an authorization boundary.
- `__DEV__`, scheme, bundle id, or Firebase project inference: release-config development and shared release identity make these incomplete or misleading.
- Missing capability throwing at runtime: fail-closed production behavior is safer for malformed/stale manifests; build/config matrix tests still detect omitted intended profile values.

## Decision 2: Centralize typed environment and URL resolution behind an owned runtime seam

A small environment feature/store owns the `BackendEnvironment` union, exact endpoint constants, capability parsing, selected-environment persistence, and reactive effective-environment access. The API mutator reads the effective base URL at request time so a completed selection takes effect after reload without generated-client changes.

`preprod` and `production` map only to the two canonical HTTPS constants. `local` is compiled from `EXPO_PUBLIC_API_URL`, is available only to a valid development capability, and must be a valid absolute `http:` or `https:` URL. There is no setter accepting URLs. Persisted values are parsed against both the enum and current capability; disallowed, malformed, or legacy values resolve to the capability default. Production always returns the production constant even when storage contains another value.

Alternatives rejected:

- A free-text URL: it could exfiltrate future credentials and is not required by the tester workflow.
- One exported `API_BASE_URL` constant selected at module evaluation: it cannot safely reflect persisted runtime selection.
- Environment-partitioning all existing stores: it would retain multiple copies of sensitive/durable state, complicate migrations, and make the destructive user promise inaccurate. A full wipe is simpler and safer at current data volume.

## Decision 3: Use a quiesced, journaled, idempotent reset protocol

The environment feature exposes one `switchBackendEnvironment(target)` orchestrator. UI can request it only after explicit confirmation, but the orchestrator independently revalidates capability and target. Its ordered protocol is:

1. Validate the target, no-op if it is already effective, and acquire an in-process single-flight lock.
2. Persist a small reset journal containing schema version, current environment, and target. Enter a global `resetting` readiness state that unmounts/pauses backend consumers and prevents new API, sync, mutation, or notification-registration work.
3. Cancel in-flight TanStack queries and mutations, then invoke registered session/auth clear participants. The participant list is deliberately empty today and a test/documented invariant says future auth must register here before shipping.
4. Wipe all four SQLite tables in one synchronous transaction. The operation is exposed by `@/db`, not feature code, and deletes child/cache tables before identity/user tables for understandable ordering even though current soft references have no foreign keys.
5. Clear all backend-bound MMKV keys, including the TanStack persisted-query key, while preserving the reset journal. Clear the in-memory QueryClient and reset calendar sync/mutation module state and notification-registration state.
6. Persist the selected target, clear the reset journal, record privacy-safe diagnostics/analytics, and invoke an injected reload adapter only after every required clear completed.

The journal makes the cross-store process recoverable rather than pretending SQLite and MMKV share a transaction. Root readiness checks it before mounting Query, sync, notifications, routes, or any API consumer. If any step throws, the selected environment remains the prior committed value, normal startup stays blocked, the journal remains, and a localized recovery surface offers retry. A cold start repeats the idempotent clear from step 3 and commits the target only when complete. Thus a partial reset can lose old local data (consistent with the destructive confirmation), but can never run old state against the new backend.

The selected target is the intentional post-reset survivor. The reset journal is only a temporary control record. No reload is attempted on failure.

Alternatives rejected:

- Write the selected environment first and then clear: a crash could immediately route old state to the new backend.
- Best-effort `Promise.all`: it has no enforceable ordering, makes in-flight writes race deletion, and cannot explain partial failure.
- Roll back all stores: impossible across SQLite, MMKV, QueryClient, and native/runtime state without a second full copy; journaled roll-forward is smaller and deterministic.
- Reload immediately after selection: it can race asynchronous cache and persistence removal.

## Decision 4: Classify persisted state explicitly and default unknown state to backend-bound

The reset implementation will maintain a reviewed registry/classification next to the storage seam:

- Environment-independent survivors: theme, language, display-timezone, and Changelog acknowledgement. These describe device/UI presentation and do not name a backend account, calendar, or server result.
- Reset-control survivors: selected backend target after successful completion; temporary reset journal until completion.
- Backend-bound and wiped: selected school/group identity, hidden-event identifiers, notification preferences/registration state, remembered feedback e-mail, persisted TanStack Query data, and any future key not explicitly classified as global.
- SQLite: wipe `checklist_items`, `calendar_events`, `user_calendars`, and `personal_events`. Although some rows are locally authored, the product promise is a coherent empty state and checklist relationships/backend calendar tokens make selective retention unsafe.
- In-memory: cancel and clear TanStack Query queries/mutations; reset calendar sync/mutation guards; restart notification registration only after reload.
- Authentication/session: no implementation exists today. The empty participant registry and coverage prove the invariant honestly; future auth work must add a clear participant and update the classification/ADR.

The storage seam will expose narrow removal/reset APIs rather than exporting the raw MMKV instance. A test enumerates known keys against the classification so a newly introduced persisted key cannot silently escape review.

## Decision 5: Make non-production state global and diagnostics privacy-safe

A root-level marker inside safe-area-aware app chrome renders whenever the effective environment is `local` or `preprod`; it is persistent across tab/stack navigation, high contrast, localized, accessible, and names the environment. It is absent in production. Settings renders a normal row/control only when the capability says it is allowed; no gesture ritual exists.

Feedback's formatted diagnostic string gains the effective environment name. Root diagnostic setup attaches only the enum value to Crashlytics. A successful switch emits an Analytics event with `from_environment` and `to_environment`; cancellation and failed reset emit no successful-switch event. No endpoint URL, token, user identifier, e-mail, or message body is logged.

## Decision 6: Treat config changes as fingerprint-sensitive until measured

The implementation will run the repository's four SDK 56 `runtimeversion:resolve` commands for preview/production on iOS/Android after config changes and record old/new hashes and source diffs in `eas.md` or release guidance. Because resolved `extra`/EAS config can contribute to fingerprints, the change must not claim OTA compatibility in advance. If any lane fingerprint changes, fresh native preview and production builds are required before that lane can receive this code; this issue records the consequence but performs no build, submission, publish, promotion, or rollout.

## Risks / Trade-offs

- [A reset fails after some data has been erased] → Keep the journal, block normal startup, make every participant idempotent, retry roll-forward, and never commit the target/reload early.
- [A new MMKV key is accidentally treated as global] → Central classification plus a known-key coverage test; unknown keys default to backend-bound and require an explicit survivor justification.
- [A request races the switch] → Enter reset readiness first, cancel queries/mutations, prevent new backend work, and keep the old effective environment until reset completion.
- [Native FCM registration still exists at the previous backend] → Clear local notification source/registration state and re-register on the target after reload; server-side deletion is out of scope because no delete contract exists.
- [Persisted corrupt state enables preprod in production] → Capability-aware total parsing always forces production; selector and marker visibility derive from the same normalized seam.
- [The global banner affects layout or accessibility] → Put it in root chrome, use safe areas/theme tokens, test stack/tab persistence and large text, and add a practical Maestro path when stable.
- [Wiping local personal events/checklists surprises testers] → Confirmation explicitly names session and all local calendar data; cancellation performs no writes.
- [Config extra changes force fresh store builds] → Recompute all four fingerprints and record the exact required native-build consequence; do not weaken fingerprint inputs.

## Migration Plan

1. Land config capability parsing and EAS/profile/script inputs with matrix tests while preserving identity, Firebase, OTA, signing, and submit shape.
2. Add the typed environment store/resolver and call-time API mutator integration, defaulting existing installs according to capability; stale persisted non-production values are inert in production.
3. Add journal/readiness handling and all reset participants before exposing the selector.
4. Add Settings confirmation/control, root non-production marker, Feedback/Firebase diagnostic context, translations, accessibility, and tests.
5. Update the ADR, binding Architecture Book, changelog, release/operator docs, and roadmap; run format/lint/typecheck/Jest coverage, config matrix, OpenSpec validation, and fingerprint commands.
6. Merge code dark with respect to store operations. If fingerprints changed, the next deliberate preview/production release uses fresh native builds. No live rollout occurs in this issue.

Rollback is a code revert followed by the same fingerprint analysis. Production remains locked to production throughout. Preview installs that already selected production/preprod may retain the enum key, but a reverted build ignores it; a later fixed build total-parses it again. An in-progress reset journal from a faulty implementation must be understood before reverting its recovery code, so rollback guidance will retain a compatible recovery reader until journals are cleared.

## Open Questions

None. Device-only banner layout, accessibility, and real reload verification are evidence tasks, not architectural decisions; if they cannot run on this host they become a non-blocking `(HUMAN: …)` migration inbox note.
