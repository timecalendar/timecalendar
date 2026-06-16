# Design — Event checklists (Phase 05 Ship B)

## Context

Phase 05 Ship B lands the **edit half** of event details that Phase 04 deferred: the
interactive per-event **checklist** (Flutter `event_details` checklist). It is the **4th
real Drizzle table** (`checklist_items`, after `personal_events`, `user_calendars`,
`calendar_events`) and a **Phase-09 importer target** with **no server backup** — losing a
checklist item is permanent, so the schema mirrors the Flutter `ChecklistItem.toMap()` wire
format **verbatim** and every write is correct and tested (the ADR-011/018/021 posture).

**The Flutter source, read precisely (not guessed):**

- `models/checklist_item.dart` — `ChecklistItem { uuid, eventUid, content, isChecked, order,
  createdAt, updatedAt, deletedAt }`. `toMap()` emits exactly those keys; the three dates are
  `DateTime?.toIso8601String()` (nullable); `order` is an `int`; `isChecked` a `bool`. `uuid`
  defaults to `Uuid().v4()` in the constructor when absent.
- `repositories/checklist_item_repository.dart` — store `checklist_items`, record key = `uuid`
  (`_store.record(item.uuid).put`). `insert` stamps `createdAt`+`updatedAt = now`; `update`
  stamps `updatedAt = now`; `updateAll` is a **transaction** of puts (the reorder write).
  `findAllByEventUid` = `Filter.equals('eventUid', eventUid)` sorted by `order` asc.
  **`delete` = `_store.delete(_db, finder: Filter.byKey(uuid))` — a HARD delete.**
- `providers/checklist_item_provider.dart` — the controller: `addItem` (a blank item with
  `order = state.length + 1`, optimistic state then `insert`), `editItem` (content/check change
  → `update`), `removeItem` (drop from state → `delete` → re-number via `updateItemOrders` →
  recount), `reorderItems` (move in the list → `updateItemOrders`), `updateItemOrders` (set each
  `order = i + 1` then a single transactional `updateAll`). `order` is **1-based**.
- `widgets/event_details_checklist*.dart` — a `SliverReorderableList` of rows (checkbox + inline
  `TextField` + a × remove button) + an "Ajouter une note" add button; reorder via long-press
  drag; **auto-focus** the newest item (`useChecklistAutoFocus` + `ChecklistFocusController`).
- `models/event_interface.dart` — `EventInterface { uid, title, …, userCalendarId, kind }`,
  implemented by **both** `CalendarEvent` (synced) and the personal event. **Both kinds open the
  same `EventDetailsScreen`** (verified — `planning_view_layout.dart` / `today_events.dart` /
  `horizontal_event_item.dart` push `EventDetailsScreen` with any `EventInterface`), and that
  screen always renders the checklist. The checklist is keyed on `event.uid` for **both** kinds.

**The RN state Phase 04 left:** the read-only `event-details-screen.tsx` builds an
`EventDetails` only from a synced `calendar_events` row (`useEventDetails`/`getByUid`); the
tap-routing helper `calendar/data/routes.ts` `eventRoute(uid, userCalendarId)` sends a **synced**
event to `/event-details/<uid>` and a **personal** event (no `userCalendarId`) straight to its
`/personal-event-form?uid=<uid>` edit form. So personal events have **no details surface** today,
and the details screen has **no checklist**. This ship fixes both.

## Goals / Non-Goals

**Goals.**
- A 4th Drizzle table `checklist_items` mirroring the Flutter `toMap()` verbatim (importer
  fidelity) + a 4th committed migration; the runner applies all four, `migrate.test.ts` green.
- A `data/` layer (mappers + repository + uid wrapper + reactive `useChecklist` + an actions
  hook) at 90% coverage, with write/read-back + a restart-simulation against a stateful `@/db`
  fake (the user_calendars/calendar_events precedent).
- The interactive checklist UI (add / toggle / edit content / reorder / delete + auto-focus-new)
  on a **unified** event-details screen serving BOTH personal and synced events.
- Crash-worthy-write observability (`recordError`) + an accessible failure surface.
- i18n flat typed FR+EN parity; a11y (checkbox roles+state, touchable labels ≥44pt, accessible
  reorder, live regions, heading roles); native-default surfaces (R-3).

