## MODIFIED Requirements

### Requirement: Scanned source handoff into app state

On a successful scan the screen SHALL parse the value once under synchronous single-scan exclusion,
then persist a durable calendar through the shared checkpointed add-calendar seam, passing the
institution and programme fields derived from the ephemeral import draft — exactly one of
`schoolId` / `schoolName` plus the normalized `name`. When the route is opened with no draft, it
SHALL create with `name: ""` and `schoolName: ""` rather than redirecting, blocking, or crashing.
A valid parsed attempt SHALL remain excluded from camera callbacks while its request is in flight
and while its failure UI is displayed. Once durable persistence succeeds, the screen SHALL request
the root calendar-import result exactly once; leaving the nested onboarding Stack SHALL clear its
draft by provider ownership. On failure it SHALL leave the draft and captured normalized URL
available for deliberate recovery. The screen SHALL NOT gain a failure-reporting payload: the
iCal-URL screen's existing Report path remains the single support surface.

#### Scenario: Single successful scan creates with the draft's metadata

- **WHEN** a QR code is scanned and parses to a valid source while a draft exists
- **THEN** the screen handles exactly one scan result and ignores further camera callbacks during the operation
- **AND** the create request carries the captured normalized URL, normalized `name`, and exactly one of `schoolId` / `schoolName`
- **AND** a committed `user_calendars` row causes exactly one transition to the root import-result route

#### Scenario: A scan on a route opened with no draft still works

- **WHEN** the QR route is opened directly with no draft and a valid code is scanned
- **THEN** the create request carries `name: ""` and `schoolName: ""`
- **AND** no redirect occurs and no missing-draft error is shown

#### Scenario: A failed valid import stays debounced and preserves context

- **WHEN** creation, token resolution, or the durable upsert rejects after a valid scan
- **THEN** the accessible failure state is shown and camera callbacks remain ignored
- **AND** the captured normalized URL, create fields, and furthest safe checkpoint remain available
- **AND** neither the draft nor the import journey is cleared or left

#### Scenario: Retry reuses the captured attempt without another scan

- **WHEN** the student activates Retry after a rejected valid import
- **THEN** the add-calendar operation resumes at its first incomplete checkpoint with the captured normalized URL and preserved create fields
- **AND** it does not repeat server creation when a token was already received
- **AND** rapid camera callbacks, repeated Retry taps, or their combination do not start a concurrent duplicate request

#### Scenario: Retry can fail again or complete through the shared success seam

- **WHEN** a retried attempt rejects
- **THEN** the recovery state remains available with the captured attempt, checkpoint, and draft intact
- **WHEN** a retried attempt commits the durable calendar
- **THEN** the root import-result route is requested exactly once and onboarding is removed

#### Scenario: Scan another QR deliberately re-arms the camera

- **WHEN** the student chooses Change method after a rejected import and selects QR in the chooser
- **THEN** the failed source route has been dismissed and a fresh scanner accepts one new camera result
- **AND** no captured attempt or checkpoint carries into the new scanner

#### Scenario: Manual iCal remains available after failure

- **WHEN** the student chooses Change method after a rejected valid import
- **THEN** the app dismisses to `/onboarding/import` without clearing the institution, programme, or completed guide
- **AND** choosing QR starts a fresh scanner and choosing iCal opens `/onboarding/ical-url`
- **AND** native Back from iCal returns to the chooser rather than the failed QR screen
- **AND** no QR URL, token, checkpoint, or private attempt state is placed in navigation parameters

#### Scenario: Non-calendar QR is recoverable

- **WHEN** a scanned code parses to `null`
- **THEN** the screen shows an accessible "not a calendar QR" message and re-arms for another scan
- **AND** this recoverable state is NOT recorded as an error

#### Scenario: Back navigation and unmount ignore late settlement

- **WHEN** the screen unmounts before an active add-calendar promise settles
- **THEN** a late settlement does not navigate, clear the draft, record an error, or update QR screen state
- **AND** a durable operation already handed to the shared sync coordinator remains independent of that presentation

#### Scenario: No new camera or permission configuration

- **WHEN** the change is inspected for native configuration
- **THEN** the existing camera-permission lifecycle is reused unchanged
- **AND** no new native permission entry or `app.config.ts` change is added

