## MODIFIED Requirements

### Requirement: T11 explicitly disambiguates intersecting effective targets

The renderer SHALL derive each retained event's effective target rectangle from its prepared horizontal placement and platform-minimum interaction geometry. Targets intersecting with positive area SHALL form deterministic conflict components. A single-event component SHALL keep one direct visual, pointer, and semantic event button. A multi-event component SHALL preserve every visual tile and SHALL expose one localized pointer chooser trigger over the component union in place of competing pointer targets. That chooser trigger MUST be excluded from the accessibility tree. Each underlying visible tile SHALL remain the sole semantic button for its original identity only after the T12 native gate proves that its target remains reachable, meaningful, and unambiguously activatable by supported assistive tools. Activating an event semantic button SHALL open exactly that identity; activating the pointer chooser SHALL present one accessible modal choice per involved original identity in stable start/end/identity order.

#### Scenario: Separated overlap columns remain directly openable

- **WHEN** simultaneous visual tiles occupy distinct columns and their effective target rectangles do not intersect
- **THEN** each tile retains one button and opens its original identity directly
- **AND** no chooser or duplicate semantic target is introduced

#### Scenario: Expanded tiny pointer targets require an explicit choice

- **WHEN** platform-minimum geometry makes two or more pointer targets intersect
- **THEN** activating their non-semantic pointer overlay opens a localized chooser instead of guessing an event from render order
- **AND** every involved event remains visibly rendered and retains exactly one chronological semantic button tied to that visual tile

#### Scenario: Choosing one crowded event is unambiguous

- **WHEN** the user activates a focused event semantic button or selects an event row from the chooser
- **THEN** the existing details route receives that event's original UID exactly once
- **AND** no sibling event, recycled page slot, column number, or array index can be activated instead

#### Scenario: Chooser cancellation and replacement are safe

- **WHEN** the user cancels the chooser or its committed page generation is replaced
- **THEN** it closes without opening details
- **AND** stale identities and underlying pointer targets remain unavailable for activation

#### Scenario: Assistive technology encounters events rather than the pointer overlay

- **WHEN** a committed page contains a multi-event target conflict after the native gate passes
- **THEN** traversal exposes each visual event tile once in complete chronological order and never exposes the pointer chooser overlay
- **AND** neighbour pages, child visuals, and the open chooser's background add no duplicate semantic nodes

#### Scenario: Native conflict geometry fails safely

- **WHEN** VoiceOver, TalkBack, Voice Control, or switch operation cannot reach and activate the intended conflict identity with meaningful visual geometry
- **THEN** T12 stops before adopting the changed semantic arrangement
- **AND** the implementation requests a scoped D06 revision rather than adding hidden buttons or a duplicate tree

## ADDED Requirements

### Requirement: T12 publishes one committed chronological accessibility projection

The Calendar data layer SHALL derive one immutable accessibility projection from the complete committed validated page. It SHALL order every supported timed event by display-zone civil date, start instant, end instant, source, and original UID using locale-independent identity comparison. Each original identity SHALL occur exactly once. Zoom, viewport position, visual culling, React mount order, and recycled pager slots MUST NOT determine semantic order or identity. Adjacent pages and filtered, malformed, unsupported, cancelled, hidden-source, or duplicate identities SHALL NOT enter the projection.

#### Scenario: Week traversal is chronological across columns

- **WHEN** a committed week contains events on multiple visible dates with tied start/end bounds
- **THEN** the projection orders them by date, start, end, source, and UID and contains each identity once
- **AND** changing input order, zoom, or vertical offset does not change the result

#### Scenario: Neighbour pages remain absent

- **WHEN** previous, committed, and next pages are retained by the pager
- **THEN** only the committed page contributes event nodes to traversal
- **AND** settling a replacement atomically swaps to the destination projection without exposing both generations

#### Scenario: Invalid duplicate identity is rejected

- **WHEN** one committed page would contain the same source/UID identity more than once
- **THEN** projection preparation rejects the invalid model in development and test
- **AND** it does not rename, merge, or silently drop one copy to fabricate uniqueness

### Requirement: T12 keeps off-viewport traversal complete and bounded

