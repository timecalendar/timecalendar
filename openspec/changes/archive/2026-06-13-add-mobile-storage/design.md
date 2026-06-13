# Design — mobile storage seams (MMKV + expo-sqlite/Drizzle migration runner)

## Context

`mobile/` persists nothing across launches today (only the in-memory `QueryClient`).
Foundation step 9 wires the two storage seams the walking skeleton needs, **and the migration
runner**, while building **no feature schema**. The shape follows the seams already in the
codebase: `src/firebase/` (thin wrapper over a native SDK, lazy native resolution, one CI
proof, an Architecture Book section) and `src/api/mutator.ts` (the single owned seam over the
network). Storage adopts the same posture — the step-10 "behind our own abstractions"
philosophy applied early because storage is cross-cutting.

Constraints shaping the design:
- **CNG.** `mobile/ios` and `mobile/android` are generated + gitignored; all native config
  flows through `app.config.ts` + config plugins (`expo prebuild`). No hand-edited native.
- **New Arch / Hermes only** (SDK 56 default). Both libraries must be New-Arch-native.
- **expo-sqlite has no Node/Jest implementation** (it's a native module; like firebase's
  native modules off-device) — the runner's CI proof must mock the SQLite seam and assert
  wiring; real migration application is the e2e/manual half.
- **Scope: runner, not schema** (roadmap risk note). Zero feature tables. The migration
  bundle is empty this step.
- **R-1 / R-2 / R-3.** Encode the seam boundary in lint before documenting it; no speculative
  scope; no invented feature table to "prove" the runner.

## Goals / Non-Goals

**Goals:**
- A key-value seam (`src/storage/`) over MMKV, with a minimal, swappable API, CI-green.
- A relational seam (`src/db/`) owning the expo-sqlite handle + the Drizzle instance.
- A **migration runner** invoked at startup that applies a committed, ordered migration
  bundle and is proven to run (journal/tracking table advance) — bundle empty this step.
- The SQL-bundling codegen toolchain wired (drizzle-kit + babel inline-import + metro `.sql`)
  so the first feature adds a schema with `generate:migrations`, not plumbing.
- The seam boundary encoded as a lint rule (R-1); two proof tests; an Architecture Book section.

**Non-Goals:**
- **No feature schema, no feature tables, no persisted keys** — the day-one consumers are the
  proof tests only. The first feature owns the first migration and the first key.
- **No query/repository layer, no `useLiveQuery` wiring, no offline-sync** — earned by features.
- **No MMKV encryption / multi-instance / secure-storage** — single default instance now;
  encryption is a later decision when sensitive data appears (recorded debt).
- **No TanStack Query persister** (the data layer deliberately left query policy unset) — the
  first server-read feature earns it; it's not a storage-seam concern this step.
- **No coverage threshold** — K-3 still owned by the first logic-bearing feature (Settings).

## Decisions

### D1 — `react-native-mmkv` v4 (Nitro) for key-value, behind `src/storage/`
MMKV is the standard synchronous KV store for RN; v4 (4.3.1) is the current major — a JSI
**Nitro Module** (`react-native-nitro-modules` peer), New-Arch-native, which is the only
supported mode under SDK 56. It auto-mocks under Jest (`createMMKV()` returns a working
in-memory mock), so the seam gets a **real round-trip** test with no hand-written mock.
The seam (`src/storage/index.ts`) owns one module-scoped instance via `createMMKV()` and
exposes a **minimal typed API** — `getString`/`setString`, `getBoolean`/`setBoolean`,
`getNumber`/`setNumber`, `has`, `remove` — thin pass-throughs that keep the backend swappable
(feature code never imports `react-native-mmkv`). No JSON-object helper this step (no consumer;
add when one appears — R-2).
*Alternatives:* `expo-secure-store` (async, keychain — wrong tool for fast settings; revisit
when secrets appear); `AsyncStorage` (async, slower, no typing); MMKV v3 (`new MMKV()`, prior
major) — rejected: v4 is current and New-Arch-native without the legacy bridge path.

