# mobile-feedback Specification

## Purpose
TBD - created by archiving change add-mobile-feedback. Update Purpose after archive.
## Requirements
### Requirement: Feedback is a layered root-route feature

The mobile app SHALL expose a root `/feedback` route as a thin `src/app/feedback.tsx` re-export over a tested `src/features/feedback/ui/` screen. Feedback validation, remembered-email parsing, request construction, and the generated contact mutation SHALL live behind the feature's non-UI sublayers and public barrel; UI SHALL NOT import generated API types/hooks, SQLite, MMKV, or React Native Firebase packages directly.

#### Scenario: Route and feature boundaries are preserved
- **WHEN** the feedback implementation is inspected
- **THEN** the root route only re-exports the feature screen and the root Stack registers it with an accessible back affordance
- **AND** generated contact imports occur only in the feedback data sublayer
- **AND** storage and telemetry are reached through `@/storage` and `@/firebase`

### Requirement: Feedback validates required e-mail and message fields

The screen SHALL provide a required e-mail field and a required multiline message field. Validation SHALL normalize surrounding e-mail whitespace, distinguish missing and invalid e-mail errors, reject an empty or whitespace-only message, return typed localizable error keys, and prevent every invalid submission from reaching `/contact`.

#### Scenario: Empty submission is rejected locally
- **WHEN** the user submits with both fields empty
- **THEN** the localized required-e-mail and required-message errors are shown inline
- **AND** the contact mutation is not called

#### Scenario: Invalid e-mail is rejected locally
- **WHEN** the user enters a non-empty invalid e-mail and a message and submits
- **THEN** the localized invalid-e-mail error is shown
- **AND** the contact mutation is not called

#### Scenario: Valid values are normalized for submission
- **WHEN** the user enters a valid e-mail with surrounding whitespace and a non-whitespace message
- **THEN** validation succeeds and the normalized e-mail is used for persistence and submission

### Requirement: Feedback remembers only the last validated e-mail

The feedback feature SHALL store the last normalized, validated e-mail under one flat namespaced `@/storage` key once client validation passes. Its parser SHALL be total: missing, empty, malformed, corrupt, or legacy values SHALL resolve to an empty string and SHALL never throw. The next screen opening SHALL prefill a valid stored e-mail. The message SHALL never be persisted.

#### Scenario: A valid e-mail is remembered before a retryable request
- **WHEN** a client-valid form is submitted, whether the server later succeeds or fails
- **THEN** the normalized e-mail is stored through `@/storage`
- **AND** reopening Feedback prefills that e-mail

#### Scenario: Invalid persisted content fails safe
- **WHEN** the stored value is absent or is not a valid e-mail
- **THEN** Feedback starts with an empty e-mail field without throwing

#### Scenario: Message content is ephemeral
- **WHEN** the user types or submits a message
- **THEN** no message value or draft is written to persistent storage

### Requirement: Contact submission uses the existing generated contract with bounded enrichment

A valid feedback submission SHALL call the existing generated `POST /contact` mutation with `email`, `message`, `calendarIds`, and `deviceInfo`. `calendarIds` SHALL contain the server `id` of every held calendar returned by the public calendar-sources hook regardless of visibility. `deviceInfo` SHALL include device model, OS name/version, app name/version/build, configured app variant, and effective backend environment using `expo-device`, `expo-constants`, and the environment seam, with safe fallbacks when metadata is absent. It SHALL name only the environment enum and SHALL NOT include a backend URL, token, secret, or additional personal data. Optional import context SHALL be limited to `calendarUrl`, `schoolId`, `schoolName`, and `calendarName`; each SHALL be trimmed and omitted when empty, and `gradeName`, subject/category, attachments, and screenshots SHALL be omitted. `calendarName` is the normalized programme name from a failed import and SHALL NOT be copied into or derived from `gradeName`. The `calendarName` field already exists in the committed generated `SendMessageDto`, so this change SHALL NOT modify `openapi/openapi.json`, `mobile/src/api/generated/`, or server code.

#### Scenario: Settings-origin submission contains standard enrichment

- **WHEN** a valid form opened from Settings is submitted with visible and hidden held calendars
- **THEN** the DTO includes every calendar's server ID and formatted device/app/variant/environment information
- **AND** it omits endpoint URLs, tokens, secrets, import context, `gradeName`, and unsupported fields

#### Scenario: Import-origin submission carries the programme name

- **WHEN** a valid form opened from a recorded import failure is submitted with a programme name
- **THEN** the DTO includes the attempted calendar URL, the available institution ID or name, and `calendarName`
- **AND** `gradeName` is not sent

#### Scenario: An empty or absent programme name is omitted

- **WHEN** a valid form opened from a recorded import failure is submitted after the programme step was skipped
- **THEN** the DTO omits `calendarName` rather than sending an empty or whitespace value
- **AND** a missing optional institution field is omitted rather than invented

#### Scenario: Existing contract remains unchanged

