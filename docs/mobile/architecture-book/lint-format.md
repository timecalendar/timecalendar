# Lint & format

The exact rules and their options live in `mobile/eslint.config.js` (named blocks:
`timecalendar/architecture`, `routes-not-importable`, `mutator-owns-fetch`,
`generated-code`, `timecalendar/feature-boundaries`, `timecalendar/chrome-seams`,
`timecalendar/activity-seam`, `timecalendar/export-guide-seam`,
`timecalendar/color-scheme-seam`, `timecalendar/developer-tools-home`,
`timecalendar/environment-home`, `timecalendar/design-home`, `timecalendar/fixtures`,
`timecalendar/design-tests`, `timecalendar/design-fixtures`, `timecalendar/chrome-fixtures`,
`timecalendar/icon-seam`, `timecalendar/raw-button`, `timecalendar/ad-hoc-status`,
`timecalendar/ad-hoc-separator`, `timecalendar/header-action`, `timecalendar/raw-event-color`, `timecalendar/raw-text-input`,
`timecalendar/raw-primitive`, `timecalendar/raw-primitive-allowlist`,
`timecalendar/components-home`, `timecalendar/routes-shell`,
`timecalendar/style-literals`, `timecalendar/style-literals-chrome`,
`timecalendar/style-literals-allowlist`,
`timecalendar/retired-list-names`,
`timecalendar/calendar-sources-is-a-leaf`, `timecalendar/storage-seams`,
`timecalendar/swiftui-identifiers`, and `timecalendar/tests`). The config is the source of
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
- **React Doctor:** `npm run react-doctor` is the reproducible, mobile-only full audit and remains
  advisory; `npm run react-doctor:changed` blocks new warnings and errors relative to
  `origin/main`. Both use the exact lockfile pin and disable telemetry, score reporting, caches,
  and cross-project supply-chain analysis. CI enforces the changed-code command; the normalized
  inventory and dispositions live in [`../react-doctor.md`](../react-doctor.md) (ADR
  [053](./decisions/053-react-doctor-changed-code-gate.md)). `react-doctor.config.json` carries
  one scoped override: `no-multi-component-file` is off for `src/**/*.gallery.tsx`.
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
  top of the `no-restricted-imports` seam bans (those ban a _package_ by specifier;
  this governs feature-internal structure between _elements_). The block declares an
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
  - **B-3** — routes (`src/app/**`) and `src/components/**` (the app shell and the
    chrome seam) must not import the seams directly. **One scoped exception** (last-write-wins `allow`): the root layout may
    import `@/db/migrate` — the `void runMigrations()` startup wiring, which is app
    infrastructure, not feature-data access (the `@/db` data surface stays banned).
  - **B-4** — the **ADR-009 infra→feature edge** (`@/hooks/use-color-scheme` and
    `@/i18n` importing `@/features/settings/prefs`[`/store`]) is **allowed** — the
    _absence_ of a disallow naming `infra-*` as `from` (the resolution of ADR 009's
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
    off. **B-1 does not cover this**: B-1 is _sublayer_-scoped, so it permits _any_
    feature's `data/` to reach the calendar-log client — the restriction wanted here is
    to **one** feature's `data/`, which `boundaries` cannot express against a file
    inside a single element. So B-5 is a `no-restricted-imports` seam ban with a
    per-directory opt-out (the `banActivitySeam` flag), not a `boundaries` rule. The
    table half uses `paths` + `importNames` rather than a
    pattern, because every feature legitimately imports `@/db` — just not those two
    bindings.
  - **B-6 — calendar-sources is a leaf** (`timecalendar/calendar-sources-is-a-leaf`,
    ADR [049](./decisions/049-activity-trigger-edges-and-failure-isolation.md)):
    `src/features/calendar-sources/**` may not import `@/features/activity` or any
    deeper path. B-5 above guards _what_ may issue an Activity request; this guards the
    **direction** of the Activity ↔ calendar-sources edge. `activity/data/request.ts`
    imports `@/features/calendar-sources/data`, so the reverse import closes a module
    require cycle whose failure mode under Metro is a binding that is `undefined` at
    module-init time — invisible to `tsc`, and invisible to `boundaries`, which governs
    sublayer shape rather than cycles between two named features. The removal prune that
    would otherwise want that import is inverted instead: `useActivityOwnershipPrune`
    lives in the Activity feature and _observes_ the held-calendar set.
  - **B-7 — the design layer knows no product** (the `design` element, `src/design`):
    `src/design/**` may not import a `feature-sublayer`, `feature-barrel`, `route`,
    `generated-api` or `db-seam` element. It consumes shared seams such as `@/theme`,
    `@/components/chrome`, `@/i18n` and `@/hooks`. The gallery registry imports fixtures from
    `src/components/chrome/**` and `src/theme/`, which stays allowed. The personal-events
    `DateTimeField` therefore stays in its feature: it imports `@/features/calendar/data`.
  - **Caveat this block exists to carry (R-1): a flat-config block that adds a ban must
    re-call `restrictedImports([...])`, never list its one pattern alone.** Flat config
    **replaces** a rule's options rather than merging them, and
    `routes-not-importable` (`files: ["src/**/*.{js,jsx,ts,tsx}"]`) is otherwise the
    last block setting `no-restricted-imports` for these files. A block naming only the
    new Activity pattern would therefore have silently switched **every base seam ban
    off** — storage backends, chrome, the generated calendar-log client, the `@/db`
    Activity tables, and the `@/app` route-entrypoint ban — for the whole
    calendar-sources feature, **with `npm run lint` still green**. Note the asymmetry
    with the seam blocks above: `storage-seams`, `chrome-seams`, `activity-seam`, and
    `export-guide-seam` use `restrictedImports([], { banX: false })` because each
    _drops_ one ban for the directory that **is** that seam; B-6 _adds_ one, which is
    the opposite shape. Because the replacement is silent, a green
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
- **Worklet safety** (`local/no-js-call-in-worklet`, error, `src/**` — the repo-local
  plugin in `mobile/tools/eslint-rules/`). Inside a worklet — a body carrying the
  `"worklet"` directive, a callback handed to `useAnimatedStyle`/`useDerivedValue`/
  `useAnimatedReaction`/`useAnimatedScrollHandler`/`runOnUI`/`withTiming` and friends, a
  `Gesture.*().onUpdate(…)` handler, or any function nested inside one — a called
  identifier must resolve to a worklet: a same-file helper carrying the directive, or an
  import blessed by the `workletSafeImports` allowlist in `eslint.config.js`. A plain JS
  call throws on the UI thread ("Tried to synchronously call a non-worklet function"),
  which `tsc` cannot type and Jest cannot reach — its mocks run the styles on the JS
  thread, where the call succeeds. Member calls (`scale.get()`, `Math.max(…)`) and
  unresolved globals are out of scope: the rule guards accident, not evasion.
  The allowlist is a name list, not a module blessing, because
  `@/features/calendar/data` is one barrel over both UI-thread geometry and JS-thread
  helpers like `formatHourStartLabel`. Lint answers "is this name blessed?";
  time-grid's "UI-thread (worklet) contract" suite answers "is the blessed name actually
  workletized?" — neither half is sufficient alone, since a blessed non-worklet would
  otherwise pass both. Like the seam blocks above, a green lint run does not prove
  the rule fires: it is verified by dropping a name from the allowlist and confirming the
  call site fails, then reverting.
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
  chrome wrapper dir. Same static-import-only caveat as raw-fetch. See
  [theming.md](./theming.md) for native chrome and [calendar.md](./calendar.md) for the
  feature-owned renderer boundary.
- **The Activity seam owns calendar-log requests and the Activity tables** (B-5 above,
  `banActivitySeam`, re-set without the ban for `timecalendar/activity-seam`):
  `@/api/generated/calendar-logs/**` is banned by pattern and `activityLogs` /
  `activityState` are banned as **named imports** from `@/db`, everywhere except
  `src/features/activity/data/**`. `@/db` itself stays freely importable. Same
  static-import-only caveat as raw-fetch. See [data.md](./data.md).
- **L1 — the device color scheme only through the C1 seam** (`deviceColorSchemeImportPath`,
  appended to `paths` by the `banDeviceColorScheme` flag of `restrictedImports`, so every block
  that builds its config through `restrictedImports` carries it): `useColorScheme` and
  `Appearance` are banned as named imports from `react-native` everywhere except
  `src/hooks/use-color-scheme.ts`. Deep imports of
  `react-native/Libraries/Utilities/Appearance*` and `…/useColorScheme*` are banned by the
  `deviceColorSchemeDeepImportPattern` regex under the same flag. ESLint's `importNames` also reports
  `import * as RN from "react-native"` and `export { … } from "react-native"`. The exemption is
  the `timecalendar/color-scheme-seam` block, which re-calls
  `restrictedImports([routeEntrypointImportPattern], { banDeviceColorScheme: false })`: the route
  pattern is re-included because `routes-not-importable` also matches the seam file, and flat
  config replacement would otherwise lift the `@/app` ban there. There is no test exemption; the
  seam's own test drives the device scheme through a factory-held mock. Caveat:
  `require("react-native").Appearance` and `jest.requireActual("react-native")` are not static
  imports, so the same static-import-only caveat as raw-fetch applies. See
  [theming.md](./theming.md).
- **The environment selector lives on the developer page** (`developerToolsImportPath` and
  `developerToolsDeepImportPattern`, both under the `banDeveloperTools` flag of
  `restrictedImports`): `useEnvironmentSelector`, `EnvironmentSettingsRow` and
  `EnvironmentSelectorDialog` are banned as named imports from
  `@/features/environment` and, by pattern, from `@/features/environment/ui` or any file under it,
  everywhere except `src/features/developer/**` and `src/features/environment/**`. The
  exemptions are the `timecalendar/developer-tools-home` block (`src/features/developer/**`, which
  also lifts the gallery-entry ban) and the `timecalendar/environment-home` block, each re-calling
  `restrictedImports([routeEntrypointImportPattern], { banDeveloperTools: false, … })` for the same
  route-pattern reason as the color-scheme seam. Same static-import-only caveat as raw-fetch;
  `jest.mock("@/features/environment", …)` factories are not imports and stay free. See
  [navigation.md](./navigation.md) → Developer page.
- **Design layer: one primitive barrel, a developer-only gallery entry, a chrome barrel, a
  route-only app shell** (ADR [068](./decisions/068-design-layer-barrel-and-gallery-entry.md),
  ADR [077](./decisions/077-visual-style-lint-ratchet.md)). Five patterns, each behind a
  `restrictedImports` flag:
  - `designDeepImportPattern` (`^@/design/(?!gallery(/|$))`, `banDesignDeepImports`, default on):
    a path below `@/design/` other than the gallery entry.
  - `galleryEntryImportPattern` (`^@/design/gallery(/|$)`, `banGalleryEntry`, default on).
  - `designBarrelImportPattern` (`^@/design$`, `banDesignBarrel`, default off).
  - `chromeDeepImportPattern` (`^@/components/chrome/`, `banChromeDeepImports`, default on): a
    path below the `@/components/chrome` barrel.
  - `appShellImportPattern` (`^@/components/(?!chrome(/|$))`, `banAppShellImports`, default on):
    the app shell (`app-tabs`), which routes compose.

  | Files                                                        | `@/design` | `@/design/<folder>/…` | `@/design/gallery` | `@/components/chrome/…` | app shell | Block                                   |
  | ------------------------------------------------------------ | ---------- | --------------------- | ------------------ | ----------------------- | --------- | --------------------------------------- |
  | features, `theme`, `hooks`, others                           | allowed    | banned                | banned             | banned                  | banned    | `architecture`, `routes-not-importable` |
  | routes (`src/app/**`)                                        | allowed    | banned                | banned             | banned                  | allowed   | `routes-shell`                          |
  | `src/features/developer/**`                                  | allowed    | banned                | allowed            | banned                  | banned    | `developer-tools-home`                  |
  | `src/design/**` primitives (not fixtures, tests, `gallery/`) | banned     | allowed               | banned             | allowed                 | banned    | `design-home`                           |
  | `src/design/icon/icon{,.test}.tsx`                           | banned     | allowed               | banned             | allowed                 | banned    | `icon-seam` (also lifts L9)             |
  | `src/design/**` tests                                        | allowed    | allowed               | banned             | allowed                 | banned    | `design-tests`                          |
  | `src/design/**` fixtures, `src/design/gallery/**`            | allowed    | allowed               | allowed            | allowed                 | banned    | `design-fixtures`                       |
  | `src/components/**` outside chrome (`app-tabs`, its tests)   | allowed    | banned                | banned             | allowed                 | allowed   | `components-home`                       |
  | `src/components/chrome/**` runtime files and tests           | banned     | allowed               | banned             | allowed                 | banned    | `chrome-seams` (also lifts L9)          |
  | `src/components/chrome/**` fixtures                          | allowed    | allowed               | allowed            | allowed                 | banned    | `chrome-fixtures` (also lifts L9)       |
  | other `*.gallery.tsx` (`src/theme/tokens.gallery.tsx`)       | allowed    | banned                | allowed            | banned                  | banned    | `fixtures`                              |

  Every block re-calls `restrictedImports(…)` with its full flag set. Most pass
  `[routeEntrypointImportPattern]`; `routes-shell` passes `[]` because routes may import `@/app`,
  and `storage-seams`, `activity-seam` and `export-guide-seam` pass `[]` as well. No later block matches `src/app/**`. No file is allowlisted against the chrome
  barrel or app-shell bans. Inside `src/design/`, a folder imports its own files relatively and other folders through
  `@/design/<folder>/<file>`; fixtures import primitives from `@/design` and gallery types from
  `@/design/gallery` with `import type`. **The R-1 proof is two tests, not inject-and-revert:**
  `tools/eslint-rules/design-import-policy.test.js` computes the effective
  `no-restricted-imports` options for one representative file per row (plus an environment file
  and a route) and asserts which design, route-entrypoint, storage, chrome-seam, chrome-barrel,
  app-shell and `expo-symbols` bans apply, so a block that forgets a flag fails naming the file; and
  `src/design/import-graph.contract.test.ts` walks the value-import graph and fails when the
  barrel reaches a gallery module, when anything but the developer UI, developer routes, fixtures
  and the gallery reaches one, or when a require cycle passes through `src/design/`. **Caveat:**
  the graph test reads static `import`/`export`/`require()`/`import()` with string specifiers; a
  computed specifier is invisible to it.

- **L8 — font scaling is never disabled** (`no-restricted-syntax` in
  `timecalendar/architecture`, the `restrictedSyntax` constant, which also carries the
  `aria-describedby` ban): two selectors,
  `JSXAttribute[name.name='allowFontScaling'][value.expression.value=false]` and
  `Property[key.name='allowFontScaling'][value.value=false]`, so both
  `allowFontScaling={false}` and the object/spread form (`{ allowFontScaling: false }`) fail.
  The selectors are element-agnostic (`Text`, `TextInput`, any wrapper) and apply to every linted
  file, tests included, with no exemption. `maxFontSizeMultiplier` is not banned. **Caveat (R-1):**
  no other block sets `no-restricted-syntax`; a future block that does must spread
  `restrictedSyntax`, because flat config replaces the options and would silently drop L8 for
  its files. See [accessibility.md](./accessibility.md).
- **L9 — icons only through the `Icon` primitive** (`symbolViewImportPath` appended to `paths`
  and `symbolsDeepImportPattern` (`^expo-symbols/`) appended to `patterns`, both by the
  `banSymbolView` flag of `restrictedImports`): `SymbolView` and the glyph loader
  `unstable_getMaterialSymbolSourceAsync` are banned as named imports from `expo-symbols`, and
  every `expo-symbols/*` sub-path (`androidWeights/*`) is banned outright, everywhere except the
  `Icon` primitive (`src/design/icon/icon{,.test}.tsx`) and the native chrome seam
  (`src/components/chrome/**`), so every icon a feature or design primitive renders declares its
  text scaling. Chrome wraps native symbol APIs at the same level as `SymbolView`, so a chrome
  wrapper that renders a raw symbol view owns the text-scaling contract itself; no chrome file
  does today. Type imports (`SFSymbol`, `AndroidSymbol`, `SymbolWeight`) from the `expo-symbols` root stay
  allowed because `importNames` names only values; the `^expo-symbols/` pattern bans sub-paths
  outright, type imports included. The exemptions are the `timecalendar/icon-seam`,
  `timecalendar/chrome-seams` and `timecalendar/chrome-fixtures` blocks, each re-calling
  `restrictedImports([routeEntrypointImportPattern], { banSymbolView: false, … })`; `icon-seam` is
  the last block for its files, so it restates the design-primitive flags. Inject-and-revert proof:
  `SymbolView` in a feature screen and in `src/design/badge/badge.tsx`, the loader and
  `expo-symbols/androidWeights/regular` in a feature screen all fail `npm run lint`; `SymbolView` in
  `src/components/chrome/floating-action.tsx` passes. Same static-import-only caveat as raw-fetch;
  `jest.mock("expo-symbols", …)` factories are not imports. See
  [accessibility.md](./accessibility.md) → Icon scaling and ADR
  [065](./decisions/065-icon-text-scaling.md).
- **L11 — no device-zone-dependent offsets** (`zoneOffsetTrapImportPaths` and
  `zoneOffsetTrapImportPattern`, appended to `paths` and `patterns` by the `banZoneOffsetTrap` flag
  of `restrictedImports`, plus two `ImportExpression` selectors in `restrictedSyntax`):
  `getTimezoneOffset` from `date-fns-tz` is banned everywhere, in every form that can reach it.
  From the `date-fns-tz` and `date-fns-tz/fp` barrels: named and aliased imports, the default
  import, the namespace import (`import * as tz` reported for `tz.getTimezoneOffset`),
  `export { getTimezoneOffset } from` and `export * (as tz) from` re-exports. The
  `date-fns-tz/getTimezoneOffset` and `date-fns-tz/fp/getTimezoneOffset` sub-path exports are banned
  outright. Any dynamic `import()` of a `date-fns-tz` path, string or template literal, is banned
  so the static rules can see it. `require` is already an error under
  `@typescript-eslint/no-require-imports`. Other helper sub-paths (`date-fns-tz/formatInTimeZone`, …)
  stay allowed. It reads a Date's device-local fields as the
  zone's wall clock, so outside UTC it returns the offset at a different instant. Zone offsets come
  from `zoneOffsetMinutes(instant, zone)` in `@/features/calendar/data` (`day-key.ts`), which
  formats the instant itself. `formatInTimeZone`, `toZonedTime` and `fromZonedTime` stay allowed.
  No file is exempt. `mobile/eslint-l11.contract.test.ts` pins every form, and the allowed helpers,
  by linting probes through the real `eslint.config.js`. See [testing.md](./testing.md) → Time
  zones.
- **Buttons — raw touchables banned** (`rawTouchablesImportPath`, appended to `paths` by
  `restrictedImports` with no flag): `Button`, `TouchableOpacity`, `TouchableHighlight`,
  `TouchableWithoutFeedback` and `TouchableNativeFeedback` are banned as named imports from
  `react-native` in every file, with no exemption (no file uses them). ESLint reports each `paths`
  entry's `importNames` independently, so this entry and L1's `react-native` entry both fire
  (verified by inject-and-revert in a feature file and in `src/hooks/use-color-scheme.ts`, where
  L1 is lifted and this ban still applies). Same static-import-only caveat as raw-fetch.
- **Buttons — `local/no-raw-button`** (`tools/eslint-rules/no-raw-button.js`, block
  `timecalendar/raw-button`, `files: ["src/**/*.tsx"]`): a `Pressable` imported from
  `react-native` (aliases followed) whose `accessibilityRole` or `role` is the literal `"button"`
  or `"link"` and that has a direct `ThemedText`/`Text` child (also inside a top-level `&&`,
  conditional or fragment) is an error; text buttons are `Button` from `@/design`
  ([theming.md](./theming.md) → Buttons, ADR [067](./decisions/067-button-family.md)). Ignored:
  `src/design/button/button.tsx`, `src/design/field/date-time-field.tsx` (the Android date-time
  row is a field trigger drawn as a text field), `src/components/chrome/**`,
  `src/features/calendar/renderer/**`, tests, and the files listed in
  `tools/eslint-rules/raw-button-allowlist.js`, each annotated with
  the slice that migrates it. `raw-button-allowlist.test.js` lints every entry with only this rule
  and fails on a stale entry (no report: remove it), a missing file, a duplicate, or a list longer
  than `RAW_BUTTON_ALLOWLIST_CEILING` (5); migrating a file means deleting its entry and lowering the
  ceiling. `no-raw-button.test.js` is the RuleTester suite. **Caveats:** a role passed as a
  variable, text wrapped in a layout `View`, a function child and `Animated` pressables are not
  inspected (rows and tiles legitimately use `Pressable`; review covers the rest). The rule has its
  own block, so it does not share the `no-restricted-syntax` slot (L8). Inject-and-revert proof:
  a migrated file added to the allowlist fails the contract test naming it; a raw text button in
  an unlisted feature file fails `npm run lint`.
- **Status — `local/no-ad-hoc-status`** (`tools/eslint-rules/no-ad-hoc-status.js`, block
  `timecalendar/ad-hoc-status`, `files: ["src/**/*.tsx"]`): a named `ActivityIndicator` import
  from `react-native` (aliases included) is an error, and so is a `ListEmptyComponent` whose value
  renders anything but `StatusView` (a JSX element, a component identifier or a call), looking
  through conditional and logical expressions, fragments and expression containers; `null` and
  `undefined` branches pass. Loading, empty and error states are `StatusView` from `@/design`
  ([theming.md](./theming.md) → Status, ADR [069](./decisions/069-status-view.md)). Ignored:
  `src/design/**`, `src/components/chrome/**`, `src/features/calendar/renderer/**`, tests, and the
  files in `tools/eslint-rules/ad-hoc-status-allowlist.js`, each annotated with its migrating slice
  (developer import 5.7).
  `ad-hoc-status-allowlist.test.js` fails on a stale entry, a missing file, a duplicate, or a list
  longer than `AD_HOC_STATUS_ALLOWLIST_CEILING` (1). `no-ad-hoc-status.test.js` is the RuleTester
  suite. **Caveats:** a plain-text empty outside a list slot, a `screen` `StatusView` nested in a
  scroll view or list, and a spinner from another package are invisible to it; review and the
  gallery cover them. Inject-and-revert proof: a migrated file added to the allowlist fails the
  contract test naming it; an `ActivityIndicator` import in an unlisted feature file fails
  `npm run lint`.
- **Status — `aria-describedby` banned** (third and fourth selectors in the `restrictedSyntax`
  constant, `JSXAttribute[name.name='aria-describedby']` and
  `Property[key.value='aria-describedby']` for spread props): React Native forwards no described-by relation to
  UIKit or Android, so `TextField` and `DateTimeField` fold a field error into the control's
  `accessibilityHint` ([accessibility.md](./accessibility.md) → Fields). It applies
  to every file, tests included, wherever L8 applies. Inject-and-revert proof: the attribute in a
  feature screen and its test fails `npm run lint` in both.
- **Fields — `local/no-raw-text-input`** (`tools/eslint-rules/no-raw-text-input.js`, block
  `timecalendar/raw-text-input`, `files: ["src/**/*.tsx"]`): a value import of `TextInput` from
  `react-native` (aliases included) is an error; text fields are `TextField` from `@/design`
  ([theming.md](./theming.md) → Fields, ADR [070](./decisions/070-text-field.md)). A type-only
  import (`import type { TextInput }`, `import { type TextInput }`) passes. Ignored:
  `src/design/**`, tests, and the files in `tools/eslint-rules/raw-text-input-allowlist.js`, each
  annotated with its migrating slice (the inline checklist row editor, 5.8).
  `src/components/chrome/**` is not ignored. `raw-text-input-allowlist.test.js` fails on a stale
  entry, a missing file, a duplicate, or a list longer than `RAW_TEXT_INPUT_ALLOWLIST_CEILING`
  (1). `no-raw-text-input.test.js` is the RuleTester suite. **Caveats:** like `no-raw-button`, it
  does not catch a namespace import (`import * as RN from "react-native"`, then `RN.TextInput`) or a
  `require`, and a `TextInput` reached through another module's re-export is invisible to it. Inject-and-revert proof: a
  migrated file added to the allowlist fails the contract test naming it; a `TextInput` import in
  `src/features/feedback/ui/feedback-screen.tsx` fails `npm run lint`.
- **Radio groups — `local/no-raw-radio-group`** (`tools/eslint-rules/no-raw-radio-group.js`,
  block `timecalendar/raw-radio-group`, `files: ["src/features/**/*.tsx", "src/app/**/*.tsx"]`):
  a JSX `accessibilityRole` or `role` whose value is the literal `"radiogroup"` or `"radio"`
  (directly, in an expression container, as either branch of a conditional such as
  `isAndroid ? "radio" : "button"` or of a logical expression such as `isAndroid && "radio"`, or
  under `as`, `satisfies` or `!`) is an error. A single choice among options is
  `ColorSwatchField` from `@/design` or a `NativeList` choice row from `@/components/chrome`
  ([theming.md](./theming.md) → Fields, ADR [078](./decisions/078-color-swatch-field.md)).
  Ignored: tests; `src/design/**` and `src/components/chrome/**` are outside `files`. No file
  violates it, so there is no allowlist and no ceiling. `no-raw-radio-group.test.js` is the
  RuleTester suite. **Caveats:** a role passed through a variable, a spread or a helper is not
  seen, and a Compose `RadioButton` in chrome carries no React Native role. Inject-and-revert
  proof: `accessibilityRole="radiogroup"` on a `View` in
  `src/features/personal-events/ui/personal-event-fields.tsx` fails `npm run lint` naming the
  rule; the same attribute in `src/design/field/color-swatch-field.tsx` passes.
- **Raw primitives — `local/no-raw-primitive`** (`tools/eslint-rules/no-raw-primitive.js`, block
  `timecalendar/raw-primitive`, `files: ["src/features/*/ui/**/*.{ts,tsx}"]`, tests ignored): a
  value import or re-export of `Text` or `Modal` from `react-native` (aliases included) is an
  error, one option and one message id per primitive: `rawText` (`text`) points to `ThemedText`
  from `@/design`, `rawModal` (`modal`) to a Router route with a sheet or modal presentation
  ([navigation.md](./navigation.md)) or `MenuView` from `@/components/chrome`. A type-only import
  or re-export passes. The calendar renderer (`src/features/calendar/renderer/**`) is outside
  `ui/` and out of scope. `TextInput` (`local/no-raw-text-input`), `ActivityIndicator`
  (`local/no-ad-hoc-status`), `Button` and the touchables (`rawTouchablesImportPath`) keep their
  own wider gates, so each name is reported by one gate and has one allowlist (ADR
  [077](./decisions/077-visual-style-lint-ratchet.md)). **Ratchet:**
  `tools/eslint-rules/raw-primitive-allowlist.js` lists each not-yet-migrated file with the
  primitives it still imports (`categories`, message ids) and its migrating slice; one
  `timecalendar/raw-primitive-allowlist` block per entry, mapped after the base block, turns off
  only those primitives for that file, so a file listed for `Text` still fails on a `Modal`. Today
  it holds one entry, `src/features/calendar/ui/calendar-screen/calendar-screen-header.tsx`
  (`rawText`, 5.10). `src/design/**` and `src/components/chrome/**` carry no entry (they are out of
  scope). `raw-primitive-allowlist.test.js` lints every entry with both options on and fails on a
  missing file, a duplicate, an unknown or stale primitive, or a per-primitive count that differs
  from `RAW_PRIMITIVE_ALLOWLIST_CEILING` (`rawText` 1, `rawModal` 0, exact).
  **Every migration slice deletes its files (or the primitives it removes) from the allowlist in
  the same PR** and lowers the ceiling. `no-raw-primitive.test.js` is the RuleTester suite.
  **Caveats:** a namespace import (`import * as RN`, then `RN.Text`), a `require` and a primitive
  reached through another module's re-export are invisible to it. Inject-and-revert proof: `Text`
  and `Modal` in `src/features/feedback/ui/feedback-screen.tsx` fail with `rawText` and `rawModal`;
  `Modal` in the allowlisted calendar header fails with `rawModal`; `TextInput` there fails once,
  from `local/no-raw-text-input`; an unmigrated entry added to the allowlist fails its test on the
  ceiling and the stale check.
- **Lists — `local/no-ad-hoc-separator`** (`tools/eslint-rules/no-ad-hoc-separator.js`, block
  `timecalendar/ad-hoc-separator`, `files: ["src/**/*.{ts,tsx}"]`): a style property
  `borderBottomWidth`, `borderTopWidth` or `height` whose value is `StyleSheet.hairlineWidth` is an
  error; list separators are `Separator` or `ListRowSeparator` from `@/design`
  ([theming.md](./theming.md) → Lists, ADR [073](./decisions/073-list-row-family.md)). Ignored:
  `src/design/**`, `src/theme/**` (the token swatch table), `src/features/calendar/renderer/**`
  (grid lines, not list separators), tests, and the files in
  `tools/eslint-rules/ad-hoc-separator-allowlist.js`, each annotated with its migrating slice (the
  Home timeline divider, 5.9). `ad-hoc-separator-allowlist.test.js` fails on a stale entry, a
  missing file, a duplicate, or a list longer than its ceiling (1). `no-ad-hoc-separator.test.js`
  is the RuleTester suite. `borderWidth` (the rings of the school logo, header icon and checklist
  box) is deliberately not matched. **Caveats:** a value reached through a variable
  (`const line = StyleSheet.hairlineWidth`) is not followed, and no rule detects a hand-built
  row: a `Pressable` with a label and chevron has no reliable static signature, so review checks
  that a list uses `ListRow` or the native seam. Inject-and-revert proof: a
  `borderBottomWidth: StyleSheet.hairlineWidth` style in
  `src/features/settings/ui/timezone-chooser-screen.tsx` fails `npm run lint` naming the rule; a
  migrated file added to the allowlist fails the contract test; re-adding `school-row.tsx` to the
  raw-button allowlist fails its test (stale and over the ceiling).
- **Header actions — `local/no-ad-hoc-header-action`** (`tools/eslint-rules/no-ad-hoc-header-action.js`,
  block `timecalendar/header-action`, `files: ["src/**/*.{ts,tsx}"]`): an object property keyed
  (identifier or string) `headerRight`, `headerLeft`, `unstable_headerRightItems` or
  `unstable_headerLeftItems` is an error, and so is a `Stack.Toolbar` whose `placement` is
  anything but the literal `"bottom"` (an expression, `"left"`, `"right"`, a bare attribute). A
  `Stack.Toolbar` with no placement or `placement="bottom"` is the iOS bottom toolbar and passes.
  Header actions are `useHeaderActions` from `@/components/chrome`
  ([theming.md](./theming.md) → Header and floating actions, ADR [075](./decisions/075-header-and-floating-actions.md)).
  Ignored: `src/components/chrome/**` (the seam and the root screen options), tests, and the files
  in `tools/eslint-rules/header-action-allowlist.js`, each annotated with its migrating slice (the
  calendar view menu, 5.10). `header-action-allowlist.test.js` fails on a stale entry, a missing
  file, a duplicate, or a list longer than its ceiling (1). `no-ad-hoc-header-action.test.js` is
  the RuleTester suite. **Caveats:** a computed key (`[key]: …`) and options spread from another
  module are not seen; review covers them. Inject-and-revert proof: `headerRight: () => null` in
  the changelog sheet's `Stack.Screen` options and `<Stack.Toolbar placement="left" />` in
  `src/features/settings/ui/timezone-chooser-screen.tsx` each fail `npm run lint` naming the rule.
- **Event colors — `local/no-raw-event-color`** (`tools/eslint-rules/no-raw-event-color.js`,
  block `timecalendar/raw-event-color`, `files: ["src/**/*.tsx"]`): two checks, both errors.
  (1) A non-computed fill or border color style property (`backgroundColor`, `borderColor`,
  `borderLeftColor`, `borderRightColor`, `borderTopColor`, `borderBottomColor`, `borderStartColor`,
  `borderEndColor`) whose value is a non-computed `.color` member (`event.color`, `tag.color`,
  `item?.color`), unless the object is `theme` (message `rawEventColor`). (2) A call to
  `resolveEventAppearance`, as an identifier or a member ending in it (message
  `eventAppearanceCall`: "Event tiles are EventSurface from @/design"). Event and calendar colors
  enter UI through `ColorDot` and event tiles through `EventSurface`, both from `@/design`
  ([theming.md](./theming.md) → Badges and color dots, Event tiles; ADR
  [074](./decisions/074-badge-and-color-dot.md), ADR [076](./decisions/076-event-surface.md)).
  Ignored: `src/design/**`, `src/theme/**`, `src/features/calendar/renderer/**` (the owned
  renderer, ADR 033), tests, and the files in `tools/eslint-rules/raw-event-color-allowlist.js`,
  each annotated with its migrating slice (`event-details-content.tsx`, the title dot and
  `TagBubble`, 5.8). `raw-event-color-allowlist.test.js` fails on a stale entry, a missing file, a
  duplicate, or a list longer than its ceiling (1). `no-raw-event-color.test.js` is the RuleTester
  suite: `color: row.color` (a data-object key, not a fill), `[key]: event.color`,
  `borderLeftColor: theme.primary` and `mix(event.color)` pass; every per-side key on a `.color`
  member and `resolveEventAppearance(…)` fail. **Caveats:** a color reached through a variable or
  another helper is not followed, a `color=` JSX prop is not matched, and `.ts` files are outside
  `files` (the calendar presenters call the resolver there by design), so review checks that new
  event-color UI uses `ColorDot` or `EventSurface`. There is no pill or dot shape rule:
  `borderRadius: Radii.pill` also draws FABs, glass buttons, the now line, the agenda now marker
  and page indicators, so it is no badge signature. Inject-and-revert proof:
  `borderLeftColor: event.color` in `src/features/calendar/ui/agenda-list.tsx` fails `npm run lint`
  with `rawEventColor`; a `resolveEventAppearance({ … })` call in
  `src/features/home/ui/upcoming-scroller.tsx` fails it with `eventAppearanceCall`; adding
  `agenda-list.tsx` to the allowlist fails its test (stale and over the ceiling); an
  `EventSurfaceText` without `numberOfLines` or an `EventSurface` without `accessibilityLabel`
  fails `npx tsc --noEmit`.
- **Style literals — `local/no-style-literals`** (`tools/eslint-rules/no-style-literals.js`, ADR
  [077](./decisions/077-visual-style-lint-ratchet.md)): visual style values come from the token
  layer and the type ramp ([theming.md](./theming.md) → Token layer). The rule matches style keys
  on every non-computed object property and, for colors, every JSX attribute, so inline styles,
  `StyleSheet.create`, style arrays and `.ts` style helpers are all covered. Five categories, one
  option and one message id each:

  | Option | Message id | Keys | Reported value | Replacement |
  | --- | --- | --- | --- | --- |
  | `colors` | `colorLiteral` | `color`, `tintColor`, any `*Color` key or JSX prop except `themeColor`; an object value of a `*Color` prop (`trackColor={{ … }}`) is checked per property | a hex, `rgb()`/`rgba()`/`hsl()`/`hsla()` or CSS named color (`transparent` passes), or a template literal starting with `#` or a color function | `useTheme()` |
  | `typography` | `typographyLiteral` | `fontSize`, `lineHeight`, `fontWeight` | any number or string literal (`"bold"` included) | `ThemedText type=`, `TypeRamp` |
  | `shadows` | `legacyShadow` | `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation` | any value (the key is banned; `shadowColor` reports once, here) | `Elevation.raised` |
  | `shadows` | `legacyShadow` | `boxShadow` | a string or template literal | `Elevation.raised` |
  | `spacing` | `spacingLiteral` | `padding*`, `margin*` (every per-side and logical key), `gap`, `rowGap`, `columnGap` | a number other than 0 or 1 (negatives included; `"auto"`, `"50%"` pass) | `Spacing` |
  | `radius` | `radiusLiteral` | `borderRadius` and every per-corner radius key | a number other than 0 or 1 | `Radii`, `ListGeometry` |

  A value is seen through `as`/`satisfies`/`!`/`<T>` casts, both branches of a conditional, both
  operands of a logical expression, a sign, literal-only arithmetic (`4 * 2`), and the values of a
  `Platform.select({ … })` object; each literal leaf is reported. Identifiers, member reads
  (`Spacing.two`, `StyleSheet.hairlineWidth`) and other calls (`PlatformColor(…)`) pass. Defaults
  are `colors` and `shadows` on, the rest off; the config passes all five explicitly.
  **Scope:** block `timecalendar/style-literals`, `files: ["src/**/*.{ts,tsx}"]`, all five on.
  Ignored: generated code, `src/theme/**` (tokens, the ramp, `EventFallbackColor`),
  `src/features/personal-events/ui/color-swatch-presets.ts`, `src/test-support/**` and tests.
  Galleries and the calendar renderer are in scope. Block `timecalendar/style-literals-chrome`
  (`src/components/chrome/**`) turns `typography` off: chrome mirrors SwiftUI/Compose type, which
  is not on the RN ramp. `src/design/**` and chrome carry no allowlist entry.
  **Ratchet:** `tools/eslint-rules/style-literal-allowlist.js` lists each not-yet-migrated file as
  `{ path, categories }` (categories are message ids) with its migrating slice. One
  `timecalendar/style-literals-allowlist` block per entry, generated by a `map` after the base and
  chrome blocks, sets only the listed categories to `false` for that file. Flat config gives a rule
  the options of the last matching block that sets it, so every unlisted category stays on for the
  file (`npx eslint --print-config <file>` shows the result).
  `style-literal-allowlist.test.js` lints each listed file with all five categories on and fails on
  a missing file, a duplicate path, an unknown category, a stale category (the failure names
  `path:category`), or a per-category entry count that differs from
  `STYLE_LITERAL_ALLOWLIST_CEILING` (the ceiling is exact, so a cleaned category cannot leave slack).
  **Every migration slice deletes its files, or the categories it cleans, from
  `style-literal-allowlist.js` in the same PR, and lowers the matching ceilings.** Raising a
  ceiling needs a reason in review. `no-style-literals.test.js` is the RuleTester suite.
  **Caveats:** a literal behind a variable, an imported constant or a spread, a computed key,
  `PlatformColor`/`DynamicColorIOS` (native-correct, not literals), keys outside the table (width,
  height, position, `borderWidth`, `letterSpacing`, opacity, `textShadow*` geometry) and
  SwiftUI/Compose modifier arguments (`padding(12)`) are not seen; review covers them. A data
  object with a style-named key and a literal value is reported; the exempt paths hold that data.
  Inject-and-revert proof: `color: "#333"` and `paddingTop: 12` in
  `src/features/feedback/ui/feedback-screen.tsx` fail `npm run lint` with `colorLiteral` and
  `spacingLiteral`; `shadowOpacity: 0.2` in `src/design/list/list-row.tsx` fails with
  `legacyShadow`; `fontSize: 17` in `src/components/chrome/native-list-header.tsx` passes and
  `borderRadius: 6` there fails with `radiusLiteral`; `color: "#333"` in the allowlisted
  `src/features/home/ui/home-screen.tsx` (listed for spacing only) fails; adding
  `feedback-screen.tsx` to the allowlist fails its test (stale and over the ceiling); removing
  `spacingLiteral` from the `home-screen.tsx` entry fails `npm run lint` on that file.
- **Migrated screens** ([`src/design/screen-migration.contract.test.ts`](../../../mobile/src/design/screen-migration.contract.test.ts),
  ADR [077](./decisions/077-visual-style-lint-ratchet.md)): `MIGRATED_SCREENS` lists each file a
  Phase 5 slice has migrated, under its slice; `DRIFT_PATTERNS` holds the audit's drift greps
  (`docs/mobile/design-system-audit/duplication-and-drift.md` → Method): color and named-color
  literals, numeric spacing, radius and `fontSize`/`lineHeight`/`letterSpacing`, `fontWeight:`,
  `fontFamily:`, legacy shadow keys, `useColorScheme`/`Appearance.`, `style={{`, `hairlineWidth`,
  literal opacity, border width and `hitSlop`, `<ActivityIndicator`, `<SymbolView`,
  `min(Height|Width): 44|48`, plus three that no lint rule covers: `themeColor=`, the legacy
  `ThemedText` type aliases (`default`, `small`, `smallBold`, `subtitle`) and `Platform.OS` /
  `Platform.select` with 44 or 48 on the line. `//` and `/* */` comments are stripped first, line
  numbers kept. The test fails on any hit (`path:line id`), a listed file that does not exist, or a
  path listed twice. Platform branching and style arrays stay allowed (they compose animated or
  measured values). **The list only grows: every Phase 5 slice appends its files in the same PR
  that migrates them and raises `MIGRATED_FILE_FLOOR` to the new count;** the test fails when the
  list holds fewer files than the floor. Caveat: a value behind a variable or a computed key is
  not seen, the same blind spot as the audit greps. Inject-and-revert proof: `themeColor="textSecondary"` in
  `src/features/onboarding/ui/welcome-pages.tsx` and `const H = Platform.OS === "ios" ? 44 : 48` in
  `connect-screen.tsx` fail the test with `theme-color-prop` and `touch-target-branch`.
- **L12 — no identifiers on SwiftUI containers** (`local/no-swiftui-container-identifier` in the
  `timecalendar/swiftui-identifiers` block, `src/**`): SwiftUI applies an accessibility identifier
  set on a container to every child and replaces the children's own, so a row inside an identified
  `Section` reads as the section. The rule reports a `testID` or an `accessibilityIdentifier`
  modifier on an `@expo/ui/swift-ui` container. A container is a view that lays out or groups
  children and is not an accessibility element; the list (`Form`, `Section`, `Group`, the stacks,
  `BottomSheet`, `List`, `ScrollView`, …) lives at the top of
  `mobile/tools/eslint-rules/no-swiftui-container-identifier.js`. Controls and labelled rows
  (`Button`, `Toggle`, `LabeledContent`, `Text`, `TextField`, `ProgressView`, …) are elements and
  keep their identifier. `Host` may keep a `testID`, which React Native applies to the UIKit hosting
  view outside SwiftUI, but not an identifier modifier, which lands on the SwiftUI root. The rule
  resolves named, aliased and namespace imports of both `@expo/ui/swift-ui` and its `modifiers`
  subpath, and searches the `modifiers` expression through array literals, spreads,
  conditional/logical expressions and a same-file `const` initializer. **Caveat (R-1):** it cannot
  follow an identifier passed through `{...props}` or a modifier array built in another module; the
  suite-wide Jest mock throws for those ([testing.md](./testing.md)). Re-check the container list
  against the `@expo/ui/swift-ui` exports on each SDK bump. RuleTester cases live in
  `no-swiftui-container-identifier.test.js`. See [theming.md](./theming.md) → Identifiers.
- **Native list names — `local/no-retired-list-names`** (`tools/eslint-rules/no-retired-list-names.js`,
  block `timecalendar/retired-list-names`, `files: ["src/**/*.{ts,tsx}"]`, no `ignores`, no
  allowlist, tests included): the native list seam is `NativeList*` from `@/components/chrome`
  and features render it directly ([theming.md](./theming.md) → Native-chrome wrapper seam, ADR
  [072](./decisions/072-native-list-seam.md)). The rule reports four things:
  1. an identifier (declaration, reference, import, TS type name or JSX tag) starting with
     `NativeSettings`, `SwiftSettings` or `ComposeSettings` (`openNativeSettings` passes);
  2. the exact identifiers `SettingsRow`, `SettingsRowProps`, `SettingsSection` and
     `SettingsSectionProps` (`EnvironmentSettingsRow` passes). The trade-off: those four
     generic names are unavailable to any future feature, which must pick a more specific one;
  3. a string or template literal containing `native-settings` or `nativeSettings`: import and
     export sources, `jest.mock` / `require` paths, testIDs, story ids, i18n keys passed to `t()`
     and file paths read by contract tests;
  4. a file whose basename starts with `native-settings` or whose stem is `settings-row` /
     `settings-section`, so a recreated file fails before anything imports it.

  `no-retired-list-names.test.js` is the RuleTester suite. **Caveats:** it cannot see JSON locale
  files (an unused `gallery.nativeSettings` key; one used through `t()` is caught), Maestro YAML,
  Markdown, JSX text children, regex literals, or computed strings (`"native-" + "settings"`);
  review covers those. Inject-and-revert
  proof: `export const NativeSettingsRow = NativeListRow` in `src/components/chrome/index.ts`,
  `testID="gallery-native-settings-rows"` on a row in `native-list.gallery.tsx`, and an empty
  `src/features/settings/ui/settings-section.tsx` each fail `npm run lint`, naming the file and
  the rule.
- **Generated code** (`src/api/generated/`) is exempt from hand-written-code rules but
  still Prettier-formatted; Orval's `afterAllFilesWrite: prettier --write` keeps regen
  output aligned with the committed format.
