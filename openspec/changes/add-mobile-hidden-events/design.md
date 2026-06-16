# Design — Hidden events (Phase 05 Ship A)

## Context

The Flutter `hidden_event` module (read for parity —
`app/lib/modules/hidden_event/` + `event_details/widgets/event_details_hidden_dialog.dart`
+ `event_details/widgets/event_details_header.dart` + `calendar/providers/events_provider.dart`):

- **Model (`models/hidden_event.dart`):** `HiddenEvent { BuiltList<String> uidHiddenEvents;
  BuiltList<String> namedHiddenEvents }`. `toMap()` → `{ 'uidHiddenEvents': [...],
  'namedHiddenEvents': [...] }`; `fromMap` reads those two keys.
- **Repository (`repositories/hidden_event_repository.dart`):** sembast store
  `hidden_events`, a **single record** (`_store.find()` → `records[0]`), absent → an
  empty `HiddenEvent`. `setHiddenEvents` runs a `transaction` that **deletes then adds**
  the one record (drop+replace of a single record).
- **Notifier (`providers/hidden_event_provider.dart`):** `addUidEvent` / `addNamedEvent`
  append to the respective list and save; `removeUidEventByIndex` / `removeNamedEventByIndex`
  remove by index and save.
- **Filter (`calendar/providers/events_provider.dart` `EventsForViewNotifier`):** over the
  **combined** events list, keep an event iff
  `!uidHiddenEvents.contains(event.uid) && !namedHiddenEvents.contains(event.title)`
  (and a separate `userCalendar.visible` check — out of scope, no calendar-visibility
  feature in RN yet).
- **Hide action (`event_details_header.dart`):** the overflow menu offers **"Masquer"
  only for `EventKind.Calendar`** (synced) events; personal events get Modifier/Supprimer.
  Selecting it opens `HiddenOptionsDialog` — a radio with **"Masquer cet événement"**
  (`addUidEvent(event.uid)`) vs **"Masquer tous les événements de même nom"**
  (`addNamedEvent(event.title)`).
- **Management (`screens/hidden_events_screen.dart` + `widgets/hidden_event_item.dart`):**
  lists the named-hidden titles (a "Groupe d'événements masqués" section) and the
  uid-hidden events **that still resolve to an existing event** (resolved by `event.uid`
  against the events list), each with an un-hide (delete-icon) control; empty → "Aucun
  événement masqué".

The RN app already has every seam this needs: the `@/storage` MMKV seam (with the
school-selection `groupValues` JSON-array-over-one-key precedent), the single
events-source seam `useCalendarEvents(range)` (`calendar/data/events.ts`, designed to
absorb a filter/source change behind an unchanged signature — it already merges synced +
personal and range-filters), the read-only event-details screen + its rich
`useEventDetails(uid)` read (`EventDetails` carries `id` = uid, `title`, and
`userCalendarId`), the `@/firebase` `recordError` seam, and the route-structure +
feature-boundary conventions.

## Goals / Non-Goals

**Goals:**

- Full Flutter `hidden_event` parity: hide a **synced** event by uid (this instance) or
  by name (all of the same title); persist the set durably; filter hidden events out of
  every view; un-hide from a reachable surface.
- **Importer fidelity (irreplaceable data):** the persisted shape mirrors the Flutter
  `toMap()` `{ uidHiddenEvents, namedHiddenEvents }` **verbatim**, so the Phase-09 one-shot
  importer can write the recovered blob with **zero value transformation**.
- Every write path correct and **tested** (write/read-back + a restart-simulation), exactly
  the posture of the `user_calendars` (Phase 03) and `calendar_events` (Phase 04) ships.
- A failed write is a crash-worthy local-persistence failure → `@/firebase` `recordError`
  + an accessible failure surface; the filter read is total/infallible.

**Non-Goals:**

- **No per-calendar visibility filter** (the Flutter `userCalendar.visible` half of the
  filter) — no calendar-visibility feature exists in RN yet; it is its own later ship.
- **No hiding of personal events from the action** — Flutter offers "Masquer" only for
  `EventKind.Calendar`; we match it. (The *filter* still applies to the merged list, so a
  hidden *name* incidentally hiding a same-titled personal event is Flutter-parity behavior,
  D4.)
- **No Drizzle table / migration** (D1) — MMKV-backed; the `@/db` seam is untouched.
- **No new dependency, no `app.config.ts`/babel/native change.**
- **No checklist / no calendar-visibility / no edit of synced events** (sibling deferred
  features).

## Decisions

