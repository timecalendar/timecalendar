# mobile-qr-scan — delta

## MODIFIED Requirements

### Requirement: Scanned source handoff into app state

On a successful scan the screen SHALL parse the value once under synchronous single-scan exclusion,
then persist a durable calendar through the shared add-calendar seam, passing the institution and
programme fields derived from the ephemeral import draft — exactly one of `schoolId` / `schoolName`
plus the normalized `name`. When the route is opened with no draft, it SHALL create with `name: ""`
and `schoolName: ""` rather than redirecting, blocking, or crashing. A valid parsed attempt SHALL
remain excluded from camera callbacks while its request is in flight and while its failure UI is
displayed. On success the screen SHALL clear the draft and leave the import journey exactly once;
on failure it SHALL leave the draft and captured normalized URL available for deliberate recovery.
The screen SHALL NOT gain a failure-reporting payload: the iCal-URL screen's existing Report path
remains the single support surface.

#### Scenario: Single successful scan creates with the draft's metadata

- **WHEN** a QR code is scanned and parses to a valid source while a draft exists
- **THEN** the screen handles exactly one scan result and ignores further camera callbacks during the operation
- **AND** the create request carries the captured normalized URL, normalized `name`, and exactly one of `schoolId` / `schoolName`
- **AND** the draft is cleared and the import journey is left exactly once

#### Scenario: A scan on a route opened with no draft still works

- **WHEN** the QR route is opened directly with no draft and a valid code is scanned
- **THEN** the create request carries `name: ""` and `schoolName: ""`
- **AND** no redirect occurs and no missing-draft error is shown

#### Scenario: A failed valid import stays debounced and preserves context

- **WHEN** creation, token resolution, or the durable upsert rejects after a valid scan
- **THEN** the accessible failure state is shown and camera callbacks remain ignored
- **AND** the captured normalized URL and institution/programme draft remain unchanged
- **AND** neither the draft nor the import journey is cleared or left

#### Scenario: Retry reuses the captured attempt without another scan

- **WHEN** the student activates Retry after a rejected valid import
- **THEN** the shared add-calendar seam runs once with the captured normalized URL and preserved create fields
- **AND** aiming the camera again is not required
- **AND** rapid camera callbacks, repeated Retry taps, or their combination do not start a concurrent duplicate request

#### Scenario: Retry can fail again or complete through the shared success seam

- **WHEN** a retried attempt rejects
- **THEN** the same deliberate recovery actions remain available with the captured attempt and draft intact
- **WHEN** a retried attempt succeeds
- **THEN** the draft is cleared and the import journey is left exactly once

#### Scenario: Scan another QR deliberately re-arms the camera

- **WHEN** the student activates Scan another QR after a rejected valid import
- **THEN** the failure and captured attempt are cleared and the scanner accepts one new camera result
- **AND** a new valid result runs through the existing shared add-calendar seam

#### Scenario: Manual iCal remains available after failure

- **WHEN** the student chooses the manual iCal action from the QR failure state
- **THEN** the app pushes the existing `/onboarding/ical-url` route without clearing the import draft
- **AND** no QR URL, token, or private attempt state is placed in navigation parameters

#### Scenario: Non-calendar QR is recoverable

- **WHEN** a scanned code parses to `null`
- **THEN** the screen shows an accessible "not a calendar QR" message and re-arms for another scan
- **AND** this recoverable state is NOT recorded as an error

#### Scenario: Back navigation and unmount ignore late settlement

- **WHEN** the screen unmounts before an active add-calendar promise settles
- **THEN** a late success or rejection does not navigate, clear the draft, record an error, or update screen state

#### Scenario: No new camera or permission configuration

- **WHEN** the change is inspected for native configuration
- **THEN** the existing camera-permission lifecycle is reused unchanged
- **AND** no new native permission entry or `app.config.ts` change is added

### Requirement: Scan failure observability

Every rejected valid-QR create/resolve/persist attempt SHALL be recorded exactly once through the
`@/firebase` `recordUnknownError` seam with the constant `calendar-sources/qr-scan` context and
surfaced as an accessible failure state. Calendar URLs, tokens, draft fields, or other private
attempt data SHALL NOT be included in logs, error metadata, navigation parameters, screenshots, or
test output. Invalid/non-calendar QR values SHALL remain unrecorded recoverable noise, and the app
SHALL NOT import `@react-native-firebase/*` directly.

#### Scenario: Initial valid attempt rejection is recorded once

- **WHEN** the shared add-calendar operation rejects after a valid scan
- **THEN** that rejection is recorded exactly once with the constant QR-scan context
- **AND** the accessible failure state and recovery actions are shown

#### Scenario: A rejected retry is a distinct real attempt

- **WHEN** the student deliberately retries and that add-calendar invocation rejects
- **THEN** the retry rejection is recorded exactly once
- **AND** duplicate taps that never enter the add-calendar seam create no additional record

#### Scenario: Private import identity is not exposed

- **WHEN** an initial attempt or retry is recorded or its failure UI is rendered
- **THEN** no calendar URL, token, or draft value is attached to the error or displayed to the student

#### Scenario: Invalid values are not recorded

- **WHEN** parsing rejects a non-calendar QR before the add-calendar operation
- **THEN** the scanner re-arms with recoverable guidance and records no operational error

### Requirement: Wiring is proven in CI without a real camera

The scan, failure, recovery, and success wiring SHALL be proven by a Jest/component test that mocks
`expo-camera`'s `CameraView` and `useCameraPermissions`, drives synthetic scanned values through the
real parser, and controls the shared add-calendar seam with deferred promises. The suite SHALL use
the repository's RNTL 14 asynchronous conventions. The on-device camera, navigation lifecycle, and
assistive-technology behavior SHALL be a recorded non-blocking physical-device verification.

#### Scenario: Synthetic scan drives the real wiring

- **WHEN** the proof test fires a synthetic `onBarcodeScanned` result through the mocked `CameraView`
- **THEN** the real parser runs and the normalized URL reaches the shared add-calendar seam
- **AND** the permission states are exercised through the mocked `useCameraPermissions`

#### Scenario: Failure recovery and concurrency are deterministic

- **WHEN** deferred add-calendar promises hold an attempt in flight or reject it
- **THEN** tests prove ignored callbacks while pending/failed, captured-URL Retry success and failure, Scan another re-arm, manual-route draft preservation, and rapid/double-tap exclusion
- **AND** tests assert one success exit/clear and one Firebase record per rejected invocation that actually ran

#### Scenario: Unmount safety is deterministic

- **WHEN** a component test unmounts the QR screen before a deferred attempt settles
- **THEN** late resolution and rejection produce no navigation, draft clearing, error record, or state-update warning

#### Scenario: On-device recovery check is recorded as manual

- **WHEN** the change is reviewed for camera lifecycle, E2E, accessibility, native correctness, and both-platform behavior
- **THEN** an inbox note tagged `(HUMAN: ...)` records retry success/failure, Scan another, Back/unmount, VoiceOver/TalkBack focus and announcement, Dynamic Type, touch targets, and iOS/Android physical-camera checks
- **AND** the change is not blocked on Maestro or a device run because the current harness cannot inject a scan and serves no parseable import endpoint
