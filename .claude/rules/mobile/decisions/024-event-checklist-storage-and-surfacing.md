# 024 — Event-checklist storage & surfacing: a verbatim `checklist_items` table (TEXT-ISO-UTC, soft-ref `eventUid`, HARD delete — `deletedAt` vestigial-but-kept), accessible move-up/down reorder, and a UNIFIED event-details screen for both event kinds

> Origin: the `add-mobile-event-checklists` change (Phase 05 Ship B — Event
> checklists), design D1/D2/D4/D5. Records the load-bearing storage + surfacing
> decisions for the durable `checklist_items` table — the 4th real Drizzle table and a
> Phase-09 importer target with **no server backup**. The schema + verified properties
> live in `mobile/src/db/schema.ts` and the Architecture Book "Storage → Checklist items
> store"; the surfacing wiring in "Features → Calendar → Event details". **Builds directly
> on ADR [011](./011-personal-event-storage.md)** (TEXT-ISO-UTC dates + verbatim + importer
> fidelity), **ADR [021](./021-calendar-event-storage-and-sync.md)** (a soft-ref `userCalendarId`
> with no FK, the recordError-write vs. isError-read observability split), and **ADR
> [022](./022-home-ia-today-view.md)** (the relocate-don't-drop entry-point posture). It
> reuses that rigor and adds the calls those didn't face — the hard-delete finding and the
> unified-both-kinds details surface.

## Status

Accepted.

## Context

Phase 05 Ship B lands the **edit half** of event details that Phase 04 deferred: the
interactive per-event **checklist** (Flutter `event_details` checklist). It is the **4th
real Drizzle table** (`checklist_items`, after `personal_events`, `user_calendars`,
`calendar_events`) and an importer target with **no server backup** — a lost checklist note
is permanent, so the schema mirrors the Flutter `ChecklistItem.toMap()` wire format
**verbatim** and every write is tested (the ADR-011/018/021 posture).

**The Flutter source, read precisely (not guessed):**
`models/checklist_item.dart` — `ChecklistItem { uuid, eventUid, content, isChecked, order,
createdAt, updatedAt, deletedAt }`; `toMap()` emits exactly those keys; the three dates are
`DateTime?.toIso8601String()` (nullable); `order` is an `int`; `uuid` defaults to a v4 UUID.
`repositories/checklist_item_repository.dart` — store `checklist_items`, record key = `uuid`;
`findAllByEventUid` filters `eventUid` + sorts by `order` asc; `updateAll` is a transactional
batch (the reorder write); **`delete` is `_store.delete(finder: Filter.byKey(uuid))` — a HARD
delete.** `providers/checklist_item_provider.dart` — `order` is 1-based (`length + 1` on add,
`i + 1` on reorder); add/edit/remove/reorder each write through the repository. The widgets
render a reorderable list (checkbox + inline text field + × remove) + an "add note" button +
**auto-focus** of the newest item. `models/event_interface.dart` — `EventInterface { uid, …,
userCalendarId, kind }` is implemented by **both** synced and personal events, and **both kinds
open the same `EventDetailsScreen`** with the same checklist (verified — the calendar/agenda/home
push `EventDetailsScreen` with any `EventInterface`).

**The RN state Phase 04 left:** the read-only details screen builds an `EventDetails` only from a
synced `calendar_events` row; the tap-routing helper `calendar/data/routes.ts`
`eventRoute(uid, userCalendarId)` sends a synced event to `/event-details/<uid>` and a personal
event straight to `/personal-event-form?uid=<uid>`. So personal events have no details surface,
and the details screen has no checklist.

Four decisions are load-bearing (copied by any later per-event-child table and costly to reverse),
so they earn an ADR (R-4); two of them — the hard-delete finding and the unified-both-kinds surface
— are this ADR's distinct contributions over ADR 011/021.

## Decision

**(1) The `checklist_items` schema mirrors `toMap()` VERBATIM (the ADR-011/021 posture).**
`checklistItems = sqliteTable("checklist_items", …)`: `uuid text primaryKey` (the sembast record
key = identity, like `personal_events.uid`), `eventUid text notNull` (the join key to either
event kind), `content text notNull`, `isChecked integer({ mode: "boolean" }).notNull()` (SQLite has
no boolean → 0/1), `order integer().notNull()` (1-based, Flutter), `createdAt`/`updatedAt`/`deletedAt
text` (**nullable** — the model's three dates are `DateTime?`) holding **UTC ISO-8601 strings**
(ADR 011/D4 — TEXT over epoch-ms for importer round-trip fidelity; canonicality guaranteed by the
mappers' `toISOString()`). A `toMap()`-shaped record imports with **zero value transformation**.

**(2) `eventUid` is a SOFT reference with NO FK constraint** — exactly the
`calendar_events.userCalendarId` posture (ADR 021). A checklist must **survive the calendar-sync
`replaceAll`** that drops and re-inserts the synced event's `calendar_events` row each sync (same
uid). A hard FK would either cascade-delete the checklist on every sync (irreplaceable-data loss!)
or block the drop. The soft ref is mandatory for survival; a dangling `eventUid` after a real
deletion is harmless (its items are simply unreachable). It is the join key for **both** kinds (it
equals a `personal_events.uid` or a `calendar_events.uid`).

**(3) Delete is a HARD delete, NOT soft-delete — matching the verified Flutter behavior — and the
read does NOT filter on `deletedAt`.** The Ship-B brief asserted soft-delete was load-bearing
("`deletedAt` is SET, the row is NOT removed"). **Reading the actual Flutter code disproves it:**
the repository's `delete` hard-removes the record, and `deletedAt` is **never set and never filtered
on** anywhere (`findAllByEventUid` filters `eventUid` + sorts `order`). `deletedAt` is a vestigial
wire-format field. So `remove(uuid)` is a hard `DELETE`, and the read filters by `eventUid` ordered
by `order` with **no `deletedAt IS NULL`**. The `deletedAt` **column is kept** for verbatim importer
fidelity (an imported sembast record may carry a non-null value the importer must round-trip), but
the app neither sets nor reads it. **Recorded loudly so a reviewer does not add a soft-delete filter
"for correctness" — that would diverge from Flutter and silently change which items render.** A
future product decision wanting real soft-delete (undo/trash) is a deliberate divergence with its
own ADR, not a silent default.

**(4) A UNIFIED event-details screen serves BOTH event kinds; the personal-event tap routes there;
the edit form is reached via an Edit header action.** Scope is BOTH personal and synced events
(Flutter parity). To put a checklist on both, the rich read `useEventDetails(uid)` is **widened** to
resolve **either** a `calendar_events` row (synced) **or** a `personal_events` row (personal),
returning a discriminated `EventDetails` (a `kind` tag; the personal branch fills the sync-only
fields with safe defaults). `eventRoute(uid, userCalendarId)` (the single tap-routing discriminator
the grid, agenda, and home all call) is changed to return `/event-details/<uid>` for **both** kinds
— a one-helper flip. The personal-event **create** affordance stays the `/personal-events` list's
Add action (unchanged); **edit/delete** stays fully reachable via an **Edit** header action on the
unified details screen (`/personal-event-form?uid=<uid>`) — the relocate-don't-drop posture of ADR
022. For a synced event the header keeps the Ship-A hide/un-hide action (the two header actions are
origin-keyed, like the body).

**(5) Reorder is accessible move-up / move-down controls, ZERO new dependency** (not a drag library).
Flutter reorders via long-press drag (`SliverReorderableList`); a RN drag library
(`react-native-draggable-flatlist`/`-reorderable-list`) is a Reanimated/gesture-handler native dep
that **bumps the EAS fingerprint** (ADR 006) for a bounded list, and drag reorder is a poor
screen-reader experience. Move-up/down buttons (disabled at the ends) are zero-dep, pure-JS, fully
accessible (each a translated `button` with a ≥44pt target), testable, and correct for the bounded
item count. The reorder write is the same transactional re-number (Flutter `updateItemOrders`).

**(6) Observability: a checklist write is crash-worthy (`recordError`); a read is total** — the ADR
021/D6 split applied to per-item writes. A failed insert/update/reorder/delete records through
`@/firebase` `recordError(error, "event-checklists/<action>")` + an accessible failure surface (the
data is irreplaceable); a reactive read is total/infallible and not recorded.

*Rejected:* `integer({ mode: "timestamp_ms" })` dates (lossy importer parse — the ADR-011 risk); a
hard FK on `eventUid` (cascade-deletes the checklist on every sync drop+replace — data loss; or
blocks the drop); a surrogate auto-increment PK (breaks importer key fidelity + the `record(uuid).put`
identity); MMKV (this is relational, multi-row, per-event-filtered, ordered — the call ADR 018/021
made; the opposite of ADR 023's flat-blob); a soft-delete read filter (diverges from the verified
Flutter hard delete — decision 3); a checklist section bolted onto the personal-event edit form
(duplicates the checklist UI + the irreplaceable write path across two screens, diverges from
Flutter's single screen); scoping checklists to synced-only (a parity regression — Flutter gives
personal events a checklist); a drag-reorder native dep (fingerprint cost + a11y, decision 5).

## Consequences

- The 4th real Drizzle migration lands (`0003_*.sql` `CREATE TABLE checklist_items`, a 4th
  `_journal.json` entry, an `0003_snapshot.json`, an updated `migrations.js` importing
  `m0000`..`m0003`), committed (fresh-clone-no-codegen). The runner applies all four unchanged; the
  `migrate.test.ts` proof still passes.
- The `@/db` seam re-exports `checklistItems` + the **`asc`** operator (the only new operator — the
  ordered read; R-2). `expo-crypto`'s `newId()` is already wired (no new dependency).
- The details screen becomes write-capable (the checklist) and serves both event kinds; `eventRoute`
  flips both tap destinations at once. A personal event's tap now lands on `/event-details/<uid>`
  (deep-link shift — expected; both routes stay valid, the form reached via Edit + still
  deep-linkable). The personal-event edit/delete flow is reachable one tap into the details screen.
- A new shared `src/features/event-checklists/` folder owns the checklist `data/` once (consumed by
  the details screen by full `@/` path — the legitimate cross-feature edge B-1..B-4 govern).
- Observability ✅ — the first per-item write path that can fail records through `@/firebase`.
- CI proves the mappers (round-trip, canonical-UTC, null/bool, importer-fidelity verbatim), the
  repository query shapes (ordered read, insert, column update, transactional re-number, hard
  delete), the actions hook (1-based order, recordError-on-throw, remove-then-renumber, move-up/down),
  the write/read-back + a **restart-simulation** including **survival across a simulated
  `calendar_events` replaceAll**. On-disk SQLite survival, reorder atomicity after a mid-write kill,
  the auto-focus feel, and the manual screen-reader pass are the on-device manual pass
  (`inbox/2026-06-16-event-checklists-on-device.md`).
- No new dependency, no `app.config.ts`/babel/native change, no EAS-fingerprint bump, no new lint
  rule (rides the existing gates; the `@/db` seam adds only `checklistItems` + `asc`).
- Rollback is a plain revert (additive table; a fresh DB lacks it until the migration re-runs; no
  destructive change to the prior three tables; revert the widened read + the `eventRoute` flip).

## Revisit if

- A query or performance need genuinely requires numeric timestamps (re-weigh epoch-ms vs. the
  fidelity cost — same trigger as ADR 011/021).
- The Flutter wire format changes before the Phase-09 importer runs (re-align the columns).
- A product decision wants **real soft-delete** (undo / a trash view) — that is a deliberate
  divergence from Flutter's hard delete, with its own ADR, and would set+filter `deletedAt`.
- The checklist list grows long enough that move-up/down is tedious AND a designer wants drag — swap
  a drag library behind the unchanged checklist component (the FlashList-swap posture).
- The unified-details routing needs to split the two kinds again (a kind genuinely needs a different
  surface) — re-open decision 4.
