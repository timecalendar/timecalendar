# 021 — Calendar-event storage & sync: verbatim `calendar_events` schema (TEXT-ISO-UTC), JSON columns as TEXT with defensive mappers, a transactional drop+replace, `type` stored verbatim, and a recoverable-fetch vs. crash-worthy-write observability split

> Origin: the `add-mobile-calendar-sync` change (Phase 04 item 3 — sync + offline
> cache), design D1/D2/D3/D6/D8. Records the load-bearing storage + sync decisions
> for the durable `calendar_events` table — the third real Drizzle table and the
> second device-local sync surface. The schema + verified properties live in
> `mobile/src/db/schema.ts` and the Architecture Book "Storage → Calendar events
> store"; the sync wiring in "Features → Calendar". **Builds directly on ADR
> [011](./011-personal-event-storage.md)** (TEXT-ISO-UTC dates + verbatim color +
> importer fidelity) and **ADR [018](./018-user-calendar-storage.md)** (a Drizzle
> table mirroring a Flutter `toDbMap()` verbatim for the Phase-09 importer); this ADR
> reuses that posture and adds the decisions those two didn't face — JSON columns,
> a drop+replace sync strategy, and a network-vs-database observability split.

## Status

Accepted.

## Context

Phase 04 item 3 makes the calendar render **real synced data**. The day/week
timeline and the agenda view both read one events-source seam,
`useCalendarEvents(range)` (`calendar/data/events.ts`), which was deliberately
designed to absorb a source swap with no consumer change (`calendar.md`). This
change is that swap: the events come from `POST /calendars/sync { tokens }` over the
durable `user_calendars` subscription tokens Phase 03 made durable (ADR 018), dropped
into a new `calendar_events` table.

It is the **third real Drizzle table** (after `personal_events`, `user_calendars`)
and a **Phase-09 importer target**: the schema mirrors the Flutter
`CalendarEvent.toDbMap()` / the server `CalendarEventForPublic` DTO verbatim so the
one-shot importer can write recovered rows with no data loss. The Flutter sync flow
(`calendar_sync_service.dart` + `calendar_event_repository.dart`, read for parity):
load `user_calendars` → if empty return → batch `syncCalendars(tokens)` → flatten
`calendars.flatMap(c => c.events.map(e => fromApi(e, userCalendarId: c.calendar.id)))`
→ **DROP all `calendar_events` then insert all flattened events** → read back. Offline:
the drop runs only after a successful fetch, so a failed sync leaves the last-good rows.

Four decisions are load-bearing (copied by any later sync surface and costly to
reverse), so they earn an ADR (R-4). One — the JSON-column representation — is the
genuinely new wrinkle vs. ADR 011/018 and is this ADR's distinct contribution.

## Decision

