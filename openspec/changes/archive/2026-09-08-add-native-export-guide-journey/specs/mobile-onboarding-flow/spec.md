## ADDED Requirements

### Requirement: Institution gates lead into the mandatory export guide
The onboarding import path SHALL derive its next legal step from the current draft and the listed
school's server-owned export-guide reference. A listed institution SHALL show Programme only when
`requireProgramme` is true, otherwise storing an empty calendar name. It SHALL show Connect only
when `requireConnect` is true and `safeIntranetUrl` accepts the URL. Missing or unsafe required
Connect URLs SHALL be skipped with a sanitized configuration diagnostic. An unlisted institution
SHALL always show the existing skippable Programme step, never Connect, and proceed to provider
selection. Every path SHALL complete a guide before the existing manual selector.

#### Scenario: Listed gate matrix is preserved
- **WHEN** a listed school's Programme and Connect flags are exercised in every combination
- **THEN** only enabled legal gates are pushed in order before exact-version guide resolution
- **AND** `requireProgramme: false` stores an empty calendar name rather than inventing one

#### Scenario: Required Connect URL is unsafe or absent
- **WHEN** `requireConnect` is true but the listed URL is missing or fails `safeIntranetUrl`
- **THEN** Connect is skipped and guide resolution remains the next step
- **AND** the diagnostic contains only missing/unsafe reason and validated provider slug

#### Scenario: Unlisted path uses provider selection
- **WHEN** an unlisted institution continues or skips Programme
- **THEN** it opens provider selection without rendering Connect
- **AND** completing the chosen guide is required before manual import

### Requirement: Existing calendar creation remains behind the completed guide
The existing manual selector, QR scanner, iCal URL form, and calendar-create derivation SHALL retain
their successful behavior after a valid current guide completion. They SHALL not create or submit
before the protected-route guard succeeds, and leaving/restarting onboarding SHALL remove the proof
needed to reach them.

#### Scenario: Completed guide preserves QR creation
- **WHEN** a student completes the current guide, selects QR, and imports a valid token
- **THEN** the existing create flow receives the current listed or unlisted create fields
- **AND** its success behavior is unchanged

#### Scenario: Completed guide preserves iCal creation
- **WHEN** a student completes the current guide, selects iCal URL, and submits a valid URL
- **THEN** the existing create flow receives the current listed or unlisted create fields
- **AND** its validation, failure switching, and success behavior are unchanged

#### Scenario: Process death restarts onboarding
- **WHEN** the process dies with manual, QR, or iCal in restored route history
- **THEN** no calendar create action is enabled from that history
- **AND** recovery starts at School because the ephemeral draft and completion no longer exist
