## ADDED Requirements

### Requirement: The non-empty user-calendar collection is virtualized without changing surrounding states

The management screen SHALL render a non-empty held-calendar collection through one React Native virtualized list keyed by `calendar.id`. The list SHALL own the existing visibility-description header, row rendering, inter-row spacing, ordinary bottom padding, and additional Android FAB clearance. The unresolved-read blank state, centered loaded-empty state, accessible write-error notice, safe-area width and horizontal insets, Android FAB, and rename dialog SHALL preserve their existing layout and lifecycle outside the virtualized collection.

#### Scenario: A populated collection uses id-keyed virtualization

- **WHEN** the loaded management screen receives one or more held calendars
- **THEN** it renders them through a virtualized list whose item keys are their calendar ids
- **AND** it does not wrap that list in another vertical scroll container

#### Scenario: The list preserves its header and platform clearance

- **WHEN** the populated list renders on either platform
- **THEN** the visibility-description copy scrolls as the list header
- **AND** the existing bottom padding is preserved
- **AND** Android retains additional clearance so the final row does not sit beneath the FAB

#### Scenario: Non-list states retain their composition

- **WHEN** the read is unresolved, resolves empty, or a write failure is present
- **THEN** the screen preserves the existing blank, centered empty, and accessible error behavior respectively
- **AND** safe-area insets, the add affordance, and rename-dialog mounting are unchanged

### Requirement: Calendar-management UI ownership remains bounded and internal

The user-calendar management surface SHALL separate screen composition, calendar row/menu presentation, and visibility control/coordination into focused modules within `calendar-sources/ui`. No component in this surface SHALL be materially above 200 lines. The extraction SHALL preserve the existing public UI and feature barrels and SHALL obey the feature-sublayer and calendar-sources leaf boundaries.

#### Scenario: Extracted modules preserve the public surface

- **WHEN** the refactor is applied
- **THEN** `UserCalendarsScreen` remains available from the existing public barrels
- **AND** row/menu and visibility implementation details remain internal to `calendar-sources/ui`
- **AND** no component in the surface is materially above 200 lines

#### Scenario: The feature remains a dependency leaf

- **WHEN** lint evaluates the extracted modules
- **THEN** UI code reaches calendar-source data through its sibling data barrel
- **AND** no calendar-sources module imports Activity or bypasses the owned native-chrome seam

### Requirement: Optimistic visibility ordering is operation-keyed and survives row virtualization

Visibility presentation SHALL be coordinated above virtualized rows by per-calendar operation records keyed by calendar id. An accepted toggle SHALL render its target immediately and start at most one persistence write for that calendar while the write is unresolved. Repeated input during that pending write SHALL be ignored. A failed write SHALL remove only its current operation and reveal the latest canonical value. A successful write SHALL retain its optimistic target while the live query still exposes the pre-write canonical value; when canonical state acknowledges that target, the operation SHALL retire without a passive effect-driven state reset. Any later external canonical change SHALL render immediately, and an old async completion SHALL NOT change a newer operation or canonical result.

#### Scenario: Successful write remains optimistic before live-query echo

- **WHEN** a visible calendar is toggled off and persistence resolves successfully before canonical state changes
- **THEN** the switch renders off immediately and remains off while canonical state still reports on
- **AND** only one persistence write is issued

#### Scenario: Delayed canonical acknowledgement retires the operation

- **WHEN** a successful optimistic target is later emitted by the live query
- **THEN** the switch remains on that target without flashing the prior canonical value
- **AND** the acknowledged operation is retired

#### Scenario: Failed write rolls back to the latest canonical value

- **WHEN** persistence for the current optimistic operation reports failure
- **THEN** that operation is cleared
- **AND** the switch renders the latest canonical value
- **AND** the existing accessible write-failure notice remains available through the actions hook

#### Scenario: Rapid repeated input is ignored while pending

- **WHEN** the switch emits multiple repeated or opposing change events before the current write settles
- **THEN** exactly one persistence write runs for that calendar
- **AND** the displayed value remains the current operation's target

#### Scenario: Later external canonical change replaces acknowledged state

- **WHEN** canonical state acknowledges a successful target and later changes again externally
- **THEN** the switch renders the later canonical value immediately
- **AND** no retired optimistic value flashes or masks it

#### Scenario: Stale completion cannot overwrite newer state

- **WHEN** an async completion arrives for an operation id that is no longer current
- **THEN** the completion is ignored
- **AND** the current operation or canonical value remains displayed

#### Scenario: Virtualized row remount preserves an active operation

- **WHEN** a row unmounts and remounts while its write or canonical acknowledgement is outstanding
- **THEN** its displayed target and one-write-at-a-time guard remain owned by the id-keyed controller
- **AND** remounting does not start another write or reveal stale canonical state

### Requirement: The refactor retains focused regression and compiler evidence

Automated tests SHALL retain the existing behavior proofs for delete, rename, visibility, menu behavior on both platforms, accessibility, testIDs, translations, effective-name fallbacks, safe-area spacing, loading/empty/error states, and platform add affordances. New tests SHALL prove every optimistic ordering scenario above with controlled promises and canonical rerenders, without retries, extended query waits, or weakened matchers. React Doctor SHALL run against the changed files; its visibility-path try/finally finding SHALL be fixed only if single-flight release and explicit failure recovery remain clear and covered, and every remaining finding SHALL be classified rather than suppressed.

#### Scenario: Focused tests prove preserved behavior and async ordering

- **WHEN** focused Jest suites for the changed screen, row/menu, and visibility controller run
- **THEN** all preserved management behavior remains green
- **AND** successful acknowledgement, failed writes, rapid repeated input, delayed canonical echo, stale completion, remount, and later external canonical changes are covered

#### Scenario: Compiler findings are handled with evidence

- **WHEN** React Doctor runs on the changed files
- **THEN** the former try/finally bailout is either removed by an explicit tested rewrite or retained with a documented classification
- **AND** no finding is hidden by suppression without evidence
