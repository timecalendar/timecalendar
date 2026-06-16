# Event checklists: per-event interactive checklist items (add / toggle / reorder / delete, auto-focus-new), persisted durably for importer fidelity and surfaced on a unified event-details screen for BOTH personal and synced events

## Why

Phase 05 Ship B — **Event checklists**, full parity with the Flutter `event_details`
checklist (`app/lib/modules/event_details/`). A student attaches a small to-do list to a
class or a personal event ("bring the lab coat", "revise chapter 4") — `checklist_items`
in the Flutter app. This is the **edit half** of event details that Phase 04 deliberately
deferred (the read-only view shipped in `add-mobile-event-details`; see
`.claude/rules/mobile/calendar.md` "Event details (read-only)" + the deferral note
`docs/react-native-migration/inbox/2026-06-16-event-details-deferrals.md`).

`checklist_items` is part of the Phase-09 importer's **IRREPLACEABLE** set — there is **no
server backup**. Lose it on the device and the user's notes are gone forever. So the store
MUST mirror the Flutter wire format **verbatim** for importer fidelity (the
[ADR 011](../../../.claude/rules/mobile/decisions/011-personal-event-storage.md) /
[018](../../../.claude/rules/mobile/decisions/018-user-calendar-storage.md) /
[021](../../../.claude/rules/mobile/decisions/021-calendar-event-storage-and-sync.md)
posture), every write path must be correct and **tested** (write/read-back + a
restart-simulation against a stateful `@/db` fake, exactly like the `user_calendars` and
`calendar_events` ships), and a failed write is a **crash-worthy** local-persistence failure.

**The Flutter wire format, read from the code (not guessed)** —
`models/checklist_item.dart` `toMap()`/`fromMap()`,
`repositories/checklist_item_repository.dart`:

- **A sembast store `checklist_items`**, record key = `uuid` (a UUID v4 generated in the
  model constructor when absent). The wire-format map is
  `{ uuid, eventUid, content, isChecked, order, createdAt, updatedAt, deletedAt }`:
  `content` String, `isChecked` bool, `order` int (**1-based**, set to `state.length + 1`
  on add and re-numbered `i + 1` on reorder), `createdAt`/`updatedAt`/`deletedAt`
  `DateTime?.toIso8601String()` (all three **nullable** in the model).
- **`eventUid`** is the join key to **either** kind of event — `ChecklistItem` is keyed on
  `EventInterface.uid`, and `EventInterface` is implemented by **both** synced
  (`CalendarEvent`) and personal events (it exposes `userCalendarId` too). Both kinds open
  the same `EventDetailsScreen`, which always renders the checklist (verified:
  `planning_view_layout.dart` / `today_events.dart` push `EventDetailsScreen` with any
  `EventInterface`).
- **The read** (`findAllByEventUid`): `Filter.equals('eventUid', eventUid)`, sorted by
  `order` ascending. **CRITICAL FINDING — delete is a HARD delete, NOT soft-delete.**
  The repository's `delete` calls `_store.delete(_db, finder: Filter.byKey(uuid))` —
  the record is removed; `deletedAt` is **never set and never filtered on** anywhere in the
  Flutter codebase (it exists only in the model/wire map, a vestigial field). The task's
  "soft-delete is load-bearing" premise does not hold against the actual code (this is
  exactly what "confirm against Flutter whether delete is truly soft" guards against). We
  keep the `deletedAt` **column** (verbatim importer fidelity — an imported row may carry a
  non-null value the importer must round-trip) but the read filters by `eventUid` only and
  delete is a hard `DELETE`, matching Flutter. Recorded so a reviewer does not "fix" it.
