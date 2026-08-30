# mobile-feedback — delta

## MODIFIED Requirements

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