### D1 — Storage backend: MMKV (`@/storage`), NOT Drizzle/SQLite. The planner's ADR call (ADR 023).

The app owns two persistence seams (`@/storage` MMKV, `@/db` Drizzle). `user_calendars`
(ADR 018) deliberately weighed MMKV and chose Drizzle because that data is **relational,
multi-row, queried, upserted-by-key**. The hidden set is the **opposite shape**, and the
call is recorded as an ADR with the same rigor (ADR 023):

**The Flutter wire format is a single flat record of two string lists** —
`{ uidHiddenEvents: String[], namedHiddenEvents: String[] }` — stored as **one** sembast
record, drop+replaced as a unit, default-empty when absent. There is **no key, no row, no
range query, no join, no upsert-by-id** — it is read whole, filtered against in memory, and
written whole. This is exactly the **flat, single-value, non-relational** shape ADR 018
itself names as MMKV's domain (and what the school-selection `groupValues` —
`string[]` JSON-encoded over one MMKV key — already does). Three forces decide it:

- **It is a single flat blob, not relational.** MMKV stores the JSON-encoded record under
  **one** key; the entire "store" is read into memory in one synchronous call and filtered
  against (the filter is `Set.has`, in memory, per render). Drizzle would mean a table, a
  migration, a schema, a repository, and a `useLiveQuery` — relational machinery for a value
  that is never queried relationally. That is the over-built path R-2 forbids.
- **Importer fidelity is preserved either way.** The MMKV blob the importer writes is the
  JSON-encoded `{ uidHiddenEvents, namedHiddenEvents }` — **byte-identical** to the Flutter
  `toMap()` shape. The Phase-09 importer writes the recovered record as the value of the one
  key with **zero transformation** (it does NOT go through `hideByUid`/`hideByName` — it sets
  the whole blob, the `newId()`-bypass analog). A Drizzle table would force the importer to
  fan the two recovered lists out into rows (or into one row of two JSON columns), MORE
  transformation, not less, for no fidelity gain.
- **Synchronous, no migration story needed.** MMKV is synchronous (JSI/Nitro), so the read
  is inline (no loading gate, mirroring the Flutter synchronous-feel notifier); the store
  needs no migration, no committed bundle, no `migrate.test.ts` change.

*Rejected — Drizzle/SQLite:* a flat two-list blob is not relational identity; a table +
migration + repository + reactive query is relational machinery for a value read-whole /
written-whole / filtered-in-memory. The "consistency with the other importer tables"
argument is real but outweighed — the importer's fidelity contract is "write the recovered
value verbatim," which MMKV satisfies more directly (one blob) than a table (fan-out). The
ADR-018 MMKV rejection was specific to a *queried, upserted, multi-row* set; this is none of
those.

*Rejected — two separate MMKV keys (`hiddenEvents.uids` + `hiddenEvents.names`):* the
Flutter wire format is ONE record `{ uidHiddenEvents, namedHiddenEvents }`. Splitting into
two keys diverges from the importer's single-blob shape and adds a two-write atomicity
question for no gain. One key holding the JSON record matches `toMap()` exactly.

### D2 — The `data/` store: a total defensive parser, one imperative write path, a reactive read.

`src/features/hidden-events/data/`:

- **`types.ts`** — the domain `HiddenEventsSet { uidHiddenEvents: string[];
  namedHiddenEvents: string[] }`, the flat key `HIDDEN_EVENTS_KEYS.set = "hiddenEvents.set"`,
  the **total** `parseHiddenEvents(raw: string | undefined): HiddenEventsSet` (unset /
  non-JSON / wrong-shape / non-string-array → the empty set `{ uidHiddenEvents: [],
  namedHiddenEvents: [] }`, **never throws** — mirroring `parseGroupValues`), and
  `encodeHiddenEvents(set): string` (`JSON.stringify`). The encode preserves the exact
  `{ uidHiddenEvents, namedHiddenEvents }` key order/shape (importer-fidelity verbatim).
- **`store.ts`** — pure imperative get/set over `@/storage` (`getString`/`setString`,
  mirroring `settings/prefs/store.ts` and `school-selection/store/store.ts`):
  `getHiddenEvents()` (read + parse), and the four mutators
  `hideByUid(uid)` / `hideByName(name)` / `unhideUid(uid)` / `unhideName(name)` — each
  reads the current set, produces the next set (append-if-absent / filter-out, **dedup**:
  hiding an already-hidden uid is a no-op, matching set semantics — Flutter `.add` allows
  dupes, but a Set is the correct RN model and the filter is membership so dupes are
  invisible; we dedup on write to keep the blob clean), and writes the whole encoded blob.
  **The write is the failure surface** (D5): each mutator may throw if `setString` fails;
  the caller (the UI hook) catches and records.
