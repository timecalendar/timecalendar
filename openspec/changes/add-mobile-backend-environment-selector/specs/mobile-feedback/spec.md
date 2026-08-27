## MODIFIED Requirements

### Requirement: Contact submission uses the existing generated contract with bounded enrichment

A valid feedback submission SHALL call the existing generated `POST /contact` mutation with `email`, `message`, `calendarIds`, and `deviceInfo`. `calendarIds` SHALL contain the server `id` of every held calendar returned by the public calendar-sources hook regardless of visibility. `deviceInfo` SHALL include device model, OS name/version, app name/version/build, configured app variant, and effective backend environment using `expo-device`, `expo-constants`, and the environment seam, with safe fallbacks when metadata is absent. It SHALL name only the environment enum and SHALL NOT include a backend URL, token, secret, or additional personal data. Optional iCal context SHALL be limited to `calendarUrl`, `schoolId`, and `schoolName`; `gradeName`, subject/category, attachments, and screenshots SHALL be omitted.

#### Scenario: Settings-origin submission contains standard enrichment

- **WHEN** a valid form opened from Settings is submitted with visible and hidden held calendars
- **THEN** the DTO includes every calendar's server ID and formatted device/app/variant/environment information
- **AND** it omits endpoint URLs, tokens, secrets, iCal context, `gradeName`, and unsupported fields

#### Scenario: iCal-origin submission contains only available failure context

- **WHEN** a valid form opened from a recorded iCal failure is submitted
- **THEN** the DTO includes the attempted calendar URL and each available selected-school ID/name field
- **AND** a missing optional school field is omitted rather than invented

#### Scenario: Existing contract remains unchanged

- **WHEN** the change is generated and typechecked
- **THEN** it consumes the committed generated contact client without modifying `openapi/openapi.json`, `mobile/src/api/generated/`, or server code
