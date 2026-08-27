## ADDED Requirements

### Requirement: Build capability authorizes backend choices independently

The app SHALL resolve a dedicated backend-environment capability with exactly three valid values: `development`, `preview`, and `production`. It SHALL NOT infer this capability from app identity, `APP_VARIANT`, bundle/package id, scheme, Firebase project, `__DEV__`, or OTA channel/update metadata. A missing, malformed, or unknown capability SHALL behave as `production` at runtime.

#### Scenario: Preview is independently authorized

- **WHEN** a store-preview binary resolves with production app identity and the explicit `preview` backend capability
- **THEN** backend switching is authorized even though its identity matches production
- **AND** changing its OTA channel metadata cannot change the backend capability

#### Scenario: Missing or malformed capability fails closed

- **WHEN** runtime config omits the backend capability or contains an unknown value
- **THEN** the app behaves as production-locked
- **AND** no persisted value or runtime inference can enable a non-production backend

### Requirement: Environment choices and defaults are fixed and allowlisted

The effective backend environment SHALL be one of `local`, `preprod`, or `production`. A valid development capability SHALL allow all three and default to `local`; a valid preview capability SHALL allow only `preprod` and `production` and default to `preprod`; production or fail-closed capability SHALL allow and default only to `production`. `preprod` SHALL resolve exactly to `https://preprod-api.timecalendar.app`, `production` exactly to `https://api-v2.timecalendar.app`, and `local` only to the development build's valid absolute HTTP(S) `EXPO_PUBLIC_API_URL`. The app SHALL expose no arbitrary URL input or URL-valued persistence setter.

#### Scenario: Each valid capability receives its default

- **WHEN** no selected environment is persisted in development, preview, or production
- **THEN** the effective environments are respectively `local`, `preprod`, and `production`

#### Scenario: Exact endpoint allowlist is used

- **WHEN** preprod or production is effective
- **THEN** the API base URL equals its canonical constant exactly
- **AND** no build input or persisted URL can override that mapping

#### Scenario: Local is developer-configured only

- **WHEN** a development build selects `local`
- **THEN** the endpoint is the valid absolute HTTP(S) URL compiled from `EXPO_PUBLIC_API_URL`
- **AND** preview and production cannot select or resolve that URL

### Requirement: Persisted selection is total, capability-aware, and production-inert

The selected environment SHALL persist across a successful reload and restart. Reads SHALL validate both the stored enum value and the current build capability; malformed, legacy, or disallowed values SHALL resolve to the capability default without throwing. A production-locked runtime SHALL resolve production even if storage contains `local` or `preprod` from another build.

#### Scenario: Valid selection survives restart

- **WHEN** a preview tester completes a switch to production and restarts the app
- **THEN** production remains the effective backend

#### Scenario: Malformed persistence fails closed

- **WHEN** the persisted selection is malformed or names an environment disallowed by the current capability
- **THEN** the capability default is effective without an exception
- **AND** a production runtime remains on production

### Requirement: Switching requires explicit destructive confirmation

Settings SHALL present a localized confirmation before changing environment that clearly states the session and all local calendar/app data will be cleared. Cancellation SHALL leave persistence, caches, databases, diagnostics, and the effective environment unchanged. The reset orchestrator SHALL revalidate the target independently of the UI.

#### Scenario: User cancels the switch

- **WHEN** the user dismisses or rejects the destructive confirmation
- **THEN** no reset participant runs and the environment remains unchanged

#### Scenario: Invalid target bypass attempt is inert

- **WHEN** code invokes the switch orchestrator with a target not allowed by the current capability
- **THEN** the operation rejects before writing the reset journal or clearing state

### Requirement: Confirmed switching is one journaled destructive reset

A confirmed switch SHALL run as a single-flight, ordered, idempotent protocol that first persists a reset journal and quiesces all backend work; cancels queries/mutations; invokes all registered session/auth clear participants; transactionally wipes every SQLite table; clears backend-bound MMKV and the persisted query cache; clears in-memory QueryClient and calendar sync/mutation state; then persists the target, removes the journal, records success diagnostics, and reloads. The target SHALL be committed and reload invoked only after every required clear succeeds.

#### Scenario: Complete reset commits then reloads

- **WHEN** every reset participant succeeds
- **THEN** all SQLite rows, backend-bound MMKV values, persisted and in-memory query state, backend-scoped tokens, notification state, and sync/mutation state are empty
- **AND** the selected target is retained, the journal is absent, and reload occurs after those facts are durable

#### Scenario: Concurrent switch requests are serialized