The committed page SHALL keep every projected event natively reachable through the existing bounded timeline owner, including events beginning at 01:00 and 23:00 when neither is initially visible. Reaching or restoring an off-viewport event SHALL move the existing vertical owner to reveal the associated visible target before native focus or activation. The renderer SHALL retain no semantic page history, unbounded cache, second scroll owner, hidden mirror list, or arbitrary event cap. Zoom SHALL change geometry without changing reachable identities, order, or complete labels.

#### Scenario: Both clock extremes are reachable

- **WHEN** the initial viewport is centred near 10:00 and the committed page also contains 01:00 and 23:00 events
- **THEN** supported assistive traversal reaches all three events once in time order and reveals each associated tile
- **AND** it does not require switching to Agenda or mounting a duplicate accessibility list

#### Scenario: Zoom preserves semantic content

- **WHEN** the same committed page moves among minimum, default, and maximum zoom
- **THEN** every event retains its identity, relative traversal position, and complete localized label
- **AND** only its visible and activation geometry changes with the shared clock scale

#### Scenario: Long sessions remain bounded

- **WHEN** the student pages repeatedly through many dates
- **THEN** semantic nodes and focus refs are retained only for the current bounded presentation and pending accepted transition
- **AND** released page identities do not accumulate with session length

### Requirement: T12 restores logical focus after accepted context changes

The Calendar SHALL remember the last natively focused event by original source/UID and relevant date. After details return, accepted paging, or a Day/Week mode change, it SHALL wait for the complete matching presentation and native target registration, reveal the target when necessary, and request focus once on that surviving identity. If the identity is absent, focus SHALL fall back to its relevant committed date heading when present, otherwise to the committed page heading. Stale revisions, transient motion, zoom frames, and adjacent pages SHALL NOT move focus. The accepted date context SHALL be announced once without a second announcement caused by focus restoration.

#### Scenario: Details return restores the surviving event

- **WHEN** a user opens an event and returns while the same identity remains in the committed presentation
- **THEN** the Calendar reveals and focuses that event's existing visible semantic target once
- **AND** it does not focus a recycled sibling, duplicate the event node, or repeat the settled context announcement

#### Scenario: Missing identity falls back by date

- **WHEN** paging or a mode change removes the previously focused identity from the committed presentation
- **THEN** focus moves to the relevant date heading if that date remains present, otherwise to the committed page heading
- **AND** no stale ref or array position determines the destination

#### Scenario: Obsolete settlement cannot steal focus

- **WHEN** a newer revision supersedes a transition whose target later mounts or settles
- **THEN** callbacks from the obsolete revision cannot scroll or request native focus
- **AND** only the latest accepted complete context may restore focus and announce settlement

### Requirement: T12 native evidence gates the approved tree

Before completing T12, the implementation SHALL run the checked-in fabricated 01:00/10:00/23:00 and overlap fixture on actual iOS and Android test paths with the applicable screen reader, voice, and switch tools. Evidence SHALL record the exact commit/PR head, build, platform/device, preparation/reset steps, traversal order, offscreen reachability, focused target geometry, exact-identity activation, page/zoom alternatives, details return, mode change, largest text, and touched regression checks. Missing platform evidence SHALL remain Applier rework and MUST NOT be inferred from host tests or earlier epics. If the approved visual-target tree fails bounded reachability or activation geometry, implementation SHALL stop and request a scoped D06 revision before adding another semantic strategy.

#### Scenario: Approved tree passes the native gate

- **WHEN** every required iOS and Android assistive path traverses each fixture event once, reveals both extremes, and activates the labelled visible identity
- **THEN** implementation may complete focus restoration and final exact-head verification on that same strategy
- **AND** the evidence names every executed result and any rerun required after relevant edits

#### Scenario: Approved tree fails the native gate

- **WHEN** any required platform cannot reach an off-viewport event or cannot unambiguously activate its visible identity
- **THEN** the slice records the failing platform/tool/build/fixture and stops further feature expansion
- **AND** no hidden duplicate, accessibility-only destination, experimental order API, or unapproved semantic layer is added

#### Scenario: Automation proves only deterministic contracts

- **WHEN** pure, component, screen, repository-contract, and CI checks pass
- **THEN** they prove ordering, uniqueness, labels, callbacks, focus state, owner count, and stop-condition wiring
- **AND** they do not claim VoiceOver, TalkBack, Voice Control, switch, large-text, or physical activation behavior without the recorded native run
