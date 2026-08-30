# mobile-ical-import Specification

## Purpose
TBD - created by archiving change add-mobile-ical-import. Update Purpose after archive.
## Requirements
### Requirement: iCal import grows the calendar-sources feature in place

The iCal-URL import SHALL be added as new sublayers/files inside the existing
`src/features/calendar-sources/` feature folder (ADR 017 D3 — one folder for QR · iCal ·
persistence), not as a separate feature, reusing the `ScannedCalendarSource` domain type
and the ephemeral handoff holder that the QR-scan ship established.

#### Scenario: No new feature folder

- **WHEN** the iCal import code is added
- **THEN** it lives under `src/features/calendar-sources/` (a new `data/create.ts`, a new `data/validate-url.ts`, and a new `ui/ical-url-screen.tsx`), re-exported through the existing `data/` and `ui/` sub-barrels and the feature barrel
- **AND** no second calendar-input feature folder is created

#### Scenario: Reuses the ship-3 domain shape and ephemeral holder

- **WHEN** an iCal URL is successfully imported
- **THEN** the resulting calendar source is represented as the existing `ScannedCalendarSource` (`{ url }`) and stashed into the existing ephemeral in-memory holder (`data/scanned-source.ts`), not a new ephemeral seam and not MMKV or SQLite

### Requirement: Server POST of the iCal URL via the generated client behind the data seam

Importing an iCal URL SHALL be a server round-trip — `POST /calendars` with the URL — using
the committed generated client over the single `customFetch` mutator, mirroring the Flutter
`import_ical` module (the server parses the calendar; the client submits the URL and receives
a token). The generated hook SHALL be imported only from the feature's `data/` sublayer
(boundary B-1). The create seam SHALL accept the institution and programme fields **explicitly**
as a `CalendarImportFields` value (`{ name, schoolId? , schoolName? }`) supplied by its caller,
and SHALL send exactly one of `schoolId` / `schoolName` plus the normalized `name` — it SHALL NOT
read the import draft itself, and the hard-coded `Dev import` literals SHALL be removed. When the
caller supplies no draft-derived fields, the request SHALL carry `name: ""` and `schoolName: ""`.
This change SHALL consume the committed generated client unchanged and SHALL NOT regenerate
`openapi/openapi.json` or `mobile/src/api/generated/`.

#### Scenario: The data layer is the only generated-hook import site

- **WHEN** `src/features/calendar-sources/` is inspected
- **THEN** only the `data/` sublayer imports `@/api/generated/**` (the create-calendar mutation); the `ui/` screen imports it through the feature's `data/` sub-barrel, never `@/api/generated/**` or `customFetch` directly

#### Scenario: Create posts the URL, one institution field, and the name

- **WHEN** a valid URL is submitted with draft-derived import fields
- **THEN** the `data/` create layer calls the generated `createCalendar` mutation with a `CreateCalendarDto` carrying the trimmed `url`, the required-nullable `customData`, the normalized `name`, and exactly one of `schoolId` / `schoolName`
- **AND** it resolves the server's `{ token }` from `CreateCalendarRepDto`

#### Scenario: The create seam does not read the draft

- **WHEN** the create seam is inspected
- **THEN** it takes its institution and programme fields as parameters
- **AND** it imports no React context and no `Dev import` literal remains

#### Scenario: No new dependency or OpenAPI regeneration

- **WHEN** the change is inspected for dependencies and codegen
- **THEN** it adds no new npm dependency, no native module, and no `app.config.ts`/babel change
- **AND** it requires no OpenAPI or generated-client regeneration (`CreateCalendarDto.name` and its 100-character maximum already exist in the committed contract)

### Requirement: Pure URL validator returning a localizable key

The feature `data/` sublayer SHALL expose a pure function that validates the typed URL as a
UX pre-filter and returns a localizable error **key** (not a sentence) when invalid and a
null/absent value when acceptable, mirroring the personal-events form validator. The server
`POST /calendars` remains the authoritative validator.

#### Scenario: Valid http(s) URL

