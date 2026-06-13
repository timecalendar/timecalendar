# Storage seams for mobile: MMKV (key-value) + expo-sqlite/Drizzle migration runner

## Why

`mobile/` has **no persistent storage**: nothing survives an app restart beyond the
in-memory `QueryClient` cache. Foundation roadmap step 9 (and migration-approach §1's
vertical slice — the walking skeleton wires every cross-cutting system *before* the first
real feature) makes the two storage seams live and CI-green now, so the day a feature needs
a persisted setting or a local table the *seams and the migration runner already exist* and
the feature only adds its keys/schema, not the plumbing. **Scope discipline (roadmap risk
note):** this builds the seams and the **migration runner** — **no feature schemas, no
feature tables, no persisted keys**. The skeleton walks; it doesn't run.

## What Changes

- **`react-native-mmkv` (v4)** added to `mobile/` for synchronous key-value storage, plus its
  required `react-native-nitro-modules` peer. Wrapped behind a thin **`src/storage/`** seam
  (the firebase/api-mutator "behind our own abstractions" posture, step 10): feature code
  imports `@/storage`, never `react-native-mmkv` directly, so the backend is swappable.
- **`expo-sqlite` (Expo-managed, ~56) + `drizzle-orm` + `drizzle-kit`** added for the local
  relational store. A thin **`src/db/`** seam owns the single `openDatabaseSync` handle, the
  Drizzle instance, and a **migration runner** (`runMigrations`, over
  `drizzle-orm/expo-sqlite/migrator`'s non-hook `migrate()`) that applies the **committed,
  ordered migration bundle** at app startup. The bundle is **empty this step** (zero feature
  tables) — the runner is proven to run and advance the journal/tracking table; schemas and
  their migrations land with the features that own them.
- **Native modules → `app.config.ts` plugins**, CNG-regenerated on the next `expo prebuild`
  (no hand-edited native). `expo-sqlite` registers as a config plugin; `react-native-mmkv`
  v4/Nitro autolinks with no plugin entry. Both ride the existing iOS `useFrameworks:
  "static"` (set by firebase) — no change there.
- **Drizzle codegen toolchain wired**: `drizzle.config.ts`, a `generate:migrations` npm
  script, plus the **`babel.config.js` `inline-import` plugin** and **`metro.config.js`
  `.sql` source extension** Drizzle needs to bundle `.sql` migration files. (No `.sql` files
  exist yet — the toolchain is ready for the first feature.)
- **Seam-boundary lint rule (R-1)**: `no-restricted-imports` bans direct
  `react-native-mmkv`, `expo-sqlite`, and `drizzle-orm`/`drizzle-orm/*` imports **outside
  `src/storage/**` and `src/db/**`**, encoding the seam boundary the firebase section only
  documented in prose.
- **Two proof tests** mirroring the i18n/a11y/firebase proofs: the MMKV seam **round-trips**
  a value through MMKV v4's built-in Jest auto-mock (get/set/delete/has); the migration
  runner **drives `migrate()` with the committed bundle** through a mocked SQLite seam
  (expo-sqlite has no Node/Jest implementation — like firebase's native modules — so wiring
  is proven in CI; the actual on-device application is the e2e/manual half).
- **Architecture Book** gains a **Storage** section (the two seams, the runner, the bundling
  toolchain, the lint boundary, what CI proves vs. what's on-device); roadmap step 9 marked done.

## Capabilities

### New Capabilities

- `mobile-storage`: the mobile app's persistence layer — the two swappable seams
  (`src/storage/` over MMKV v4 for key-value; `src/db/` over expo-sqlite + Drizzle for the
  relational store), the startup **migration runner** over a committed ordered migration
  bundle (empty this step, runner proven), the SQL-bundling codegen toolchain (drizzle-kit +
  babel inline-import + metro `.sql`), the seam-import lint boundary, and what CI proves
  (seam round-trip + runner wiring) vs. what is verified on-device (real migration
  application via e2e).

### Modified Capabilities

<!-- none. No existing capability's requirements change. mobile-architecture-book gains a
Storage section — normal book evolution per R-1, not a requirement change. The seam-import
lint rule extends the existing lint surface but introduces a new boundary owned by this new
capability, not a change to mobile-lint-format's requirements. -->

## Impact

- `mobile/`: new deps (`react-native-mmkv`, `react-native-nitro-modules`, `expo-sqlite`,
  `drizzle-orm`; dev: `drizzle-kit`, `babel-plugin-inline-import`); new `src/storage/`
  (seam + round-trip proof test) and `src/db/` (handle + Drizzle instance + `runMigrations`
  runner + empty committed migration bundle + proof test); `drizzle.config.ts`;
  `babel.config.js` + `metro.config.js` (created — Drizzle SQL bundling); `app.config.ts`
  (`expo-sqlite` plugin); `_layout.tsx` runs migrations at startup; `eslint.config.js`
  (seam-import boundary); `package.json` (`generate:migrations` script); `jest/setup-db.ts`
  (mock the SQLite seam suite-wide).
- `.claude/rules/mobile/architecture.md`: Storage section added.
- `docs/react-native-migration/01-roadmap/01-foundation.md`: step 9 marked done.
- No server/web/`app/` code touched. No OpenAPI change (`npm run generate` not needed).
  Native projects are CNG/gitignored and regenerate on the next `prebuild`.
- **No human-only prerequisite** (unlike firebase's console registration): storage needs no
  external console, credentials, or store action.
