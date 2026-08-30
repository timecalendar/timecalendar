# mobile-ical-import — delta

## MODIFIED Requirements

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