**(D1) The `calendar_events` schema mirrors `toDbMap()`/`CalendarEventForPublic`
VERBATIM, reusing ADR 011/018's posture.** `calendarEvents =
sqliteTable("calendar_events", …)` (the sembast store name verbatim): `uid text
primaryKey` (the record key + replace identity — the uid IS the identity, like
`personal_events`), `title`/`color`/`groupColor text notNull` (`#RRGGBB` verbatim —
ADR 011/D3), `startsAt`/`endsAt`/`exportedAt text notNull` holding **UTC ISO-8601
strings** (ADR 011/D4: TEXT over epoch-ms for importer fidelity AND because canonical
UTC ISO sorts lexicographically = chronologically, so `findInRange` filters on plain
TEXT columns; canonicality guaranteed by the mappers' `toISOString()`), nullable
`location`/`description text`, `allDay integer({ mode: "boolean" }).notNull()`,
`teachers`/`tags`/`fields text` (JSON — D2; `fields` nullable, `teachers`/`tags`
notNull), `type text notNull`, `userCalendarId text notNull`.

**`type` is stored as plain TEXT VERBATIM, not a Drizzle enum** — importer fidelity
requires that an unknown future server `EventTypeEnum` value round-trip rather than
throw a constraint; the domain narrows it with a cast at the mapper edge. (The Flutter
`toDbMap()` does **not** persist `type`; we carry it from the DTO for richer rendering
parity. The Phase-09 importer's sembast rows lack `type`, so the importer supplies a
safe default (`class`) for recovered rows — recorded here so it is not flagged as a
fidelity gap.)

**`userCalendarId` is a SOFT reference, NO FK constraint** — drop+replace clears events
independently of the calendar table; a dangling id after a calendar removal is harmless
and the next sync reconciles fully. A hard FK would complicate the importer and the
independent drop.

**(D2) JSON-array/object columns (`teachers`/`tags`/`fields`) as plain TEXT with pure
defensive mappers — NOT Drizzle `text({ mode: "json" })`.** These are the first
non-scalar columns. Choice: **plain `text()` + explicit JSON encode/decode in the pure
mappers.** Reasons: (1) the mappers already own the row↔domain boundary (where ADR
011/018 isolate storage format), so the JSON shape stays one tested seam, not split
between Drizzle's runtime and our mappers; (2) importer fidelity — the importer writes
the exact JSON string we control, no dependence on Drizzle's serializer; (3) a
corrupt/legacy/unparseable JSON value must **not throw the whole list read** — the
decode degrades to a safe default (`[]` / `null`), the total-read posture the stores'
defensive parsers established, which a `mode: "json"` column **cannot** do (it throws).
The encode normalizes to a canonical `JSON.stringify`. The domain `tags` stays
`string[]` (the display surface renders tag names): the mapper decodes the full
`EventTag[]` from the row and projects to `tags.map(t => t.name)`; the rich tag objects
stay in the row for importer fidelity. `canceled` derives from `fields?.canceled ?? false`.
**No `CalendarEvent` shape change** — the new data fills already-present fields.

**(D3) The drop+replace sync strategy is TRANSACTIONAL (atomic).** `replaceAll(events)`
runs `db.transaction(async (tx) => { await tx.delete(calendarEvents); /* chunked bulk
insert */ })` — the delete-all + the chunked bulk insert (chunked under SQLite's bound-
variable limit, ~50 rows/chunk) commit or roll back as ONE unit. A crash mid-replace
must never leave a half-empty `calendar_events` (a partial table would silently lose
the user's timetable until the next successful sync). The drop is reached **only after a
successful fetch**, so a failed fetch leaves the last-good rows intact (offline-safe by
construction).

**(D4) Observability splits recoverable fetch failure from crash-worthy local write
failure (D6).** A sync **fetch** failure (network/server) is **recoverable** — the
last-good rows render and the user can retry — so it is an `isError` UI state and is
**NOT** `recordError`'d (mirroring the school-selection read path). A failure of the
local **`replaceAll` transaction** (a SQLite write failure) IS a crash-worthy local-
persistence failure and is reported through `@/firebase` `recordError(error,
"calendar/sync")` in addition to surfacing the error. The orchestrator distinguishes the
two by where the chain throws: a mutation rejection → `isError` only; a `replaceAll`
throw → `recordError` + `isError`. This is the deliberate contrast with personal-
events / user-calendars **writes** (✅ recordError — local failures with no recovery
surface) vs. the read path (➖ isError).

*Rejected:* `integer({ mode: "timestamp_ms" })` dates (lossy importer parse — the ADR-011
fidelity risk); a Drizzle `enum` for `type` (rejects an unknown future server value —
breaks round-trip); `text({ mode: "json" })` columns (throw on corrupt data, split the
JSON seam, couple to Drizzle's serializer — D2); a hard FK on `userCalendarId`
(complicates the importer + the independent drop); a non-transactional drop+insert (a
crash mid-replace loses the timetable — D3); recording a fetch failure to Crashlytics
(it is recoverable noise — D4); MMKV (this is relational, multi-row, range-queried — the
same call ADR 018 made for `user_calendars`).

## Consequences

- The Phase-09 importer can write recovered `calendar_events` rows with **no data loss
  and minimal transformation** — scalars verbatim, dates already canonical UTC, `allDay`
  bool→0/1, `teachers`/`tags`/`fields` already JSON-shaped. The importer writes rich rows
  **directly** (bypassing the domain, supplying `type` + `groupColor` + full tag objects),
  the same `newId()`-bypass posture as ADR 011/018.
- The third real migration lands (`0002_first_mauler.sql` `CREATE TABLE calendar_events`,
  a third `_journal.json` entry, an `0002_snapshot.json`, an updated `migrations.js`
  importing `m0000`/`m0001`/`m0002`), committed (fresh-clone-no-codegen). The runner
  applies all three unchanged; the `migrate.test.ts` proof still passes.
- `useCalendarEvents(range)` swaps its source to `useSyncedEvents(range)` (reactive
  `useLiveQuery`) merged with the personal-events read — same signature, same
  `CalendarEvent` shape, no consumer change. The dense-week fixture is removed from the
  default runtime merge (dev/test-only).
- Sync triggers at startup (fire-and-forget, silent on failure) + pull-to-refresh on the
  calendar screen (an accessible refreshing / sync-error + retry surface).
- A second network call shape (`POST /calendars/sync`) is added on the durable tokens;
  the failure is recoverable + retryable, not recorded.
- CI proves the mappers (round-trip, importer-fidelity verbatim, canonical-UTC, JSON
  encode/decode + **defensive decode**, null/boolean), the repository query shape + the
  **transactional drop+replace** (delete-then-insert inside one `transaction`), the DTO
  mapper, the sync wiring at the `customFetch` seam (success, no-tokens no-op,
  fetch-failure → `isError` no-record, replace-failure → `recordError`), and a
  **restart-simulation**. On-disk SQLite survival + drop+replace atomicity after a
  mid-sync kill + real-data perf are the on-device manual pass
  (`inbox/2026-06-16-calendar-sync-on-device.md`).
- Rollback is a plain revert (additive table; a fresh DB lacks it until the migration
  re-runs; no destructive change to the prior two tables).

## Revisit if

- A query or performance need genuinely requires numeric timestamps (re-weigh epoch-ms
  vs. the fidelity cost — same trigger as ADR 011/018).
- The Flutter wire format changes before the Phase-09 importer runs (re-align the columns).
- A future server tag/fields shape change breaks the defensive decode beyond a safe
  default (extend the decode, still total).
- Synced timetables grow large enough that the reactive `useLiveQuery` whole-table read
  janks or the `SectionList` needs FlashList (the recorded perf trigger — both ride the
  existing seams) — the on-device perf pass owns the call.
- Incremental/delta sync, per-calendar partial sync, or an offline write queue is
  genuinely needed (this ship is read-into-cache only via a full drop+replace).
