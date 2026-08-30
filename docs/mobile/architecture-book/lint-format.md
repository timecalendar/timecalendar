# Lint & format

The exact rules and their options live in `mobile/eslint.config.js` (named blocks:
`timecalendar/architecture`, `routes-not-importable`, `mutator-owns-fetch`,
`generated-code`, `timecalendar/feature-boundaries`, `timecalendar/chrome-seams`,
`timecalendar/calendar-kit-vendor-seam`, `timecalendar/activity-seam`,
`timecalendar/calendar-sources-is-a-leaf`, `timecalendar/storage-seams`,
`timecalendar/tests`). The config is the source of
truth; this file carries the caveats the config can't (R-1).

## Toolchain

- **ESLint 9 flat config** on `eslint-config-expo/flat`. **Prettier identical to
  web/server**, enforced as a lint error via `eslint-plugin-prettier` — one gate
  covers style and format, `eslint --fix` repairs both. `mobile/.prettierrc` is a
  hand-kept copy (the standalone-project placement), synced by hand.
- **Zero warnings.** `npm run lint` is `expo lint --max-warnings 0`, and CI runs that
  same entrypoint — local and CI cannot diverge on what "clean" means.
- **Pre-commit:** the `lint-staged` block in `mobile/package.json`
  (`eslint --cache --fix`), picked up by the root husky hook.
- `eslint-plugin-react-native-a11y` is ESLint-8-era: loaded via `fixupPluginRules`
  (`@eslint/compat`) with an npm `override` pinning its eslint peer. If its rules
  misbehave under a future ESLint, the fallback is a minimal local rule for touchables.

## Rule inventory

- **No hardcoded user-facing strings** (`i18next/no-literal-string`, error). Only the
  `timecalendar/tests` block exempts literal strings (test fixtures assert them on
  purpose).
- **A11y on touchables** (`react-native-a11y` touchable rules): touchables/pressables
  must declare a role or label+hint. Runtime semantics are in the a11y rules file.
- **Navigation** — `@react-navigation/*` imports banned; Expo Router is the only
  navigation API.
- **Import boundaries:** no parent-relative imports (`../`) — the `@/` alias is the
  only cross-directory path (which is what makes the alias-pattern rules sound); files
  outside `src/app/` may not import `@/app/*` (routes are entrypoints, not modules);
  `axios` banned.
