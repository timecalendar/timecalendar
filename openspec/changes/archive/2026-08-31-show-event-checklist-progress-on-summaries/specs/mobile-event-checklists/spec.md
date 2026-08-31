## ADDED Requirements

### Requirement: Checklist progress is read reactively for a rendered event UID set

The event-checklists feature SHALL expose a reactive UID-keyed progress projection for the rendered event set. One invocation SHALL issue one set-oriented live SQLite query scoped to the unique event UIDs and return `completed` and `total` counts per UID; consumers SHALL NOT create one live query or hook instance per event.

The projection SHALL count every matching `checklist_items` row, including imported rows with non-null `deletedAt`, because the existing Flutter-compatible repository does not apply a soft-delete predicate. An empty UID set or a UID with no rows SHALL yield no progress entry rather than an error.

#### Scenario: One read serves multiple visible events

- **WHEN** a summary screen renders multiple synced and personal event UIDs, including duplicate representations of one UID
- **THEN** the progress seam performs one live query for the unique UID set and returns a UID-keyed completed/total map
- **AND** no event summary starts its own live query

#### Scenario: Zero, partial, and complete counts are aggregated

- **WHEN** one UID has no rows, one has one checked row out of three, and one has two checked rows out of two
- **THEN** the result has no entry for the zero-row UID, reports `1/3` for the partial UID, and reports `2/2` for the complete UID

#### Scenario: Imported deletedAt rows still count

- **WHEN** a matching imported checklist row has a non-null `deletedAt`
- **THEN** it contributes to `total` and, when checked, `completed`, with no `deletedAt` predicate added

### Requirement: Checklist mutations update summary progress without navigation

The checklist progress projection SHALL react to checklist-table mutations while a summary screen remains mounted. Add, check, uncheck, and hard-delete SHALL update completed/total counts after the coalesced live read; reorder SHALL trigger the live projection without changing either count.

#### Scenario: Add and delete update total

- **WHEN** an item is added to or deleted from an event checklist while a summary consumer remains mounted
- **THEN** the summary progress total updates without leaving or reopening the screen

#### Scenario: Check and uncheck update completed

- **WHEN** an item is checked and then unchecked while a summary consumer remains mounted
- **THEN** the completed count updates after each mutation while total remains unchanged

#### Scenario: Reorder preserves progress

- **WHEN** checklist items are reordered
- **THEN** the reactive read settles with the same completed and total counts

### Requirement: A shared progress indicator communicates partial and complete states

The event-checklists feature SHALL provide one shared progress indicator with inline and compact variants. Callers SHALL omit it when `total` is zero. For nonzero totals it SHALL show `completed/total`; the all-complete state SHALL be visibly distinct through an explicit checked icon/shape in addition to styling, and no state SHALL depend on color or a tiny dot alone.

The visual indicator SHALL not duplicate announcements. Each owning event summary SHALL include a localized EN/FR phrase equivalent to “2 of 3 checklist items completed” in its accessible label.

#### Scenario: Zero items hide the indicator

- **WHEN** an event has zero checklist items
- **THEN** no visual progress indicator or checklist-progress phrase is rendered for that summary

#### Scenario: Partial and complete states remain explicit

- **WHEN** progress is partial or all complete
- **THEN** both states show the numeric completed/total value
- **AND** all-complete uses an explicit checked glyph/shape that remains distinguishable without color

#### Scenario: Assistive technology receives one composed phrase

- **WHEN** a summary with progress receives accessibility focus
- **THEN** its label includes the localized completed-of-total phrase exactly once
