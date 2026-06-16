# Storage

Two persistence seams + a startup migration runner. Each is a thin owned seam over a
native backend, lazy/module-scoped, with one CI proof. Entries below are R-1 pointers
plus the caveats tooling can't carry; rationale and alternatives live in the
`add-mobile-storage` change's `design.md` (D1–D8) and `specs/mobile-storage/spec.md`.

## Two swappable seams

- **`src/storage/` over `react-native-mmkv` v4** (a JSI **Nitro Module**, New-Arch-native
  — the only supported mode under SDK 56; needs the `react-native-nitro-modules` peer).
  One module-scoped `createMMKV()` instance; a **minimal typed API** — `getString`/
  `setString`, `getBoolean`/`setBoolean`, `getNumber`/`setNumber`, `has` (over
  `contains`), `remove`. No JSON-object helper, no encryption/multi-instance until a
  consumer needs them (R-2). v4 idioms: `createMMKV()` not `new MMKV()`, `remove` not
  `delete`.
- **`src/db/` over `expo-sqlite` + `drizzle-orm`** (`drizzle-orm/expo-sqlite`). One
  module-scoped `openDatabaseSync("timecalendar.db")` handle and `drizzle(expo)`
  instance. `expo-sqlite` (Expo-managed SQLite) keeps the seam in the Expo upgrade lane;
  `op-sqlite` rejected for leaving that lane with no current need (R-2).
- Feature code imports `@/storage` / `@/db`, never the backends directly —
  **lint-enforced** (see "Seam-import lint boundary").

## Startup migration runner

- `runMigrations()` in `src/db/migrate.ts` — a **non-hook** async function calling
  Drizzle's `migrate(db, migrations)` from `drizzle-orm/expo-sqlite/migrator`, passed the
  committed bundle. Non-hook because the runner is infrastructure, not UI: testable in
  isolation, invokable from a startup side-effect, decoupled from render. Invoked
  fire-and-forget (`void runMigrations()`) at the top of `src/app/_layout.tsx`, mirroring
  the `import "@/i18n"` wiring. A failure is `recordError`'d through the `@/firebase` seam
  (a failed migration is a crash-worthy event) — never swallowed.
- The committed bundle lives in `src/db/migrations/` (`meta/_journal.json` +
  `migrations.js`); its shape is exactly what `drizzle-kit generate` (driver `expo`)
  emits. The `migrations.js` `.js` side is hand-stable; `migrations.d.ts` types it since
  tsconfig doesn't `allowJs`. A fresh clone has the migrations without codegen.
