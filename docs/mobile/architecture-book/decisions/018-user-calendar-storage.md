# 018 — User-calendar storage: Drizzle (not MMKV), schema mirroring the Flutter `toDbMap()` verbatim, dates TEXT ISO-8601 UTC

> Origin: the `add-mobile-calendar-identity-persistence` change (Phase 3 ship 5/5,
> the load-bearing identity ship), design D1/D2/D5. Records the two load-bearing
> storage decisions for the durable `user_calendars` token store. The schema +
> verified properties live in `mobile/src/db/schema.ts` and the Architecture Book
> "Storage → User-calendar identity store". **Builds directly on ADR
> [011](./011-personal-event-storage.md)** (the `personal_events` precedent — a
> Drizzle table mirroring a Flutter sembast `toMap()` verbatim for importer fidelity);
> this ADR reuses that posture and adds the MMKV-vs-Drizzle call ADR 011 didn't face.

## Status

Accepted.

## Context

Phase 3 ship 5 makes the calendar-subscription store **durable**. The token a user
adds (QR scan / iCal import / school pick) **is their calendar identity**, and there
is **no server-side record** of which calendars a device holds — lose the token and
the user must re-add the calendar by hand. The migration-research doc names
`user_calendars.token` the single most critical, **irreplaceable** sembast field
([data-persistence-migration.md §2](../../../../docs/react-native-migration/00-exploration/data-persistence-migration.md)).

Ships 3 and 4 landed an added calendar in an **ephemeral** module-scoped holder
(`calendar-sources/data/scanned-source.ts`, a `useSyncExternalStore`) explicitly
marked "the seam **ship 5 swaps** for the durable token store" — gone on restart,
process kill, or JS-cache clear. This ship makes it durable, and it is the **first
table added** to the Drizzle store since `personal_events` and a **Phase-09 importer
target**. Two decisions are load-bearing (copied by every later persisted-identity
ship and costly to reverse), so they earn an ADR (R-4):

1. **Storage backend: MMKV (`@/storage`) vs. Drizzle/SQLite (`@/db`).** The app owns
   both seams. `personal_events` chose Drizzle without weighing MMKV (it was obviously
   relational); here MMKV is genuinely tempting (a small set, synchronous, simpler for a
   blob), so the call must be recorded.
2. **Schema representation** (dates, color, boolean, the upsert key) — the importer-
   fidelity question ADR 011 answered for `personal_events`, re-answered for this
   feature's distinct fields (a `visible` boolean, a nullable school pair, `id`-not-token
   as the record key).

**The Flutter wire format — read, not guessed.** Traced precisely:
`app/lib/modules/calendar/models/user_calendar.dart` `toDbMap()` = `{ id, name, token,
schoolName, schoolId, lastUpdatedAt: toIso8601String(), createdAt: toIso8601String(),
visible: bool }`; `user_calendar_repository.dart` `STORE_NAME = 'user_calendars'` with
`_store.record(calendar.id).put(...)` (**the sembast record key is `id`, not the
token**); a Flutter migration `003_convert_user_calendar_to_record.dart` re-keyed
records so `record.key == value['id']`; the §3.2 real-device JSONL dump confirms store
`user_calendars`, record key `id`, token a field of `value`. The server DTO
`CalendarForPublic` (from `GET /calendars/by-token/{token}`) maps one-to-one onto these
fields (`schoolName` nullable, `schoolId?` optional; `visible` is client-only, default
true).

## Decision

**(1) Drizzle/SQLite (`@/db`), not MMKV.** `user_calendars` is **relational identity** —
a *set* of rows, each with an upsert key (`id`), a token, and metadata; the app queries
by id and by token, upserts by id, removes by id, and exposes a reactive list. Three
forces decide it:

- **It is relational, multi-row, queried.** `getByToken`, `upsert`-by-`id`, `remove`,
  `setVisible`, and a reactive `useLiveQuery` list are first-class relational operations.
  MMKV would force a hand-rolled JSON-array-in-one-key with manual find/replace/serialize
  on every write — a flat-KV hack re-implementing what SQLite does.
- **It is a Phase-09 migration target needing a real schema + migration.** The importer
  replays the sembast `user_calendars` store into a *matching* schema; `personal_events`
  set the precedent (a sembast store → a Drizzle table mirroring `toMap()`). A MMKV blob
  has no schema for the importer to target and no migration story.
- **It gets the migration-runner durability story for free** — the same `runMigrations()`
  + committed-bundle plumbing `personal_events` uses; on-disk SQLite is durable across
  restart/kill/cache-clear with no extra wiring.

MMKV *was* genuinely weighed (simpler for a tiny blob, synchronous), and **rejected**:
the simplicity is illusory once identity is a queried, upserted, multi-row set with an
importer target — MMKV becomes the harder path (manual serialization, no schema, no
migration) and would **diverge** from the `personal_events` precedent the next importer
engineer expects. *(MMKV stays right for Settings prefs and the query-cache persister —
flat, single-value, non-relational. This is not one.)*

