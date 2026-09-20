## MODIFIED Requirements

### Requirement: URL-entry screen with accessible async states

The app SHALL provide a URL-entry screen in the calendar-sources feature `ui/` sublayer,
reachable as an onboarding `Stack` sibling route, with a labeled URL text input, a submit
control, inline validation feedback, and accessible progress / error-with-retry states over
the complete create, token-resolution, and durable-persistence operation. A valid submission
SHALL replace the editable form with progress until it either fails or commits the durable
calendar. The root import-result route SHALL own event hydration and terminal success.

#### Scenario: URL input and submit

- **WHEN** the screen renders
- **THEN** it shows a labeled text input for the calendar URL (URL keyboard type, no autocapitalize/autocorrect, font scaling not disabled) and a submit control with an accessibility role + translated label + a ≥44pt/48dp target

#### Scenario: Inline validation error

- **WHEN** the user submits an empty or non-URL value
- **THEN** the screen maps the validator's key through `t()` and shows the translated error inline with an alert role
- **AND** it does not call the server or create an import checkpoint

#### Scenario: Importing replaces the editable form

- **WHEN** a valid URL is submitted and any create, resolve, or durable-upsert step is pending
- **THEN** the editable form is replaced by an accessible importing status in the measured readable lane
- **AND** duplicate submission and URL editing are unavailable during that invocation

#### Scenario: Durable import hands off to the root result

- **WHEN** the add-calendar operation commits the `user_calendars` row
- **THEN** the screen requests `/calendar-import-result` through root-targeted dismissal
- **AND** it does not confirm success before local event hydration completes
- **AND** no URL, token, school, programme, or checkpoint is placed in route parameters

#### Scenario: Reachable from onboarding

- **WHEN** the onboarding flow is presented
- **THEN** the URL-entry screen is reachable as a `Stack` sibling route from the guarded import-method chooser
- **AND** the route under `src/app/` is a thin re-export of the screen through the feature's `ui/` sub-barrel

### Requirement: Import failure observability and retry

A syntactically valid create, resolve, or durable-persist invocation that rejects SHALL be
recorded exactly once through the `@/firebase` `recordError` seam and surfaced as an accessible
error state with a retry control. Retry SHALL resume the current attempt at its first incomplete
checkpoint and SHALL NOT repeat `POST /calendars` when the operation already holds the returned
token. A recoverable client-side validation error SHALL NOT be recorded. The app SHALL NOT import
`@react-native-firebase/*` directly.

#### Scenario: Operation failure is recorded and checkpoint-retryable

- **WHEN** a syntactically valid create, token-resolution, or durable-upsert invocation rejects
- **THEN** the rejection is recorded once via `@/firebase` `recordError` with a static context breadcrumb
- **AND** an accessible error state with a retry control is shown
- **AND** Retry resumes the same attempt without repeating any completed checkpoint

#### Scenario: A known token is not recreated

- **WHEN** token resolution or durable upsert fails after server creation returned a token
- **THEN** Retry starts at resolution or upsert respectively
- **AND** no second create request is issued for that mounted attempt

#### Scenario: Validation error is not recorded

- **WHEN** the user submits an invalid URL caught by the pre-filter validator
- **THEN** the inline error is shown and the failure is NOT recorded as an error
