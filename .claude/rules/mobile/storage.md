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
