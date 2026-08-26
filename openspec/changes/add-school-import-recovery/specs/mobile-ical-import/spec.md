## MODIFIED Requirements

### Requirement: Server POST of the iCal URL via the generated client behind the data seam

Importing an iCal URL SHALL be a server round-trip — `POST /calendars` with the URL and
available selected-school identity — using the committed generated client over the single
`customFetch` mutator. The generated hook SHALL be imported only from the feature's
`data/` sublayer, and that layer SHALL map the typed create error into a feature-domain
recovery model without exposing generated types to UI.

#### Scenario: The data layer is the only generated-hook import site

- **WHEN** `src/features/calendar-sources/` is inspected
- **THEN** only the `data/` sublayer imports `@/api/generated/**` for calendar creation and
  typed recovery
- **AND** UI imports the feature data seam, never generated DTOs or `customFetch`

#### Scenario: Create posts URL and real selected-school context

- **WHEN** a valid URL is submitted with an available selected school
- **THEN** the create mutation receives the trimmed URL, required nullable custom data, and
  the real selected-school identity required by the server
- **AND** it does not inject `"Dev import"` as school/name context

#### Scenario: Create resolves a token

- **WHEN** calendar creation succeeds
- **THEN** the data layer resolves the server token and continues the existing durable
  token-resolve/upsert chain

#### Scenario: Contract artifacts are regenerated

- **WHEN** the typed calendar-import error DTO is implemented
- **THEN** `openapi/openapi.json` and `mobile/src/api/generated/` are regenerated and
  committed
- **AND** server and mobile CI drift checks pass with no hand-edited generated files

### Requirement: Import failure observability and recovery are typed and private

A failed create/resolve/persist operation SHALL be mapped to a total domain recovery model
and surfaced accessibly. Classified create failures SHALL be recorded through
`@/firebase` only as a newly constructed sanitized error containing bounded classification
and help keys; the original `ApiError`, request URL, response body, database IDs, and
resource identifiers MUST NOT be recorded. Client validation failures SHALL NOT be
recorded.

#### Scenario: Typed create failure is sanitized

- **WHEN** the server returns a conforming calendar-import recovery DTO
- **THEN** the data seam returns its bounded classification, help key, and retryability
- **AND** Crashlytics receives only a sanitized error plus the static
  `calendar-sources/ical-import` context

#### Scenario: Legacy or malformed error falls back safely

- **WHEN** creation fails because of a network timeout, older server body, malformed body,
  resolve failure, or durable-write failure
- **THEN** the total mapper returns generic unknown recovery without throwing
- **AND** no raw body, URL, token, or database error is forwarded to diagnostics

#### Scenario: Validation error is not recorded

- **WHEN** the user submits an invalid URL caught by the client pre-filter
- **THEN** the localized inline error is shown without a network request
- **AND** no operational error, Retry, or Report action is recorded or shown

### Requirement: Wiring is proven in CI without a live university source

Automated tests SHALL prove create success, typed recovery mapping, privacy, durable
handoff, and UI actions by mocking the `customFetch` seam or deterministic E2E server
behavior. Tests MUST NOT contact a university source or send real feedback.

#### Scenario: Data-seam contract proof

- **WHEN** the real generated create mutation receives mocked success and each typed error
  class through `customFetch`
- **THEN** success reaches the existing durable token handoff and failures map to the exact
  bounded domain recovery model
- **AND** malformed/legacy/network failures map to the generic fallback

#### Scenario: Privacy regression proof

- **WHEN** test URLs/errors contain synthetic credentials and resource identifiers
- **THEN** Crashlytics, console logging, analytics, and feedback mocks contain none of those
  sentinel values
- **AND** only allowlisted classification/help keys are asserted

#### Scenario: Device-only verification is recorded

- **WHEN** the change is reviewed on this no-KVM host
- **THEN** deterministic automated coverage is complete
- **AND** a non-blocking `(HUMAN: …)` migration inbox item records iOS/Android
  screen-reader, large-text, focus, and visual recovery-state checks

### Requirement: Recorded iCal failures can open a privacy-bounded feedback report

The iCal URL screen SHALL offer a localized Report action after an operational failure.
The action SHALL navigate to root `/feedback` with only the bounded classification and
help key. It MUST NOT pass the attempted URL, hostname/path/query, selected school database
ID/name, calendar token/ID, credential, resource identifier, grade, e-mail, message, or
calendar object.

#### Scenario: Operational failure offers appropriate actions

- **WHEN** a syntactically valid iCal URL reaches the add operation and fails
- **THEN** the accessible recovery panel and Report action are shown
- **AND** Retry is shown only when the mapped recovery is retryable

#### Scenario: Report forwards only bounded recovery context

- **WHEN** the user activates Report after a classified import failure
- **THEN** Expo Router opens `/feedback` with only classification and help key route params
- **AND** the attempted URL and selected-school identity are absent

#### Scenario: Invalid URL prefilter never offers reporting

- **WHEN** the pre-filter rejects an empty, malformed, or non-http(s) value
- **THEN** neither operational recovery nor Report is offered

### Requirement: iCal report context uses public feature seams

The iCal UI SHALL obtain selected-school context through the existing public
school-selection hooks only to submit legitimate calendar identity to the server. Feedback
SHALL receive bounded recovery context explicitly through route parameters and SHALL NOT
import calendar-source or school-selection stores for that context.

#### Scenario: Selected school is submitted through the data seam

- **WHEN** a selected school exists during import
- **THEN** UI passes it to the public calendar-source add seam for the create request
- **AND** it is not included in diagnostic or feedback context

#### Scenario: Public seams preserve feature boundaries

- **WHEN** cross-feature imports are inspected
- **THEN** iCal uses the public school-selection barrel and Feedback uses its explicit safe
  route context
- **AND** no direct MMKV, database, generated school hook, or private sibling import is
  added

## ADDED Requirements

### Requirement: School-specific recovery is localized and action-oriented

The URL-entry screen SHALL render typed EN/FR guidance for the Rennes, Tours, Réunion,
Montpellier, UBE, Lyon 2, Saint-Étienne, Bordeaux INP, and Toulouse 3 help keys. Guidance
for unsupported links SHALL explain how to obtain a public iCal export without entering
credentials; guidance for outages SHALL identify a temporary school-service failure and
offer Retry.

#### Scenario: Unsupported school link asks for correction, not retry

- **WHEN** a Tours login/short link or another cataloged web-UI/encrypted shape fails
- **THEN** the screen renders that school's localized export instructions
- **AND** exposes an action that returns focus to the editable URL field without showing
  Retry

#### Scenario: Upstream outage offers retry

- **WHEN** Saint-Étienne, Bordeaux INP, or Toulouse 3 returns its outage help key
- **THEN** the screen renders localized temporary-outage guidance and a Retry action

#### Scenario: English and French parity

- **WHEN** the component suite renders representative unsupported and outage states under
  both supported locales
- **THEN** resolved translated copy, actions, alert/live-region semantics, and focus
  behavior are asserted
- **AND** TypeScript proves complete flat-key parity in both catalogs