**(2) Schema mirrors `toDbMap()` VERBATIM (importer fidelity), reusing ADR 011's posture.**
`userCalendars` `sqliteTable("user_calendars")` (the sembast store name verbatim):
`id text primaryKey` (the sembast record key = upsert identity — **not** the token, not a
surrogate), `token text notNull` (the irreplaceable identity, the `getByToken` lookup
key), `name text notNull`, `schoolName`/`schoolId text` (nullable; null↔undefined at the
mapper edge), `lastUpdatedAt`/`createdAt text notNull` holding **UTC ISO-8601 strings**,
`visible integer({ mode: "boolean" }).notNull().default(true)`.

- **Dates as TEXT ISO-8601 UTC, not epoch-ms** — same as ADR 011: (a) the importer writes
  the Flutter `toIso8601String()` string verbatim, no `Date.parse()` edge cases / `NaN`
  corruption on a no-backup recovery; (b) canonical UTC ISO-8601 sorts lexicographically =
  chronologically (relevant if a later ship orders calendars by recency). Canonicality is
  guaranteed by `calendarToRow`'s `toISOString()`.
- **`visible` as a Drizzle boolean** (SQLite has no boolean — `mode: "boolean"` stores
  0/1; default `true` mirrors Flutter `visible = true`). The column exists **because the
  Flutter wire format has it** and the importer must round-trip it — not speculative
  divergence (a `setVisible` repository method is the seam a later toggle ship uses; no
  toggle UI this ship).
- **The importer-fidelity property:** a `toDbMap()`-shaped record imports with **zero
  value transformation** — `id`/`token`/`name` verbatim, the two date strings already
  canonical UTC from Flutter, `schoolName`/`schoolId` null-preserving, `visible` bool →
  0/1. No parse-and-re-encode anywhere on the import path = no data-loss surface (exactly
  ADR 011's argument).
- **The server-DTO mapper** `fromCalendarForPublic(dto: CalendarForPublic)` (the only place
  the generated DTO type touches the data layer, and it lives in `data/` — B-1) is a field
  copy (`schoolName: string | null` → `undefined`, ISO strings → `Date`, `visible: true`),
  mirroring Flutter's `UserCalendar.fromCalendarForPublic`.

*Rejected:* MMKV (a flat-KV hack for relational identity — see above); `integer({ mode:
"timestamp_ms" })` dates (lossy importer parse — the ADR-011 fidelity risk); a packed/enum
color (n/a — no color on this schema); the **token** as the primary key (the Flutter
record key is `id`; using the token would break importer-key fidelity and `onConflictDoUpdate`
identity); a caller-only uid with no generator (a future local-only source needs `newId()`).

## Consequences

- The Phase-09 importer can write recovered `user_calendars` rows (carrying the
  irreplaceable token) with **no data loss and minimal transformation** — it maps
  `toDbMap()` keys to columns once, no value parsing, and supplies its own recovered `id`
  to `upsert` (the `newId()` bypass — same as ADR 011).
- The second real Drizzle migration lands (`0001_*.sql` `CREATE TABLE user_calendars`, a
  second `_journal.json` entry, an updated `migrations.js`), committed (fresh-clone-no-
  codegen). The runner applies both unchanged; the `migrate.test.ts` proof still passes.
- Ships 3/4's success paths now persist through the shared `addCalendarFromUrl` seam (POST
  → resolve-by-token → upsert); the ephemeral holder is removed. **A persist can now fail**
  (the first calendar-sources write that can) — recorded through `@/firebase` `recordError`
  + an accessible failure surface (observability ✅).
- A second network call (`GET /calendars/by-token`) is added on the add path — accepted:
  the metadata is needed to render and store a meaningful calendar; the failure is recorded
  + retryable.
- CI proves the mappers (round-trip, importer-fidelity verbatim, canonical-UTC, null/boolean),
  the repository query shape, the persist wiring, and a **restart-simulation** (a fresh
  store handle reads back a prior write). On-disk SQLite survival is the on-device manual
  pass (inbox note — no list UI ships, so no Maestro post-relaunch assertion target).
- Rollback is a plain revert (additive table; a fresh DB lacks it until the migration re-runs).

## Revisit if

- A query or performance need genuinely requires numeric timestamps (re-weigh epoch-ms vs.
  the fidelity cost then — same trigger as ADR 011).
- The Flutter wire format changes before the Phase-09 importer runs (re-align the columns).
- A second, genuinely non-relational identity blob appears that MMKV would serve better —
  this ADR's MMKV rejection is specific to a queried, upserted, multi-row, importer-targeted
  set.
- The `visible` column earns a toggle UI / a calendar set grows large enough that the
  reactive `useLiveQuery` list needs pagination — both ride the existing repository seam.