- **The `useMigrations()` hook (loading-gate) pattern is what features inherit** when a
  feature's *first read must wait on its tables* — gate a loading screen on
  `{ success, error }`. **Deferred**, owned by the first feature whose *initial read must
  block on a table* (today's reads are reactive `useLiveQuery`, not first-paint gates).

## SQL-bundling toolchain

Drizzle's Expo migrator consumes a **bundled** `migrations.js` that inline-imports `.sql`
files at build time, and Metro must resolve `.sql`. The contract:

- `mobile/babel.config.js` — `babel-preset-expo` + `["inline-import", { extensions:
  [".sql"] }]`.
- `mobile/metro.config.js` — `getDefaultConfig(__dirname)` + `config.resolver.sourceExts.push("sql")`.
- `mobile/drizzle.config.ts` — `dialect: "sqlite"`, `driver: "expo"`, `schema:
  "./src/db/schema.ts"`, `out: "./src/db/migrations"`, with the `generate:migrations` npm
  script (`drizzle-kit generate`). Adding a schema is one command, not build plumbing.

Both configs are the Expo defaults plus only these documented Drizzle additions. Caveat:
config-shape, verified by build/e2e, not lint (R-1).

## Native config flows through CNG

`expo-sqlite` registers as a **config plugin** entry in `app.config.ts` `plugins`;
`react-native-mmkv` v4/Nitro **autolinks with no plugin entry**. Both link under the
existing iOS `useFrameworks: "static"` — no new `expo-build-properties` change. Native
projects regenerate on the next `expo prebuild`; never hand-edited. If a Nitro/SQLite pod
breaks under static linking, the escape is `ios.forceStaticLinking`. Verified only by a
real prebuild (config-shape, not source) — prose, not lint (R-1).

## Seam-import lint boundary

`mobile/eslint.config.js` (`storageBackendImportPatterns`, applied via the shared
`restrictedImports()` to **all** files; re-set without the storage patterns for
`src/storage/**` + `src/db/**` in the `timecalendar/storage-seams` block, since those
dirs *are* the wrappers): a `no-restricted-imports` pattern bans `react-native-mmkv`,
`expo-sqlite`, and `drizzle-orm` (+ subpaths) everywhere except the seam dirs. Flat-config
caveat: re-setting `no-restricted-imports` *replaces* options (doesn't merge), hence the
separate seam-dir block.

## What CI proves vs. what's on-device

`src/storage/storage.test.ts` round-trips each typed helper through MMKV v4's built-in
in-memory mock (`createMockMMKV`); `jest/setup-storage.ts` stubs `react-native-nitro-modules`
suite-wide first, since the auto-mock's factory imports it at the top level and would
throw off-device before `isTest()` runs. `src/db/migrate.test.ts` drives `runMigrations()`
with `expo-sqlite` / `drizzle-orm/expo-sqlite` / the migrator mocked suite-wide
(`jest/setup-db.ts`) and asserts `migrate()` is called with the committed bundle and that
a thrown error is recorded through `@/firebase`. CI **cannot** assert tables materialize
on disk — the Maestro e2e launch runs `runMigrations()` at startup, so a launch that
doesn't crash is the real-application proof.

## Live forward-looking constraints

- **No generic query/repository framework** — one feature's typed repository only (R-2);
  no offline-sync, no TanStack Query SQLite persister until a feature earns them.
- **No MMKV encryption / multi-instance / secure-store** — single default instance;
  encryption is a later decision when sensitive data appears.

## First feature schema — personal events

The first real `src/db/schema.ts`, the first real consumer of the `@/db` seam, and the
first wiring of `useLiveQuery`. Load-bearing storage-representation decisions:
**ADR [011](./decisions/011-personal-event-storage.md)**. Rationale lives in
`add-mobile-personal-events-data`'s `design.md` (D1–D8) and
`specs/mobile-personal-events-data/spec.md`.

- **The schema — `src/db/schema.ts` `personalEvents` (SQL `personal_events`).** Columns
  mirror the Flutter `PersonalEvent.toMap()` wire format **verbatim** for **importer
  fidelity** (the Phase-09 one-shot importer must write recovered rows with no data loss):
  `uid` TEXT primary key (the sembast record key / upsert identity — not a surrogate),
  `title` TEXT not-null, `color` TEXT not-null (the `#RRGGBB` hex string verbatim — ADR
  011/D3), `startsAt` / `endsAt` / `exportedAt` TEXT not-null holding **UTC ISO-8601
  strings** (ADR 011/D4 — over epoch-ms for importer round-trip fidelity *and* because
  lexicographic order of canonical UTC ISO-8601 = chronological order, so the range query
  sorts/filters on a plain text column), nullable `location` / `description` TEXT. `kind`
  (a constant) is not stored. `schema.ts` lives in `src/db/**` because `sqliteTable`
  imports `drizzle-orm/sqlite-core` (lint-banned outside the seam; `timecalendar/storage-seams`
  exempts the dir).
- **The `@/db` seam re-exports only what consumers need (R-2).** `src/db/index.ts`
  re-exports the query operators the repository needs — `eq`, `and`, `gte`, `lte` (from
  `drizzle-orm`) — plus `useLiveQuery` (from `drizzle-orm/expo-sqlite/query`) and the
  `personalEvents` table. This is the **encoded form of "the feature never imports
  `drizzle-orm`"**: feature code imports `{ db, personalEvents, eq, and, gte, lte,
  useLiveQuery }` from `@/db` only — not all of `drizzle-orm`. `src/db/**` stays the only
  place importing the backends (lint).
- **The feature `data/` layer — `src/features/personal-events/data/`** (a module of
  functions, no class/base-repository, R-2): `types.ts` (the `PersonalEvent` domain type
  exposing `Date` timestamps + the pure `rowToEvent`/`eventToRow` mappers that isolate the
  TEXT-ISO storage format and **normalize every write to canonical UTC** via
  `toISOString()` — the property the range query relies on), `repository.ts` (async CRUD
  over `@/db` — `findAll`, `getById`, `upsert` by uid via `onConflictDoUpdate` mirroring
  the Flutter `put`, `remove`, and a `findInRange` date-range query), `uid.ts`
  (`newEventId()` over `expo-crypto`'s `randomUUID` — the single, swappable import site;
  the importer bypasses it by supplying its own uid), `hooks.ts` (`usePersonalEvents()` —
  the reactive read over the seam's `useLiveQuery`), and an `index.ts` barrel.
- **`expo-crypto` is the uid native dep** — in `mobile/package.json`. It **autolinks with
  no `app.config.ts` plugin entry** (it ships no config plugin — verified by `expo
  prebuild`; do NOT add it to `plugins`, that errors). Mocked under Jest, so `tsc`/lint/Jest
  are unaffected; the native link is verified by prebuild/e2e (config-shape, R-1).
- **What CI proves vs. on-device.** CI proves the **mappers** (round-trip, canonical-UTC
  normalization, null↔undefined), the **uid wrapper** (delegates to mocked `expo-crypto`),
  the **repository wiring** (each function issues the expected Drizzle query shape against
  the mocked `@/db` seam — a query-builder spy — mapping rows→domain via the real mappers),
  and the **reactive hook**. Real table **materialization** is on-device — the Maestro
  launch runs `runMigrations()` → `CREATE TABLE personal_events` (idempotent); a launch
  that doesn't crash is the proof. The repository tests `jest.mock("@/db")` locally (the
  suite-wide `setup-db.ts` mocks `drizzle → {}`, no query chain to spy). The K-3 coverage
  gate (`src/db/**`, `src/features/**` at 90%) lands green.

## User-calendar identity store — `user_calendars`

The **second real table** (the first added since `personal_events`) and the first
**durable token store** — the load-bearing identity ship (the calendar-subscription
**token IS the user's identity**, no server backup). It replays the personal-events
precedent: a Drizzle table mirroring a Flutter sembast `toMap()` verbatim for **importer
fidelity** (Phase-09 target). Load-bearing decisions: **ADR
[018](./decisions/018-user-calendar-storage.md)** (Drizzle-over-MMKV + verbatim-schema);
rationale in `add-mobile-calendar-identity-persistence`'s `design.md` (D1–D9) and
`specs/mobile-calendar-identity-persistence/spec.md`.

- **The schema — `src/db/schema.ts` `userCalendars` (SQL `user_calendars`).** Columns
  mirror the Flutter `UserCalendar.toDbMap()` wire format **verbatim** (traced to
  `app/lib/modules/calendar/models/user_calendar.dart` + the §3.2 device JSONL dump):
  `id` TEXT primary key (the **sembast record key** `_store.record(calendar.id).put` =
  the upsert identity — **not** the token, not a surrogate), `token` TEXT not-null (the
  **irreplaceable** subscription identity — the single most critical sembast field — the
  `getByToken` lookup key), `name` TEXT not-null, nullable `schoolName` / `schoolId` TEXT,
  `lastUpdatedAt` / `createdAt` TEXT not-null holding **UTC ISO-8601 strings** (ADR 011/D4
  posture — TEXT over epoch-ms for importer round-trip fidelity *and* lexicographic =
  chronological order), `visible` `integer({ mode: "boolean" }).notNull().default(true)`
  (SQLite has no boolean; default mirrors Flutter `visible = true`). The importer-fidelity
  property: a `toDbMap()`-shaped record imports with **zero value transformation**.
- **The second real migration — `src/db/migrations/0001_*.sql`** (`drizzle-kit generate`,
  driver `expo`): `CREATE TABLE user_calendars …`, a second `meta/_journal.json` entry, an
  `0001_snapshot.json`, and an updated `migrations.js` (now importing `m0000` + `m0001`).
  All committed (fresh-clone-no-codegen). `migrations.d.ts` is stable across regenerations.
  The runner applies both unchanged; the `migrate.test.ts` proof still passes.
- **The `@/db` seam re-exports `userCalendars`** (the table) alongside `personalEvents`;
  no new operator (`eq` already re-exported is the only one the repository needs — R-2).
- **The feature `data/` layer — `src/features/calendar-sources/data/user-calendars/`** (a
  grouped sub-module under the existing calendar-sources `data/` seam, D3): `types.ts` (the
  `UserCalendar` domain type exposing `Date` + `boolean`; the pure `rowToCalendar` /
  `calendarToRow` mappers normalizing every write to canonical UTC; and
  `fromCalendarForPublic` — the server `CalendarForPublic` DTO → domain mapper, the **only**
  generated-type import in the layer, in `data/` per B-1), `repository.ts` (async CRUD over
  `@/db` — `findAll`, `getById`, `getByToken`, `upsert` by `id` via `onConflictDoUpdate`
  mirroring the Flutter `record(id).put` and accepting a caller-supplied id for the importer,
  `remove`, `setVisible`), `id.ts` (`newId()` over `expo-crypto` — the swappable uid site;
  the importer bypasses it), `hooks.ts` (`useUserCalendars()` — the reactive `useLiveQuery`
  read replacing the removed ephemeral holder), `add-calendar.ts` (the shared persist seam —
  `useAddCalendar`'s `addCalendarFromUrl`: POST `/calendars` → resolve `GET /calendars/by-token/{token}`
  → `fromCalendarForPublic` → `upsert`; both the QR and iCal screens use it), and `index.ts`.
- **Ships 3/4 persist through it.** The QR-scan + iCal-import success paths now `upsert` a
  durable row (replacing the ephemeral `scanned-source.ts`, removed). **A persist can fail**
  (the first calendar-sources write that can) — recorded through `@/firebase` `recordError`
  + an accessible failure surface.
- **What CI proves vs. on-device.** CI proves the **mappers** (round-trip, importer-fidelity
  verbatim, canonical-UTC, null/boolean), the **uid wrapper**, the **repository wiring** (the
  `jest.mock("@/db")` query-builder spy), the **reactive hook**, the **persist wiring**
  (success + the failure→`recordError` path at the `customFetch` seam), and a
  **restart-simulation** (a fresh repository module reads back a prior write through a
  stateful Map-backed `@/db` fake — the write-then-read-back contract). CI **cannot** prove
  on-disk SQLite survival — that is the **on-device manual restart/kill/cache-clear pass**
  (inbox `2026-06-16-calendar-restart-durability.md`; no list UI ships this change, so there
  is no Maestro post-relaunch assertion target — design D9). The K-3 coverage gate lands green.

## Calendar events store — `calendar_events`

The **third real table** (the second since `personal_events`) and the **second
device-local sync surface** — the events the calendar actually renders, synced from
`POST /calendars/sync { tokens }` over the durable `user_calendars` tokens and
dropped+replaced into this table each sync. It replays the importer-fidelity precedent
a third time: a Drizzle table mirroring the Flutter `CalendarEvent.toDbMap()` / the
server `CalendarEventForPublic` DTO **verbatim** (Phase-09 importer target). Load-bearing
decisions: **ADR [021](./decisions/021-calendar-event-storage-and-sync.md)** (building on
ADR 011/018); rationale in `add-mobile-calendar-sync`'s `design.md` (D1–D8) and
`specs/mobile-calendar-sync/spec.md`.

- **The schema — `src/db/schema.ts` `calendarEvents` (SQL `calendar_events`).** `uid`
  TEXT primaryKey (the record key + replace identity — the uid IS the identity, like
  `personal_events`); `title` / `color` / `groupColor` TEXT notNull (`#RRGGBB` verbatim —
  ADR 011/D3); `startsAt` / `endsAt` / `exportedAt` TEXT notNull (UTC ISO-8601 — ADR
  011/D4: TEXT over epoch-ms for fidelity AND lexicographic = chronological for
  `findInRange`); nullable `location` / `description` TEXT; `allDay`
  `integer({ mode: "boolean" }).notNull()`; `teachers` / `tags` notNull + `fields`
  nullable as **JSON-in-TEXT** (below); `type` TEXT notNull (the `EventTypeEnum` value
  **verbatim**, NOT a checked enum — an unknown future server value must round-trip, not
  throw; the Flutter `toDbMap()` doesn't persist `type`, so the importer supplies a safe
  default `class` — recorded so it's not flagged as a fidelity gap); `userCalendarId`
  TEXT notNull — the parent `user_calendars.id`, a **soft reference, NO FK** (drop+replace
  clears events independently; the next sync reconciles).
- **The JSON columns — `teachers` / `tags` / `fields` as plain TEXT, decoded by pure
  DEFENSIVE mappers (ADR 021 / D2 — the new wrinkle vs. ADR 011/018).** NOT Drizzle
  `text({ mode: "json" })`: the mappers own the JSON encode (`JSON.stringify`) / decode so
  the shape is one tested seam, the importer writes the exact string we control, and a
  **corrupt/legacy/unparseable value degrades to a safe default** (`[]` / `null`) rather
  than throwing the whole list read — a `mode: "json"` column throws, which is exactly why
  these are plain TEXT. The **write** (`dtoToRow`) JSON-encodes the **full** DTO value
  (the full `EventTag[]` `{name,color,icon}` each, the full `fields` object) verbatim; the
  **read** (`rowToCalendarEvent`) is a lossy RENDERING projection — it decodes the full
  `EventTag[]` then projects to the domain `tags: string[]` (names) and derives `canceled`
  from `fields?.canceled ?? false`, with the rich objects / `groupColor` / `type` / the
  rest of `fields` staying in the ROW (written verbatim, never lost on a write). **No
  `CalendarEvent` shape change** — the lossy domain is the rendering projection of the
  verbatim row.
- **The third real migration — `src/db/migrations/0002_first_mauler.sql`** (`drizzle-kit
  generate`, driver `expo`): `CREATE TABLE calendar_events …`, a third `meta/_journal.json`
  entry, an `0002_snapshot.json`, and an updated `migrations.js` (now importing
  `m0000`/`m0001`/`m0002`). All committed (fresh-clone-no-codegen). `migrations.d.ts` is
  stable across regenerations. The runner applies all three unchanged; `migrate.test.ts`
  still passes.
- **The `@/db` seam re-exports `calendarEvents`** (the table) alongside `personalEvents` /
  `userCalendars`; no new operator (`and` / `gte` / `lte` already re-exported for the
  personal-events range query are exactly what `findInRange` needs — R-2).
- **The feature `data/` layer — `src/features/calendar/data/sync/`** (a sub-module under
  the existing calendar `data/` seam): `types.ts` (the pure `dtoToRow` — the **verbatim**
  DTO→row WRITE mapper, the only generated-DTO import, B-1 — and `rowToCalendarEvent` — the
  lossy row→domain RENDERING read, mapping to the EXISTING `CalendarEvent` domain type),
  `repository.ts` (`findInRange` + the **transactional `replaceAll(rows)`** — takes
  verbatim insert rows, `db.transaction(tx ⇒ delete-all then chunked bulk insert)`, atomic
  so a crash mid-replace never leaves a half-empty table — D3), `hooks.ts`
  (`useSyncedEvents()` — the reactive `useLiveQuery` read, row→domain mapped, no range
  filter — `useCalendarEvents` filters the merged set once), `sync.ts`
  (`useSyncCalendars()` — the orchestrator: read tokens → batch `POST /calendars/sync` →
  flatten DTOs to **verbatim rows** via `dtoToRow` → `replaceAll(rows)`), `startup.ts`
  (`useStartupSync()` — the fire-and-forget once-effect mounted in `_layout.tsx`), and
  `index.ts`. The single verbatim write shape (`dtoToRow`'s output) is what both the live
  sync AND the Phase-09 importer write — fidelity holds end-to-end, not just on the
  importer path.
- **What CI proves vs. on-device.** CI proves the **mappers** (`dtoToRow` **verbatim
  survival** of groupColor/type/rich-tags/rich-fields + canonical-UTC + null handling;
  `rowToCalendarEvent` round-trip + **corrupt-JSON → safe default** + the lossy rendering
  projection), the **repository query shape + the transactional drop+replace** (delete-
  then-insert inside one `transaction`, chunked, taking rows), the **sync wiring** at the
  `customFetch` seam (success writing **verbatim rows**, no-tokens no-op, fetch-failure →
  `isError` no-record, replace-failure → `recordError`), the **reactive hook + the startup
  trigger**,
  and a **restart-simulation** (a fresh repository module reads back a prior `replaceAll`
  through a stateful Map-backed `@/db` fake). CI **cannot** prove on-disk SQLite survival,
  drop+replace **atomicity** after a mid-sync kill, or real-data perf — those are the
  **on-device manual pass** (inbox `2026-06-16-calendar-sync-on-device.md`). The K-3
  coverage gate lands green.

## Hidden events store — a single MMKV blob (not Drizzle)

The **first durable importer-target deliberately backed by MMKV, not Drizzle** — the
hidden-events set (Phase 05 Ship A). Where `personal_events` / `user_calendars` /
`calendar_events` are relational, multi-row, keyed Drizzle tables, the hidden set is the
**opposite shape**: a single flat record of two string lists, read whole / written whole /
filtered in memory — exactly the flat, non-relational shape MMKV owns (the school-selection
`groupValues` JSON-array-over-one-key precedent). The MMKV-over-Drizzle call is **ADR
[023](./decisions/023-hidden-events-storage.md)** (which makes the *opposite* call to ADR 018
for the *opposite* shape); rationale in `add-mobile-hidden-events`'s `design.md` (D1) and
`specs/mobile-hidden-events/spec.md`.

- **The blob — `src/features/hidden-events/data/types.ts`.** One flat key
  `HIDDEN_EVENTS_KEYS.set = "hiddenEvents.set"` holds a JSON-encoded
  `{ uidHiddenEvents: string[], namedHiddenEvents: string[] }` record, mirroring the Flutter
  `HiddenEvent.toMap()` wire format **verbatim** for **importer fidelity** (the Phase-09
  one-shot importer writes the recovered blob as the key's value with **zero value
  transformation** — the `newId()`-bypass analog; it sets the whole blob, never going through
  the mutators). A **total defensive parser** `parseHiddenEvents(raw)` decodes an unset /
  non-JSON / wrong-shape / non-string-array value to the empty default
  `{ uidHiddenEvents: [], namedHiddenEvents: [] }` and **never throws** (each list parses
  independently, so a partially-corrupt blob keeps the valid half) — the views then render
  everything, the safe default. `encodeHiddenEvents(set)` preserves the verbatim two-key shape.
- **The store — `data/store.ts`** (the **only** place touching `@/storage` for this feature,
  B-1): pure imperative get/set over the seam (`getString`/`setString`), `getHiddenEvents()`
  (read + parse), and the four mutators `hideByUid` / `hideByName` / `unhideUid` / `unhideName`
  — each reads the current set, produces the next set (append-if-absent **deduped** / filter-out;
  a Set is the RN model, the filter is membership, so dupes are invisible — deduped on write to
  keep the blob clean), and writes the whole encoded blob (drop+replace of the single record,
  Flutter parity). **The write is the failure surface** — a `setString` failure throws; the UI
  hook catches + records (below).
- **The hooks — `data/hooks.ts`.** `useHiddenEvents()` — the reactive read over the seam's
  `useStoredString(HIDDEN_EVENTS_KEYS.set)` + `parseHiddenEvents` (mirroring `useSelectedSchool`),
  so the calendar views and the management screen re-render when the set changes.
  `useHideActions()` — the four mutators wrapped with the observability + failure-state handling
  (the one place the UI calls writes): a thrown write records through `@/firebase`
  `recordError(error, "hidden-events/<action>")` **and** flips an accessible `failed` flag. The
  filter read is **total/infallible** (corrupt/absent → empty set, no record — the school-read
  posture, not the personal-events-write posture).
- **No Drizzle table, no migration, no `@/db` change** (the `migrate.test.ts` proof is untouched);
  **no new dependency, no `app.config.ts`/babel/native change** (a new MMKV key under the existing
  seam). The feature is filtered at the events-source seam — see calendar.md "Hidden events".
- **What CI proves vs. on-device.** CI proves the **total parser** (empty / corrupt / verbatim-shape
  round-trip), the **four mutators** (append / dedup no-op / remove / remove-absent no-op), the
  **verbatim importer-fidelity blob shape**, the **write-then-read-back** contract (through the real
  in-memory MMKV mock), the **restart-simulation** (`data/restart.test.ts` — a fresh store module
  reads back a prior write through a stateful Map-backed `@/storage` fake surviving
  `resetModules()`, mirroring the user_calendars proof), the reactive hook, and the
  **observability path** (a thrown write → `recordError` + the failure flag). CI **cannot** prove
  on-disk MMKV survival across a real restart/kill/cache-clear — the **on-device manual pass**
  (inbox `2026-06-16-hidden-events-on-device.md`). The K-3 coverage gate lands green (the `data/`
  layer at 100%).

## Checklist items store — `checklist_items`

The **fourth real Drizzle table** (the second since `calendar_events`) and a **per-event
child** of *both* event kinds — a small to-do list a student attaches to a class or a
personal event ("bring the lab coat"). It is a **Phase-09 importer target with NO server
backup** (a lost item is permanent), so the schema mirrors the Flutter
`ChecklistItem.toMap()` **verbatim** and every write is tested (the ADR-011/018/021 posture,
a fourth time). Load-bearing decisions: **ADR
[024](./decisions/024-event-checklist-storage-and-surfacing.md)** (verbatim schema +
soft-ref + the **hard-delete-not-soft finding** + the unified-details surfacing); rationale
in `add-mobile-event-checklists`'s `design.md` (D1–D8) and
`specs/mobile-event-checklists/spec.md`.

- **The schema — `src/db/schema.ts` `checklistItems` (SQL `checklist_items`).** Columns
  mirror the Flutter `toMap()` wire format **verbatim** (traced to
  `app/lib/modules/event_details/models/checklist_item.dart` + its repository): `uuid` TEXT
  primaryKey (the sembast record key `_store.record(item.uuid).put` = the identity — not a
  surrogate), `eventUid` TEXT not-null (the **join key to either event kind** — a
  `personal_events.uid` OR a `calendar_events.uid` — a **SOFT reference, NO FK**, exactly
  like `calendar_events.userCalendarId`: the sync `replaceAll` drops+re-inserts the synced
  event's `calendar_events` row each sync with the same uid, so a hard FK would cascade-delete
  the checklist every sync (data loss!) or block the drop), `content` TEXT not-null,
  `isChecked` `integer({ mode: "boolean" }).notNull()` (SQLite has no boolean → 0/1), `order`
  INTEGER not-null (**1-based**, Flutter sets `length + 1` on add and re-numbers `i + 1` on
  reorder), `createdAt` / `updatedAt` / `deletedAt` TEXT **nullable** (the model's three dates
  are `DateTime?`) holding **UTC ISO-8601 strings** (ADR 011/D4 — TEXT over epoch-ms for
  importer round-trip fidelity). A `toMap()`-shaped record imports with **zero value
  transformation**.
- **DELETE IS HARD, NOT SOFT (ADR 024 / decision 3 — the brief's premise corrected against
  the Flutter code).** The Flutter `delete` is `_store.delete(finder: Filter.byKey(uuid))` —
  a hard removal — and `deletedAt` is **never set and never filtered on** anywhere; it is a
  vestigial wire-format field. So `remove(uuid)` is a hard `DELETE`, and the read
  (`findByEvent`/`useChecklist`) filters by `eventUid` ordered by `order` **with NO
  `deletedAt IS NULL` filter** (Flutter `findAllByEventUid` has none). The `deletedAt` **column
  is kept** for verbatim importer fidelity only (an imported record may carry a non-null value
  the importer must round-trip). **Do NOT add a soft-delete filter "for correctness" — it would
  diverge from Flutter and silently change which items render.** A future real soft-delete
  (undo/trash) is a deliberate divergence with its own ADR.
- **The fourth real migration — `src/db/migrations/0003_soft_iron_fist.sql`** (`drizzle-kit
  generate`, driver `expo`): `CREATE TABLE checklist_items …`, a fourth `meta/_journal.json`
  entry, an `0003_snapshot.json`, and an updated `migrations.js` (now importing
  `m0000`..`m0003`). All committed (fresh-clone-no-codegen). `migrations.d.ts` is stable across
  regenerations. The runner applies all four; `migrate.test.ts` still passes (it asserts the
  committed bundle, not a fixed count).
- **The `@/db` seam re-exports `checklistItems`** (the table) + the **`asc`** operator (the
  ordered `order BY order` read — the only new operator, R-2; `eq` was already re-exported).
- **The feature `data/` layer — `src/features/event-checklists/data/`** (a new SHARED feature
  folder named for the concern, ADR 024 / decision 4 — consumed by both the calendar
  details screen and, transitively, personal events; a module of functions, no class, R-2):
  `types.ts` (the `ChecklistItem` domain type + pure `rowToChecklistItem`/`checklistItemToRow`
  mappers normalizing every write to canonical UTC via `toISOString()`, null↔undefined for the
  three dates, bool↔0/1), `repository.ts` (async CRUD over `@/db` — `findByEvent` ordered by
  `order`, `add` insert, `setContent`/`setChecked` one-column UPDATE + `updatedAt`, the
  **transactional `reorder`** re-numbering each `order = i + 1` inside ONE `db.transaction` so a
  crash mid-reorder never leaves duplicate/gap orders, `remove` HARD delete), `id.ts`
  (`newId()` over `expo-crypto`'s `randomUUID` — the swappable uid site; the importer bypasses
  it), `hooks.ts` (`useChecklist(eventUid)` — the reactive `useLiveQuery` read; and
  `useChecklistActions(eventUid, items)` — the write controller computing `order = items.length
  + 1` on add, the move-up/down swap-then-reorder, the remove-then-renumber, each write wrapped
  in `recordError` + a `failed` flag), and an `index.ts` barrel.
- **What CI proves vs. on-device.** CI proves the **mappers** (round-trip, canonical-UTC,
  null/bool, importer-fidelity verbatim incl. a non-null `deletedAt`), the **repository query
  shapes** (the ordered read with no `deletedAt` filter, the insert, the column update, the
  transactional re-number, the hard delete), the **actions hook** (1-based order, the
  `recordError`-on-throw path, the remove-then-renumber, move-up/down), the **reactive read**,
  the **write/read-back + a restart-simulation** (a fresh repository module reads items back in
  `order` through a stateful Map-backed `@/db` fake surviving `resetModules()`), **including the
  survives-a-sync-`replaceAll` property** (a checklist keyed on a synced event's uid survives a
  simulated `calendar_events` drop+replace — the soft-ref-no-FK guarantee). CI **cannot** prove
  on-disk SQLite survival across a real restart/kill/cache-clear, the reorder atomicity after a
  mid-write kill, the auto-focus keyboard-raise feel, or the manual screen-reader pass — the
  **on-device manual pass** (`inbox/2026-06-16-event-checklists-on-device.md`). The K-3 coverage
  gate lands green (the `data/` layer ≥90%).