### D2 — `expo-sqlite` (Expo-managed) + `drizzle-orm`, the SQLite seam in `src/db/`
`expo-sqlite` is the Expo-managed SQLite (versioned with the SDK, autolinked, config-plugin),
not a third-party native lib — it stays inside the Expo upgrade lane. Drizzle is the typed
query/migration layer over it (`drizzle-orm/expo-sqlite`). `src/db/index.ts` owns the single
`openDatabaseSync("timecalendar.db")` handle and the `drizzle(expo)` instance; both lazy/
module-scoped. Feature code imports `@/db`, never `expo-sqlite` or `drizzle-orm` directly.
*Alternatives:* `op-sqlite` (faster, third-party native — rejected, leaves the Expo lane for
no current need, R-2); raw `expo-sqlite` without an ORM (rejected — no typed schema, no
migration tooling; Drizzle is the migration tooling we need this step); WatermelonDB
(reactive, heavyweight — speculative, R-2).

### D3 — Migration runner over `migrate()` (non-hook), invoked at startup
The runner is `runMigrations()` in `src/db/migrate.ts`, calling Drizzle's **non-hook**
`migrate(db, migrations)` from `drizzle-orm/expo-sqlite/migrator`, passed the committed
bundle. **Non-hook over `useMigrations()`** because the runner is infrastructure, not UI: a
plain async function is testable in isolation, invokable from a side-effect at startup, and
doesn't couple migration to a React render. It is invoked from `_layout.tsx` (the app's
startup wiring, mirroring `import "@/i18n"`) — fire-and-forget with a `recordError` on failure
through the `@/firebase` seam (an honest reuse of the just-landed observability seam; a failed
migration is exactly a crash-worthy event). `migrate()` creates/advances Drizzle's
`__drizzle_migrations` tracking table; with an empty bundle it applies zero migrations and
leaves the DB at version 0 — a valid, idempotent green run that **proves the runner runs**.
*Alternative:* `useMigrations()` hook gating a loading screen — rejected this step: there is
no screen to gate and no schema to migrate; the hook is the right call *when a feature's first
read must wait on its tables*, recorded as the pattern features inherit.

