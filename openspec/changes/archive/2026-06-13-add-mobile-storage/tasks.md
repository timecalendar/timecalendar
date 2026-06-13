## 1. Dependencies + native config

- [x] 1.1 `npx expo install expo-sqlite` (Expo-aligned, ~56); `npm i react-native-mmkv react-native-nitro-modules drizzle-orm`; `npm i -D drizzle-kit babel-plugin-inline-import`. Update the lockfile. Run `npx expo-doctor` to confirm version alignment.
- [x] 1.2 `app.config.ts`: add `"expo-sqlite"` to the `plugins` array. Confirm **no** new `expo-build-properties` change is needed (MMKV v4/Nitro + expo-sqlite link under the existing `ios.useFrameworks: "static"` — D8); MMKV autolinks with no plugin entry.

## 2. SQL-bundling toolchain (Drizzle on Expo)

- [x] 2.1 Create `mobile/babel.config.js` from `babel-preset-expo` plus `["inline-import", { extensions: [".sql"] }]` (D5).
- [x] 2.2 Create `mobile/metro.config.js` from `getDefaultConfig(__dirname)` plus `config.resolver.sourceExts.push("sql")` (D5).
- [x] 2.3 Create `mobile/drizzle.config.ts`: `dialect: "sqlite"`, `driver: "expo"`, `schema: "./src/db/schema.ts"` (path reserved for the first feature; file need not exist yet), `out: "./src/db/migrations"`.
- [x] 2.4 Add a `generate:migrations` script to `mobile/package.json` (`drizzle-kit generate`). Document in the script/README comment that it needs a schema to emit anything (none exists this step — D4).

## 3. Key-value seam (`src/storage/`)

- [x] 3.1 Create `src/storage/index.ts`: one module-scoped `createMMKV()` instance; export minimal typed helpers `getString`/`setString`, `getBoolean`/`setBoolean`, `getNumber`/`setNumber`, `has`, `remove` — thin pass-throughs (D1). No JSON-object helper (no consumer; R-2).

## 4. Relational seam + migration runner (`src/db/`)

- [x] 4.1 Create `src/db/index.ts`: one module-scoped `openDatabaseSync("timecalendar.db")` handle and `drizzle(expo)` instance, lazily/module-scoped (D2). Export the `db` instance.
- [x] 4.2 Create the committed empty migration bundle under `src/db/migrations/` — `_journal.json` with empty `entries` and a `migrations.js`/`migrations.ts` exporting `{ journal, migrations: {} }`, the shape `migrate()` consumes (D4). Do **not** invent a feature/no-op table.
- [x] 4.3 Create `src/db/migrate.ts`: `runMigrations()` — async, non-hook, calls `migrate(db, migrations)` from `drizzle-orm/expo-sqlite/migrator` with the committed bundle; on failure, `recordError` through `@/firebase` (D3). No `useMigrations()` hook this step.
- [x] 4.4 Invoke the runner at startup from `src/app/_layout.tsx` (fire-and-forget, mirroring the i18n side-effect wiring) — migrations applied before features read tables (D3).

## 5. Seam-import lint boundary (R-1, D6)

- [x] 5.1 `mobile/eslint.config.js`: add a `no-restricted-imports` pattern banning `react-native-mmkv`, `expo-sqlite`, and `drizzle-orm` (+ subpaths) everywhere **except** `src/storage/**` and `src/db/**` (exempt the seam dirs). Confirm the seam files themselves still lint clean.

## 6. Proof tests (R-1, D7)

- [x] 6.1 `src/storage/storage.test.ts`: round-trip each typed helper against MMKV v4's built-in Jest auto-mock — `setString`→`getString`, boolean, number, `has` true/false, `remove` then `has` false. A real round-trip, no hand-written mock.
- [x] 6.2 `jest/setup-db.ts`: mock `expo-sqlite` (`openDatabaseSync`), `drizzle-orm/expo-sqlite` (`drizzle`), and `drizzle-orm/expo-sqlite/migrator` (`migrate`) suite-wide (expo-sqlite has no off-device JS — D7); register in `jest.config.js` `setupFilesAfterEnv`.
- [x] 6.3 `src/db/migrate.test.ts`: assert `runMigrations()` calls the mocked `migrate()` with the committed bundle; assert a thrown migration error is recorded through `@/firebase` (mock the firebase seam or assert via the existing firebase mock).

## 7. Gates (local verification)

- [x] 7.1 `npx tsc --noEmit` clean in `mobile/`.
- [x] 7.2 `npm run lint` clean in `mobile/` with `--max-warnings 0` (the new seam-import rule passes; seam dirs exempt).
- [x] 7.3 `npm test` green in `mobile/` (storage round-trip + migration-runner wiring proofs + existing suites).
- [x] 7.4 (`npm run generate` **not** needed — no OpenAPI/server change.)

## 8. Docs

- [x] 8.1 Add a **Storage** section to `.claude/rules/mobile/architecture.md`: the two seams (`src/storage/` over MMKV v4/Nitro; `src/db/` over expo-sqlite + Drizzle), the startup migration runner over the committed bundle (empty this step — runner exists, schemas come with features), the SQL-bundling toolchain (drizzle-kit + babel inline-import + metro `.sql`), the seam-import lint boundary (R-1 pointer to `eslint.config.js`), the `useFrameworks: "static"` interaction (no new build-properties — pointer), and **what CI proves (seam round-trip + runner wiring) vs. on-device (real migration application via the e2e launch)** — caveats tooling can't carry (R-1). Note the `useMigrations()` loading-gate pattern features inherit when a first read must wait on tables.
- [x] 8.2 Append a Rule changelog entry to `.claude/rules/mobile/architecture-changelog.md` (new Storage rule era + the seam-import lint boundary).
- [x] 8.3 Mark step 9 done in `docs/react-native-migration/01-roadmap/01-foundation.md` with a one-line summary of what landed.

## 9. Native verification (on-device — not gated by CI; no human-only prerequisite)

- [x] 9.1 `npx expo prebuild --clean` then `npm run ios` (and/or `npm run android`): confirm the app **builds with the new native modules under `useFrameworks: "static"`** and **launches without crashing** — the real proof the migration runner runs at startup and MMKV/SQLite link. (No new Maestro flow needed; the existing schools e2e flow launching the app exercises the runner. If a pod breaks under static linking, apply the documented `ios.forceStaticLinking` escape — D8.)
