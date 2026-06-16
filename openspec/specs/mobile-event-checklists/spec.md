# mobile-event-checklists Specification

## Purpose
TBD - created by archiving change add-mobile-event-checklists. Update Purpose after archive.
## Requirements
### Requirement: Checklist items are persisted in a 4th Drizzle table mirroring the Flutter wire format verbatim for importer fidelity

The app SHALL persist per-event checklist items in a new device-local Drizzle/SQLite table
`checklist_items` (NOT MMKV, NOT an ephemeral holder), with columns mirroring the Flutter
`ChecklistItem.toMap()` wire format **verbatim** so the Phase-09 one-shot importer can write
recovered rows with **no value transformation**: `uuid` TEXT primary key (the sembast record key /
identity), `eventUid` TEXT not-null (a SOFT reference to the owning event's uid — NO foreign-key
constraint), `content` TEXT not-null, `isChecked` boolean (stored 0/1) not-null, `order` INTEGER
not-null (1-based), and `createdAt` / `updatedAt` / `deletedAt` nullable TEXT holding UTC ISO-8601
strings. The table SHALL be created by a 4th committed migration; the items SHALL survive app
restart, process kill, and JS-cache clear.

#### Scenario: The schema matches the Flutter toMap() verbatim

- **WHEN** a checklist item is written
- **THEN** the row carries `uuid`, `eventUid`, `content`, `isChecked`, `order`, `createdAt`,
  `updatedAt`, `deletedAt` with the same names and types as the Flutter `toMap()`
- **AND** an importer can write a recovered `toMap()`-shaped record (including a non-null
  `deletedAt`) as a row with no value parsing that could corrupt or drop data

#### Scenario: The dates are canonical UTC ISO-8601 TEXT

- **WHEN** an item with a `createdAt` / `updatedAt` is persisted
- **THEN** the date columns hold canonical UTC ISO-8601 strings (normalized via the mappers'
  `toISOString()`), and a null date is stored and read back as null/undefined

#### Scenario: The items survive a restart

- **WHEN** checklist items are added and the app is then restarted or relaunched
- **THEN** the items are still present, in their persisted `order`, read back from the durable
  SQLite table

#### Scenario: The data layer is the only place touching the @/db seam for this table

- **WHEN** the checklist repository, mappers, or hooks run
- **THEN** they touch `@/db` (`checklistItems` + the operators) only within the
  `event-checklists/data/` sublayer, and no `ui/` component, route, or another feature imports
  `expo-sqlite` / `drizzle-orm` directly

### Requirement: The eventUid is a soft reference (no FK) so a checklist survives a sync drop+replace

The `eventUid` column SHALL be a **soft reference** with **no foreign-key constraint** to either
`personal_events.uid` or `calendar_events.uid`. Because the calendar-sync `replaceAll` drops and
re-inserts the `calendar_events` rows each sync (with the same uids), a checklist keyed on a synced
event's uid SHALL survive that drop+replace unaffected. A `eventUid` that no longer resolves to any
event SHALL be harmless (its items are simply unreachable), with no cascade and no orphan-cleanup
required.

#### Scenario: A synced event's checklist survives a sync

- **WHEN** a checklist exists for a synced event and a calendar sync drops+replaces the
  `calendar_events` table (re-inserting the same event uid)
- **THEN** the checklist items remain in `checklist_items` and read back joined on the unchanged
  event uid

#### Scenario: No FK cascade on a dropped event

- **WHEN** an event no longer resolves (a calendar removed, a row absent)
- **THEN** the checklist read for that uid simply returns its items (or none) and nothing throws or
  cascade-deletes

### Requirement: Delete is a hard delete; the read filters by eventUid and orders by order, with NO deletedAt filter

The app SHALL match the verified Flutter behavior: deleting a checklist item SHALL **hard-delete**
the row (a SQLite `DELETE`), NOT set `deletedAt`. The read (`findByEvent(eventUid)` /
`useChecklist(eventUid)`) SHALL filter by `eventUid` equality and sort by `order` ascending, with
**no `deletedAt IS NULL` filter** (Flutter has none — `deletedAt` is a vestigial wire-format field
kept only for importer round-trip fidelity). After a delete, the remaining items' `order` SHALL be
re-numbered (1-based, contiguous) in a single transaction.