- **WHEN** the validator receives a trimmed `http://` or `https://` URL
- **THEN** it returns no error (the value is acceptable for submission)

#### Scenario: Empty or whitespace value

- **WHEN** the validator receives an empty or whitespace-only string
- **THEN** it returns the empty-URL error key

#### Scenario: Non-URL value

- **WHEN** the validator receives a string that is not an http/https URL
- **THEN** it returns the invalid-URL error key

#### Scenario: The validator is pure

- **WHEN** the validator is unit-tested
- **THEN** it requires no translation function and no backend, returns localizable keys (not sentences), and is covered to the 90% logic threshold

### Requirement: URL-entry screen with accessible async states

The app SHALL provide a URL-entry screen in the calendar-sources feature `ui/` sublayer,
reachable as an onboarding `Stack` sibling route, with a labeled URL text input, a submit
control, inline validation feedback, and accessible loading / error-with-retry states over
the create mutation.

#### Scenario: URL input and submit

- **WHEN** the screen renders
- **THEN** it shows a labeled text input for the calendar URL (URL keyboard type, no autocapitalize/autocorrect, font scaling not disabled) and a submit control with an accessibility role + translated label + a ≥44pt/48dp target

#### Scenario: Inline validation error

- **WHEN** the user submits an empty or non-URL value
- **THEN** the screen maps the validator's key through `t()` and shows the translated error inline with a status role, and does not call the server

#### Scenario: Importing (pending)

- **WHEN** a valid URL is submitted and the create mutation is pending
- **THEN** the screen shows an accessible importing status (polite live region) and prevents duplicate submission

#### Scenario: Successful import

- **WHEN** the create mutation resolves a token
- **THEN** the screen stashes the `ScannedCalendarSource` into the ephemeral holder, confirms the imported URL to the user, and dismisses back to onboarding

#### Scenario: Reachable from onboarding

- **WHEN** the onboarding flow is presented
- **THEN** the URL-entry screen is reachable as a `Stack` sibling route from a welcome "add by URL" control (not a bare unreachable sibling)
- **AND** the route under `src/app/` is a thin re-export of the screen through the feature's `ui/` sub-barrel

### Requirement: Import failure observability and retry

A server create failure SHALL be recorded through the `@/firebase` `recordError` seam and
surfaced as an accessible error state with a retry control; a recoverable client-side
validation error SHALL NOT be recorded. The app SHALL NOT import `@react-native-firebase/*`
directly.

#### Scenario: Server failure is recorded and retryable

- **WHEN** the create mutation rejects (network, server error, or an unimportable URL)
- **THEN** the error is recorded via `@/firebase` `recordError` with a context breadcrumb
- **AND** an accessible error state with a retry control is shown, and retry re-runs the mutation

#### Scenario: Validation error is not recorded

- **WHEN** the user submits an invalid URL (caught by the pre-filter validator)
- **THEN** the inline error is shown and the failure is NOT recorded as an error (it is user-correctable)

### Requirement: Internationalization and accessibility

Every user-facing string on the URL-entry screen and the welcome "add by URL" CTA SHALL be
translated (FR + EN, no hardcoded strings), and interactive controls and async status SHALL
be accessible.

#### Scenario: FR/EN parity

- **WHEN** the i18n catalogs are typechecked
- **THEN** every new key (field label/placeholder, submit, the validator error keys, importing, server-error, retry, the CTA + its a11y label) exists in both `en.json` and `fr.json` (bidirectional `tsc` parity)
- **AND** no user-facing string is hardcoded

#### Scenario: Accessible controls and status

- **WHEN** the URL-entry screen renders any state
- **THEN** every touchable declares an accessibility role and a translated label with a ≥44pt/48dp target
- **AND** status/error/importing text uses a polite live region with a status role

### Requirement: Wiring is proven in CI without a live calendar server

The validate → create → handoff wiring SHALL be proven by a Jest/component test that mocks
the `customFetch` mutator seam (not the network), drives the real generated create mutation
through a real `QueryClient`, and asserts the success, inline-validation, and server-failure
paths; the on-device import round-trip SHALL be a recorded manual verification.