### D4 — The migration bundle is **empty** this step (no invented table)
The committed bundle (`src/db/migrations/` — `_journal.json` + `migrations.js` produced by
`drizzle-kit generate`, OR a hand-authored `{ journal: { entries: [] }, migrations: {} }` if
the schema is empty and drizzle-kit emits nothing) carries **zero migrations**. We do **not**
invent a `_meta`/no-op table to "prove" the runner — that would be a feature schema by another
name (R-2, and the roadmap's explicit "don't build feature schemas yet"). The runner running
the empty bundle to completion (tracking table created, journal at 0) is the proof; the *first
feature* commits the first real migration. The drizzle-kit + babel + metro toolchain (D5) is
wired so that first migration is `npm run generate:migrations`, not plumbing.
*Alternative:* one no-op/marker migration — rejected as a disguised feature table.

### D5 — SQL-bundling toolchain: drizzle-kit + babel `inline-import` + metro `.sql`
Drizzle's Expo migrator consumes a **bundled** `migrations.js` that `inline-import`s the
`.sql` files at build time; Metro must resolve `.sql` as a source extension. So this step
creates the (previously absent) `babel.config.js` (`babel-preset-expo` + the `inline-import`
plugin for `.sql`) and `metro.config.js` (`getDefaultConfig` + `sourceExts.push("sql")`),
plus `drizzle.config.ts` (`dialect: "sqlite"`, `driver: "expo"`, `schema`, `out:
"./src/db/migrations"`) and a `generate:migrations` npm script. These are inert today (no
`.sql` files) but are the contract the first schema-bearing feature relies on. Creating the
default Metro/Babel configs explicitly (Expo otherwise uses built-in defaults) is a known,
documented Drizzle-on-Expo requirement, not config drift.
*Alternative:* hand-author migration bundles without drizzle-kit — rejected: drift-prone, and
abandons the typed schema→SQL pipeline that is the whole reason to adopt Drizzle.

### D6 — Seam-import boundary encoded in lint (R-1)
A `no-restricted-imports` pattern bans `react-native-mmkv`, `expo-sqlite`, and `drizzle-orm`
(+ subpaths) **everywhere except `src/storage/**` and `src/db/**`**, so the swappable-seam
posture is *enforced*, not just documented. This also retroactively closes the gap the
firebase section left (it documented "import `@/firebase`, never `@react-native-firebase/*`"
in prose only); we encode storage's equivalent boundary now and note the pattern. The seam
directories themselves are exempted (they *are* the wrapper). Implemented in
`mobile/eslint.config.js` alongside the existing `restrictedImportPatterns`/`Paths`.
*Alternative:* `eslint-plugin-boundaries` (full feature-module boundaries) — deferred (the
book already defers it until feature folders exist); a targeted `no-restricted-imports` pattern
is the proportionate tool now.

### D7 — Two proof tests; SQLite mocked, MMKV real-mocked (R-1, mirrors firebase D7)
- `src/storage/storage.test.ts`: drives the seam (`setString`→`getString`, `setBoolean`,
  `setNumber`, `has`, `remove`) against MMKV v4's **built-in Jest auto-mock** — a genuine
  round-trip (set then read back the value), proving the seam's API works end to end. No
  hand-written mock needed.
- `src/db/migrate.test.ts`: `jest/setup-db.ts` mocks `expo-sqlite` (`openDatabaseSync`) and
  the `drizzle-orm/expo-sqlite` + `.../migrator` modules suite-wide (expo-sqlite has no JS
  off-device — exactly firebase's situation). The test asserts `runMigrations()` calls
  `migrate()` with the committed bundle (and surfaces/records a failure). This proves the
  **wiring** — handle → drizzle → migrator — in CI. CI **cannot** assert tables actually
  materialize on disk; that half is on-device (the Maestro e2e launches the app, which runs
  migrations at startup — a startup that doesn't crash is the real-application proof, exactly
  like firebase "must not break app launch").

### D8 — Both ride the existing iOS `useFrameworks: "static"`; no new build-properties
Firebase already set `ios.useFrameworks: "static"`. expo-sqlite and MMKV v4/Nitro link fine
under static frameworks; no new `expo-build-properties` change. `expo-sqlite` adds a config
**plugin** entry; MMKV v4 autolinks with **no** plugin. Verified only by a real `prebuild`
(config-shape, not source) — prose, not lint (R-1). The escape if a Nitro/SQLite pod breaks
under static linking is the same documented `ios.forceStaticLinking` lever firebase named.

## Risks / Trade-offs

- **MMKV v4 Nitro is newer than v3** → the Nitro toolchain is a moving target; mitigated by
  the seam (swap to v3 or another KV behind `src/storage/` with no call-site changes) and by
  v4 being stable (4.3.1) and the only New-Arch-native line.
- **Babel/Metro configs created where none existed** → introduces config files Expo otherwise
  defaulted; mitigated by building them from `getDefaultConfig`/`babel-preset-expo` (the Expo
  defaults) plus only the documented Drizzle additions — `tsc`/lint/Jest/e2e catch a botched
  config immediately.
- **expo-sqlite untestable in Jest** → wiring-only CI proof; mitigated by the e2e launch
  exercising the *real* runner at startup (D7), same posture as firebase.
- **`static` frameworks + a new Nitro/SQLite pod** → could break the iOS pod link app-wide;
  mitigated by validating after a real `prebuild` and the `forceStaticLinking` escape (D8).
- **Empty migration bundle** → looks like "nothing happened"; mitigated by the runner proof
  (it *does* create the tracking table) and the recorded contract that features add the first
  real migration via the wired toolchain.

## Migration Plan

Additive; rollback = revert + remove the deps and the babel/metro/drizzle config. Order: add
deps → `app.config.ts` (`expo-sqlite` plugin) → `babel.config.js` + `metro.config.js` +
`drizzle.config.ts` + `generate:migrations` script → `src/storage/` seam + round-trip test →
`src/db/` (handle + drizzle instance + empty committed bundle + `runMigrations` + Jest mock +
proof test) → `_layout.tsx` startup invocation → seam-import lint rule → Architecture Book +
roadmap. Gate on `tsc`, `npm run lint` (zero warnings), `npm test`. Real migration application
is exercised by the existing Maestro e2e launching the app (no new flow needed this step).

## Open Questions

None blocking. Deferred (recorded, not built): MMKV encryption / secure-store for sensitive
data; a query/repository layer + `useLiveQuery`; the `useMigrations()` loading-gate pattern
(documented for the first feature whose first read must wait on its tables); a TanStack Query
SQLite persister; K-3 coverage threshold (Settings).
