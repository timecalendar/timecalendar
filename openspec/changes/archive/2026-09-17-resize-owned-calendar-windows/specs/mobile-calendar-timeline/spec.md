## ADDED Requirements

### Requirement: T07 replaces timed viewport geometry atomically

The owned Day/Week renderer SHALL treat each normalized timed-viewport width/height pair and its effective automatic native insets as one monotonic geometry revision. Before replacing geometry, it SHALL snapshot one coherent committed date identity, timeline mode, renderer generation, bounded pixels-per-hour scale, raw offset, and visible clock anchor. Replacement SHALL preserve the date, mode, scale, and clock anchor, and SHALL NOT request a date transition, switch Week to Day, or expose a frame composed from old and new dimensions.

#### Scenario: Width and height replace together

- **WHEN** rotation or native window resizing changes the timed viewport
- **THEN** width and height commit under one new geometry revision
- **AND** header, pager, clock canvas, and vertical bounds consume that same revision

#### Scenario: Resize preserves committed presentation state

- **WHEN** a Day or Week surface at non-default zoom is resized
- **THEN** its selected date, explicit mode, pixels-per-hour scale, and clock anchor remain unchanged
- **AND** no resize-driven date request, accessibility date announcement, Agenda-range change, or mode persistence write occurs

#### Scenario: Repeated transient measurements remain coherent

- **WHEN** the platform emits multiple complete layout pairs during rotation or interactive resizing
- **THEN** each accepted pair supersedes the previous geometry monotonically and idempotently
- **AND** no callback can reconstruct a mixed width/height snapshot

### Requirement: T07 preserves and clamps the visible clock anchor

The renderer SHALL capture the wall-clock coordinate at the usable center of the old timed viewport and solve the replacement raw offset against the usable center of the new viewport at the unchanged scale. The usable center and raw bounds SHALL include actual automatic top/bottom native insets. The clock coordinate SHALL remain stable when the solution is in range and SHALL clamp to the nearest valid 00:00/24:00 bound when the replacement viewport makes exact preservation impossible.

#### Scenario: Height-only resize preserves clock context

- **WHEN** viewport height changes without a width change while an afternoon clock coordinate is visible
- **THEN** the same clock coordinate remains at the new usable viewport center unless clamped
- **AND** the result uses live native insets rather than an assumed zero inset or the last React-only measurement

#### Scenario: Width-only resize does not move time

- **WHEN** viewport width changes without a height or inset change
- **THEN** the settled scale and visible clock coordinate remain unchanged
- **AND** only horizontal lane geometry is redistributed

#### Scenario: Closing boundary remains reachable

- **WHEN** height or bottom inset changes near the end of the full-day surface
- **THEN** the raw offset clamps to the updated inset-aware lower bound
- **AND** the exact 24:00 closing boundary remains reachable above native chrome with its presentation hairline intact

### Requirement: T07 invalidates stale motion across geometry revisions

A geometry replacement SHALL be a cancellation boundary for pager selection/idle, dated-header progress, pending vertical settlement, native-owner epochs, and active pinch work begun under the prior revision. The renderer SHALL cancel or settle that work coherently, recenter the existing pager/header on the committed page, apply the replacement offset without animation, and reject every late completion whose renderer generation or geometry revision is stale. Fresh native ownership SHALL reopen only after an interaction begins under the new revision.

#### Scenario: Rotation interrupts horizontal motion

- **WHEN** rotation or resizing occurs during page drag, settle, selection, or dated-header projection
- **THEN** the unaccepted destination is cancelled and the pager/header recenter on the committed date
- **AND** late selection, idle, or progress callbacks cannot commit or relabel the new layout

#### Scenario: Rotation interrupts vertical motion

- **WHEN** geometry changes during vertical drag, momentum, or a queued end-drag frame
- **THEN** old settlement work is cancelled before the new clock-anchor offset is applied
- **AND** a late scroll completion cannot replace the resized offset

#### Scenario: Rotation interrupts pinch

- **WHEN** geometry changes after pinch starts but before its settlement reaches React
- **THEN** pinch is cancelled or finalized against one coherent pre-replacement snapshot and the new geometry revision owns the restored result
- **AND** a stale zoom settlement cannot persist scale or offset over the replacement snapshot

### Requirement: T07 keeps one responsive native renderer

At every supported compact, medium, and expanded timed-viewport size, the owned renderer SHALL retain one automatic-inset native vertical owner, one native horizontal pager, and exactly three previous/current/next pages. Day SHALL render one complete column and Week SHALL render five or seven complete equal-width columns according to the existing weekend preference. The pinned dated header and clock grid SHALL derive their content lane from the same committed geometry. The renderer SHALL NOT add a column scroller, second pager, compatibility renderer, or width-driven mode switch.

#### Scenario: One, five, and seven columns stay aligned

- **WHEN** Day, five-day Week, and seven-day Week are each resized through representative compact, medium, and expanded widths
- **THEN** every dated-header cell remains aligned with its complete clock column on all three pages
- **AND** no partial column, blank weekend lane, overlapping gutter, or independent horizontal column motion appears

#### Scenario: Native ownership and insets survive resize

- **WHEN** the Calendar is inspected before and after width-only, height-only, and combined changes
- **THEN** it retains one `contentInsetAdjustmentBehavior="automatic"` vertical owner and one three-page pager
- **AND** native tab-bar reachability, bounce/deceleration ownership, and the no-second-renderer contract remain unchanged

#### Scenario: Agenda and details remain available

- **WHEN** the student opens Agenda or event details and returns after an orientation/window change
- **THEN** the existing Agenda range, refresh, checklist, and activation behavior remain available
- **AND** returning to Day or Week restores the committed date, mode, scale, and resized clock position

### Requirement: T07 evidence is revision and build bound

Deterministic coverage SHALL include pure resize snapshots, clock-anchor invariance and clamp boundaries, stale-revision rejection, one/five/seven-column alignment, one vertical owner, one pager, three pages, automatic insets, and absence of a second renderer. Native evidence SHALL identify the exact revision, runtime fingerprint, compatible binary/build, device model, OS, physical/simulator status, and tested dimensions. The full canonical owner checklist SHALL cover both phone rotations, repeated representative tablet window sizes, resize during drag/pinch, shared navigation/chrome, height-only 24:00 reachability, and touched prior interactions.

#### Scenario: Host automation stays within its evidence boundary

- **WHEN** deterministic checks run on the non-virtualized host
- **THEN** they report source, reducer, component, repository, config, and disposable-prebuild results only
- **AND** they do not claim actual rotation, multitasking, native gesture feel, or device chrome results

#### Scenario: Owner acceptance uses a compatible build

- **WHEN** T07 is presented for owner acceptance
- **THEN** the handoff names a fresh native binary whose runtime fingerprint matches the tested revision rather than an OTA-only JS reload
- **AND** every canonical checklist item is marked pass, fail, or explicitly deferred through the permitted T28 path before acceptance is recorded