#### Scenario: Delete removes the row

- **WHEN** an item is deleted
- **THEN** the row is removed from `checklist_items` (a hard DELETE) and the read no longer returns
  it

#### Scenario: The read does not filter on deletedAt

- **WHEN** the checklist for an event is read
- **THEN** items are returned by `eventUid` ordered by `order` ascending, with no `deletedAt`
  filter, matching Flutter `findAllByEventUid`

#### Scenario: Remaining items are re-numbered after a delete

- **WHEN** an item is deleted from the middle of a list
- **THEN** the remaining items are re-numbered `1..n` (contiguous, 1-based) in one transaction

### Requirement: Add, toggle-checked, edit content, reorder, and delete checklist items, with a single write path

The app SHALL provide repository writes — `add`, `setContent`, `setChecked`, `reorder`, `remove` —
as the single write path for `checklist_items`. `add` SHALL insert a blank item with the next
1-based `order` (`current count + 1`), a freshly generated `uuid`, `content = ""`, `isChecked =
false`, and `createdAt`/`updatedAt = now`. `setContent` / `setChecked` SHALL UPDATE the one column
plus `updatedAt`. `reorder` SHALL re-number every item's `order` (1-based) and write them in ONE
`db.transaction` (atomic — a crash mid-reorder never leaves duplicate or gap orders). `remove` SHALL
hard-delete then trigger a re-number of the remainder.

#### Scenario: Add appends a blank 1-based item

- **WHEN** `add` runs for an event with N items
- **THEN** a new blank item is inserted with `order = N + 1` and a generated uuid, and the read
  returns it last

#### Scenario: Toggle and edit update one column

- **WHEN** `setChecked(uuid, true)` or `setContent(uuid, text)` runs
- **THEN** the single column is updated, `updatedAt` is stamped, and the reactive read re-renders

#### Scenario: Reorder is atomic

- **WHEN** `reorder(items)` runs with a new ordering
- **THEN** all items are re-numbered `1..n` and written in one transaction (either all commit or
  none)

### Requirement: The checklist read is reactive, ordered, and total

The reactive read `useChecklist(eventUid)` SHALL be a live query over the `@/db` seam
(`useLiveQuery`) filtered by `eventUid` and ordered by `order` ascending, mapping rows to the domain
type via the pure mappers. A write (add / toggle / edit / reorder / delete) SHALL re-render
consumers automatically. An event with no items SHALL read as the empty checklist (never a throw).

#### Scenario: A write re-renders the list

- **WHEN** an item is added, toggled, edited, reordered, or removed
- **THEN** `useChecklist` re-renders the consuming UI to reflect the change

#### Scenario: An empty checklist reads as empty

- **WHEN** an event has no checklist items
- **THEN** the read returns an empty ordered list and the UI shows the empty state, not a crash

### Requirement: A uid is generated through a single swappable wrapper that the importer bypasses

A locally-created checklist item SHALL get its `uuid` from a single `newId()` wrapper over the
platform CSPRNG (`expo-crypto` `randomUUID`) — the one import site, swappable. The Phase-09 importer
SHALL bypass the generator by supplying its own recovered `uuid` to the insert (the `uuid` is the
identity in both the Flutter store and the wire format).

#### Scenario: A new item gets a generated uuid

- **WHEN** a new checklist item is added locally
- **THEN** its `uuid` comes from the `newId()` wrapper (a v4 UUID), the single uid import site

#### Scenario: The importer supplies its own uuid

- **WHEN** the importer writes a recovered item
- **THEN** it passes the recovered `uuid` directly to the insert, bypassing `newId()`

### Requirement: The interactive checklist is surfaced on the event-details screen for both event kinds, with add / toggle / edit / reorder / delete and auto-focus-new-item

