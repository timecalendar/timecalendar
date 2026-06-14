## 1. First real Drizzle schema (`mobile/src/db/schema.ts`)

- [x] 1.1 Create `mobile/src/db/schema.ts` with a `personalEvents` `sqliteTable` (SQL table name
  `personal_events`, matching the Flutter sembast store name). Columns (design D1 + ADR 011):
  `uid: text("uid").primaryKey()`, `title: text("title").notNull()`,
  `color: text("color").notNull()` (the `#RRGGBB` hex string verbatim — D3),
  `startsAt: text("starts_at").notNull()`, `endsAt: text("ends_at").notNull()`,
  `exportedAt: text("exported_at").notNull()` (UTC ISO-8601 strings — D4), and nullable
  `location: text("location")`, `description: text("description")`. Do **not** store `kind`
  (a constant). Imports `drizzle-orm/sqlite-core` — this is why the file MUST live under
  `src/db/**` (the lint-banned backend; the `timecalendar/storage-seams` block exempts the dir).
  No `any`.

## 2. Generate + commit the first real migration

- [x] 2.1 Run `npm run generate:migrations` in `mobile/` (drizzle-kit, driver `expo`, reads
  `drizzle.config.ts` → `schema.ts`). Confirm it emits a real `src/db/migrations/0000_*.sql`
  (`CREATE TABLE personal_events …`), advances `src/db/migrations/meta/_journal.json` (one
  entry), and updates `src/db/migrations/migrations.js` (now importing the `.sql` and exporting a
  non-empty `migrations` map). **Commit all generated files** — a fresh clone must have the
  migration without running codegen (the committed-bundle rule).
- [x] 2.2 Confirm `src/db/migrations/migrations.d.ts` (the hand-stable `.d.ts`) still types the
  regenerated `migrations.js` (the declaration is stable across regenerations — design note in
  the storage section). Adjust only if the generated shape changed.
- [x] 2.3 Run `npm test` and confirm `src/db/migrate.test.ts` **still passes** unchanged — it
  asserts `runMigrations()` drives `migrate(db, migrations)` with the committed bundle; the bundle
  now has one entry, the assertion still holds. Do not edit the runner or its test.

## 3. New native dep — `expo-crypto` (uid source, D2)

- [x] 3.1 Add `expo-crypto` to `mobile/package.json` (`npx expo install expo-crypto` to pin the
  SDK-56-compatible version — pinned `~56.0.4`). **DEVIATION from plan:** `expo-crypto` ships
  **no config plugin** (`app.plugin.js`), so adding it to `app.config.ts` `plugins` makes
  `expo prebuild` throw (`No "app.plugin.*" file was found in "expo-crypto"`). It **autolinks
  with no plugin entry** (like `react-native-mmkv`), so it is **not** added to `plugins` — the
  plan's "add it to `plugins`" was incorrect; package.json + autolink is the real wiring,
  verified by a clean `prebuild` (task 10.4). **Flag (R-1, config-shape):** still
  native-affecting — `npx expo prebuild` regenerates the native projects. `tsc`/lint/Jest don't
  need the native module (the uid wrapper is mocked under Jest — task 6), so CI `test-mobile` is
  unaffected.

## 4. Widen the `@/db` seam with the query helpers the feature needs (D5)

- [x] 4.1 In `mobile/src/db/index.ts`, **re-export** the Drizzle query operators the repository
  needs — `eq`, `and`, `gte`, `lte` (from `drizzle-orm`) — and `useLiveQuery` (from
  `drizzle-orm/expo-sqlite/query`). These imports are backend imports, allowed only here (the
  seam). This is the encoded form of "the feature never imports `drizzle-orm`" — re-export ONLY
  what a consumer needs (R-2), not all of `drizzle-orm`. Keep `{ db }` and add a
  `export * from "./schema"` (or a named `personalEvents` re-export) so the feature imports the
  table from `@/db` too. Confirm `src/db/**` stays the only place importing the backends (lint).

## 5. Feature data layer (`mobile/src/features/personal-events/data/`)