- **WHEN** another switch is requested while a reset is active
- **THEN** no second reset interleaves with the active protocol

### Requirement: Partial reset cannot resume against mixed state

The root runtime SHALL inspect the reset journal before mounting routes or any API/query/sync/notification consumer. If a reset participant fails, the prior selected environment SHALL remain committed, reload SHALL NOT run, the journal SHALL remain, and normal application startup SHALL stay blocked behind a localized recovery surface. Retrying or restarting SHALL repeat the idempotent destructive steps and commit the target only after completion.

#### Scenario: A participant fails mid-reset

- **WHEN** SQLite or MMKV/query/sync/session clearing throws after an earlier participant changed state
- **THEN** the app does not activate the target or reload into normal routes
- **AND** it preserves enough journal state to retry without using partially cleared state

#### Scenario: Cold start finds an incomplete reset

- **WHEN** the app starts with a valid reset journal
- **THEN** no backend request or normal route mounts before recovery completes
- **AND** a successful retry produces the same coherent empty target state as a first-attempt success

### Requirement: Authentication clearing is an explicit extensibility invariant

The reset protocol SHALL expose one registered session/auth participant seam. The current empty registration SHALL be documented and tested because the React Native app has no authentication/session store; it SHALL NOT fabricate or claim to clear credentials that do not exist. Any future authentication feature MUST register its credential/session clear operation before shipping.

#### Scenario: Current app satisfies the honest no-auth invariant

- **WHEN** the reset runs in the current React Native tree
- **THEN** the session participant registry is explicitly empty and the remainder of backend-scoped state is still fully cleared

#### Scenario: Future auth joins the protocol

- **WHEN** an authentication/session persistence implementation is introduced
- **THEN** its tests fail the reset-participant invariant until it registers an idempotent clear operation

### Requirement: Persistence classification is explicit and conservative

Theme, language, display-timezone, and Changelog acknowledgement MAY survive because they are environment-independent device/UI preferences. The successful target selection SHALL survive by design and the reset journal MAY survive only until recovery completes. Selected school/group identity, hidden-event identifiers, notification preferences/registration state, remembered feedback e-mail, persisted query data, every SQLite row, and any future unclassified persisted key SHALL be treated as backend-bound and wiped.

#### Scenario: Global UI preferences survive

- **WHEN** a confirmed switch completes
- **THEN** theme, language, display-timezone, and Changelog acknowledgement retain their prior values

#### Scenario: Backend-bound values do not cross environments

- **WHEN** a confirmed switch completes with every known persistent category populated
- **THEN** only explicitly classified global preferences and the target selection remain
- **AND** a coverage test fails if a known persistent key lacks a reviewed classification

### Requirement: Non-production use is unmistakable and diagnosable

Whenever `local` or `preprod` is effective, the app SHALL render a persistent localized, accessible, high-contrast marker across normal tab and stack navigation that names the environment and remains suitable for screenshots. Production SHALL render no marker. Feedback and Crashlytics context SHALL include only the environment enum, and a successful switch SHALL emit an Analytics event containing only the from/to environment enums; endpoints, tokens, identifiers, e-mail, and message content SHALL NOT be logged.

#### Scenario: Preprod is visible outside Settings

- **WHEN** preprod is effective and the user navigates across ordinary app routes
- **THEN** a persistent preprod marker remains visible and accessible

#### Scenario: Diagnostic context remains private

- **WHEN** Feedback is submitted or Crashlytics/Analytics context is recorded
- **THEN** the active environment enum is included
- **AND** no backend URL, secret, personal data, or backend-scoped identifier is added

### Requirement: Environment behavior has focused automated and device proof

Automated tests SHALL cover config capability/default matrices, exact URL allowlisting, production visibility and behavioral inertness, malformed persistence, restart persistence, confirmation cancellation, reset single-flight ordering, every current SQLite/MMKV/query/sync/notification/session category, retained values, and partial-reset recovery. A practical Maestro flow SHALL cover the visible Settings confirmation and marker when stable; native reload/accessibility/screenshot evidence that cannot run on this host SHALL be captured in a non-blocking `(HUMAN: …)` inbox note rather than adding `run-e2e` by default.

#### Scenario: Local gates prove the safety contract

- **WHEN** the focused Jest and app-config suites run
- **THEN** every fail-closed and destructive-reset invariant is asserted, including call ordering and failure paths

#### Scenario: Device-only proof is non-blocking

- **WHEN** the host cannot run native iOS/Android verification
- **THEN** the remaining device checks are recorded as a tagged inbox checklist
- **AND** the PR does not request native E2E merely because this host lacks KVM