The app SHALL render an interactive checklist section on the event-details screen for BOTH a synced
and a personal event (keyed on the event uid). The section SHALL offer: an **add** control (appends a
blank item), a **checkbox** per item (toggle `isChecked`, exposing a checkbox role + checked state),
an inline editable **content** field per item, **reorder** controls per item, and a **remove** control
per item. On adding an item the new item's content field SHALL **auto-focus** (Flutter parity). Every
control SHALL carry a translated accessible label and a ≥44pt/48dp touch target; the list SHALL show
an accessible empty state.

#### Scenario: Add and auto-focus

- **WHEN** the user taps the add control
- **THEN** a new blank item appears at the end and its content field receives focus

#### Scenario: Toggle a checkbox

- **WHEN** the user toggles an item's checkbox
- **THEN** `isChecked` is persisted, the checkbox exposes the new checked state to assistive tech,
  and the item re-renders

#### Scenario: Edit content

- **WHEN** the user edits an item's content field
- **THEN** the new content is persisted (the single write path)

#### Scenario: Reorder an item

- **WHEN** the user moves an item up or down
- **THEN** the items are re-numbered and persisted, and the list re-renders in the new order

#### Scenario: Remove an item

- **WHEN** the user removes an item
- **THEN** the row is hard-deleted, the remainder re-numbered, and the list re-renders without it

#### Scenario: Empty checklist state

- **WHEN** an event has no items
- **THEN** the section shows an accessible empty state and the add control

### Requirement: A failed checklist write is recorded; a read is infallible

A failure of a checklist write (insert / update / reorder / delete) SHALL be reported through the
`@/firebase` `recordError(error, "event-checklists/<action>")` seam (a crash-worthy local-persistence
failure — the data is irreplaceable, no server backup) AND surfaced as an accessible failure state.
A checklist read SHALL be total/infallible (an empty/absent result is the empty checklist) and SHALL
NOT be recorded.

#### Scenario: A write failure is recorded and surfaced

- **WHEN** an add / toggle / edit / reorder / delete write throws
- **THEN** the error is reported through `@/firebase` `recordError` with an `event-checklists/<action>`
  tag and an accessible failure state is shown

#### Scenario: A read does not record

- **WHEN** the checklist read returns empty (no items)
- **THEN** no error is recorded and the empty state renders

### Requirement: The checklist data layer is verified by automated tests under the coverage gate

The `event-checklists/data/` layer SHALL be covered by automated tests under the K-3 90% logic gate:
the mappers (round-trip, canonical-UTC, null/bool, importer-fidelity verbatim), the repository (each
function's Drizzle query shape — the ordered read, the insert, the column update, the transactional
re-number, the hard delete), the actions hook (the 1-based order computation, the
`recordError`-on-throw path, the remove-then-renumber path, move-up/down), the **write-then-read-back**
contract, and a **restart-simulation** (a fresh repository module reads items back through a stateful
`@/db` fake) including the **survives-a-sync-replaceAll** property. The presentational checklist
component SHALL meet the 70% floor.

#### Scenario: The data layer meets the coverage threshold

- **WHEN** `npm test -- --coverage` runs in `mobile/`
- **THEN** `event-checklists/data/**` clears the 90% gate and the suite is green

#### Scenario: The write/read-back and restart contract is proven

- **WHEN** the test writes items and a fresh repository module reads them back through a stateful
  `@/db` fake
- **THEN** the items return in `order`, proving the round-trip and restart-survival, including survival
  across a simulated `calendar_events` `replaceAll`

### Requirement: No new dependency, native, or schema-toolchain change beyond the 4th table

The change SHALL add NO new npm dependency, NO `app.config.ts` / babel / native change, and NO
EAS-fingerprint bump. The only `@/db` seam change SHALL be re-exporting the `checklistItems` table and
the `asc` operator; `expo-crypto` (already a dependency) backs `newId()`.

#### Scenario: The fingerprint is unchanged

- **WHEN** the change lands
- **THEN** no native module is added, the `@/db` seam adds only `checklistItems` + `asc`, and the EAS
  runtime fingerprint does not change (the 4th SQLite table rides the existing seam)