- **Feature-module boundaries** (`eslint-plugin-boundaries` v6, the
  `timecalendar/feature-boundaries` block). Encodes ADR
  [014](./decisions/014-layered-feature-module-pattern.md)'s
  `data/`-only-seam / no-self-barrel-cycle / barrel-entry-point boundaries, layered on
  top of the `no-restricted-imports` seam bans (those ban a *package* by specifier;
  this governs feature-internal structure between *elements*). The block declares an
  element taxonomy (`boundaries/elements`: feature-sublayer / feature-barrel /
  generated-api / db-seam / route / component / infra-color-scheme / infra-i18n —
  sublayer before barrel so the deeper match wins) and one `boundaries/dependencies`
  rule (`default: "allow"` + three disallows; `no-unknown`/`no-unknown-files` off, so
  it governs only the named elements, not the whole tree):
  - **B-1** — only a feature's `data/` sublayer may import `@/api/generated/**` or
    `@/db` (the `!(data)` sublayer is the `from`); every other sublayer — **including
    the `ui/` screens** — goes through a barrel.
  - **B-2** — a feature sublayer may not import its **own** feature barrel (cycle; the
    `{{ from.feature }}` template binds the same feature, `internalPath: "index.*"`
    targets the barrel) — a sibling's sub-barrel is untouched. A `ui/` screen consumes
    its siblings' sub-barrels directly (e.g. `personal-event-form-screen` →
    `@/features/personal-events/form`, the school pickers → `…/data` + `/store`).
  - **B-3** — routes (`src/app/**`) and the shared components remaining in
    `src/components/**` (shell/primitives — feature screens have moved into
    `src/features/*/ui/`, governed as sublayers by B-1/B-2) must not import the seams
    directly. **One scoped exception** (last-write-wins `allow`): the root layout may
    import `@/db/migrate` — the `void runMigrations()` startup wiring, which is app
    infrastructure, not feature-data access (the `@/db` data surface stays banned).
  - **B-4** — the **ADR-009 infra→feature edge** (`@/hooks/use-color-scheme` and
    `@/i18n` importing `@/features/settings/prefs`[`/store`]) is **allowed** — the
    *absence* of a disallow naming `infra-*` as `from` (the resolution of ADR 009's
    parked revisit: allow as a documented seam, not promote).
  - The `ui/` sublayer (feature screens, ADR 014's fired open-sublayer revisit) needed
    **no new element type or rule** — it matches the existing `feature-sublayer` pattern
    (`src/features/*/*`, layer `ui`), so B-1/B-2 cover it automatically (comments-only
    `eslint.config.js` change).
  - **B-5 — the Activity seam** (`timecalendar/activity-seam`, ADR
    [048](./decisions/048-activity-refresh-single-flight-and-token-precondition.md)):
    only `src/features/activity/data/**` may import `@/api/generated/calendar-logs/**`
    or the `activityLogs` / `activityState` bindings from `@/db`. Activity's refresh
    coordinator is the single issuer of calendar-log requests, because four triggers
    each issuing their own request is the capacity risk that got the feature switched
    off. **B-1 does not cover this**: B-1 is *sublayer*-scoped, so it permits *any*
    feature's `data/` to reach the calendar-log client — the restriction wanted here is
    to **one** feature's `data/`, which `boundaries` cannot express against a file
    inside a single element. So B-5 is a `no-restricted-imports` seam ban with a
    per-directory opt-out (the `banActivitySeam` flag, mirroring `banCalendarKit`), not
    a `boundaries` rule. The table half uses `paths` + `importNames` rather than a
    pattern, because every feature legitimately imports `@/db` — just not those two
    bindings.
  - **B-6 — calendar-sources is a leaf** (`timecalendar/calendar-sources-is-a-leaf`,
    ADR [049](./decisions/049-activity-trigger-edges-and-failure-isolation.md)):
    `src/features/calendar-sources/**` may not import `@/features/activity` or any
    deeper path. B-5 above guards *what* may issue an Activity request; this guards the
    **direction** of the Activity ↔ calendar-sources edge. `activity/data/request.ts`
    imports `@/features/calendar-sources/data`, so the reverse import closes a module
    require cycle whose failure mode under Metro is a binding that is `undefined` at
    module-init time — invisible to `tsc`, and invisible to `boundaries`, which governs
    sublayer shape rather than cycles between two named features. The removal prune that
    would otherwise want that import is inverted instead: `useActivityOwnershipPrune`
    lives in the Activity feature and *observes* the held-calendar set.
  - **Caveat this block exists to carry (R-1): a flat-config block that adds a ban must
    re-call `restrictedImports([...])`, never list its one pattern alone.** Flat config
    **replaces** a rule's options rather than merging them, and
    `routes-not-importable` (`files: ["src/**/*.{js,jsx,ts,tsx}"]`) is otherwise the
    last block setting `no-restricted-imports` for these files. A block naming only the
    new Activity pattern would therefore have silently switched **every base seam ban
    off** — storage backends, chrome, calendar-kit, the generated calendar-log client,
    the `@/db` Activity tables, and the `@/app` route-entrypoint ban — for the whole
    calendar-sources feature, **with `npm run lint` still green**. Note the asymmetry
    with the seam blocks above: `storage-seams`, `chrome-seams`,
    `calendar-kit-vendor-seam` and `activity-seam` use `restrictedImports([], { banX:
    false })` because each *drops* one ban for the directory that **is** that seam; B-6
    *adds* one, which is the opposite shape. Because the replacement is silent, a green
    lint run does not prove a block like this works — it is verified by injecting a
    banned import into a calendar-sources file and confirming lint fails for **each**
    pattern, new and inherited, then reverting (the same inject-and-revert discipline
    the boundaries typescript-resolver caveat below demands, and for the same reason:
    the failure mode is a silent pass).
  - Caveat lint can't carry: boundaries must **resolve** the `@/` alias to classify a
    target — otherwise an `@/db` specifier resolves to nothing and the boundary
    silently never fires (a false-negative). `eslint-config-expo/flat` already ships
    `import/resolver: { typescript: true }` which cascades and resolves the alias, but
    the block also sets `settings['import/resolver'].typescript` and
    `eslint-import-resolver-typescript` is an **explicit** devDependency — belt-and-
    braces so the gate can't go quiet if an expo-config bump drops the transitive
    resolver. `src/api/generated/**` + `*.test.*` are exempt.
- **Import/export order** (`simple-import-sort/imports` + `/exports`, error,
  autofixable; `importSortGroups` in the config). Canonical group order:
  **side-effect → Node builtins + third-party → `@/` alias → relative**, each group
  blank-line-separated, members alphabetized. Complements the `../` ban (relative is
  only ever `./…`). Side-effect imports sit at the top and **keep their relative
  order** (reordering could change behavior — e.g. the `import "@/i18n"` init seam in
  `src/app/_layout.tsx`); no bare `^` catch-all, so groups stay disjoint and the
  plugin's longest-match-wins tie-break never has to choose. Generated code exempt.
- **No raw `fetch`** outside `src/api/mutator.ts`. Caveat: catches the bare global,
  not `globalThis.fetch`-style evasion — guards accident, not adversaries; review
  covers the rest.
- **Wrapped native chrome only through `src/components/chrome/`**
  (`chromeAlphaImportPatterns`, applied via the shared `restrictedImports` and re-set
  without the ban for the `timecalendar/chrome-seams` block): `expo-router/unstable-native-tabs`,
  `expo-glass-effect`, and `@expo/ui` (+ subpaths) are banned everywhere except the
  chrome wrapper dir. `@howljs/calendar-kit` is also globally banned, but its exact
  `features/calendar/renderer/calendar-kit/vendor.ts` seam receives a scoped exception.
  Calendar UI and the neutral renderer facade cannot import the package. Same
  static-import-only caveat as raw-fetch. See [theming.md](./theming.md) for native
  chrome and [calendar.md](./calendar.md) for the renderer boundary.
- **The Activity seam owns calendar-log requests and the Activity tables** (B-5 above,
  `banActivitySeam`, re-set without the ban for `timecalendar/activity-seam`):
  `@/api/generated/calendar-logs/**` is banned by pattern and `activityLogs` /
  `activityState` are banned as **named imports** from `@/db`, everywhere except
  `src/features/activity/data/**`. `@/db` itself stays freely importable. Same
  static-import-only caveat as raw-fetch. See [data.md](./data.md).
- **Generated code** (`src/api/generated/`) is exempt from hand-written-code rules but
  still Prettier-formatted; Orval's `afterAllFilesWrite: prettier --write` keeps regen
  output aligned with the committed format.
