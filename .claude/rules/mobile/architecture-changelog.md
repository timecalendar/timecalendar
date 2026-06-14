# Rule changelog — TimeCalendar mobile

One of the [five living artifacts](./architecture.md#the-five-living-artifacts). A
dated, **append-only** (newest last) log of every change to the rules — the
[Architecture Book](./architecture.md) or the [Definition of Done](./definition-of-done.md).
Per migration-approach §7, **the act of changing the rules is itself recorded here**:
any change that establishes, moves, or retires a rule appends an entry.

Each entry: date · change · what rule moved · why · link to the Architecture Book
section it lives in. Dates are the change's landing date.

This log is **backfilled** to start truthful — the book already documented seven rule
eras before this changelog existed, so an empty log would misrepresent history. The
entries below the backfill marker were authored retroactively from those landed
changes (dates from the archived change directory names / merge commits); everything
from this change forward is appended live.

---

### Backfilled — rule eras that landed before this changelog existed

- **2026-06-12 · `scaffold-mobile-expo`** — Seeded the scaffold-time rules: runtime
  baseline (Expo SDK 56, New Arch + Hermes), `mobile/` as a standalone npm project
  (D7 revision), TS strict flags, CNG native projects (gitignored, never hand-edited),
  `APP_VARIANT` app identity, minimum OS floors (iOS 16.4 / API 24, K-2 revisit fired).
  *Why:* the foundation's first rules, established as the codebase came alive.
  → Architecture Book "Scaffold-time rules".

- **2026-06-12 · `add-mobile-api-client`** — Data layer: the committed-spec seam
  (`openapi/openapi.json`), Orval-generated TanStack Query client (committed, never
  hand-edited), the single `customFetch` mutator (no axios), base-URL config, and a
  stock-defaults `QueryClient`. *Why:* one reviewable server↔mobile contract and one
  fetch seam. → Architecture Book "Data layer". (Its ADR is a
  [pending lift](./decisions/README.md#pending-lifts).)

- **2026-06-12 · `add-mobile-test-harness`** — Testing rules: `jest-expo` harness,
  mock-at-the-`customFetch`-seam, coverage reported-not-gated; Maestro real-round-trip
  e2e, shared server lifecycle, release-config dev-variant e2e builds; dev-variant
  network exceptions; the route-screen / non-tab-route navigation rules (discovered on
  a simulator). *Why:* a green test floor and the navigation rules it surfaced.
  → Architecture Book "Testing", "Navigation & route structure".

- **2026-06-12 · `add-mobile-lint-format`** — Lint & format: ESLint 9 flat config,
  Prettier-as-lint-error, zero-warnings policy, pre-commit; the rule inventory
  (no-hardcoded-strings, a11y-on-touchables, navigation ban, import boundaries,
  no-raw-fetch / no-axios — paying the data-layer R-1 debt). *Why:* encode the rules
  R-1 says must be encoded. → Architecture Book "Lint & format".

- **2026-06-13 · `add-mobile-i18n`** — i18n runtime (the lint half was already live):
  module-scoped i18next + react-i18next + expo-localization, device-locale with EN
  fallback, flat greppable keys (`keySeparator: false`), `tsc`-typed FR/EN parity, a CI
  proof test; scaffold reshaped to the real app's tabs (Accueil / Profil, Calendar
  deferred). *Why:* pay off the no-hardcoded-strings rule with a real runtime.
  → Architecture Book "i18n".

- **2026-06-13 · `add-mobile-a11y`** — a11y runtime (the lint half was already live):
  the heading-role contract encoded in `ThemedText`, accessible async status on the
  schools screen, a CI proof test; recorded as prose what lint can't encode (Dynamic
  Type, touch targets, meaningful labels, manual screen-reader passes, reduced motion,
  contrast) with reason + owner. *Why:* the runtime half of accessibility + naming the
  obligations the DoD inherits. → Architecture Book "Accessibility".

- **2026-06-13 · `add-mobile-firebase`** — Firebase: `@react-native-firebase/*` v24
  modular API behind a thin `@/firebase` seam, one Firebase project per environment
  (variant-switched config), iOS static frameworks, `crashlytics_debug_enabled`, the
  `__DEV__` `FirebaseDebugPanel` (first live exercise of the a11y touchable rules), a CI
  proof test; discharged the scaffold-era `.dev` Firebase-registration deferral. *Why:*
  the first real instrumentation in the skeleton. → Architecture Book "Firebase".

---

### Live — appended as rules change

- **2026-06-13 · `add-mobile-living-artifacts`** — Created the four remaining
  [living artifacts](./architecture.md#the-five-living-artifacts) beside the book: the
  ADR log ([`decisions/`](./decisions/README.md) — README + template + K-1…K-5 authored
  as real ADRs 001–005, satisfying the Phase 0 exit criterion, including the K-1/K-2
  revisits that already fired), the [Definition of Done](./definition-of-done.md) (the §5
  checklist enriched with every obligation the book parked on it), this changelog
  (backfilled with the seven prior rule eras), and the
  [golden-path placeholder](./golden-path.md) (an honest Phase-1.5 signpost). The book
  gained its "The five living artifacts" pointer section and its scattered
  forward-references now resolve to these real files. *Why:* foundation step 12 — every
  later slice now has a real DoD to pass, ADR log to append to, and changelog to record
  in. No rule text changed (wiring only), but it is a book change, so it earns this entry.

- **2026-06-13 · `add-mobile-storage`** — Storage: two swappable persistence seams —
  `@/storage` over `react-native-mmkv` v4 (Nitro) for key-value, `@/db` over
  `expo-sqlite` + `drizzle-orm` for the relational store — plus a non-hook startup
  **migration runner** (`runMigrations()` over `drizzle-orm/expo-sqlite/migrator`,
  failure → `@/firebase`) applying a **committed but empty** migration bundle (runner
  proven, zero feature tables — R-2), the SQL-bundling toolchain (`drizzle.config.ts` +
  `generate:migrations` + created `babel.config.js`/`metro.config.js` for `.sql`), and a
  **new seam-import lint boundary** (`no-restricted-imports` bans the backends outside the
  seam dirs — encoding what the firebase section left in prose). Two CI proof tests
  (MMKV real round-trip via the built-in mock; runner wiring with SQLite mocked). Both
  ride the existing iOS `useFrameworks: "static"` — no new build-properties. *Why:*
  foundation step 9 — the persistence plumbing the first feature needs, wired before it.
  → Architecture Book "Storage".

- **2026-06-13 · `add-mobile-theming`** — Theming & native-chrome: a first-class typed
  token layer under `src/theme/` (`tokens.ts` — colors light/dark, spacing, the new
  `Radii` scale, typography; `use-theme.ts` moved off `src/hooks/`; `index.ts` re-exports
  the surface and keeps the `@/global.css` side-effect) **consolidating and deleting** the
  loose `constants/theme.ts` + `hooks/use-theme.ts`; `Themed*` and every consumer repointed
  at `@/theme` with the `ThemedText` heading-role contract preserved byte-for-byte (its a11y
  proof passes unmodified). Our own swappable native-chrome wrappers under
  `src/components/chrome/` — `NativeTabs` (the single import site for
  `expo-router/unstable-native-tabs`, themed from `@/theme`; `app-tabs.tsx` repointed),
  `GlassSurface` (the single import site for `expo-glass-effect`, centralizing the iOS-26+
  Liquid-Glass / fallback decision in one place), and an **`@expo/ui` boundary-only seam**
  (no rendered stub — no consumer yet, R-2/D6). A **new chrome-boundary lint rule**
  (`no-restricted-imports` bans the three alpha APIs outside `src/components/chrome/`,
  mirroring the mutator/storage seam pattern — static-import-only caveat recorded). WCAG-AA
  contrast pairs documented in `tokens.ts` (discharging the contrast DoD ownership the a11y
  section deferred to theming; runtime checker deferred with trigger). One CI proof test
  (token resolves light/dark + GlassSurface fallback renders). No new deps, no `app.config.ts`
  change. *Why:* foundation step 10 — the wrapper layer is the roadmap's insurance against
  alpha-API churn, and the token home the splash (step 13) and features build on.
  → Architecture Book "Theming & native-chrome".

- **2026-06-13 · `add-mobile-eas`** — EAS / distribution: the skeleton's first release
  path. `mobile/eas.json` with three build profiles split along the `APP_VARIANT` line —
  `development` (`.dev` id, simulator + APK, dev client), `preview` (production identity,
  `internal` distribution, device `.ipa` + APK, `preview` channel — the dogfood track),
  `production` (`store`, `.aab` + `.ipa`, `production` channel, `autoIncrement`); a
  **secret-free** `submit` skeleton (iOS via `$EXPO_*` env, Android `serviceAccountKeyPath`
  outside git); `expo-updates` wired in `app.config.ts` with **`runtimeVersion: { policy:
  "fingerprint" }`** and the `updates.url` / `extra.eas.projectId` seam reading
  `EAS_PROJECT_ID` (zero-UUID placeholder until the human `eas init`). **EAS stays
  human-invoked — CI untouched**, no `.eas/workflows/` (the native E2E keeps building via
  `prebuild`). New ADR [006](./decisions/006-eas-distribution.md) (fingerprint policy +
  human-invoked-EAS, load-bearing — D3/D4). **No Jest proof test** (D8 justified N/A:
  config not runtime; the EAS CLI + `expo config --json` are the enforcing gates, R-1).
  This change is also the **first to use the handoff inbox**. The
  credential/account/console/device half is in
  `docs/react-native-migration/inbox/2026-06-13-eas-credentials.md`. *Why:* foundation
  step 11 — configure so a human *can* dogfood on a real device. → Architecture Book
  "EAS / distribution".

- **2026-06-13 · `add-mobile-splash`** — Splash: a JS animated splash overlay
  (`src/components/splash-screen.tsx`) over the existing static native splash —
  `expo-splash-screen`'s `preventAutoHideAsync()` (global) holds the native splash, the
  overlay continues it (brand from `@/theme` tokens + `t("app.name")`, light/dark),
  `hideAsync()` runs the native→JS handoff, and the overlay fades out (or cuts under
  reduced motion) once a `useAppReady()` readiness gate resolves. New gate hook
  (`src/hooks/use-app-ready.ts`) coordinating i18n/fonts/migrations that **always
  resolves** (synchronous today + a load-bearing watchdog cap) — the reusable
  render-when-ready pattern. **Reduced-motion contract encoded in the component** (the
  app's first animation, R-1: lint can't know which view animates) — **discharging the
  a11y section's recorded reduced-motion deferral** (that "What lint can't encode" note
  now points at the new Splash section). One CI proof test (localized brand renders,
  accessible status resolves, both reduced-motion branches, dismissal) + a suite-wide
  `jest/setup-splash.ts` mock (mirrors setup-firebase/setup-db); `app.config.ts` native
  splash background documented as the pre-JS scheme-asymmetry exemption; prebuild
  validated. **No new rule encoded** — the splash consumes existing seams (theme/chrome
  boundaries, i18n, a11y, firebase) and the only new prose rule (the reduced-motion
  contract) is, by R-1, unencodable. This is the **first feature through the entire
  DoD**; the irreducibly on-device axes are inboxed + HUMAN-tagged
  (`inbox/2026-06-13-splash-dod-manual.md`), Phase-0 exit gated on that manual pass.
  *Why:* foundation step 13 — the Phase-0 capstone, the DoD walked end-to-end.
  → Architecture Book "Splash".

- **2026-06-13 · `drop-mobile-web-and-brand-theme`** — Theming-readiness +
  platform-scope cleanup ahead of Phase-1 Settings. **Web target dropped** (iOS +
  Android only): removed the `app.config.ts` `web` block, the `"web"` script +
  `react-dom` / `react-native-web` deps (lockfile regenerated), the `Fonts.web`
  `Platform.select` branch + its now-orphaned `@/theme/index.ts` `import "@/global.css"`
  side-effect, and the four web-only files (`app-tabs.web.tsx`, `use-color-scheme.web.ts`,
  `global.css`, `favicon.png`); `Fonts.mono` preserved (`ios`/`default` kept) for the
  parallel-issue-owned `themed-text.tsx`. **Single color-scheme seam (C1):** `_layout.tsx`
  now reads `useColorScheme` through `@/hooks/use-color-scheme` (the same seam `useTheme`
  uses), so Settings' future override has one place to override. **Tokenized RN nav theme
  (C2):** a pure `buildNavTheme(scheme)` helper (`src/theme/nav-theme.ts`, re-exported from
  `@/theme`) spreads the stock `DefaultTheme`/`DarkTheme` (imported from `expo-router`, not
  `@react-navigation` — lint-banned) and overrides `colors` from tokens, fed to
  `ThemeProvider` so nav chrome can't drift from `@/theme`. **Pink brand `primary` token**
  (`light = #E91E63` accent/tint, `dark = #FF4081`) with **re-verified WCAG-AA contrast**
  documented in `tokens.ts` — the load-bearing rule: white text on brand rides `#C2185B`
  (5.87:1), the identity pink is accent/tint (3:1 UI bar); native splash `backgroundColor`
  re-tinted `#208AEF` → `#E91E63`. **`BottomTabInset` removed** (unused; `Radii` kept).
  Two new ADRs ([007](./decisions/007-drop-web-target.md) web drop,
  [008](./decisions/008-brand-color.md) brand hue, both load-bearing — R-4) + README rows.
  Extended `theme.test.tsx` (brand `primary` per scheme + the `buildNavTheme` nav↔token
  contract). **No new lint rule** (R-1/D7: the web drop removes deps, C1/C2/brand are
  code+config — inventing a "no-react-native-web" rule would be cargo-cult); gates are
  tsc/lint/test + `expo prebuild --clean`. *Why:* prepare clean theming ground (brand
  token, one scheme seam, tokenized nav) for Phase-1 Settings and shed the unused web
  surface. → Architecture Book "Theming & native-chrome", "Scaffold-time rules".

- **2026-06-14 · `add-mobile-import-order-lint`** — Lint & format: a new
  **import/export-order rule** (`eslint-plugin-simple-import-sort`,
  `simple-import-sort/imports` + `/exports`, error, autofixable) in the
  `timecalendar/architecture` block. Canonical group order **side-effect → Node
  builtins + third-party → `@/` alias → relative** (`importSortGroups`), complementing
  the existing `../` ban (which makes the `@/`-as-its-own-group split unambiguous —
  relative is only ever `./…`); side-effects sit at the top and keep their relative
  order so the `import "@/i18n"` init seam is not reordered; no bare `^` catch-all
  (groups stay disjoint, so the plugin's longest-match-wins tie-break never bites);
  generated code stays exempt. Ran a
  one-time `eslint --fix` sweep that normalized import/export order in 6 files (order
  only — no behavior change; tsc/lint/test green). `simple-import-sort` chosen over
  `import/order` as the lighter, resolver-free idiomatic default. **No ADR** (tooling,
  not architectural — the issue, TIM-121 §E1, said so) and **no Jest proof test** (a
  lint rule's enforcement *is* the gate, R-1; an "imports are sorted" test would be
  cargo-cult). Closes the last open lint gap from the Phase-0 scaffolding review
  (TIM-117 §E1). *Why:* lock in the import order that was previously hand-maintained,
  before features multiply the import surface. → Architecture Book "Lint & format".

- **2026-06-14 · `add-mobile-settings-prefs`** — Phase-2 Feature A (Settings),
  **data/logic layer only** (the screen is A2/TIM-131). The repo's **first feature
  folder** (`src/features/settings/prefs/`) — two typed, defensively-validated
  preferences (theme + language, both default `"system"`, validators make a read
  total) persisted behind `@/storage`. A **minimal reactive `@/storage` seam
  extension** (`useStoredString` over MMKV v4's `useMMKVString` bound to the
  module-scoped instance, read-only) — it lives in the seam because
  `react-native-mmkv` is lint-banned outside it. Wires the prefs into the two
  foundation extension points: the **C1 theme seam** (`@/hooks/use-color-scheme`
  resolves a stored light/dark override, **preserving the `ColorSchemeName` return
  contract** — the promised single-file change), and **i18n** (startup `lng` via
  `getInitialLocale()` read from the *store module* not the barrel, so no cycle;
  runtime `changeLanguage` in the language hook's setter). The dependency graph stays
  a clean DAG. **The K-3 coverage gate is now enforced** (`jest.config.js`
  `coverageThreshold`: 90% logic globs / 70% global floor; `.d.ts` + the
  E2E-covered `src/app/**` and `src/api/{mutator,config}` excluded with recorded
  reasons), landed **green** via the supporting tests this change added
  (`use-app-ready`, the `use-color-scheme` C1 seam, the `use-theme` unspecified
  branch, the `migrate` non-Error branch); `setup-storage` reordered before
  `setup-i18n` so the MMKV mock loads before i18n init reads the store; the
  `ci-mobile.yml` "no coverageThreshold yet" comment updated. New ADR
  [009](./decisions/009-settings-feature-prefs.md) (feature folder + the
  infra-consumes-feature edge, revisit pinned to `eslint-plugin-boundaries` /
  TIM-135); ADR [003](./decisions/003-coverage-threshold.md) flipped to **enforced**
  in place (revisit fired). The Theming C1 note + the Testing/Storage K-3 notes now
  point at the wired override / enforced gate. **Observability is ➖ N/A** (D6 —
  MMKV reads/writes are synchronous, in-process, infallible; no error path to
  record). *Why:* Phase-2 opens with Settings' data layer — the persisted prefs and
  the reactive hooks features read — and discharges the C1 / device-only-locale /
  K-3 loose ends the foundation pinned to "the first logic-bearing feature."
  → Architecture Book "Settings preferences".

- **2026-06-14 · `add-mobile-settings-screen`** — Settings **UI layer** (A2 / TIM-131,
  Feature A's screen + native controls over A1's hooks — **no new prefs logic**). The
  **first `@expo/ui` chrome wrapper** landed: `src/components/chrome/expo-ui.tsx` is the
  single import site for `@expo/ui` (the universal `Host` + `Picker`), exported from the
  chrome barrel — **discharging the theming-D6 deferral** (the barrel's `@expo/ui`
  boundary-only note flipped to "wrapper landed"). The wrapper is **thin**: it does not
  theme the OS-chromed picker (R-3) and bakes in no higher-level component (R-2). A
  **presentational** Settings screen (`src/components/settings-screen.tsx`, under the 70%
  floor — exempt from the 90% logic gate per ADR 003, **no `jest.config.js` change**) with
  two native single-select pickers driving `useThemePreference` / `useLanguagePreference`;
  a thin route `src/app/settings.tsx`; `<Stack.Screen name="settings" />` (Stack sibling of
  `(tabs)`) + an accessible Profile→Settings `Link`/`Pressable` (role + translated label +
  ≥44pt/48dp hit area) — **the first real product touchable**, where the `react-native-a11y`
  touchable rules and the touch-target obligation first bite. New FR/EN keys (`settings.*`,
  `profile.settings.link`, `tsc`-typed parity); a suite-wide `jest/setup-expo-ui.ts` mock
  (mirrors `setup-firebase`/`setup-splash`); one proof test (render + control→hook wiring);
  a Maestro flow (`.maestro/settings.yaml`) proving render + reachability only (no
  native-picker toggle — not deterministically drivable across platforms, D5). New ADR
  [010](./decisions/010-expo-ui-chrome-wrapper.md) (`@expo/ui` adopted behind the chrome
  seam; universal entry the default — load-bearing, R-4). **No `app.config.ts` / babel
  change** (`@expo/ui` autolinks, babel-plugin `Icon`-only — verified via a clean
  `prebuild`). **A2 is the first interactive product control through the entire DoD**; the
  irreducibly on-device axes (VoiceOver/TalkBack, native-picker feel, contrast, touch-by-
  finger, jank, Maestro-through-the-picker) are inboxed + HUMAN-tagged
  (`inbox/2026-06-14-settings-screen-dod-manual.md`), Feature A's DoD pass gated on that
  manual pass. **No new lint rule** (the chrome boundary already banned `@expo/ui`; A2
  fills the wrapper body it pointed at). *Why:* Phase-2 Feature A's screen — the UI over
  A1's data layer, and the first `@expo/ui` consumer. → Architecture Book "Theming &
  native-chrome", "Settings preferences".

- **2026-06-14 · `add-mobile-personal-events-data`** (B1 / TIM-132) — Phase-2 Feature B,
  **data layer only** (the screen / forms / native date-time pickers / list / route are a
  later B-issue). **Discharges the storage step's deliberate deferrals:** the repo's first
  real `src/db/schema.ts` (`personalEvents`, SQL `personal_events`) whose columns mirror the
  Flutter `PersonalEvent.toMap()` wire format **verbatim** for Phase-09 importer fidelity
  (`uid` TEXT pk, `title`/`color` TEXT, `startsAt`/`endsAt`/`exportedAt` TEXT UTC ISO-8601,
  nullable `location`/`description`; `kind` not stored); the **first real migration**
  (`npm run generate:migrations` → committed `0000_*.sql` + advanced `meta/_journal.json` +
  one-entry `migrations.js`), **replacing the empty bundle** (runner + `migrate.test.ts`
  unchanged — now one entry, not zero). The **`@/db` seam widened** to re-export the query
  operators the feature needs (`eq`/`and`/`gte`/`lte`), `useLiveQuery`, and the
  `personalEvents` table — the encoded form of "the feature never imports `drizzle-orm`"
  (R-2: only what a consumer needs). The **second `src/features/` folder**,
  `personal-events/data/` (mirroring Settings' `prefs/` shape): `types.ts` (domain type +
  pure `rowToEvent`/`eventToRow` mappers normalizing every write to canonical UTC),
  `repository.ts` (async CRUD over `@/db` — `findAll`/`getById`/`upsert`-by-uid/`remove`/
  `findInRange`), `uid.ts` (`newEventId()` over `expo-crypto` `randomUUID`, swappable; the
  importer supplies its own uid), `hooks.ts` (`usePersonalEvents()` reactive read over
  `useLiveQuery`), barrel. **New dep `expo-crypto`** — **autolinks with no plugin entry**
  (ships no config plugin; verified by `prebuild` — do not add to `app.config.ts`); mocked
  under Jest so CI `test-mobile` is unaffected. New **ADR
  [011](./decisions/011-personal-event-storage.md)** (dates TEXT ISO-8601 UTC over epoch-ms,
  color `#RRGGBB` TEXT verbatim, uid from `expo-crypto` — load-bearing, importer fidelity +
  range-query, R-4). The **K-3 coverage gate** (`src/db/**`, `src/features/**` at 90%) lands
  **green** (mappers/uid/repository/hook 100%). **No new lint rule** (the `src/db/**` storage
  seam already exempts the schema's backend import; the seam widening rides the existing
  rule); **no `app.config.ts` plugin change** (`expo-crypto` autolinks); **no OpenAPI /
  server / web / `app/` change, no inbox handoff** (no human prerequisite). *Why:* Phase-2
  Feature B's data layer — the first structured device-local schema, the first real
  migration, the data the future B-screen consumes. → Architecture Book "Storage → First
  feature schema — personal events".

- **2026-06-14 · `add-mobile-personal-events-ui`** (B2 / TIM-133) — Phase-2 Feature B's
  **UI layer** over B1's data layer (list + create/edit/delete form + native date/time
  pickers + validation + write error path). The **second feature through the full DoD** and
  the **first with a multi-field form** + a **genuine write error path**. A reactive Home-tab
  list (`src/components/personal-events-list.tsx` over B1's `usePersonalEvents` `useLiveQuery`,
  with an Add action + empty state) behind the thin `(tabs)/index.tsx`; one create/edit form
  route (thin `src/app/personal-event-form.tsx` → `src/components/personal-event-form-screen.tsx`,
  a `<Stack.Screen>` sibling of `(tabs)`, optional `uid` param → prefill + delete; dev deep
  link). **Form/validation logic in the new `src/features/personal-events/form/`** (90%-gated:
  pure `validateEventForm` returning error keys, pure `buildEventFromForm` mirroring the Flutter
  `buildEvent`, and `useSaveEvent`/`useDeleteEvent`/`useEventToEdit` over B1's repository) vs.
  the **presentational screens** under `src/components/` (70% floor) — the ADR-003 split. The
  **second `@expo/ui` chrome consumer**: `chrome/expo-ui.tsx` now also re-exports `DateTimePicker`
  (the `@expo/ui/community/datetime-picker` subpath — `@expo/ui`'s own SwiftUI/Compose control,
  **not** `@react-native-community/datetimepicker`, **no new dependency**), under the same ADR-010
  universal posture; `jest/setup-expo-ui.ts` extended to mock the subpath (drives `onValueChange`).
  A custom preset **color-swatch picker** (`src/components/color-swatch-picker.tsx`, no new native
  dep) storing `#RRGGBB` verbatim (ADR 011); RN-core text inputs (D3). **Observability ✅ wired**
  (not N/A): a rejected `upsert`/`remove` is `recordError`'d through `@/firebase` + a failure flag
  surfaced (a DB write can fail, unlike A1's infallible MMKV), proven by a forced-rejection test.
  New FR/EN `personalEvents.*` keys (`tsc`-typed parity); a Maestro CRUD round-trip flow
  (`.maestro/personal-events.yaml` — create-via-text → list → delete, no native-picker drive, D5);
  CI proof tests for the logic (90% green), the list/form/picker→state wiring, and the error path.
  New **ADR [012](./decisions/012-personal-event-datetime-picker.md)** (the date/time-control
  choice — `@expo/ui`'s own `DateTimePicker` behind the existing wrapper, load-bearing — R-4) +
  README row. **No new lint rule** (the chrome boundary already bans the `@expo/ui` subpath; B2
  fills the wrapper); **no `jest.config.js`/`app.config.ts`/babel/dependency change**; **no
  data-layer / OpenAPI / server / web / `app/` change**. **A2-style DoD split:** automatable axes
  green in CI; the on-device axes (VoiceOver/TalkBack, native-picker feel/contrast, touch-by-finger,
  jank, Crashlytics arrival, Maestro-through-the-picker) inboxed + HUMAN-tagged
  (`docs/react-native-migration/inbox/2026-06-14-personal-events-ui-dod-manual.md`); Feature B's
  full DoD pass is gated on that manual pass. *Why:* Phase-2 Feature B's UI — the list/form/native
  pickers/delete over B1's data, the first multi-field form + real write error path.
  → Architecture Book "Storage → First feature schema — personal events → Personal events — CRUD UI"
  + "Theming & native-chrome".