#### Scenario: Mock-at-the-mutator proof

- **WHEN** the proof test submits a valid URL with the `customFetch` mutator mocked to resolve a token
- **THEN** the real generated mutation runs, the token is resolved, and the `ScannedCalendarSource` reaches the ephemeral holder
- **AND** submitting an invalid URL shows the inline error with no recorded error
- **AND** a mocked rejection records via `@/firebase` and shows the retry state

#### Scenario: On-device import check is recorded as manual

- **WHEN** the change is reviewed for the E2E / accessibility / native-correctness / observability DoD axes
- **THEN** the manual on-device iCal import round-trip verification is captured in an inbox note (the dev e2e harness seeds no parseable `.ics` import endpoint; a live external `.ics` would be flaky cross-platform)
- **AND** the deterministic URL-entry render + reachability + empty-submit inline-validation MAY be covered by a Maestro step (no network)

### Requirement: Recorded iCal failures can open a context-bounded feedback report

The iCal URL screen SHALL offer a localized “Report a problem” action only after a syntactically valid URL reaches the create/resolve/persist operation and that recorded operation fails. The action SHALL navigate to root `/feedback` with the trimmed attempted `calendarUrl`, the institution context derived from the import draft (`schoolId` for a listed institution, `schoolName` for an unlisted one), and the normalized programme name as `calendarName` — each omitted when unavailable or empty. It SHALL NOT pass a boolean origin flag, calendar object, `gradeName`, e-mail, message, or any other state. A failed import SHALL leave the draft intact so the student can retry or switch to the QR route.

#### Scenario: Recorded server-side failure offers Retry and Report
- **WHEN** a valid iCal URL reaches the add-calendar operation and that operation rejects
- **THEN** the existing accessible recorded failure and Retry control remain visible
- **AND** a localized accessible Report a problem action is shown
- **AND** the import draft is unchanged

#### Scenario: Report forwards only DTO context, including the programme name
- **WHEN** the user activates Report a problem after a failed import with a listed draft carrying a programme name
- **THEN** Expo Router opens `/feedback` with the trimmed attempted URL, the institution `schoolId`, and `calendarName`
- **AND** route values are encoded and no non-DTO navigation state is included

#### Scenario: An empty programme name is omitted rather than sent blank
- **WHEN** the user activates Report a problem after skipping the programme step
- **THEN** `/feedback` receives the failed URL and the institution field
- **AND** `calendarName` is omitted rather than passed as an empty value

#### Scenario: Missing draft context does not block reporting
- **WHEN** the user activates Report a problem on a route opened with no draft
- **THEN** `/feedback` receives the failed URL and omits the unavailable institution and programme fields

#### Scenario: Invalid URL prefilter never offers reporting
- **WHEN** an empty, malformed, or non-http(s) URL is rejected by client validation before the add operation
- **THEN** the local validation error is shown and neither Retry nor Report a problem is offered
- **AND** no operational error is recorded

### Requirement: iCal report context uses public feature seams

The iCal UI SHALL obtain its institution and programme context from the ephemeral import draft
through the onboarding feature's public seam, **replacing** the previous read of the persisted
school selection and the schools query. The feedback feature SHALL receive that context explicitly
through route parameters and SHALL NOT import iCal, onboarding, or school-selection stores. Neither
feature SHALL read storage or database tables directly for this handoff.

#### Scenario: Institution context comes from the draft
- **WHEN** a listed draft exists and an import fails
- **THEN** the report route includes that institution's id
- **AND** the screen does not read the persisted school selection or re-query the school list for this context

#### Scenario: Public seams preserve feature boundaries
- **WHEN** the cross-feature imports are inspected
- **THEN** the iCal screen imports the import draft through the onboarding feature's public seam and Feedback imports held calendars through the public calendar-sources barrel
- **AND** no direct `user_calendars`, MMKV, generated school hook, or private sibling-module import is added

