# Personal events data layer: first real Drizzle schema + migration + repository/query layer (importer-targetable)

## Why

Phase 2's second feature is **Personal events** (ADR
[004](../../../.claude/rules/mobile/decisions/004-phase-1-feature-order.md) — Settings →
**Personal events** → School selection), chosen second because it stresses exactly one new
architectural axis: **structured device-local data** (a real relational schema, a real
migration, a repository/query layer), where Settings stressed flat KV preferences. This change
builds Personal events' **data layer only** — the Drizzle table, the first real migration, the
repository CRUD + reactive read hook, and the tests that prove them. **The forms, the native
date/time pickers, the list-rendering screen, and any route are a separate B-issue and are
explicitly out of scope here** — this change ships no screen, no route, no native control, no
user-facing string.

It lands the firsts the **Storage** foundation step deliberately deferred to "the first
feature":

- **The repo's first real `src/db/schema.ts`** and the **first real migration**
  (`npm run generate:migrations`), replacing the committed-but-**empty** migration bundle the
  storage change shipped to prove the runner. The storage section says verbatim: "The first
  feature regenerates the bundle via `npm run generate:migrations` once it adds
  `src/db/schema.ts`" and "the first feature owns the first migration and the first key." This
  is that feature.
- **The first real consumer of the `@/db` seam** beyond the migration runner — a feature
  repository that imports `{ db }` from `@/db` and the table from `@/db/schema`, never the
  backend (lint-enforced).

**Importer-targetability is load-bearing** (the roadmap repeats it twice and the issue calls it
out): the schema columns are chosen so the **Phase-09 one-shot importer** can take the Flutter
app's `PersonalEvent.toMap()` wire format — `uid` (UUID string), `color` (a `#RRGGBB` hex
string), `startsAt` / `endsAt` / `exportedAt` (UTC ISO-8601 strings), nullable `location` /
`description` — and write rows with **no data loss and minimal transformation**. The
date-storage and color-storage choices constrain that importer *and* every future
calendar/list query, so they earn an ADR (011).

The **K-3 coverage gate bites here** (already enforced by Settings, ADR
[003](../../../.claude/rules/mobile/decisions/003-coverage-threshold.md)): `src/features/**`
and `src/db/**` are 90%-lines+branches logic globs. The data layer is pure logic and must meet
the bar.

## What Changes

- **First real Drizzle schema — `mobile/src/db/schema.ts`** — a `personalEvents`
  `sqliteTable` whose columns mirror the Flutter `toMap()` wire format for importer fidelity:
  `uid` TEXT primary key, `title` TEXT not-null, `color` TEXT not-null (the `#RRGGBB` hex
  string, stored verbatim), `startsAt` / `endsAt` / `exportedAt` stored as **TEXT ISO-8601 UTC**
  (ADR 011 — chosen over epoch-int for importer round-trip fidelity; sortable as text, which
  serves the future range query), `location` / `description` TEXT nullable. `schema.ts` lives
  under `src/db/**` because `sqliteTable` imports `drizzle-orm/sqlite-core`, lint-banned outside
  the seam dir.
- **First real migration** — `npm run generate:migrations` (drizzle-kit, driver `expo`) emits
  the real `0000_*.sql` (`CREATE TABLE personal_events …`), advances `meta/_journal.json`, and
  updates `migrations.js`; all **committed**. The existing `runMigrations()` runner and its
  `migrate.test.ts` are unchanged (the runner still drives `migrate(db, migrations)` — now with
  one entry instead of zero).
- **First feature folder for Personal events — `mobile/src/features/personal-events/`** with a
  `data/` sub-layer mirroring Settings' `prefs/` shape: `types.ts` (the `PersonalEvent` domain
  type + the row↔domain mappers), `repository.ts` (async CRUD over `@/db` — `findAll`,
  `getById`, `upsert`, `remove`, and a `findInRange` date-range query for the eventual
  calendar/list), `hooks.ts` (a reactive `useLiveQuery`-backed read), `uid.ts` (a tiny UUID
  generator wrapper), and an `index.ts` barrel.
- **UID generation via `expo-crypto`'s `randomUUID()`** (ADR 011 / D2) — a new dependency
  (autolinks with **no `app.config.ts` plugin entry** — it ships no config plugin; native-affecting
  → a `prebuild` is required, flagged in tasks). A thin `newEventId()` wraps it so the generator is
  swappable and the repository can also accept a caller-supplied uid (the importer path supplies its
  own uid).
- **Reactive read via `drizzle-orm/expo-sqlite`'s `useLiveQuery`** (the storage section names
  this as the reactive-read pattern features inherit) — exposed only through a feature hook
  (`usePersonalEvents`); the call site imports `@/db`, never `drizzle-orm`.
- **Tests** — the row↔domain mappers and the uid wrapper unit-tested to ≥90%; the repository
  CRUD proven against the `@/db` seam (mocked at the seam, mirroring the storage harness); the
  reactive hook proven. The gate lands **green**.
- **Architecture Book** "Storage" section gains a **"First feature schema — personal events"**
  subsection; **ADR 011** records the date/color storage decision + uid source; the
  **changelog** gets an entry; the roadmap notes Feature B's data layer landed.

## Capabilities

### New Capabilities

- `mobile-personal-events-data`: the Personal events feature's device-local data layer — the
  `personalEvents` Drizzle schema (importer-targetable columns), the first real migration
  bundle, the repository CRUD + date-range query over the `@/db` seam, the row↔domain mappers,
  the uid generator, and the reactive `useLiveQuery` read hook. CI proves the mappers, the
  repository against the seam, the uid wrapper, and the migration runner still drives the
  (now non-empty) bundle; the forms/pickers/list UI is a separate B-issue.

## Impact

- `mobile/`: new `src/db/schema.ts` (`personalEvents` table); regenerated `src/db/migrations/`
  (real `0000_*.sql` + `meta/_journal.json` + `migrations.js`, all committed); new
  `src/features/personal-events/data/` (`types.ts`, `repository.ts`, `hooks.ts`, `uid.ts`,
  `index.ts` + tests); `package.json`/`app.config.ts` gain `expo-crypto`.
- `.claude/rules/mobile/architecture.md`: "Storage" section gains a "First feature schema —
  personal events" subsection; `.claude/rules/mobile/architecture-changelog.md`: entry
  appended; `.claude/rules/mobile/decisions/011-personal-event-storage.md`: new ADR + README
  index row.
- `docs/react-native-migration/01-roadmap/02-pattern-establishment.md`: Feature B data-layer
  note.
- **New dependency — `expo-crypto`** (a native module that autolinks with **no config-plugin
  entry** — it ships none; not added to `app.config.ts` `plugins`). Native projects are
  CNG-regenerated on the next `npx expo prebuild` (the e2e build already prebuilds). `tsc`/lint/Jest don't need the native module (the uid wrapper is mocked under
  Jest), so CI `test-mobile` is unaffected; the native link is verified by `prebuild`/e2e.
- **No OpenAPI change. No server/web/`app/` code touched. No human-only prerequisite** (no
  console, credentials, or store action; no inbox handoff). No CI workflow change (the K-3
  gate already lives in `jest.config.js`).
- **No new user-facing string** — the data layer has no UI; the displayed labels land with the
  B-screen issue. i18n DoD is trivially satisfied (no string added).
