# 023 — Hidden-events storage: MMKV (not Drizzle), a single verbatim `{ uidHiddenEvents, namedHiddenEvents }` blob mirroring the Flutter `toMap()` for importer fidelity; filtered at the events-source seam

> Origin: the `add-mobile-hidden-events` change (Phase 05 Ship A — Hidden events),
> design D1/D4. Records the load-bearing **storage-backend** decision for the durable
> hidden-events set — an importer target with no server backup. The store shape +
> verified properties live in `mobile/src/features/hidden-events/data/` and the
> Architecture Book "Storage → Hidden events store". **Builds directly on ADR
> [018](./018-user-calendar-storage.md)** (which weighed MMKV-vs-Drizzle for a durable
> importer target and chose Drizzle for relational identity) — this ADR makes the
> *opposite* call for the *opposite shape*, reusing ADR 018's rigor and ADR 011/021's
> verbatim-importer-fidelity posture.

## Status

Accepted.

## Context

Phase 05 Ship A adds **hidden events** — hide / un-hide synced calendar events, persist
the hidden set, filter hidden events out of every view (full Flutter `hidden_event`
parity). The hidden set is part of the Phase-09 importer's **IRREPLACEABLE** set: there
is no server-side record of which events a user has hidden. Lose it on the device and the
user re-hides everything by hand. So the persisted shape MUST mirror the Flutter wire
format **verbatim** for importer fidelity, every write path must be correct and tested,
and a failed write is a crash-worthy local-persistence failure.

**The Flutter wire format — read, not guessed** (`app/lib/modules/hidden_event/`):
`models/hidden_event.dart` `HiddenEvent { BuiltList<String> uidHiddenEvents;
BuiltList<String> namedHiddenEvents }`, `toMap()` → `{ 'uidHiddenEvents': [...],
'namedHiddenEvents': [...] }`. `repositories/hidden_event_repository.dart`: sembast store
`hidden_events`, a **single record** (`_store.find()` → `records[0]`), **absent → an
empty `HiddenEvent`**; `setHiddenEvents` runs a transaction that **deletes then adds** the
one record. The notifier appends to / removes-by-index from the two lists. The filter
(`calendar/providers/events_provider.dart` `EventsForViewNotifier`) runs over the
**combined** events list: keep iff `!uidHiddenEvents.contains(event.uid) &&
!namedHiddenEvents.contains(event.title)`. The hide *action*
(`event_details/widgets/event_details_header.dart`) is offered **only for
`EventKind.Calendar`** (synced) events.

The app owns two durable seams — `@/storage` (MMKV) and `@/db` (Drizzle). `personal_events`
(ADR 011), `user_calendars` (ADR 018), and `calendar_events` (ADR 021) — all importer
targets — chose Drizzle because each is **relational, multi-row, keyed, queried**. The
hidden set is the **opposite shape**, so the backend call must be recorded with the same
rigor (R-4).

## Decision

**Persist the hidden-events set in MMKV (`@/storage`), NOT Drizzle**, as a **single
JSON-encoded record** `{ uidHiddenEvents: string[], namedHiddenEvents: string[] }` under
**one** flat key (`hiddenEvents.set`), mirroring the Flutter `toMap()` shape verbatim.

Three forces decide it:

- **It is a single flat blob, not relational.** The Flutter store is ONE record, read
  whole, written whole (drop+replace of the single record), filtered against in memory
  (`contains`). There is no key, no row, no range query, no join, no upsert-by-id. MMKV
  stores the JSON record under one key and reads it synchronously into memory; the filter
  is `Set.has` per render. This is exactly the **flat, single-value, non-relational** shape
  ADR 018 itself names as MMKV's domain — and what the school-selection `groupValues`
  (`string[]` JSON over one MMKV key) already does. Drizzle would mean a table, a migration,
  a schema, a repository, and a `useLiveQuery` — relational machinery for a value never
  queried relationally (the over-built path R-2 forbids).
- **Importer fidelity is preserved — more directly than Drizzle.** The MMKV blob the
  importer writes is the JSON-encoded `{ uidHiddenEvents, namedHiddenEvents }` —
  **byte-identical** to the Flutter `toMap()`. The Phase-09 importer sets the whole blob as
  the key's value with **zero transformation** (it bypasses the `hideByUid`/`hideByName`
  mutators — the `newId()`-bypass analog). A Drizzle table would force the importer to fan
  the two recovered lists into rows (or one row of two JSON columns) — MORE transformation,
  not less, for no fidelity gain.