**Non-Goals.**
- **No soft-delete read filter** — the Flutter delete is hard (see D1/D2); we match it. The
  `deletedAt` column exists for verbatim importer fidelity only.
- **No drag-reorder native dependency** (D5 — move-up/down, zero dep).
- **No checklist count badge on the calendar/agenda/home tiles** (the Flutter
  `event_nb_checklist_items_provider` powers a badge) — deferred (the tiles ship unchanged; a
  badge is a later cosmetic pass — recorded debt, no importer/data risk).
- **No checklist on the calendar grid/agenda tile inline** — the checklist lives on the details
  screen only (Flutter parity).
- **No change to the personal-event create/edit/delete form** beyond relocating its entry point
  one tap (the form, its route, and `usePersonalEvents` are untouched).

## Decisions

### D1 — The schema: a 4th table `checklist_items`, mirroring the Flutter `toMap()` VERBATIM (the ADR-011/018/021 posture). The planner DECIDES the columns below; recorded as ADR 024.

```
checklistItems = sqliteTable("checklist_items", {
  uuid:      text("uuid").primaryKey(),                                 // sembast record key = identity
  eventUid:  text("event_uid").notNull(),                              // SOFT ref to the event uid (NO FK)
  content:   text("content").notNull(),                                // verbatim
  isChecked: integer("is_checked", { mode: "boolean" }).notNull(),     // SQLite has no bool → 0/1
  order:     integer("order").notNull(),                               // 1-based int (Flutter)
  createdAt: text("created_at"),                                       // nullable UTC ISO-8601 (DateTime?)
  updatedAt: text("updated_at"),                                       // nullable UTC ISO-8601 (DateTime?)
  deletedAt: text("deleted_at"),                                       // nullable UTC ISO-8601 (DateTime?)
})
```

- `uuid` PK = the sembast record key (`_store.record(item.uuid).put`) and the upsert/replace
  identity — not a surrogate (the uuid IS the identity, like `personal_events.uid`).
- `eventUid` is a **SOFT reference, NO FK** — exactly like `calendar_events.userCalendarId`. A
  checklist may outlive a sync's `replaceAll` drop+replace of its `calendar_events` row (the row
  is re-inserted next sync with the same uid), so a hard FK would either cascade-delete the
  checklist on every sync (data loss!) or block the drop. The soft ref is mandatory for survival
  across sync; a dangling `eventUid` after a real deletion is harmless (the items are simply
  unreachable — the same posture `calendar_events.userCalendarId` takes). It is the **join key
  for BOTH kinds** (it equals a `personal_events.uid` or a `calendar_events.uid`).
- `content`/`isChecked`/`order` verbatim. `order` is a 1-based INTEGER (Flutter sets `length + 1`
  on add and re-numbers `i + 1` on reorder) — stored as a plain int, the read sorts on it.
- `createdAt`/`updatedAt`/`deletedAt` TEXT, **nullable** (the Flutter model's three dates are
  `DateTime?` — `fromMap` parses null through). UTC ISO-8601 per ADR 011/D4 (TEXT over epoch-ms
  for importer round-trip fidelity); canonicality guaranteed by the mappers' `toISOString()`.
- **Importer fidelity property:** a `toMap()`-shaped record imports with **zero value
  transformation** — `uuid`/`eventUid`/`content` verbatim, `isChecked` bool→0/1, `order` int
  verbatim, the three dates already canonical UTC ISO from Flutter (and `deletedAt` may be
  non-null — the importer must round-trip it, which is exactly why the column exists).

*Rejected:* `integer({ mode: "timestamp_ms" })` dates (lossy importer parse — the ADR-011 risk);
a hard FK on `eventUid` (cascade-deletes the checklist on every sync drop+replace — data loss; or
blocks the drop — D1); a surrogate auto-increment PK (breaks importer key fidelity + the
`onConflictDoUpdate`/`record(uuid).put` identity); MMKV (this is relational, multi-row,
per-event-filtered, ordered — the same call ADR 018/021 made; the opposite of ADR 023's flat-blob
hidden set).

### D2 — Delete is a HARD delete, NOT soft-delete — matching the verified Flutter behavior; the read filters by `eventUid` only.

