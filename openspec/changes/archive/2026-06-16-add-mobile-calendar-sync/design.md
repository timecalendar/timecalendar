## Context

Phase 04 item 3. The calendar feature already renders through a single events-source
seam, `useCalendarEvents(range): CalendarEvent[]` in
`mobile/src/features/calendar/data/events.ts`, which today returns
`denseWeekFixture()` merged with the personal-events read, range-filtered. The domain
`CalendarEvent` (`data/types.ts`) was **deliberately designed against the eventual
sync model** — its `allDay`/`teachers`/`tags`/`canceled`/`userCalendarId` fields mirror
the Flutter `calendar_event.toDbMap()` wire format precisely so this ship's
`calendar_events` table maps onto it "without a shape change to any consumer"
(`calendar.md`). The day/week timeline (`ui/calendar-screen.tsx`) and the agenda view
(`ui/agenda-list.tsx`) both read the seam and **must not change**.

Phase 03 made the subscription tokens durable: `user_calendars`
(`mobile/src/features/calendar-sources/data/user-calendars/`, ADR 018), with a reactive
`useUserCalendars()` hook and a `findAll()` repository read. Those tokens are the input
to sync.

The server contract is already committed: `useCalendarSyncControllerSyncCalendars`
(`POST /calendars/sync`, `SyncCalendarsDto { tokens: string[] }` →
`CalendarWithContent[]` = `{ calendar: CalendarForPublic, events: CalendarEventForPublic[] }[]`)
over the single `customFetch` mutator. The `CalendarEventForPublic` DTO carries `type`
(EventTypeEnum), `color`, `groupColor`, `uid`, `title`, `startsAt`, `endsAt`,
`location` (nullable), `allDay`, `description` (nullable), `teachers: string[]`,
`tags: EventTag[]`, `fields: CalendarEventCustomFields | null`, `exportedAt`.

The Flutter sync flow (`calendar_sync_service.dart` + `calendar_event_repository.dart`,
read for parity): load `user_calendars` → if empty return → batch `syncCalendars(tokens)`
→ `calendarsWithContent.map(c => c.events.map(e => CalendarEvent.fromApi(e, userCalendarId: c.calendar.id))).expand()` →
`putCalendarEvents`: `_store.drop()` then `addAll(events.map(toDbMap))` → read back, sort
by `startsAt` → views filter client-side. Triggers: startup, pull-to-refresh, after
calendar creation. Offline: a failed fetch leaves the last-good rows (drop runs only
after a successful fetch).

## Goals / Non-Goals

**Goals**
- A durable `calendar_events` table + migration, importer-fidelity verbatim (ADR 011/018
  posture), with the first JSON-array/object columns.
- A `calendar/data/sync/` layer: pure mappers, a transactional drop+replace, a range
  read, a reactive read hook, and a sync orchestrator over `customFetch`.
- Swap `useCalendarEvents(range)` to source synced rows (+ personal events) behind the
  unchanged seam; the consumers (timeline + agenda) are untouched.
- Sync triggers at startup + pull-to-refresh; an accessible recoverable error surface.
- A new ADR 021; the Book updated; the 90/70 coverage split honored; `migrate.test.ts`
  still green across all three migrations.

**Non-Goals**
- No event-details / tap target (Phase 04 item 4 — the agenda/timeline tiles stay
  `accessibilityRole="text"`, no `onPress`).
- No home today-grid (item 5), no weekends toggle / persisted view preference, no
  calendar visibility filtering UI (`visible` exists on `user_calendars`; wiring a
  hide-toggle is a later ship — sync still respects it only when a UI sets it).
- No incremental/delta sync, no per-calendar partial sync, no sync-logs/activity module
  (Flutter's `calendarLogsProvider` refresh is explicitly out of scope — it is the
  `activity` module, a separate Phase 04 partial).
- No offline **write** queue (sync is read-into-cache only).
- No persisted-query (TanStack) entry — **sync is a mutation, not a persisted read**
  (ADR 013 persists only the schools/groups reads; the durable cache here is SQLite).
