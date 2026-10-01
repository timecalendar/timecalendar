## ADDED Requirements

### Requirement: T06 uses one bounded dynamic wall-clock scale

The owned Day/Week renderer SHALL use one finite pixels-per-hour value for gutter labels, minor and major lines, the 24:00 closing boundary, day columns, all three pager pages, and scroll content height. Initial T06 values SHALL be 40 px/hour minimum, 60 px/hour default, and 120 px/hour maximum; pinch SHALL remain continuous within those inclusive bounds and menu commands SHALL move by 10 px/hour. Day and Week SHALL share the same value. Agenda, event facts, page count, and native owner count SHALL remain unchanged.

#### Scenario: Every clock primitive follows one scale
- **WHEN** zoom changes from one valid value to another
- **THEN** every label, grid boundary, page, day column, closing boundary, and content extent derives from the new value
- **AND** no fixed 60 px/hour canvas coordinate remains outside the named default

#### Scenario: Initial bounds are deterministic
- **WHEN** repeated zoom commands or continuous pinch input cross either initial limit
- **THEN** the scale clamps exactly to 40 or 120 px/hour
- **AND** reset returns exactly to 60 px/hour

#### Scenario: Renderer ownership remains singular
- **WHEN** the zoomed shell is inspected in Day and Week
- **THEN** it retains one automatic-inset native vertical owner, one native pager, and exactly three pages
- **AND** no compatibility, fallback, or second renderer is mounted

### Requirement: T06 preserves the chosen focal clock coordinate

Pinch SHALL preserve the wall-clock coordinate under the live gesture focal point, and menu zoom SHALL preserve the coordinate at the measured usable viewport center. Geometry SHALL use the live raw native offset, actual timed viewport, and current native top/bottom insets. Focal preservation SHALL be exact before boundary clamping and SHALL settle at the nearest valid native offset when the day boundary makes exact preservation impossible.

#### Scenario: Unclamped pinch keeps clock time stationary
- **WHEN** scale changes during a pinch whose solved offset lies within the native scroll range
- **THEN** `(rawOffset + focalY) / pixelsPerHour` is unchanged within deterministic numeric tolerance
- **AND** releasing the gesture introduces no second correction or jump

#### Scenario: Menu commands anchor the usable viewport center
- **WHEN** Zoom in, Zoom out, or Reset changes scale
- **THEN** the clock coordinate at the center between the live automatic insets remains stationary unless clamped by a day boundary

#### Scenario: Insets and boundaries are explicit
- **WHEN** top/bottom insets are zero or non-zero and the solved offset is before 00:00 or after 24:00
- **THEN** the raw offset clamps against the inset-aware native range
- **AND** no assumed zero inset or last-settled React offset participates in the focal equation

### Requirement: T06 pinch takes precedence over one-finger interactions

The installed Gesture Handler/Reanimated path SHALL give an active two-finger pinch precedence over one-finger presses, native vertical drag/momentum, and native horizontal drag/settle. A pinch start SHALL prevent an unaccepted page from committing, cancel press recognition, and coordinate the accepted native owners without adding custom replacement physics. Pointer-count changes, cancellation, app backgrounding, generation replacement, and unmount SHALL leave one coherent settled scale/offset/header state.

#### Scenario: Second finger interrupts vertical motion
- **WHEN** a second finger begins pinch during native vertical drag or momentum
- **THEN** pinch owns the interaction and preserves its focal clock coordinate
- **AND** release produces no drift or delayed vertical correction

#### Scenario: Second finger interrupts horizontal motion
- **WHEN** a second finger begins pinch during horizontal drag or settle
- **THEN** no day/week destination commits from that interrupted motion
- **AND** the dated header and centered grid remain aligned with no delayed page change

#### Scenario: Finger-count and lifecycle changes settle coherently
- **WHEN** the pinch loses a finger, is cancelled, backgrounds, unmounts, or meets a replacement generation
- **THEN** scale, offset, pager, and header follow one cancellation/settlement path
- **AND** no stale callback overwrites the newer committed context

### Requirement: T06 keeps frame-frequency zoom geometry off React state

Live scale, native raw offset, viewport/inset geometry, focal point, and pinch baseline SHALL reside in feature-private UI-thread state while a gesture is active. Scroll and pinch frames SHALL NOT write React state, persistence, formatted labels, event data, or navigation. React SHALL receive only discrete measurement/configuration changes and settled zoom/offset results.

#### Scenario: Pinch frames remain UI-thread local
- **WHEN** a continuous pinch and native scroll emit frame-frequency updates
- **THEN** shared values and worklet-compatible pure geometry compute the visual result
- **AND** no per-frame `setState`, persistence write, event query, formatting pass, or `runOnJS` bridge occurs

#### Scenario: Settlement crosses the boundary once
- **WHEN** a pinch or menu command settles successfully
- **THEN** the controller receives one coherent clamped scale/offset result for persistence and later restoration

### Requirement: T06 provides accessible bound-aware zoom commands

The screen-owned Calendar menu SHALL expose localized Zoom in, Zoom out, and Reset actions for Day and Week. Zoom in/out SHALL be disabled at their measured inclusive bounds and Reset SHALL be disabled at the default. A successful menu command SHALL announce the settled rounded percentage relative to the default once; a limit SHALL communicate its state without requiring pinch, color, or gesture discovery. Controls SHALL retain platform minimum targets and SHALL NOT change the chronological accessibility representation.

#### Scenario: Zoom is operable without pinch
- **WHEN** a student uses the Calendar menu in Day or Week
- **THEN** Zoom in, Zoom out, and Reset produce the same bounded zoom domain as pinch
- **AND** each successful command preserves viewport-center clock time and announces one settled result

#### Scenario: Limits communicate disabled state
- **WHEN** zoom is at 40 or 120 px/hour or at the 60 px/hour default
- **THEN** respectively Zoom out, Zoom in, or Reset exposes disabled state
- **AND** translated labels communicate the available action or reached limit

#### Scenario: Agenda does not gain visual zoom
- **WHEN** Agenda is active
- **THEN** its list, accessibility order, scroll position, refresh, and event activation remain unchanged
- **AND** returning to Day or Week restores the shared timeline zoom

### Requirement: T06 evidence is deterministic and revision-bound

Pure focal geometry, scale validation, inset-aware clamps, repeated commands, finger-count transitions, persistence, and reset preservation SHALL have deterministic automated coverage. Renderer and repository-contract checks SHALL retain automatic insets, one vertical owner, one pager, three pages, native header synchronization, no second renderer, and no per-frame React state path. Native arbitration, focal stability, bound communication, restart persistence, and prior accepted interactions SHALL be recorded against the exact tested build and full canonical owner checklist.

#### Scenario: Pure zoom behavior has property and boundary proof
- **WHEN** the focused data tests run
- **THEN** every introduced statement and branch is covered
- **AND** properties prove unclamped focal invariance, inclusive clamps, finite recovery, repeated commands, and valid offsets across viewport/inset combinations

#### Scenario: Existing Calendar behavior remains available
- **WHEN** focused renderer, screen, settings, storage, and repository-contract suites run
- **THEN** native pager/header synchronization, three-page retention, one vertical owner, weekend preferences, Agenda/details access, and absence of a second renderer remain proven

#### Scenario: Native evidence is not inferred from host tests
- **WHEN** local verification runs on the non-virtualized host
- **THEN** it reports only deterministic host results
- **AND** iOS/Android arbitration, release jump, automatic-inset stability, VoiceOver/TalkBack, and device feel remain explicit build-bound checklist evidence rather than fabricated claims
