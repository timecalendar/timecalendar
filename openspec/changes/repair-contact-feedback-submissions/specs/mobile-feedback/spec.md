## ADDED Requirements

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