- **WHEN** the change is generated and typechecked
- **THEN** it consumes the committed generated contact client without modifying `openapi/openapi.json`, `mobile/src/api/generated/`, or server code

### Requirement: Feedback submission has accessible pending, success, and retry states

While a request is pending, the screen SHALL prevent duplicate submission and expose an accessible polite loading status. On success it SHALL show a native localized Alert with title, body, and one Close action; activating Close SHALL call `router.back()`. On failure it SHALL retain the entered values, show a localized inline polite live-region alert, return Send to an enabled retryable state, and call `recordUnknownError` with a static feedback context that contains neither the e-mail nor message body.

#### Scenario: Pending prevents duplicate mail
- **WHEN** the generated contact mutation is pending
- **THEN** Send is disabled with the matching accessibility state
- **AND** an accessible loading status is exposed

#### Scenario: Success is acknowledged before leaving
- **WHEN** the contact mutation resolves
- **THEN** a localized native success Alert is shown with one Close action
- **AND** activating Close returns to the previous route

#### Scenario: Failure is private and retryable
- **WHEN** the contact mutation rejects
- **THEN** the inline accessible failure is shown and Send becomes enabled for retry with the form values retained
- **AND** `recordUnknownError` receives the error and a static context with no e-mail or message content

### Requirement: Feedback form follows keyboard, accessibility, and localization contracts

The feedback screen SHALL use a heading-role `ThemedText` title, visible translated labels, translated accessibility labels, and minimum 44pt iOS / 48dp Android interactive targets. The e-mail input SHALL use the e-mail keyboard and Next action to focus the message input. The message SHALL support multiple lines and Return SHALL insert a newline rather than submit. Content SHALL remain reachable when the keyboard and large text are active. Every feedback and entry-point key SHALL exist in flat typed EN and FR catalogs with parity.

#### Scenario: Keyboard traversal reaches the multiline message
- **WHEN** the user activates Next from the e-mail field
- **THEN** focus moves to the message field
- **AND** Return in the message field creates a new line without submitting

#### Scenario: Assistive technology receives semantic form state
- **WHEN** the screen renders titles, labels, errors, loading, and controls
- **THEN** headings, field labels, alerts/live regions, button roles, disabled state, and touch targets expose the required semantics

#### Scenario: FR and EN remain typed and complete
- **WHEN** TypeScript and i18n tests run
- **THEN** all feedback, Settings-entry, and iCal-report keys resolve in both catalogs with no hardcoded user-facing copy

### Requirement: Feedback is proven without sending real mail in E2E

Automated tests SHALL cover pure validation, total persisted-email parsing, device-info formatting, DTO construction through the real generated mutation with `customFetch` mocked, screen states, both navigation entry points, and privacy constraints at the applicable coverage thresholds. A Maestro flow SHALL navigate from Settings and assert client-side validation only; it MUST NOT submit a valid form or contact the real `/contact` endpoint. A non-blocking `(HUMAN: …)` inbox note SHALL define the iOS/Android device pass.

#### Scenario: Data proof exercises the generated mutation without a server
- **WHEN** the feedback data test runs with `customFetch` mocked
- **THEN** the real generated contact mutation receives the complete expected DTO
- **AND** success and rejection behavior are deterministic without a live server

#### Scenario: Maestro remains mail-safe
- **WHEN** the feedback Maestro flow runs
- **THEN** it opens Feedback from Settings, submits an invalid empty form, and observes client validation errors
- **AND** no valid request is sent to `/contact`

#### Scenario: Native-only checks are recorded non-blockingly
- **WHEN** implementation documentation is completed
- **THEN** a migration inbox note tagged `(HUMAN: …)` lists the iOS/Android keyboard, accessibility, dark-mode, Alert, retry, and iCal-context checks
- **AND** the note does not block merge

### Requirement: Feedback handles contact-service unavailability privately in both locales

The React Native feedback flow SHALL treat HTTP 503 from `POST /contact` as a recoverable failed submission. It SHALL retain the validated e-mail and message in the current form, re-enable Send, expose an accessible inline error that says the message was not sent and can be retried, and provide equivalent typed French and English copy. Contact request bodies and user identity MUST NOT appear in development API logs or the feature's recorded telemetry.

#### Scenario: English contact-service failure remains retryable

- **WHEN** the generated contact mutation rejects with HTTP 503 while English is active
- **THEN** the form keeps both values, re-enables Send, and announces localized not-sent/retry guidance
- **AND** a second press can retry the same form

#### Scenario: French contact-service failure remains retryable

- **WHEN** the generated contact mutation rejects with HTTP 503 while French is active
- **THEN** the form keeps both values, re-enables Send, and announces equivalent localized not-sent/retry guidance

#### Scenario: Contact payload is redacted from client diagnostics

- **WHEN** a development build submits `POST /contact` and the request succeeds or fails
- **THEN** the API diagnostic log identifies the method/path without printing the request body
- **AND** recorded failure telemetry receives only the error object and static `feedback/contact-submit` context, never the e-mail or message