### Requirement: QR import transitions have one explicit controller owner

The QR scanner SHALL delegate valid-attempt capture, synchronous scan and in-flight exclusion,
checkpointed import execution, failure, retry, Change method, durable completion, and
disposal transitions to one focused controller/state machine. Its render state SHALL distinguish
scanning, importing, failed, and completed phases; a captured attempt SHALL exist only in phases
that own a valid normalized URL and immutable create-field snapshot. Presentation components SHALL
invoke controller commands and SHALL NOT independently mutate import-transition state.

#### Scenario: Valid scan atomically captures and starts one attempt

- **WHEN** a valid camera value arrives while the controller is active, incomplete, and idle
- **THEN** the controller synchronously excludes later camera callbacks before starting async work
- **AND** it captures the normalized URL and a snapshot of the current create fields in the importing phase

#### Scenario: Invalid scan re-arms without creating an attempt

- **WHEN** parsing returns no calendar source
- **THEN** the controller exposes recoverable invalid-payload guidance in the scanning phase
- **AND** it creates no attempt, records no error, and immediately accepts a later camera value

#### Scenario: Failure retains the authoritative retry attempt

- **WHEN** the add-calendar operation rejects while the controller remains active and incomplete
- **THEN** the controller records that executed invocation exactly once and enters the failed phase
- **AND** Retry can only resume the captured attempt and its add-calendar checkpoint

#### Scenario: Rapid inputs cannot overtake synchronous guards

- **WHEN** camera callbacks, Retry presses, or both occur repeatedly before React can commit another render
- **THEN** no more than one add-calendar invocation is active
- **AND** inputs that did not enter the add-calendar seam produce no error record or completion effect

#### Scenario: Scan another is the only failed-attempt reset

- **WHEN** the student chooses Change method and starts a new QR scan from the chooser
- **THEN** the new source instance starts scanning without the abandoned attempt
- **AND** Retry on the failed source never resets its captured checkpoint
- **AND** changing method retains the import draft for either source selection

#### Scenario: Completion is exactly once

- **WHEN** an initial or retried add-calendar invocation commits `user_calendars` while active and incomplete
- **THEN** the controller enters its terminal completed phase and requests the root import-result route exactly once
- **AND** later callbacks or settlements have no navigation, cleanup, recording, or render-state effect

#### Scenario: Disposal makes every late settlement inert

- **WHEN** the owning screen unmounts before an add-calendar promise resolves or rejects
- **THEN** the controller produces no navigation, draft clearing, error recording, or React-state update from that settlement

### Requirement: QR scanner presentation is decomposed without contract drift

The QR scanner SHALL compose cohesive permission, scanner, import-progress, and failure/recovery
views, with no component materially above 200 lines. The camera SHALL unmount once a valid scan is
claimed, and import progress SHALL use localized accessible copy in a readable non-camera surface.
The root import-result route, not the QR scanner, SHALL own event-hydration failure and terminal
success. Views SHALL receive data and commands from the screen/controller rather than importing
persistence, draft, Firebase, generated API, or navigation infrastructure directly.

#### Scenario: Permission and scanner behavior remain unchanged

- **WHEN** camera permission is loading, requestable, permanently denied, or granted and idle
- **THEN** the corresponding existing guidance/control or QR-only camera view is rendered
- **AND** the same translated labels, live-region behavior, settings action, viewfinder properties, and test IDs remain available

#### Scenario: Import progress replaces the camera

- **WHEN** the controller enters importing after a valid scan
- **THEN** the camera view unmounts and a localized polite progress status renders in the readable layout
- **AND** no second barcode can be delivered through a still-mounted camera

#### Scenario: Import and recovery phases have cohesive views

- **WHEN** the controller enters failed before durable persistence
- **THEN** the recovery presentation retains one primary Retry and one secondary Change method control with their accessibility properties
- **AND** the terminal success presentation is not duplicated on the QR route

#### Scenario: Views do not own side effects

- **WHEN** the presentation modules are inspected
- **THEN** they call controller commands supplied as props
- **AND** they do not import the add-calendar seam, import draft, Firebase seam, generated API, or router