- [x] 5.1 Create the feature folder `mobile/src/features/personal-events/data/` (the second
  `src/features/` folder, mirroring Settings' `prefs/` shape — design D1). Keep it thin (one
  feature's data layer, not a framework).
- [x] 5.2 `data/types.ts`: the domain type `PersonalEvent` (`uid`, `title`, `color`: string;
  `startsAt`, `endsAt`, `exportedAt`: `Date`; `location`, `description`: `string | undefined`)
  and the pure mappers `rowToEvent(row)` / `eventToRow(event)` (design D7). `rowToEvent`:
  `new Date(row.startsAt)` etc., null `location`/`description` → `undefined`. `eventToRow`:
  `event.startsAt.toISOString()` (canonical UTC — the property D4's range query relies on),
  `undefined` → null. Use Drizzle's inferred row types (`typeof personalEvents.$inferSelect` /
  `$inferInsert`) for the row side. No `any`.
- [x] 5.3 `data/uid.ts`: `newEventId(): string` wrapping `expo-crypto`'s `randomUUID()` — the
  single import site of the generator (swappable; the importer bypasses it by supplying its own
  uid — design D2).
- [x] 5.4 `data/repository.ts`: async CRUD over `@/db` (imports `{ db, personalEvents, eq, and,
  gte, lte }` from `@/db`, the mappers from `./types`) — a module of functions, no class
  (R-2, mirroring Settings' store):
  - `findAll(): Promise<PersonalEvent[]>` — `db.select().from(personalEvents)` → `rowToEvent`.
  - `getById(uid: string): Promise<PersonalEvent | undefined>` — `…where(eq(personalEvents.uid,
    uid))`, first row → `rowToEvent` or `undefined`.
  - `upsert(event: PersonalEvent): Promise<void>` — `db.insert(personalEvents).values(
    eventToRow(event)).onConflictDoUpdate({ target: personalEvents.uid, set: eventToRow(event) })`
    (upsert by uid — mirrors Flutter `put`; one write path for create + edit).
  - `remove(uid: string): Promise<void>` — `db.delete(personalEvents).where(eq(personalEvents.uid,
    uid))`.
  - `findInRange(from: Date, to: Date): Promise<PersonalEvent[]>` — events overlapping `[from,
    to)` using the ISO-string columns (`gte`/`lte` on `toISOString()` bounds), ordered by
    `startsAt` → `rowToEvent` (the query D4's TEXT-date choice exists to serve).
- [x] 5.5 `data/hooks.ts`: `usePersonalEvents()` — a reactive read over the seam's `useLiveQuery`
  (`useLiveQuery(db.select().from(personalEvents))` from `@/db`), mapping `data` rows → domain via
  `rowToEvent`. No direct `drizzle-orm` import (design D5).
- [x] 5.6 `data/index.ts`: barrel re-exporting the domain type, the repository functions,
  `newEventId`, and `usePersonalEvents` (mirroring Settings' `prefs/index.ts`).

## 6. Tests — the feature's proof (meet the K-3 90% logic gate)

- [x] 6.1 `data/types.test.ts`: round-trip a domain event through `eventToRow` → `rowToEvent`
  (all fields preserved, timestamps equal, the row's date strings canonical UTC ISO-8601); assert
  null `location`/`description` round-trip as `undefined`; assert `eventToRow` normalizes a
  non-UTC `Date` to a canonical `Z` string. Pure functions — no SQLite mock. Target ≥90%
  lines+branches.
- [x] 6.2 `data/uid.test.ts`: assert `newEventId()` returns the value from a mocked `expo-crypto`
  `randomUUID` (mock `expo-crypto` in the test — it has no off-device JS). Assert the wrapper is
  the delegation point.
- [x] 6.3 `data/repository.test.ts`: prove each repository function against the `@/db` seam
  **mocked** (design D8). Use a `jest.mock("@/db")` (or extend the suite-wide `setup-db` per
  task 6.4) exposing a `db` whose `select`/`insert`/`delete` return chainable spies, plus the
  re-exported `eq`/`and`/`gte`/`lte`/`personalEvents`. Assert: `upsert` issues
  `insert…onConflictDoUpdate` with the uid target and the `eventToRow` row; `remove` issues
  `delete…where(eq(uid))`; `getById` issues `select…where` and maps the returned row→domain;
  `findAll` maps all rows→domain; `findInRange` issues the `gte`/`lte` range and returns
  chronologically-ordered domain events. This proves the query shape + the mapping (CI-provable
  wiring; real materialization is on-device — task 10.5). Target ≥90% on `repository.ts`.
- [x] 6.4 If the suite-wide `jest/setup-db.ts` `drizzle → {}` mock blocks the repository test,
  extend it (or prefer a local `jest.mock("@/db")` per the repository test) so the query chain is
  spy-able. Keep `setup-db` minimal; do the query-builder spying per-test. Confirm the existing
  `migrate.test.ts` still passes after any `setup-db` change.
- [x] 6.5 `data/hooks.test.ts`: render `usePersonalEvents` with RNTL `renderHook`, the seam's
  `useLiveQuery` mocked to return a `data` array; assert the hook maps rows → domain. (Mock
  `@/db`'s `useLiveQuery`.)

## 7. Verify the coverage gate stays green (HIGHEST-RISK — do not skip)

- [x] 7.1 Run `npm test -- --coverage` in `mobile/` and **read the per-path coverage table**.
  Confirm the new `src/db/**` (schema + the re-export surface) and `src/features/**`
  (personal-events `data/`) paths meet **90% lines+branches**, and the global 70% floor holds —
  the gate must stay **green**. `schema.ts` is declarative (covered by being imported by the
  repository/tests); the logic (mappers, uid, repository, hook) carries the bar. If a logic path
  is short, return to task 6 (prefer adding a test). Only if a path is genuinely untestable in
  Jest, exclude it from the glob **with a one-line recorded reason in `jest.config.js`** (never a
  silent skip — the DoD's no-third-state rule); none is expected.

## 8. Definition-of-Done walk (every axis ✅ or ➖ N/A + reason — no third state)

Data layer only (the screen is a separate B-issue), so several axes are ➖ N/A-with-reason —
mirror `add-mobile-storage` / `add-mobile-settings-prefs`. Record each (design "DoD axes" +
`definition-of-done.md` axes).

- [x] 8.1 **Architecture** — ✅ follows the Architecture Book (`@/db` seam, migration runner,
  SQL-bundling toolchain, feature-folder shape); the date/color storage decision recorded as
  **ADR 011** (task 9).
- [x] 8.2 **Types** — ✅ `npx tsc --noEmit` clean in `mobile/`; domain type, inferred row types,
  mappers typed; no unjustified `any`.
- [x] 8.3 **Lint** — ✅ `npm run lint` clean (`--max-warnings 0`): no `drizzle-orm`/`expo-sqlite`
  import outside `src/db/**` (the repository imports `@/db`; the schema lives in `src/db/`),
  import-order, no parent-relative imports.
- [x] 8.4 **Unit/component tests** — ✅ mappers/uid/repository/hook tests green; **coverage gated**
  (K-3, already enforced) — `src/db/**` + `src/features/**` meet 90% (tasks 6–7).
- [x] 8.5 **E2E** — ➖ **N/A + reason**: no user flow (no screen). The existing Maestro round-trip
  (`mobile/.maestro/schools.yaml`) must still pass — the app launches and `runMigrations()` now
  runs the real `CREATE TABLE personal_events` (idempotent), which is the on-device proof the
  migration applies. A Personal-events E2E flow lands with the B-screen issue. Confirm no
  Maestro/e2e change is needed this change (record the decision).
- [x] 8.6 **i18n** — ➖ **N/A + reason**: no user-facing string (no UI; field values are user
  content / format strings, not displayed labels). Zero hardcoded strings holds (lint). The
  B-screen adds FR+EN labels.
- [x] 8.7 **Accessibility** — ➖ **N/A + reason**: no UI / interactive control (the B-screen owns
  controls, touch targets, screen-reader passes).
- [x] 8.8 **Native correctness** — partial: a new native dep (`expo-crypto`) links via CNG; a
  `prebuild` is required (task 9.4); no rendered native control. The native link is verified by
  `prebuild`/e2e (config-shape, not lint — R-1). The rendered-native-control half is the
  B-screen's.
- [x] 8.9 **Performance** — ➖ **N/A + reason**: no list rendering, no animation, no
  interaction-heavy screen (the B-screen owns list perf / Reassure). The single `CREATE TABLE`
  migration is trivial; the range query uses natural text ordering.
- [x] 8.10 **Observability** — ✅ (transitive): a migration failure already reaches Crashlytics
  via the existing `runMigrations()` `@/firebase` path (unchanged); the per-CRUD-call error path
  is ➖ N/A-with-reason (no UI consumes the errors yet — wiring `@/firebase` into every CRUD call
  now would be cargo-cult; the future B-screen earns it).
- [x] 8.11 **Product analytics** — ➖ **N/A + reason**: no user action surface (data is
  read/written by code, not yet by a user gesture). A "personal event created/deleted" event is
  the B-screen's call.
- [x] 8.12 **Documentation** — ✅ Architecture Book "Storage → First feature schema" subsection +
  changelog entry; ADR 011 + README index row (task 9).

## 9. Docs + ADR (R-1 pointers, the living artifacts)

- [x] 9.1 Author **ADR 011** (`.claude/rules/mobile/decisions/011-personal-event-storage.md`
  from `TEMPLATE.md`): the load-bearing **date storage = TEXT ISO-8601 UTC** decision (vs.
  epoch-ms `integer({ mode: "timestamp_ms" })`) justified against BOTH importer fidelity and
  range-query needs (design D4), the **color = `#RRGGBB` TEXT verbatim** decision (D3), and the
  **uid source = `expo-crypto` `randomUUID`** (D2). Record the one caveat (lexicographic =
  chronological only for canonical UTC strings — guaranteed by the mappers). Set the revisit
  trigger (a query/perf need that genuinely requires numeric timestamps, or a Flutter wire-format
  change before the Phase-09 importer runs). Add the index row to
  `.claude/rules/mobile/decisions/README.md`.
- [x] 9.2 Add a **"First feature schema — personal events"** subsection to the Architecture Book
  "Storage" section (`.claude/rules/mobile/architecture.md`): the `personalEvents` schema (columns
  + the importer-fidelity rationale, pointer to ADR 011), the first real migration replacing the
  empty bundle (and that the runner/`migrate.test.ts` are unchanged), the `@/db` seam widening
  (re-exported `eq`/`and`/`gte`/`lte`/`useLiveQuery` — the encoded form of the no-backend-import
  rule), the feature `data/` layer (repository + mappers + uid + reactive `useLiveQuery` hook),
  `expo-crypto` as the uid native dep, and what CI proves (mappers/uid/repository wiring) vs.
  on-device (table materialization via the Maestro launch). R-1 pointer style (link the gates).
- [x] 9.3 Update the storage section notes that say "the first feature regenerates the bundle" /
  "the first feature owns the first migration and the first key" / "No feature schema, no feature
  tables" — point them at the new subsection as now-discharged (the schema/migration/table now
  exist). Update the `useLiveQuery` / `useMigrations()` notes: `useLiveQuery` is now wired (point
  at the new hook); `useMigrations()` blocking gate is still deferred (design D6 — point at the
  first feature whose initial read blocks on a table).
- [x] 9.4 Append an entry to `.claude/rules/mobile/architecture-changelog.md` (Live section): the
  first real schema + migration, the `@/db` seam widening, the personal-events `data/` layer,
  `expo-crypto`, ADR 011.
- [x] 9.5 Note Feature B's **data layer** landed in
  `docs/react-native-migration/01-roadmap/02-pattern-establishment.md` (one line; the screen /
  forms / pickers / list are a later B-issue, still pending — Feature B is not fully done until
  that lands).

## 10. Local verification (gates) + prebuild

- [x] 10.1 `npx tsc --noEmit` clean in `mobile/`.
- [x] 10.2 `npm run lint` clean in `mobile/` (`--max-warnings 0`).
- [x] 10.3 `npm test -- --coverage` green in `mobile/` (all suites + the K-3 `coverageThreshold`
  passes — restates task 7 as the final gate).
- [x] 10.4 `npx expo prebuild` (or `--clean`) in `mobile/` to confirm `expo-crypto` autolinks and
  the native projects regenerate without error (config-shape, verified by prebuild — R-1). The
  generated `ios/`/`android/` are gitignored (CNG); do not commit them.
- [x] 10.5 Confirm the existing Maestro flow still launches the app (the app runs
  `runMigrations()` at startup → the real `CREATE TABLE personal_events` applies; a launch that
  doesn't crash is the on-device migration proof — no new Maestro flow this change).

## 11. Validate

- [x] 11.1 `openspec validate add-mobile-personal-events-data --strict` passes.
