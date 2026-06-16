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
  these are plain TEXT. `tags` decodes the full `EventTag[]` then projects to the domain
  `tags: string[]` (names; the rich objects stay in the row for importer fidelity);
  `canceled` derives from `fields?.canceled ?? false`. **No `CalendarEvent` shape change.**
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
  the existing calendar `data/` seam): `types.ts` (the pure `rowToCalendarEvent` /
  `calendarEventToRow` mappers + `fromCalendarEventDto` — the only generated-DTO import,
  B-1 — all mapping to the EXISTING `CalendarEvent` domain type), `repository.ts`
  (`findInRange` + the **transactional `replaceAll`** — `db.transaction(tx ⇒ delete-all
  then chunked bulk insert)`, atomic so a crash mid-replace never leaves a half-empty
  table — D3), `hooks.ts` (`useSyncedEvents(range)` — the reactive `useLiveQuery` read),
  `sync.ts` (`useSyncCalendars()` — the orchestrator: read tokens → batch `POST
  /calendars/sync` → flatten+map → `replaceAll`), `startup.ts` (`useStartupSync()` — the
  fire-and-forget once-effect mounted in `_layout.tsx`), and `index.ts`.
- **What CI proves vs. on-device.** CI proves the **mappers** (round-trip,
  importer-fidelity verbatim, canonical-UTC, JSON encode/decode + **corrupt-JSON → safe
  default**, null/boolean), the **repository query shape + the transactional drop+replace**
  (delete-then-insert inside one `transaction`, chunked), the **DTO mapper**, the **sync
  wiring** at the `customFetch` seam (success, no-tokens no-op, fetch-failure → `isError`
  no-record, replace-failure → `recordError`), the **reactive hook + the startup trigger**,
  and a **restart-simulation** (a fresh repository module reads back a prior `replaceAll`
  through a stateful Map-backed `@/db` fake). CI **cannot** prove on-disk SQLite survival,
  drop+replace **atomicity** after a mid-sync kill, or real-data perf — those are the
  **on-device manual pass** (inbox `2026-06-16-calendar-sync-on-device.md`). The K-3
  coverage gate lands green.