- **Synchronous, no migration story.** MMKV is synchronous (JSI/Nitro), so the read is
  inline (no loading gate, mirroring Flutter's synchronous-feel notifier); the store needs
  no migration, no committed bundle, no `migrate.test.ts` change.

**The set is read TOTAL/defensively** (an unset / non-JSON / wrong-shape / non-string-array
value → the empty set, never throws — the views render everything, the safe default), with
**one imperative write path** (`hideByUid`/`hideByName`/`unhideUid`/`unhideName`, deduped)
and a reactive read (`useHiddenEvents()` over `useStoredString`) — the settings /
school-selection store posture.

**Filtering lives at the single events-source seam** (`useCalendarEvents`), applied to the
**merged** synced+personal list (Flutter parity), so every view honors hiding with no
consumer change. The hide **action** is offered **only for synced events** (Flutter parity).

*Rejected — Drizzle/SQLite:* a flat two-list blob is not relational identity; a table +
migration + repository + reactive query is relational machinery for a value read-whole /
written-whole / filtered-in-memory. "Consistency with the other importer tables" is real but
outweighed — the importer's contract is "write the recovered value verbatim," which MMKV
satisfies more directly (one blob) than a table (fan-out). ADR 018's MMKV rejection was
specific to a *queried, upserted, multi-row* set; this is none of those.

*Rejected — two separate MMKV keys (`hiddenEvents.uids` + `hiddenEvents.names`):* the
Flutter wire format is ONE record `{ uidHiddenEvents, namedHiddenEvents }`. Splitting into
two keys diverges from the importer's single-blob shape and adds a two-write atomicity
question for no gain.

*Rejected — scoping the name filter to synced events only:* the Flutter filter runs over the
combined list, so a hidden *name* can also hide a same-titled personal event. We match that
(the hide *action* stays synced-only, so it is never a deliberate personal-event hide). Made
a recorded revisit below rather than a silent divergence.

## Consequences

- The Phase-09 importer writes the recovered hidden set as a single JSON blob with **no
  value transformation** — the directest possible importer-fidelity path.
- **No Drizzle table, no migration, no `@/db` change** — the `@/db` seam and
  `migrate.test.ts` are untouched. **No new dependency, no `app.config.ts`/babel/native
  change.**
- The hidden-events feature reads `useHiddenEvents()` from a new
  `src/features/hidden-events/` folder; the calendar feature reads it by full `@/` path (a
  `data → data` cross-feature edge — the legitimate pattern the sync orchestrator + home
  selectors already use).
- A failed write is a crash-worthy local-persistence failure → `@/firebase`
  `recordError(error, "hidden-events/<action>")` + an accessible failure surface; the read
  is total/infallible (corrupt/absent → empty set, no record).
- A hidden *name* incidentally hiding a same-titled personal event is **Flutter-parity**
  behavior (the merged-list filter); the hide action is synced-only so it is never a
  deliberate personal hide.
- CI proves the parser totality, the four mutators (append/dedup/remove), the write/read-back
  contract, and a restart-simulation (a fresh store module reads back a prior write through a
  stateful in-memory `@/storage` fake) — the irreplaceable-data write rigor of the
  user_calendars / calendar_events ships. On-device restart survival is the manual pass.
- Rollback is a plain revert: the feature folder + route + the seam filter line + the
  details-screen action are removed; the `hiddenEvents.set` key goes unread (no destructive
  change).

## Revisit if

- A query or performance need genuinely makes the hidden set relational (e.g. per-calendar
  hiding, a hidden-events history, or a set large enough that the in-memory `Set.has` per
  render janks) — re-weigh Drizzle (the table the importer would then target).
- The Flutter wire format changes before the Phase-09 importer runs — re-align the blob shape.
- The same-name-hides-a-personal-event parity behavior surprises users — scope the name
  filter to synced events (a one-line change behind the unchanged events-source seam).
- A per-calendar visibility filter (the Flutter `userCalendar.visible` half of
  `EventsForViewNotifier`, out of scope this ship) lands — decide whether it shares this store
  or owns its own.