- **`hooks.ts`** — `useHiddenEvents(): HiddenEventsSet`, the reactive read over the seam's
  `useStoredString(HIDDEN_EVENTS_KEYS.set)` + `parseHiddenEvents` (mirroring
  `useSelectedSchool`), so the calendar views and the management screen re-render when the
  set changes. Plus `useHideActions()` returning the four mutators wrapped with the
  `recordError` + failure-state handling (D5) — the one place the UI calls writes.
- **`index.ts`** — the data sub-barrel; `src/features/hidden-events/index.ts` — the feature
  barrel (no self-cycle, B-2).

`data/` is the **only** place touching `@/storage` (B-1). The store is pure logic →
**90%-gated**; the parser, the four mutators (append/dedup/remove), and the encode are the
testable surface.

### D3 — Feature placement: a new `src/features/hidden-events/` folder (NOT grown into calendar / calendar-sources).

Hidden events is its **own concern** with its own persistence (a distinct MMKV blob), its
own management screen, and its own importer target — the same independence `personal-events`,
`school-selection`, and `calendar-sources` have. Growing it into `calendar/` would conflate a
cross-cutting hide/un-hide store with the calendar *rendering* feature; growing it into
`calendar-sources/` (the calendar-token store) is unrelated (that owns subscription identity,
not per-event hiding). A new `src/features/hidden-events/` folder (`data/` + `ui/`) matches
the ADR-014 layered pattern and keeps the seam edges clean: the **calendar feature** reads
`useHiddenEvents()` from `@/features/hidden-events` (a cross-feature `data → data` read by
full `@/` path — the legitimate edge the sync orchestrator and home selectors already use),
and the **event-details screen** calls the hide actions through the same barrel.

### D4 — Filtering at the single events-source seam, applied to the MERGED list; the hide ACTION gated to synced events.

The filter lives in `useCalendarEvents(range)` (`calendar/data/events.ts`) — the one seam
every view (day/week/agenda + home) reads, designed to absorb exactly this with **no
consumer change**. It reads `useHiddenEvents()`, builds a `uidSet` and a `nameSet`, and
filters the **merged** (synced + personal) list **before** the range filter, keeping an event
iff `!uidSet.has(event.id) && !nameSet.has(event.title)` — Flutter parity
(`EventsForViewNotifier` filters the combined list). The membership is over `event.id` (the
uid — `CalendarEvent.id` is `uid` for synced and the personal uid for personal events) and
`event.title`.

**The merged-list filter is deliberate Flutter parity:** a hidden *name* will also hide a
same-titled **personal** event (because Flutter filters the combined list too). This is
correct — but the hide *action* (the dialog) is offered **only for synced events** (D6),
exactly like Flutter offers "Masquer" only for `EventKind.Calendar`. So a user never hides a
personal event *deliberately*; a same-name collision is the documented parity behavior.

The seam read of `useHiddenEvents()` is the calendar feature's first import of
`@/features/hidden-events` — a `data → data` cross-feature edge (allowed; the same legitimate
pattern `home/data/selectors.ts` uses to read `@/features/calendar/data`).

### D5 — Observability: a write is crash-worthy (`recordError`); a read is total/infallible.

A failed hidden-set **write** (a `setString` failure inside `hideByUid`/`hideByName`/
`unhideUid`/`unhideName`) is a **crash-worthy local-persistence failure** — the user's
intent (hide / un-hide) did not persist and there is no server backup — so it records through
`@/firebase` `recordError(error, "hidden-events/<action>")` AND surfaces an accessible
failure state (a polite live region / `alert`), mirroring the personal-events write and the
calendar-sync `replaceAll` posture. The **filter read** is **total/infallible**: a corrupt /
absent blob parses to the empty set (D2), so a view never throws because of the hidden store —
it just renders everything (the safe default).

### D6 — The hide / un-hide action on the read-only event-details screen.

The event-details screen (`calendar/ui/event-details-screen.tsx`) gains a **header overflow
menu**, offered **only for a synced event** (one carrying a `userCalendarId` — the
`EventDetails.userCalendarId` is always set for a synced row; the screen is reached for synced
events via `/event-details/<uid>`, while personal events route to their edit form, so in
practice this screen is synced-only, but the guard is explicit). The menu's content depends on
whether the viewed event is **currently hidden** (read via `useHiddenEvents()`):