- No FlashList swap (the agenda's recorded perf trigger) — owned here only as a noted
  on-device perf-pass check, not a code change unless it janks.

## Decisions

### D1 — The `calendar_events` schema mirrors `toDbMap()`/`CalendarEventForPublic` verbatim (ADR 021)

`calendarEvents = sqliteTable("calendar_events", …)` (the sembast store name verbatim):
- `uid` TEXT primaryKey — the sembast record key and upsert/replace identity (the uid IS
  the identity, like `personal_events.uid`).
- `title` TEXT notNull.
- `color` / `groupColor` TEXT notNull — `#RRGGBB` hex strings verbatim (ADR 011/D3:
  zero-transformation TEXT, the importer writes the `colorToHex` output unchanged).
- `startsAt` / `endsAt` / `exportedAt` TEXT notNull — UTC ISO-8601 strings (ADR 011/D4:
  TEXT over epoch-ms for importer fidelity AND because canonical UTC ISO sorts
  lexicographically = chronologically, so `findInRange` range-filters on plain TEXT
  columns). Canonicality is guaranteed by the mappers' `toISOString()`.
- `location` / `description` TEXT nullable (null↔undefined at the mapper edge).
- `allDay` `integer({ mode: "boolean" }).notNull()` (SQLite has no boolean — mirrors
  `user_calendars.visible`).
- `teachers` / `tags` / `fields` TEXT (JSON-encoded — see D2). `fields` is **nullable**
  (the DTO's `fields: CalendarEventCustomFields | null`); `teachers`/`tags` are notNull
  (the DTO always provides arrays, possibly empty).
- `exportedAt` — above.
- `type` TEXT notNull — the `EventTypeEnum` value (`cm`/`td`/`tp`/`tp2`/`project`/`exam`/
  `class`). **Stored as a plain TEXT string, not a Drizzle enum** (importer fidelity:
  store the DTO value verbatim; an unknown future server value must round-trip, not
  throw — a Drizzle `enum` check would reject it). The domain type narrows it to the
  union with an `EventType` cast at the mapper edge.
- `userCalendarId` TEXT notNull — the parent `user_calendars.id` (attached during the
  flatten, mirroring Flutter `fromApi(e, userCalendarId: c.calendar.id)`). **No FK
  constraint** — a soft reference (drop+replace clears events independently of the
  calendar table; a dangling id after a calendar removal is harmless and the next sync
  reconciles). Defaulting to `""` is the Flutter backward-compat behavior; we instead
  always supply the real parent id (the DTO always carries it), so notNull is sound.

**Importer-fidelity property:** a `toDbMap()`-shaped record imports with near-zero value
transformation — `uid`/`title`/`color`/`groupColor`/`type`/`userCalendarId` verbatim,
the three date strings already canonical UTC from Flutter, `location`/`description`
null-preserving, `allDay` bool→0/1, `teachers`/`tags`/`fields` already JSON-shaped (the
Flutter `toDbMap` emits the same nested maps/lists we JSON-encode).

*Note on `type` vs. Flutter `toDbMap()`:* the Flutter `CalendarEvent.toDbMap()` does
**not** persist `type` (the field isn't on the Flutter model). We store `type` from the
DTO because it is load-bearing for richer rendering parity (Flutter resolves event
styling/icons from `type` upstream) and is cheap to carry. The Phase-09 importer's
sembast rows lack `type`, so the importer supplies a safe default (`class`) for recovered
rows — recorded in the ADR so it is not flagged as a fidelity gap.

### D2 — JSON-array/object columns (teachers/tags/fields) as TEXT-mode JSON with pure mappers (ADR 021)

`teachers: string[]`, `tags: EventTag[] ({name,color,icon})`, and
`fields: CalendarEventCustomFields | null ({canceled?,shortDescription?,subject?,
groupColor?})` are the **first non-scalar columns** in the store. Two backend options
weighed:
- **(a) Drizzle `text({ mode: "json" })`** — Drizzle JSON-encodes on write / parses on
  read automatically.
- **(b) plain `text()` + explicit JSON encode/decode in the pure mappers.**

**Choice: (b) plain TEXT + explicit mapper encode/decode.** Reasons: (1) the mappers
already own the row↔domain boundary (the place ADR 011/018 isolate storage format), so
the JSON shape stays one tested seam, not split between Drizzle's runtime and our
mappers; (2) importer fidelity — the importer writes the exact JSON string we control,
no dependence on Drizzle's serializer version; (3) a corrupt/legacy/unparseable JSON
value must **not throw** the whole list read — the mapper decodes defensively (a parse
failure → safe default `[]` / `null` / `{}`, total-read posture mirroring the stores'
defensive parsers), which a `mode: "json"` column cannot do (it throws). The decode is a
pure, exhaustively-tested function. The encode normalizes to a canonical JSON string
(`JSON.stringify` of the structured value).

The domain `CalendarEvent` already exposes `teachers: string[]`, `tags: string[]`,
`canceled: boolean` (the existing seam shape). **The domain `tags` stays `string[]`**
(the display surface uses tag names) — the mapper decodes the full `EventTag[]` from the
column and projects to `tags.map(t => t.name)` for the domain (the rich tag objects stay
in the row for importer fidelity; the domain exposes what consumers render). `canceled`
is derived from `fields?.canceled ?? false`. `groupColor`/`type`/`description`/`allDay`
already exist or are carried. **No `CalendarEvent` shape change** — the new data fills
the already-present fields; the swap is invisible to consumers.

### D3 — `calendar/data/sync/` sub-module: mappers, transactional drop+replace, range read, reactive read

A new sublayer `mobile/src/features/calendar/data/sync/` (mirroring
`calendar-sources/data/user-calendars/`):
- **`types.ts`** — `CalendarEventRow` aliases; pure `rowToCalendarEvent` /
  `calendarEventToRow` (canonical UTC, JSON encode/decode via D2, null↔undefined,
  boolean) and `fromCalendarEventDto(dto, userCalendarId)` (the **only** generated-DTO
  import in the layer, B-1; mirrors Flutter `fromApi`). These map to the **existing
  `CalendarEvent`** domain type from `../types` (sibling sub-barrel import).
- **`repository.ts`** — `findInRange(from, to): Promise<CalendarEvent[]>` (a
  `where(and(lte(startsAt, to.toISOString()), gte(endsAt, from.toISOString())))` overlap
  query — `gte`/`lte`/`and` already re-exported from `@/db`), and
  `replaceAll(events: CalendarEvent[]): Promise<void>`. **`replaceAll` is
  transactional**: `db.transaction(async (tx) => { await tx.delete(calendarEvents);
  for-batch insert })` — the drop+replace must be **atomic** so a crash mid-replace
  never leaves a half-empty table (a half-empty `calendar_events` would silently lose a
  user's timetable until the next successful sync). Bulk insert in chunks (SQLite's
  variable limit — chunk to ~500 rows) inside the one transaction.
- **`hooks.ts`** — `useSyncedEvents(range): CalendarEvent[]` over the seam's
  `useLiveQuery` (reactive: a `replaceAll` re-renders the views). It reads the live rows
  and range-filters + maps in a `useMemo` (the live query reads the whole small table;
  range filtering in JS keeps the reactive subscription simple and matches the views'
  bounded windows). The repository's `findInRange` is the non-reactive read used by tests
  and any future imperative caller.
- **`index.ts`** — the sub-barrel.

### D4 — `useSyncCalendars()` orchestrator over `customFetch`; the seam swap

`mobile/src/features/calendar/data/sync/sync.ts` — `useSyncCalendars()`:
- Wraps the committed `useCalendarSyncControllerSyncCalendars` mutation (the **only**
  generated-hook import site, B-1) over the single `customFetch` mutator.
- Reads the durable tokens via the existing user-calendars `findAll()` repository read
  (imported by its full `@/features/calendar-sources/data/user-calendars` barrel path —
  a cross-feature `data`→`data` read of the durable identity store; the calendar feature
  is the legitimate consumer of the held tokens). If empty → no-op (Flutter parity).
- Calls the BATCH mutation once with `{ tokens }`, flattens
  `result.flatMap(c => c.events.map(e => fromCalendarEventDto(e, c.calendar.id)))`,
  and `replaceAll(events)`.
- Owns its own `{ sync(), isSyncing, isError, reset }` state across the full
  fetch→map→replaceAll chain (mirroring `useAddCalendar`). A failure rejects/sets
  `isError` — the **drop+replace is only reached after a successful fetch**, so a failed
  fetch leaves the last-good rows intact (offline-safe by construction).

Then **`events.ts` swaps the source**: `useCalendarEvents(range)` returns
`useSyncedEvents(range)` merged with `usePersonalEvents()` (mapped `PersonalEvent →
CalendarEvent`), range-filtered — same signature, same shape. The dense-week fixture is
**no longer merged at runtime**; `denseWeekFixture` stays exported for tests/dev only
(see D7). The merge keeps personal events (device-local, not synced) alongside synced
events — the user's own events and their timetable in one view (Flutter parity: both
`EventKind`s render together).

### D5 — Sync triggers: startup (fire-and-forget) + pull-to-refresh

- **Startup:** a fire-and-forget sync kicked at app start, mirroring `void
  runMigrations()` / `import "@/i18n"` in `src/app/_layout.tsx`. Because
  `useSyncCalendars` is a hook (it wires the generated mutation), the trigger is a small
  `useStartupSync()` effect mounted once in the root layout (or in the calendar screen's
  first mount) that fires `void sync()` once. A failed startup sync is silent at startup
  (offline launch shows last-good rows) — the **visible** error surface is on the
  user-initiated pull-to-refresh.
- **Pull-to-refresh:** the calendar screen wires a `RefreshControl` (the agenda
  `SectionList` and a scroll wrapper) calling `sync()`, showing an accessible refreshing
  state, and on failure an accessible sync-error + retry (a polite live region + a
  retry control — mirroring school-selection's read-error posture). The screen stays
  presentational: it calls the `data/` hook, holds no fetch logic.

### D6 — Observability ➖ N/A for sync failure (recoverable UI state, not a crash)

A sync failure is **recoverable** — the last-good rows still render and the user can
retry. It is **not** crash-worthy, so it is **NOT** `recordError`'d (mirroring the
school-selection read path: a failed server read is an `isError` UI state, not a thrown
crash). This is the deliberate contrast with personal-events/user-calendars **writes**
(✅ recordError) — those are local persistence failures with no recovery surface; a sync
fetch failure is a transient network condition with a built-in retry. **One exception
recorded:** if `replaceAll`'s **transaction** itself throws (a local SQLite write
failure, not a network failure) that IS a crash-worthy local-persistence failure and is
`recordError`'d — distinguishing "the network failed" (recoverable, silent-record) from
"the database write failed" (crash-worthy). The orchestrator separates the two: a
mutation rejection → `isError` only; a `replaceAll` throw → `recordError` + `isError`.

### D7 — The dense-week fixture becomes dev/test-only

The fixture's runtime job (give the empty calendar something to render) is over — synced
+ personal events are the source. `denseWeekFixture` stays exported from `data/index.ts`
for: (a) the existing primitive/screen tests, and (b) optional `__DEV__` seeding. It is
**removed from the default `useCalendarEvents` merge**. Not deleted — it is the
overlap-engine's worst-case test anchor and the Maestro fixture-render fallback (D9).

### D8 — A new ADR 021

The `calendar_events` storage schema (verbatim mirror, TEXT-ISO dates, JSON columns) +
the drop+replace sync strategy + the recoverable-error observability split are
load-bearing (importer fidelity for Phase 09; the drop+replace and JSON-column
reasoning are reused by any later sync surface) → ADR 021 (R-4), mirroring ADR 018's
rigor and explicitly building on ADR 011/018. The JSON-column-as-defensive-mapper
decision (D2) is the genuinely new wrinkle vs. ADR 011/018 and is the ADR's distinct
contribution.

## Risks / Trade-offs

- **Drop+replace atomicity.** A non-transactional drop+insert that crashes mid-way loses
  the timetable. Mitigated by D3's `db.transaction`. CI proves the transaction is used
  (the mock asserts delete-then-insert inside one `transaction` callback); on-disk
  atomicity is the on-device manual proof.
- **No FK / soft `userCalendarId`.** A removed calendar leaves dangling event rows until
  the next sync's drop+replace clears them. Accepted — drop+replace reconciles fully each
  sync; a hard FK would complicate the importer and the independent drop.
- **JSON-column parse robustness.** A future server tag shape change could break decode;
  D2's defensive decode degrades to a safe default rather than throwing the whole read.
- **Performance at scale.** Synced timetables can be hundreds–thousands of events over a
  long horizon vs. the fixture's dozens. The agenda's recorded `SectionList`→FlashList
  trigger and `findInRange`/`useLiveQuery` cost are an **on-device perf-pass** item (the
  ADR 019 low-end-Android gate is extended to name real synced data); no code change
  unless it janks. The reactive `useLiveQuery` reads the whole table — fine at current
  scale; pagination is the recorded later trigger.
- **Startup sync on first launch with no calendars** is a no-op (empty tokens) — no
  spurious network call.

## Migration Plan

Additive. A third migration creates `calendar_events`; a fresh DB lacks it until the
migration runs (the runner applies all three at next launch). Rollback is a plain revert
(the table goes unread; no destructive change to the prior two tables). The committed
bundle is fresh-clone-no-codegen. `migrate.test.ts` asserts the runner applies the
committed bundle (now three migrations) unchanged.

## Open Questions

- **Does the e2e server seed a calendar with events reachable by a token + deep link?**
  Resolved in tasks: inspect `ci/` seed; if a seeded `user_calendars` token + synced
  events are reachable, the Maestro flow asserts a synced event renders (ideally
  offline-after-sync); if not, keep the fixture/dev-seed render + reachability assertion
  and record the limitation (no new seeding work this ship — that is its own infra
  change). Defaulting to the latter unless the seed already exists.