The task brief asserted "soft-delete is load-bearing — `deletedAt` is SET, the row is NOT
removed." **Reading the actual Flutter code disproves this.** The repository's `delete` is
`_store.delete(_db, finder: Filter.byKey(uuid))` — a hard removal — and `deletedAt` is **never
set and never filtered on** anywhere (`findAllByEventUid` filters by `eventUid` + sorts by
`order`; the controller's `removeItem` calls `delete` then re-numbers). `deletedAt` is a
vestigial wire-format field. So:

- **`remove(uuid)`** is a hard `db.delete(checklistItems).where(eq(uuid))` (Flutter parity).
- **`findByEvent(eventUid)`** = `where(eq(checklistItems.eventUid, eventUid))` ordered
  `asc(checklistItems.order)` — **no `deletedAt IS NULL` filter** (Flutter has none).
- The `deletedAt` **column is kept** for verbatim importer fidelity (an imported sembast record
  may legitimately carry a non-null `deletedAt`; the importer round-trips it with no
  transformation), but the app neither sets nor reads it. **Recorded so a reviewer does not add a
  soft-delete filter "for correctness" — that would diverge from Flutter and silently change
  which items render.**

This is the "confirm against Flutter whether delete is truly soft" check the brief mandated,
resolved against the code. If a future product decision *wants* soft-delete (undo, trash), it is
a deliberate divergence with its own ADR — not a silent default here.

### D3 — Feature placement: a new SHARED `src/features/event-checklists/` folder.

The checklist is consumed by **both** the calendar details screen and the personal-events flow
(both kinds get a checklist). Three options:

- **(a) A new `src/features/event-checklists/` feature folder** (`data/` + `ui/`) — CHOSEN. The
  checklist concern is independent of *which* event owns it (it joins on a uid that is either a
  `personal_events.uid` or a `calendar_events.uid`). A single feature folder owns the data layer
  once; the details screen (in `calendar/ui/`) imports the checklist `ui/` component + its
  `data/` hook by full `@/` path — a `data → data` / `ui → ui` cross-feature read, the legitimate
  edge the sync orchestrator + home selectors already use (B-1..B-4 govern it; the checklist's
  `data/` is the only `@/db` import site for `checklist_items`).
- **(b) A `calendar/data/checklist/` sub-module** — rejected: it scopes the checklist to the
  calendar feature, but personal events also need it, forcing a cross-feature import *into* the
  calendar feature from personal-events (or duplicating). Named-for-the-concern (a) is cleaner.
- **(c) Split into `calendar` + `personal-events` copies** — rejected (duplication; two write
  paths to the same irreplaceable table — a fidelity-risk multiplier).

The `event-checklists` `data/` layer mirrors the `user_calendars`/`calendar_events` `data/` shape
exactly: `types.ts` (the `ChecklistItem` domain type + pure `rowToChecklistItem`/
`checklistItemToRow` mappers normalizing to canonical UTC), `repository.ts` (the async functions),
`id.ts` (`newId()` over `expo-crypto`, the importer bypasses it), `hooks.ts` (`useChecklist` +
`useChecklistActions`), `index.ts`.

### D4 — THE surfacing decision (load-bearing, ADR 024): a UNIFIED event-details screen for BOTH kinds; personal-event tap routes there; the personal-event edit form is reached via an "Edit" header action.

**Scope is BOTH personal and synced events** (Flutter parity — both `EventInterface` open the
same screen with a checklist). Phase 04 routes them apart: synced → `/event-details/[uid]`,
personal → `/personal-event-form?uid=<uid>`. To put a checklist on **both**, the planner weighs:

- **(a) Add a checklist section to the personal-event EDIT FORM** (keep the two routes split) —
  rejected. It duplicates the checklist UI across two screens (the details screen for synced, the
  form for personal), bloats the form (which is a create/edit surface, not a view surface), and
  diverges from Flutter's single-screen model. Two mount sites for the same irreplaceable write
  path doubles the test surface and the fidelity risk.
- **(b) UNIFY: one event-details screen serves BOTH kinds; the checklist ships once there** —
  CHOSEN. This matches Flutter (`EventInterface` → one `EventDetailsScreen`) and the
  read-only-details Phase-04 work already built most of the screen. Concretely:
  - The rich read `calendar/data/event-details.ts` `useEventDetails(uid)` is **widened** to
    resolve **either** a `calendar_events` row (synced) **or** a `personal_events` row
    (personal) for the uid, returning a discriminated `EventDetails` (a `kind: "synced" |
    "personal"` tag; the personal branch fills `groupColor = color`, `type` n/a, empty
    tags/teachers, `userCalendarId` empty — it carries only what a personal event has). The
    screen renders the shared title/date/lines/footer for both and the checklist for both.
  - **`eventRoute(uid, userCalendarId)`** (`calendar/data/routes.ts`, the single tap-routing
    discriminator both the grid, agenda, and home call) is changed to return
    `/event-details/<uid>` for **both** kinds — a **one-helper change** that flips every tap
    site at once (the seam was built for exactly this).
  - The **personal-event edit form stays fully reachable**: the unified details screen shows an
    **"Edit" header action for a personal event** (`kind === "personal"`) that pushes
    `/personal-event-form?uid=<uid>` — so create lives on the `/personal-events` list's Add
    action (unchanged) and edit/delete live one tap into the details screen (the same
    relocate-don't-drop posture as ADR 022's Home-IA change). For a **synced** event the header
    action stays the **hide/un-hide** action Ship A added (synced-only) — the two header actions
    are origin-keyed, exactly like the body.
- **(c) Scope checklists to synced-only** — rejected explicitly. Flutter gives personal events a
  checklist too; silently dropping it is a parity regression. The brief forbids scoping
  synced-only without recording the divergence — we do not take it.

**Why this is ADR-worthy (R-4):** it changes the routing/IA of an established, shipped surface
(every event tap), it is consumed by every calendar view + home, and it is costly to reverse (it
moves the personal-event entry point). It rides the events-source seam's single discriminator, so
the blast radius is one helper + one widened read + one screen — but the *decision* (unify vs.
bolt-onto-form vs. synced-only) is load-bearing and recorded.

### D5 — Reorder: accessible move-up / move-down controls, ZERO new dependency (not a drag library).

Flutter reorders via long-press drag (`SliverReorderableList`). The RN-native-idiomatic options:

- **A drag-and-drop reorder library** (`react-native-draggable-flatlist`, `react-native-reorderable-list`)
  — rejected: each is a **native dep** (Reanimated/gesture-handler bindings) that bumps the EAS
  fingerprint (ADR 006) for a bounded list (a handful of checklist items), and drag reorder is a
  notoriously poor screen-reader experience. R-2 (no speculative native dep) + the fingerprint
  cost rule (ADR 021/agenda's FlashList posture) say no until the item count earns it.
- **Move-up / move-down controls** (two small accessible buttons per row, disabled at the ends) —
  CHOSEN. **Zero dependency**, pure-JS, fully accessible (each a translated `button` with a ≥44pt
  target), trivially testable, and correct for the bounded item count. The reorder write is the
  same `reorder` repository call (a transactional re-number, Flutter `updateItemOrders` parity).
- A bare RN-core `<ScrollView>` long-press drag hand-rolled on Reanimated — rejected (re-pays the
  drag-a11y problem for no gain over move-up/down at this list size).

**Recorded revisit trigger:** if the checklist list grows long enough that move-up/down is
tedious AND a designer wants drag, swap a drag library behind the unchanged checklist component
(the list-interaction is an internal detail of one file) — the same FlashList-swap posture the
agenda ship recorded.

### D6 — Auto-focus the newly-added item (Flutter parity), implemented natively.

Flutter's `addItem` appends a blank item and `useChecklistAutoFocus` focuses its `TextField` ~50ms
later. RN: the `ui/event-checklist.tsx` component holds a `ref` to the just-added row's `TextInput`
and calls `.focus()` after the add resolves (the new item is the last in the ordered list). The
add → insert → reactive `useLiveQuery` re-render → focus-last sequence mirrors Flutter's
optimistic-add-then-focus. Implemented in the component (lint can't know which input to focus — it
is authorial intent, like the heading-role contract).

### D7 — The write path + the order computation.

The repository functions (a module of async functions, no class — R-2, mirroring the other `data/`
layers):

- **`add(eventUid, order)`** — insert a blank item: `{ uuid: newId(), eventUid, content: "",
  isChecked: false, order, createdAt: now, updatedAt: now, deletedAt: null }`. `order` is
  computed by the actions hook as `currentItems.length + 1` (1-based, Flutter parity). Returns the
  new uuid (so the UI can focus it).
- **`setContent(uuid, content)`** / **`setChecked(uuid, isChecked)`** — an UPDATE of the one
  column + `updatedAt = now` (Flutter `editItem` → `update` stamps `updatedAt`).
- **`reorder(items)`** — takes the items in their new order; re-numbers each `order = i + 1` and
  writes them in **one `db.transaction`** (Flutter `updateItemOrders` → `updateAll`'s transaction)
  — atomic so a crash mid-reorder never leaves duplicate/gap orders.
- **`remove(uuid)`** — a hard DELETE (D2); the actions hook then calls `reorder(remaining)` to
  re-number (Flutter `removeItem` → `delete` → `updateItemOrders`).

The actions hook `useChecklistActions(eventUid)` wraps each repository write in a try/catch that
records a failure through `@/firebase` `recordError(error, "event-checklists/<action>")` and
exposes a `failed` flag (D8). The reactive read `useChecklist(eventUid)` (over `useLiveQuery`,
ordered) feeds both the list and the order computation — a write re-renders it automatically.

### D8 — Observability: a write is crash-worthy (`recordError`); a read is total/infallible.

A failed checklist write (insert / update / reorder / delete) is a **crash-worthy
local-persistence failure** — the data is irreplaceable (no server backup), so a silently-lost
"bring the lab coat" note is a real defect. Each repository write through the actions hook records
through `@/firebase` `recordError(error, "event-checklists/<action>")` AND surfaces an accessible
failure state (a polite live region + alert role). A checklist **read** is total/infallible (a
reactive `useLiveQuery`, ordered; an empty result is the empty checklist, never a throw) and is
NOT recorded. This is the `calendar_events` `replaceAll`-write posture (ADR 021/D6 — write
recorded, read not), now applied to per-item writes.

### D9 — No new ADR beyond 024; no new dependency / native / lint change.

ADR 024 records both load-bearing calls (the schema/storage/hard-delete finding + the
unified-details-surface surfacing). Everything else is execution of landed patterns: the 4th-table
data layer is the `user_calendars`/`calendar_events` shape; the migration is the
`drizzle-kit generate` flow; `expo-crypto`'s `newId()` is already wired; the screen is the
Phase-04 details screen widened; the routing is one `eventRoute` helper. **No new dependency, no
`app.config.ts`/babel/native change, no EAS-fingerprint bump, no new lint rule** (rides the
existing feature-boundary B-1..B-4 / no-hardcoded-strings / a11y / import-order / coverage gates;
the `@/db` seam adds only the `asc` operator re-export + the `checklistItems` table).

## Risks / Trade-offs

- **The unified-details routing change touches every event tap** (grid, agenda, home). Mitigated
  by it being a one-helper change (`eventRoute`) + the existing tap-routing tests asserting the
  new destination; the personal-event edit/delete stays reachable via the Edit action (proven in
  the screen test). Deep-link shift (expected): a personal event's tap now lands on
  `/event-details/<uid>` not `/personal-event-form?uid=<uid>`; both routes stay valid (the form is
  still deep-linkable + reached via Edit).
- **`eventUid` soft ref + sync drop+replace.** A synced event's `calendar_events` row is dropped
  and re-inserted (same uid) every sync; the checklist (keyed on that uid) survives because there
  is no FK cascade. Verified by the design (D1) and a test asserting a checklist read by a uid
  survives a simulated `replaceAll`. The on-disk reality is the on-device pass.
- **Auto-focus timing** is a runtime UX detail CI can assert only at the wiring level (the new
  item's input receives focus); the real keyboard-raise feel is the on-device pass.
- **Hard-delete-not-soft is a finding that contradicts the brief.** Mitigated by recording it
  loudly (proposal + D2 + ADR 024) so it is a deliberate, reviewed parity choice, not an accident.
- **No checklist-count badge on tiles** (deferred) — a cosmetic parity gap, recorded; no data risk.

## Migration Plan

Additive — a new table + a new feature folder + a widened read + a routing-helper change. Rollback
is a plain revert: drop the `event-checklists/` folder, revert `event-details.ts`/the screen/the
`eventRoute` helper, remove the `checklist_items` table from `schema.ts`/`@/db`, and the 4th
migration (a fresh DB simply lacks the table until the migration re-runs; the prior three tables
are untouched). No destructive change, no data transform.

## Open Questions

- **None blocking.** The hard-delete finding, the unified-surface decision, the reorder approach,
  and the `eventUid` soft-ref are all resolved above. The checklist-count badge on tiles and a
  future drag-reorder are recorded deferrals with triggers.
