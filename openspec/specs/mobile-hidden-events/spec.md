# mobile-hidden-events Specification

## Purpose
TBD - created by archiving change add-mobile-hidden-events. Update Purpose after archive.
## Requirements
### Requirement: The hidden-events set is persisted durably in the MMKV storage seam for importer fidelity

The app SHALL persist the hidden-events set in the device-local key-value store (the `@/storage`
MMKV seam), NOT in Drizzle/SQLite and NOT in an ephemeral holder, as a **single JSON-encoded record**
`{ uidHiddenEvents: string[], namedHiddenEvents: string[] }` under one flat key
(`hiddenEvents.set`). The persisted shape SHALL mirror the Flutter `HiddenEvent.toMap()` wire format
**verbatim** (the same two keys, two string lists) so the Phase-09 one-shot importer can write the
recovered record with **no value transformation**. The set SHALL survive app restart, process kill,
and JS-cache clear.

#### Scenario: The persisted blob matches the Flutter wire format verbatim

- **WHEN** the hidden-events store writes the set
- **THEN** it stores a JSON-encoded `{ uidHiddenEvents: [...], namedHiddenEvents: [...] }` record under
  the single `hiddenEvents.set` key, with the same two keys and string-list shape as the Flutter
  `toMap()`
- **AND** an importer can write a recovered `{ uidHiddenEvents, namedHiddenEvents }` record as that
  key's value with no value parsing that could corrupt or drop data

#### Scenario: The hidden set survives a restart

- **WHEN** an event is hidden and the app is then restarted or relaunched
- **THEN** the previously-hidden uid / name is still present and the event is still filtered out
- **AND** the set was read back from the durable MMKV key, not re-derived

#### Scenario: The data layer is the only place touching the storage backend

- **WHEN** the hidden-events store, parser, or hooks run
- **THEN** they touch `@/storage` only within the feature's `data/` sublayer
- **AND** no `ui/` screen, route, or the feature barrel imports `react-native-mmkv` or `@/storage`
  directly

### Requirement: The hidden-events read is total and defensively parsed

The app SHALL parse the persisted hidden-events blob with a total parser: an unset, non-JSON,
wrong-shape, or non-string-array value SHALL decode to the empty set
`{ uidHiddenEvents: [], namedHiddenEvents: [] }` and SHALL NEVER throw. The reactive read
(`useHiddenEvents()`) SHALL re-render consumers when the set changes (over the seam's reactive
string read).

#### Scenario: An absent set reads as empty

- **WHEN** no hidden-events record has ever been written
- **THEN** the read returns the empty set and no view filters out any event

#### Scenario: A corrupt set reads as empty, never throws

- **WHEN** the persisted value is non-JSON, the wrong shape, or contains non-string entries
- **THEN** the parser returns the empty set and the read does not throw (the views render everything —
  the safe default)

#### Scenario: A hide/un-hide re-renders the reactive consumers

- **WHEN** an event is hidden or un-hidden
- **THEN** the reactive read updates and the calendar views and the management screen re-render to
  reflect the new set

### Requirement: Hide by uid and by name, un-hide by uid and by name, one imperative write path

The app SHALL provide four imperative mutators over the MMKV seam — `hideByUid(uid)`,
`hideByName(name)`, `unhideUid(uid)`, `unhideName(name)` — each reading the current set, producing the
next set (append-if-absent for a hide, filter-out for an un-hide; de-duplicated so a hide of an
already-hidden value is a no-op), and writing the whole encoded record. The four mutators SHALL be the
single write path; the reactive read SHALL NOT write.

#### Scenario: Hide by uid adds the uid to the uid list

- **WHEN** `hideByUid(uid)` runs
- **THEN** the uid is added to `uidHiddenEvents` if absent (a no-op if already present) and the whole
  record is written

#### Scenario: Hide by name adds the title to the named list

- **WHEN** `hideByName(title)` runs
- **THEN** the title is added to `namedHiddenEvents` if absent and the whole record is written

#### Scenario: Un-hide removes the value from its list

- **WHEN** `unhideUid(uid)` or `unhideName(title)` runs
- **THEN** the value is removed from the respective list and the whole record is written; removing an
  absent value is a no-op

### Requirement: Hidden events are filtered out at the single events-source seam

The app SHALL filter hidden events out within `useCalendarEvents(range)` (the single events-source
seam): an event SHALL be excluded iff its uid is in `uidHiddenEvents` OR its title is in
`namedHiddenEvents`. The filter SHALL apply to the merged synced+personal list (Flutter parity — the
filter runs over the combined list), behind the unchanged seam signature and `CalendarEvent` shape, so
every view (day/week, agenda, home) honors hiding with NO consumer change.

#### Scenario: A uid-hidden event is filtered from every view

- **WHEN** an event's uid is in `uidHiddenEvents`
- **THEN** `useCalendarEvents` excludes it, and the day/week timeline, the agenda list, and the home
  today view all render without it

#### Scenario: A name-hidden title filters all same-titled events

