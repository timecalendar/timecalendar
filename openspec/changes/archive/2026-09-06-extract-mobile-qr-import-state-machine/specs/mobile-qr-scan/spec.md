## ADDED Requirements

### Requirement: QR import transitions have one explicit controller owner

The QR scanner SHALL delegate valid-attempt capture, synchronous scan and in-flight exclusion,
import execution, failure, retry, Scan another, manual URL, completion, and disposal transitions to
one focused controller/state machine. Its render state SHALL distinguish scanning, importing,
failed, and completed phases; a captured attempt SHALL exist only in phases that own a valid
normalized URL and immutable create-field snapshot. Presentation components SHALL invoke controller
commands and SHALL NOT independently mutate import-transition state.

#### Scenario: Valid scan atomically captures and starts one attempt

- **WHEN** a valid camera value arrives while the controller is active, incomplete, and idle
- **THEN** the controller synchronously excludes later camera callbacks before starting async work
- **AND** it captures the normalized URL and a snapshot of the current create fields in the
  importing phase

#### Scenario: Invalid scan re-arms without creating an attempt

- **WHEN** parsing returns no calendar source
- **THEN** the controller exposes recoverable invalid-payload guidance in the scanning phase
- **AND** it creates no attempt, records no error, and immediately accepts a later camera value

#### Scenario: Failure retains the authoritative retry attempt

- **WHEN** the add-calendar operation rejects while the controller remains active and incomplete
- **THEN** the controller records that executed invocation exactly once and enters the failed phase
- **AND** Retry can only reuse the captured normalized URL and field snapshot from that failed phase

#### Scenario: Rapid inputs cannot overtake synchronous guards

- **WHEN** camera callbacks, Retry presses, or both occur repeatedly before React can commit another
  render
- **THEN** no more than one add-calendar invocation is active
- **AND** inputs that did not enter the add-calendar seam produce no error record or completion
  effect

#### Scenario: Scan another is the only failed-attempt reset

- **WHEN** Scan another is invoked from the failed phase while no request is active
- **THEN** the captured attempt and failure are cleared and the controller returns to scanning
- **AND** manual URL navigation does not perform that reset or clear the import draft

#### Scenario: Completion is exactly once

- **WHEN** an initial or retried add-calendar invocation resolves while active and incomplete
- **THEN** the controller enters its terminal completed phase, clears the draft, and leaves the
  import journey exactly once
- **AND** later callbacks or settlements have no navigation, cleanup, recording, or render-state
  effect

#### Scenario: Disposal makes every late settlement inert

- **WHEN** the owning screen unmounts before an add-calendar promise resolves or rejects
- **THEN** the controller produces no navigation, draft clearing, error recording, or React-state
  update from that settlement

### Requirement: QR scanner presentation is decomposed without contract drift

The QR scanner SHALL compose cohesive permission, scanner, import-progress, terminal-success, and
failure/recovery views, with no component materially above 200 lines. The split SHALL retain the
existing visible copy, camera behavior, theme styling, accessibility semantics, test IDs, and
immediate success exit; views SHALL receive data and commands from the screen/controller rather
than importing persistence, draft, Firebase, generated API, or navigation infrastructure directly.

#### Scenario: Permission and scanner behavior remain unchanged

- **WHEN** camera permission is loading, requestable, permanently denied, or granted
- **THEN** the corresponding existing guidance/control or QR-only camera view is rendered
- **AND** the same translated labels, live-region behavior, settings action, viewfinder properties,
  and test IDs remain available

#### Scenario: Import and recovery phases have cohesive views

- **WHEN** the controller is importing, completed, or failed
- **THEN** the screen selects the corresponding progress, terminal-success, or recovery
  presentation from the controller phase
- **AND** progress/completion add no new copy or dwell state, while failure retains the existing
  Retry, Scan another, and manual URL controls and their accessibility properties

#### Scenario: Views do not own side effects

- **WHEN** the presentation modules are inspected
- **THEN** they call controller commands supplied as props
- **AND** they do not import the add-calendar seam, import draft, Firebase seam, generated API, or
  router

### Requirement: Attempt-state diagnostics are resolved or evidence-classified

The changed QR-import files SHALL be scanned with React Doctor. A standalone React state value used
only by event handlers SHALL be removed. If React Doctor reports the captured attempt after it has
become part of render-driving tagged state, the result SHALL be classified with code and focused
test evidence showing the phase/render dependency and captured retry behavior; it SHALL NOT be
silenced through an inline suppression without that evidence.

#### Scenario: Captured attempt participates in render state and retry

- **WHEN** a valid import fails and the current draft or next camera value changes before Retry
- **THEN** the rendered failed phase remains tied to the captured attempt
- **AND** Retry uses the original normalized URL and fields rather than current external values

#### Scenario: Changed-file diagnostics are recorded

- **WHEN** implementation verification is complete
- **THEN** React Doctor is run against the changed QR-import files
- **AND** every remaining finding is reported as fixed, actionable, or a false positive with
  specific code/test evidence