- **Not hidden:** a "Hide event" action opening a native-default surface (an
  `Alert`/action-sheet-style chooser, R-3 — no Material dialog port) with the two radio-style
  options — **"Hide this event"** (`hideByUid(event.id)`) and **"Hide all events of the same
  name"** (`hideByName(event.title)`) — each a translated, accessible choice. After a
  successful hide the screen pops back (Flutter pops twice — dialog + details).
- **Currently hidden** (the viewed event's uid is in the uid set, OR its title is in the named
  set — a deep link to a hidden event still resolves the row): an **"Un-hide"** action
  (`unhideUid(event.id)` and/or `unhideName(event.title)` for whichever set contains it) — so
  the details screen is **never a one-way trap**.

The menu is a thin presentational addition; the write goes through `useHideActions()` (D5).
The screen stays under the 70% UI floor; the screen test proves the menu→action wiring and the
synced-only gating.

### D7 — A hidden-events management screen ships in THIS change (un-hide must be reachable).

Hide-by-name has **no per-event details surface** to un-hide from (a named-hidden recurring
class may have many or zero current instances), so a management surface is **required parity**,
not a follow-up. `ui/hidden-events-screen.tsx` (presentational, 70% floor) reads
`useHiddenEvents()` + the synced events (`useSyncedEvents()` from `calendar/data` — to resolve
each uid to a title, Flutter `_buildDisplayItems`), and renders:

- a **named-hidden** section (each title with an un-hide control → `unhideName`),
- a **uid-hidden** section (each uid resolved to its current synced event's title + time;
  Flutter only lists uid-hidden events that **still resolve** to an existing event — we match
  that, so a uid with no current event is not orphaned in the list), each with an un-hide
  control → `unhideUid`,
- an accessible **empty state** when nothing is hidden.

A thin route `src/app/hidden-events.tsx` (a `<Stack.Screen>` sibling of `(tabs)`, deep-linkable
`timecalendar-dev://hidden-events`) re-exports it through the `ui/` sub-barrel; a Profile-tab
entry link reaches it (mirroring the `/settings`, `/personal-events`, `/calendar` siblings).

### D8 — No new ADR beyond 023; no lint/dependency/native change.

The only load-bearing, reversible, cross-feature decision is the **storage backend** (D1) →
**ADR 023**. The filter-at-the-seam, the synced-only hide gating, the new feature folder, and
the management screen are *executions of* existing patterns (ADRs 014/021 + the events-source
seam design + the route-structure rule), not new reversible patterns. The change rides the
existing feature-boundary B-1..B-4 / no-hardcoded-strings / a11y / coverage gates — no new lint
rule, no new dependency, no `app.config.ts`/babel/native change, no Drizzle schema/migration.

## Risks / Trade-offs

- **[A same-name hide incidentally hides a personal event]** → This is **Flutter-parity**
  (the filter runs over the combined list). Documented in D4 + the spec; the hide *action* is
  synced-only so it is never a *deliberate* personal-event hide. Mitigation if it ever
  surprises users: scope the name filter to synced events — a one-line change behind the
  unchanged seam (recorded revisit on ADR 023).
- **[A failed write silently loses the user's hide intent]** → recorded through `recordError`
  + an accessible failure surface (D5); the user sees the action did not take and can retry.
- **[Importer fidelity drift]** → the MMKV blob is the verbatim `{ uidHiddenEvents,
  namedHiddenEvents }` JSON; the parser/encoder round-trip and verbatim-shape are CI-tested
  (write/read-back + restart-simulation), so a regression that reshapes the blob fails the
  suite, not the importer.
- **[A hidden event is unreachable to un-hide]** → mitigated by the management screen (D7) +
  the details-screen un-hide (D6); both ship here, so hiding is never a one-way trap.
- **[Hidden uids accumulating for events that no longer sync]** → the management list (like
  Flutter) only shows uid-hidden events that still resolve, so stale uids don't clutter the
  UI; the blob retains them (Flutter parity — the importer round-trips them). A future GC pass
  is recorded debt, not this ship.

## Migration Plan

Additive and MMKV-only — no Drizzle migration, no schema change, no native change. A fresh
install reads the empty default (no `hiddenEvents.set` key). Rollback is a plain revert: the
feature folder + the route + the seam filter line + the details-screen action are removed; the
`hiddenEvents.set` MMKV key simply goes unread (no destructive change).

## Open Questions

None blocking. The personal-event same-name collision (D4) is resolved as Flutter parity with
a recorded revisit; the per-calendar `visible` filter is an explicit Non-Goal (its own later
ship).
