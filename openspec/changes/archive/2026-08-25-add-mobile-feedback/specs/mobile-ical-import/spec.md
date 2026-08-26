## ADDED Requirements

### Requirement: Recorded iCal failures can open a context-bounded feedback report

The iCal URL screen SHALL offer a localized “Report a problem” action only after a syntactically valid URL reaches the create/resolve/persist operation and that recorded operation fails. The action SHALL navigate to root `/feedback` with the trimmed attempted `calendarUrl` and each available selected `schoolId`/`schoolName` as encoded route parameters. It SHALL NOT pass a boolean origin flag, calendar object, `gradeName`, e-mail, message, or any other state.

#### Scenario: Recorded server-side failure offers Retry and Report
- **WHEN** a valid iCal URL reaches the add-calendar operation and that operation rejects
- **THEN** the existing accessible recorded failure and Retry control remain visible
- **AND** a localized accessible Report a problem action is shown

#### Scenario: Report forwards only DTO context
- **WHEN** the user activates Report a problem after a failed import with selected-school context
- **THEN** Expo Router opens `/feedback` with the trimmed attempted URL and the available selected school ID/name
- **AND** route values are encoded and no non-DTO navigation state is included

#### Scenario: Missing school context does not block reporting
- **WHEN** the user activates Report a problem and no selected school or school name is available
- **THEN** `/feedback` receives the failed URL and omits unavailable school fields

#### Scenario: Invalid URL prefilter never offers reporting
- **WHEN** an empty, malformed, or non-http(s) URL is rejected by client validation before the add operation
- **THEN** the local validation error is shown and neither Retry nor Report a problem is offered
- **AND** no operational error is recorded

### Requirement: iCal report context uses public feature seams

The iCal UI SHALL obtain optional selected-school context through public school-selection hooks and SHALL resolve an available name through the public school query result. The feedback feature SHALL receive that context explicitly through route parameters and SHALL NOT import iCal or school-selection stores. Neither feature SHALL read storage or database tables directly for this handoff.

#### Scenario: Selected school is enriched when resolvable
- **WHEN** a selected school ID exists and the public schools query contains a matching school
- **THEN** the report route includes both that ID and matching name

#### Scenario: Public seams preserve feature boundaries
- **WHEN** the cross-feature imports are inspected
- **THEN** iCal imports school context through the public school-selection barrel and Feedback imports held calendars through the public calendar-sources barrel
- **AND** no direct `user_calendars`, MMKV, generated school hook, or private sibling-module import is added
