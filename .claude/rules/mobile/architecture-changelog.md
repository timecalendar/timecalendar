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
