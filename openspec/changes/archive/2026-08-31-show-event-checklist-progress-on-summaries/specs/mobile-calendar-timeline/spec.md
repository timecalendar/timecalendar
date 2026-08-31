## ADDED Requirements

### Requirement: Day and week tiles surface checklist progress without rebuilding renderer events

The calendar day/week timeline SHALL show checklist progress on timed and all-day tiles for synced and personal events. It SHALL obtain progress through one UID-set projection outside individual tiles and pass the progress map through the renderer-neutral facade separately from `CalendarEvent[]`.

Checklist progress changes SHALL update tile content without recreating the memoized CalendarKit vendor event collection or changing projected event identity. Zero-item events SHALL show no indicator. Nonzero events SHALL use the compact shared indicator, including an explicit non-color all-complete state and a localized progress phrase in the tile accessibility label.

#### Scenario: Timed tiles render partial and complete progress in day and week modes

- **WHEN** day or week mode renders timed synced and personal events with partial or complete checklists
- **THEN** each tile shows the correct compact completed/total state and announces the localized progress phrase

#### Scenario: All-day tiles render progress

- **WHEN** an all-day event has checklist items
- **THEN** its CalendarKit header tile shows the compact progress state without changing all-day date projection

#### Scenario: Small and dense tiles retain meaningful progress

- **WHEN** overlap packing or minimum tile geometry leaves insufficient room for normal title/location content
- **THEN** the compact indicator remains bounded to the tile and preserves an icon/count signal rather than degrading to a color-only dot
- **AND** the complete accessible label retains the full progress phrase

#### Scenario: Progress-only rerender preserves event projection identity

- **WHEN** only checklist counts change while `CalendarEvent[]` is referentially unchanged
- **THEN** tile content updates from the sidecar progress map
- **AND** the CalendarKit vendor event array and its projected event objects are not recreated
