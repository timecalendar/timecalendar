## ADDED Requirements

### Requirement: T11 packs positive intervals into deterministic equal-width clusters

The Calendar timeline SHALL validate overlap inputs as finite positive-duration intervals and SHALL order them by start instant, end instant, and stable source/event identity using locale-independent comparison. Input position SHALL NOT affect ordering or placement. Intervals SHALL overlap only when each starts strictly before the other's end, so an interval ending exactly when another starts SHALL free its column. Every maximal overlap-connected cluster SHALL use the minimum number of columns required by its maximum simultaneous occupancy, and every member SHALL receive one equal-width, non-covering column across that complete cluster.

#### Scenario: Input permutations keep the same placement

- **WHEN** the same valid intervals, including identical start/end bounds with distinct stable identities, arrive in different input orders
- **THEN** each identity receives the same output order, column, column count, and fractional horizontal bounds in every permutation
- **AND** no input index, title, or locale-dependent value participates in the tie-break

#### Scenario: Adjacent intervals share the full lane

- **WHEN** one interval ends at the exact instant another begins and neither overlaps another event
- **THEN** both intervals reuse column zero in separate one-column clusters
- **AND** each occupies the available width without an artificial overlap gap

#### Scenario: Transitive cluster uses minimum equal columns

- **WHEN** intervals form one transitive overlap-connected cluster whose maximum simultaneous occupancy is three
- **THEN** every cluster member receives one of exactly three equal-width columns
- **AND** no two time-overlapping visual rectangles cover one another

#### Scenario: Invalid interval cannot enter packing

- **WHEN** an overlap input has equal, reversed, invalid, or non-finite endpoints
- **THEN** the positive-interval boundary rejects it before sorting or placement
- **AND** point-event facts remain on their existing point-presentation path without invented duration

### Requirement: T11 placement is prepared from complete clusters before viewport clipping

The immutable timeline presentation SHALL calculate positive-interval overlap placement from every retained event in the relevant civil day before any vertical viewport clipping. A transitive cluster member outside the visible clock region SHALL still contribute to the cluster's column count and placement. Vertical scrolling, viewport clipping, and live zoom frames SHALL NOT sort, repack, or change an identity's horizontal placement. Gesture-frame work SHALL be limited to projection from prepared minute and fractional geometry.

#### Scenario: Off-screen member still determines visible placement

- **WHEN** an off-screen interval overlaps a second interval that connects transitively to a visible interval
- **THEN** all three are packed as one complete cluster before clipping
- **AND** scrolling the off-screen member into or out of view does not change any identity's column

#### Scenario: Zoom preserves columns

- **WHEN** a packed cluster is viewed at the minimum, default, and maximum supported zoom or changes scale during a pinch
- **THEN** every identity retains its prepared column and fractional horizontal bounds
- **AND** no frame performs interval sorting, clustering, local read, or React state write

### Requirement: T11 explicitly disambiguates intersecting effective targets

The renderer SHALL derive each retained event's effective target rectangle from its prepared horizontal placement and platform-minimum interaction geometry. Targets intersecting with positive area SHALL form deterministic conflict components. A single-event component SHALL remain a direct event button. A multi-event component SHALL preserve every visual tile but SHALL expose one localized accessible chooser trigger in place of competing underlying targets. Activating the trigger SHALL present one accessible modal choice per involved original identity in stable start/end/identity order, and choosing a row SHALL dismiss the modal and activate exactly that identity.

#### Scenario: Separated overlap columns remain directly openable

- **WHEN** simultaneous visual tiles occupy distinct columns and their effective target rectangles do not intersect
- **THEN** each tile retains its own button and opens its original identity directly
- **AND** no chooser or duplicate semantic target is introduced

#### Scenario: Expanded tiny targets require an explicit choice

- **WHEN** platform-minimum geometry makes two or more effective targets intersect
- **THEN** activating their conflict region opens a localized chooser instead of guessing an event from render order
- **AND** every involved event remains visibly rendered and appears once as a complete labelled choice

#### Scenario: Choosing one crowded event is unambiguous

- **WHEN** the user selects an event row from the chooser
- **THEN** the chooser dismisses and the existing details route receives that row's original UID exactly once
- **AND** no sibling event, recycled page slot, column number, or array index can be activated instead

#### Scenario: Chooser cancellation and replacement are safe

- **WHEN** the user cancels the chooser or its committed page generation is replaced
- **THEN** it closes without opening details
- **AND** stale identities and underlying ambiguous targets remain unavailable for activation

#### Scenario: Assistive technology encounters one explicit path

- **WHEN** a committed page contains a multi-event target conflict
- **THEN** traversal exposes one labelled chooser trigger followed, while open, by one complete button label per choice in a focus-contained modal
- **AND** neighbour pages, child visuals, and underlying conflicting pressables add no duplicate semantic nodes

### Requirement: T11 proof is permutation-, density-, and revision-bound

Deterministic proof SHALL cover input permutations, stable tie-breaks, invalid input, adjacency, identical bounds, transitive clusters, minimum column count, equal widths, non-covering visuals, viewport and zoom stability, direct activation, chooser activation/cancellation/replacement, and semantic-node uniqueness. Evidence SHALL use identified fabricated adjacent, two-way, three-way, five-way, point, and tiny-target cases and SHALL record exact event, cluster, placement, mounted-visual, committed-semantic, open-chooser-semantic, and activation counts against the tested revision. Host automation SHALL NOT claim a final supported density, physical target feel, or VoiceOver/TalkBack acceptance.

#### Scenario: Fabricated dense cluster remains complete

- **WHEN** the identified five-way fabricated cluster and its adjacent/tiny companions are laid out and rendered
- **THEN** every retained identity has a deterministic placement or point visual and an unambiguous activation path
- **AND** the evidence reports exact counts without hiding events or applying an event-count threshold

#### Scenario: Evidence keeps device claims explicit

- **WHEN** focused and local-green host checks pass
- **THEN** the handoff records their exact commands, results, tested head, and fabricated frame/node measurements
- **AND** missing native-device accessibility and target-feel evidence remains explicitly assigned to the planned final-device slice