- **WHEN** a title is in `namedHiddenEvents`
- **THEN** every event with that exact title is excluded from `useCalendarEvents` (covering a recurring
  class's many instances)

#### Scenario: The filter applies to the merged list (Flutter parity)

- **WHEN** the hidden set contains a name that a personal event also carries
- **THEN** the same-titled personal event is also filtered (the filter runs over the merged
  synced+personal list, matching Flutter `EventsForViewNotifier`)

### Requirement: The hide / un-hide action is offered only for synced events on the event-details screen

The read-only event-details screen SHALL gain a hide / un-hide action — a header overflow menu offered
ONLY for a synced event (one carrying a `userCalendarId`), matching Flutter offering "Masquer" only for
`EventKind.Calendar`. For a not-currently-hidden event the menu SHALL open a native-default surface
(R-3, no Material dialog port) offering two translated, accessible choices: **hide this event**
(`hideByUid(event.id)`) and **hide all events of the same name** (`hideByName(event.title)`). For a
currently-hidden event the menu SHALL offer **un-hide** (removing the event from whichever set(s)
contain its uid or title), so the details screen is never a one-way trap.

#### Scenario: Hide this instance

- **WHEN** the user, on a synced event's details, chooses "hide this event"
- **THEN** `hideByUid(event.id)` runs, the event is filtered from the views, and the screen navigates
  back

#### Scenario: Hide all of the same name

- **WHEN** the user chooses "hide all events of the same name"
- **THEN** `hideByName(event.title)` runs and every same-titled event is filtered from the views

#### Scenario: Un-hide from the details screen

- **WHEN** the viewed synced event is currently hidden (its uid or title is in the set) and the user
  chooses un-hide
- **THEN** the event is removed from the set and renders again in the views

#### Scenario: No hide action on a personal event

- **WHEN** the details surface is reached for a personal event (no `userCalendarId`)
- **THEN** no hide action is offered (Flutter parity — hiding applies to synced events only)

### Requirement: Un-hide is reachable from a hidden-events management screen

The app SHALL provide a presentational hidden-events management screen (and a deep-linkable thin route,
a Stack sibling of the tabs, reached from a Profile entry link) that lists the name-hidden titles and
the uid-hidden events (each uid resolved to its current synced event's title and time; a uid that no
longer resolves to a synced event is not listed, Flutter parity), each with an un-hide control, plus an
accessible empty state. This screen SHALL ship in this change so that hide-by-name (which has no
per-event details surface) is always un-hideable.

#### Scenario: The management screen lists hidden entries with un-hide controls

- **WHEN** the management screen renders with a non-empty hidden set
- **THEN** it lists the name-hidden titles and the still-resolving uid-hidden events, each with an
  accessible un-hide control that removes it from the set

#### Scenario: Empty management state

- **WHEN** nothing is hidden
- **THEN** the management screen shows an accessible empty state, not a crash or a blank

#### Scenario: The management screen is reachable

- **WHEN** the user opens the Profile tab
- **THEN** a "Hidden events" entry navigates to the management screen (also deep-linkable
  `timecalendar-dev://hidden-events`)

### Requirement: A failed hidden-set write is recorded; a read is infallible

A failure of a hidden-set write (a `setString` failure inside any of the four mutators) SHALL be
reported through the `@/firebase` `recordError(error, "hidden-events/<action>")` seam (a crash-worthy
local-persistence failure — there is no server backup) AND surfaced as an accessible failure state. A
hidden-events read SHALL be total/infallible (a corrupt or absent blob parses to the empty set and the
views render everything) and SHALL NOT be recorded.

#### Scenario: A write failure is recorded and surfaced

- **WHEN** a hide / un-hide write throws (a local KV write failure)
- **THEN** the error is reported through `@/firebase` `recordError` and an accessible failure state is
  shown to the user

#### Scenario: A read failure is impossible (degrades to empty)

- **WHEN** the persisted blob is corrupt or absent
- **THEN** the read returns the empty set, no error is recorded, and the views render normally

### Requirement: The hidden-events data layer is verified by automated tests under the coverage gate

The hidden-events `data/` layer SHALL be covered by automated tests under the K-3 90% logic gate: the
total parser (empty / corrupt / verbatim-shape round-trip), the four mutators (append, dedup, remove,
no-op-on-absent), the **write-then-read-back** contract, and a **restart-simulation** (a fresh store
module reads back a prior write through a stateful in-memory `@/storage` fake). The presentational
management and details screens SHALL meet the 70% floor (the menu→action wiring, the synced-only
gating, the un-hide path, the empty state).

#### Scenario: The data layer meets the coverage threshold

- **WHEN** `npm test -- --coverage` runs in `mobile/`
- **THEN** the hidden-events `data/**` logic clears the 90% gate and the suite is green

#### Scenario: The write/read-back and restart contract is proven

- **WHEN** the store test writes a hide and a fresh store module reads the set back through a stateful
  `@/storage` fake
- **THEN** the read returns the persisted set, proving the round-trip and the restart-survival contract