- **The UX** (`event_details_checklist.dart`, `event_details_checklist_item.dart`,
  `event_details_checklist_section.dart`): a reorderable list of items, each a checkbox + an
  inline text field + a remove (×) button; an "add note" button appends a blank item;
  reorder via long-press drag (`SliverReorderableList` + `ReorderableDelayedDragStartListener`);
  **auto-focus** the newly-added item's text field (the `useChecklistAutoFocus` hook +
  `ChecklistFocusController`). On a successful add the whole row is written immediately
  (insert) and each content/check change is an update; a delete re-numbers the remaining
  items' `order` (`updateItemOrders` → a single transactional `updateAll`).

## What Changes

- **A new `src/features/event-checklists/` feature folder** (`data/` + `ui/`) — the home
  of the checklist concern (named for the concern, ADR-014 layered pattern). It is a
  **shared** feature consumed by **both** the calendar details screen and (transitively, via
  a unified details surface) the personal-events flow — a single feature folder avoids
  duplicating the checklist data layer across the calendar and personal-events features and
  keeps cross-feature imports legitimate (a `data → data` edge, the pattern the sync
  orchestrator + home selectors already use).
- **A 4th real Drizzle table `checklistItems` (SQL `checklist_items`)** mirroring the Flutter
  `toMap()` **verbatim** for importer fidelity: `uuid` TEXT primaryKey (the sembast record
  key / identity), `eventUid` TEXT notNull (**SOFT ref** to the event uid — NO FK, like
  `calendar_events.userCalendarId`; the join key for BOTH kinds), `content` TEXT notNull,
  `isChecked` `integer({ mode: "boolean" })` notNull, `order` INTEGER notNull,
  `createdAt`/`updatedAt`/`deletedAt` TEXT **nullable** UTC ISO-8601 (the ADR-011/D4
  TEXT-over-epoch posture; nullable verbatim — the model's three dates are `DateTime?`).
  **Storage-backend + schema + delete-semantics decision recorded as a new ADR** (024).
- **A 4th committed migration** via `drizzle-kit generate` (driver `expo`):
  `CREATE TABLE checklist_items …`, a 4th `meta/_journal.json` entry, an `0003_*.json`
  snapshot, and an updated `migrations.js` importing `m0000`..`m0003` — **all committed**
  (fresh-clone-no-codegen). The runner applies all four; `migrate.test.ts` stays green.
- **The `@/db` seam re-exports `checklistItems`** + the operators the repository needs
  (`eq` is already re-exported; **`asc` is added** for the ordered read — `order BY order` —
  the only new operator; R-2).
- **The full `data/` layer** mirroring the `user_calendars` / `calendar_events` shape: pure
  `rowToChecklistItem` / `checklistItemToRow` mappers normalizing dates to canonical UTC; a
  `repository.ts` of async functions (`findByEvent`, `add`, `setContent`, `setChecked`,
  `reorder`, `remove`); a `newId()` uid wrapper over `expo-crypto` (the importer bypasses
  it); a reactive `useChecklist(eventUid)` over the seam's `useLiveQuery`; and the
  controller hook `useChecklistActions(eventUid)` wrapping the repository writes with the
  observability + a stable order computation.
- **A UNIFIED event-details surface for BOTH event kinds** (the load-bearing surfacing
  decision — ADR 024): the read-only `event-details-screen.tsx` is widened to accept **both
  a synced event (a `calendar_events` row) AND a personal event** (a `personal_events` row),
  and the **personal-event tap routing is changed** to open the details screen instead of
  jumping straight to the edit form. The checklist section ships on this one screen for both
  kinds (Flutter parity — both `EventInterface` open the same screen with the same checklist).
  The personal-event **edit** affordance becomes an "Edit" header action on the details
  screen (so create/edit/delete of the personal event itself stays fully reachable — not
  dropped, relocated behind one tap). Alternatives (a checklist section bolted onto the edit
  form; checklist scoped to synced-only) are weighed and rejected in design + ADR 024.
- **The interactive checklist UI** (`ui/event-checklist.tsx`): a reorderable list of items
  (checkbox + inline `TextInput` + remove), an "add note" button, **auto-focus** the new
  item, and a native-default reorder approach. **Reorder uses move-up / move-down accessible
  controls (zero new dependency)** rather than a drag library — see design D5 (a drag-handle
  reorder lib would be a fingerprint-bumping native dep; move-up/down is pure-JS, fully
  accessible, and matches the bounded item count). Recorded as a revisit trigger.
- **Observability ✅** — a failed checklist write (insert / update / reorder / delete)
  records through `@/firebase` `recordError(error, "event-checklists/<action>")` plus an
  accessible failure surface (irreplaceable data — a lost item never comes back). The
  reactive read is total/infallible.
- **A new ADR 024** (the checklist storage/schema + hard-delete-not-soft finding + the
  unified-details-surface surfacing decision — recorded as one ADR covering both
  load-bearing calls).

## Capabilities

### New Capabilities

- `mobile-event-checklists`: attach an interactive checklist to any event (personal or
  synced) — add / toggle-checked / edit content / reorder / delete items with
  auto-focus-new-item; persist the items durably in a 4th Drizzle table mirroring the Flutter
  wire format verbatim for the Phase-09 importer; read them reactively, ordered, joined on
  the event uid; with a crash-worthy-write observability posture.

### Modified Capabilities

- `mobile-event-details`: the details screen is widened to render **both** synced and
  personal events behind one read seam, gains the interactive checklist section, and gains an
  "Edit" header action for personal events (so the personal-event edit/delete flow is reached
  from the unified surface). This is the deferred "edit half" of event details landing.
- `mobile-personal-events`: a personal-event tap now opens the unified event-details screen
  (with its checklist + an Edit action) instead of routing straight to the edit form; the
  `/personal-event-form` route, the form, and `usePersonalEvents` are unchanged (the entry
  point moved one tap, like the Home-IA relocation in ADR 022).

## Impact

- New: `mobile/src/features/event-checklists/{data,ui,index}.ts(x)` — the schema-mapper +
  repository + uid wrapper + reactive hook + actions hook + barrels; the interactive
  checklist component + its test.
- New Drizzle table + migration: `mobile/src/db/schema.ts` (`checklistItems`),
  `mobile/src/db/index.ts` (re-export `checklistItems` + `asc`),
  `mobile/src/db/migrations/0003_*.sql` + `0003_snapshot.json` + a 4th `_journal.json` entry
  + an updated `migrations.js`/`migrations.d.ts` (all committed).
- Modified: `mobile/src/features/calendar/data/event-details.ts` — the rich read is widened
  to resolve a personal event too (a `PersonalEventDetails` branch), keyed on origin; and the
  details screen `mobile/src/features/calendar/ui/event-details-screen.tsx` (the checklist
  section + the personal-event branch + the Edit header action) — and their tests.
- Modified: the tap-routing in the calendar screens + home that previously sent personal
  events to `/personal-event-form` now sends them to `/event-details/<uid>`
  (`mobile/src/features/calendar/ui/calendar-screen.tsx` / `agenda-list` press handler,
  `mobile/src/features/home/ui/home-screen.tsx`) — and their tests.
- Modified: `mobile/src/i18n/locales/{en,fr}.json` (the checklist add/empty/item/reorder/
  remove labels + the Edit action + the write-error string).
- New: `mobile/.maestro/event-checklists.yaml` (render + reachability of the checklist on a
  reachable event; the populated add/toggle round-trip is seeded-data-limited like the other
  flows — the on-device manual pass is inboxed).
- Docs: `.claude/rules/mobile/{storage.md,calendar.md,features.md,firebase.md,architecture-changelog.md}`
  + ADR 024 + the ADR README index.
- New native-affecting surface: **none.** `expo-crypto` is already a dependency (the
  `newId()` wrapper reuses it); the new SQLite table rides the existing `@/db` seam. **No new
  dependency, no `app.config.ts`/babel/native change, no EAS-fingerprint bump.**
