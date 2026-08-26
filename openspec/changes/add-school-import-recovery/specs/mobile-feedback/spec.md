## MODIFIED Requirements

### Requirement: Contact submission uses the existing generated contract with bounded enrichment

A valid feedback submission SHALL call the existing generated `POST /contact` mutation
with `email`, `message`, held `calendarIds`, and `deviceInfo`. When opened from iCal
recovery, optional context SHALL be limited to allowlisted recovery classification and help
keys. The feedback handoff and DTO MUST NOT include the attempted calendar URL, hostname,
path/query values, selected school database ID/name, calendar source token, credentials,
or timetable resource identifiers.

#### Scenario: Settings-origin submission contains standard enrichment

- **WHEN** a valid form opened from Settings is submitted with visible and hidden held
  calendars
- **THEN** the DTO includes every held calendar's existing server ID and formatted
  device/app/variant information required by the feedback contract
- **AND** it omits all iCal recovery context

#### Scenario: iCal-origin submission contains safe recovery context

- **WHEN** a valid form opened from a classified iCal failure is submitted
- **THEN** the DTO includes only the allowlisted classification and help key as optional
  recovery context
- **AND** the attempted URL and selected-school identity are absent

#### Scenario: Route and DTO privacy are regression-tested

- **WHEN** synthetic URL credentials and resource identifiers exist in the failed input
- **THEN** neither feedback route params nor the constructed contact DTO contain those
  values
- **AND** generated contract drift is committed and verified if the optional context fields
  change
