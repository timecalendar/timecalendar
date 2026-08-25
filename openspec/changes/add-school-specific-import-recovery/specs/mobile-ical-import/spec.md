## MODIFIED Requirements

### Requirement: Server POST of the iCal URL via the generated client behind the data seam

Importing an iCal URL SHALL be a server round-trip — `POST /calendars` with the URL — using
the committed generated client over the single `customFetch` mutator (the server parses
the calendar; the client submits the URL and receives a token or typed recovery error).
The generated hook and DTOs SHALL be imported only from the feature's `data/` sublayer
(boundary B-1).

#### Scenario: The data layer is the only generated-hook import site

- **WHEN** `src/features/calendar-sources/` is inspected
- **THEN** only the `data/` sublayer imports `@/api/generated/**`; the `ui/` screen imports through the feature's `data/` sub-barrel and never imports generated code or `customFetch` directly

#### Scenario: Create posts the URL and resolves a token

- **WHEN** a valid supported URL is submitted
- **THEN** the `data/` create layer calls the generated create-calendar mutation with a trimmed `url` and required nullable `customData`
- **AND** it resolves the server's token response through the existing durable add-calendar flow

#### Scenario: Typed recovery body remains behind the data seam

- **WHEN** the generated mutation rejects with a documented calendar-import error body
- **THEN** the data sublayer maps it to a feature-domain recovery value
- **AND** no generated DTO or API error-body parsing leaks into the UI sublayer

#### Scenario: Contract artifacts are regenerated

- **WHEN** the calendar-import error response is implemented
- **THEN** `openapi/openapi.json` and `mobile/src/api/generated/` are regenerated rather than hand-edited
- **AND** both server OpenAPI drift and mobile Orval drift checks pass
- **AND** no dependency, native module, `app.config.ts`, or store configuration changes

### Requirement: Import failure observability and retry

Recognized calendar-import recovery errors SHALL be presented as expected product states
and SHALL NOT be recorded to Crashlytics. Unknown network/API/persistence failures SHALL
remain visible and retryable and SHALL be recorded only through a sanitized Firebase-seam
diagnostic. The app SHALL NOT log or record source URLs, request/response bodies,
credentials, calendar tokens, or resource ids.

#### Scenario: Unsupported link is not recorded or blindly retried

- **WHEN** the server returns a recognized `unsupported_link` response
- **THEN** the app shows the mapped remediation and an edit/try-again action
- **AND** it does not record the response to Crashlytics or offer a blind retry of the unchanged URL

#### Scenario: School outage is retryable without Crashlytics noise

- **WHEN** the server returns a recognized `upstream_unavailable` response
- **THEN** the app shows the school-specific temporary-outage guidance and a retry control
- **AND** it does not record the expected outage response to Crashlytics

#### Scenario: Unknown failure is sanitized and retryable

- **WHEN** an unknown API, network, resolve, or persistence failure occurs
- **THEN** the app shows the existing generic retryable error state
- **AND** records only context, error class, and HTTP status through `@/firebase`, excluding submitted values and API bodies

#### Scenario: Client validation error is not recorded

- **WHEN** the user submits an invalid URL caught by the local pre-filter
- **THEN** the inline error is shown and no error is recorded

#### Scenario: API debug logging is body-free

- **WHEN** the shared mobile API mutator logs a request or response in development
- **THEN** it logs method/path/status only
- **AND** request bodies, response bodies, source URLs supplied in bodies, tokens, and resource ids are absent

### Requirement: Wiring is proven in CI without a live calendar server

The validate → create → success/recovery wiring SHALL be proven with focused server,
mobile data, component, and deterministic Maestro checks that do not depend on a live
university service. Device-only accessibility and native review SHALL be recorded as a
`(HUMAN: …)` migration-inbox check.

#### Scenario: Generated mutation and mapper proof

- **WHEN** the data test drives the real generated mutation with `customFetch` mocked
- **THEN** success still reaches durable persistence
- **AND** every closed recovery enum combination maps to an exhaustive domain recovery
- **AND** malformed or unknown bodies safely map to the generic failure

#### Scenario: Component recovery-state proof

- **WHEN** the screen test supplies unsupported-link, upstream-outage, and generic failures from the data seam
- **THEN** it asserts localized accessible guidance and the correct edit/retry action for each
- **AND** it asserts recognized outcomes are not recorded while unknown failures are sanitized before recording

#### Scenario: Deterministic real-stack CI proof

- **WHEN** the labeled mobile E2E workflow runs on iOS and Android
- **THEN** a synthetic secret-free recognized web-UI URL is rejected before outbound fetch by the local server
- **AND** the app renders the corresponding school recovery guidance

#### Scenario: Device-only QA is inboxed

- **WHEN** implementation is ready for its required QA stage
- **THEN** an inbox note tagged `(HUMAN: …)` contains concrete VoiceOver, TalkBack, large-text, native-behavior, and real-school recovery checks
- **AND** the no-KVM development host is not treated as capable of those device-only checks

## ADDED Requirements

### Requirement: School-specific recovery guidance is localized and accessible

The iCal import screen SHALL map the server's closed recovery metadata to school-specific
French and English guidance. It SHALL distinguish a link the student must replace from a
temporary school-service outage and expose an action appropriate to that distinction.

#### Scenario: Export guidance for unsupported web UI

- **WHEN** the server identifies a Rennes, Réunion, Montpellier, UBE, or Lyon 2 web-UI/encrypted link
- **THEN** the screen names the school and explains in the active language that the student must export/copy a direct iCal feed
- **AND** the URL field remains editable with an accessible edit/try-again action

#### Scenario: Tours login or short-link guidance

- **WHEN** the server identifies a Tours login page or dead `.shu` short link
- **THEN** the screen names Tours and explains in the active language that the student must export a direct iCal feed or renew the shared link
- **AND** it does not suggest entering credentials into TimeCalendar

#### Scenario: School outage guidance

- **WHEN** the server identifies a Saint-Étienne, Bordeaux INP, or Toulouse 3 upstream outage
- **THEN** the screen names the school, explains in the active language that its timetable service is temporarily unavailable, and offers retry
- **AND** it does not tell the student that the link shape is unsupported

#### Scenario: Accessible state and FR/EN parity

- **WHEN** any recovery state renders
- **THEN** its guidance is announced as an accessible alert/live region, its action has a translated label and compliant target, and focus remains usable
- **AND** every recovery key has matching French and English catalog entries with no hardcoded user-facing text
