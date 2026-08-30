# mobile-qr-scan — delta

## MODIFIED Requirements

### Requirement: Scanned source handoff into app state

On a successful scan the screen SHALL parse the value once (single-scan debounce), then persist a
durable calendar through the shared add-calendar seam, passing the institution and programme fields
derived from the ephemeral import draft — exactly one of `schoolId` / `schoolName` plus the
normalized `name`. When the route is opened with no draft, it SHALL create with `name: ""` and
`schoolName: ""` rather than redirecting, blocking, or crashing. On success it SHALL clear the draft
and leave the import journey; on failure it SHALL leave the draft intact so the student can retry or
switch to the iCal-URL route. The screen SHALL NOT gain a failure-reporting affordance: the
iCal-URL screen's existing Report path remains the single support surface.

#### Scenario: Single successful scan creates with the draft's metadata

- **WHEN** a QR code is scanned and parses to a valid source while a draft exists
- **THEN** the screen handles exactly one scan result (further scans are ignored until re-armed)
- **AND** the create request carries the normalized `name` and exactly one of `schoolId` / `schoolName`
- **AND** the draft is cleared and the import journey is left

#### Scenario: A scan on a route opened with no draft still works

- **WHEN** the QR route is opened directly with no draft and a valid code is scanned
- **THEN** the create request carries `name: ""` and `schoolName: ""`
- **AND** no redirect occurs and no missing-draft error is shown

#### Scenario: A failed scan import keeps the draft

- **WHEN** creation, token resolution, or the durable upsert fails after a scan
- **THEN** the existing accessible failure state is shown
- **AND** the draft is unchanged, so switching to the iCal-URL route finds the same institution and programme

#### Scenario: Non-calendar QR is recoverable

- **WHEN** a scanned code parses to `null`
- **THEN** the screen shows an accessible "not a calendar QR" message and re-arms for another scan
- **AND** this recoverable state is NOT recorded as an error

#### Scenario: No new camera or permission configuration

- **WHEN** the change is inspected for native configuration
- **THEN** the existing camera-permission lifecycle is reused unchanged
- **AND** no new native permission entry or `app.config.ts` change is added
