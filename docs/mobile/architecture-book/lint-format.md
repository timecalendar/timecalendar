# Lint & format

The exact rules and their options live in `mobile/eslint.config.js` (named blocks:
`timecalendar/architecture`, `routes-not-importable`, `mutator-owns-fetch`,
`generated-code`, `timecalendar/feature-boundaries`, `timecalendar/chrome-seams`,
`timecalendar/activity-seam`, `timecalendar/export-guide-seam`,
`timecalendar/color-scheme-seam`, `timecalendar/developer-tools-home`,
`timecalendar/environment-home`, `timecalendar/design-home`, `timecalendar/fixtures`,
`timecalendar/design-tests`, `timecalendar/design-fixtures`, `timecalendar/chrome-fixtures`,
`timecalendar/icon-seam`, `timecalendar/raw-button`, `timecalendar/ad-hoc-status`,
`timecalendar/calendar-sources-is-a-leaf`, `timecalendar/storage-seams`, and
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
- **Design layer: one primitive barrel, a developer-only gallery entry** (ADR
  [068](./decisions/068-design-layer-barrel-and-gallery-entry.md)). Three patterns, each behind a
  `restrictedImports` flag:
  - `designDeepImportPattern` (`^@/design/(?!gallery(/|$))`, `banDesignDeepImports`, default on):
    a path below `@/design/` other than the gallery entry.
  - `galleryEntryImportPattern` (`^@/design/gallery(/|$)`, `banGalleryEntry`, default on).
  - `designBarrelImportPattern` (`^@/design$`, `banDesignBarrel`, default off).

  | Files                                                             | `@/design` | `@/design/<folder>/…` | `@/design/gallery` | Block                                   |
  | ----------------------------------------------------------------- | ---------- | --------------------- | ------------------ | --------------------------------------- |
  | features, routes, `components/app-tabs`, `theme`, `hooks`, others | allowed    | banned                | banned             | `architecture`, `routes-not-importable` |
  | `src/features/developer/**`                                       | allowed    | banned                | allowed            | `developer-tools-home`                  |
  | `src/design/**` primitives (not fixtures, tests, `gallery/`)      | banned     | allowed               | banned             | `design-home`                           |
  | `src/design/icon/icon{,.test}.tsx`                                | banned     | allowed               | banned             | `icon-seam` (also lifts L9)             |
  | `src/design/**` tests                                             | allowed    | allowed               | banned             | `design-tests`                          |
  | `src/design/**` fixtures, `src/design/gallery/**`                 | allowed    | allowed               | allowed            | `design-fixtures`                       |
  | `src/components/chrome/**` runtime files and tests                | banned     | allowed               | banned             | `chrome-seams`                          |
  | `src/components/chrome/**` fixtures                               | allowed    | allowed               | allowed            | `chrome-fixtures`                       |
  | other `*.gallery.tsx` (`src/theme/tokens.gallery.tsx`)            | allowed    | banned                | allowed            | `fixtures`                              |

  Every block re-calls `restrictedImports([routeEntrypointImportPattern], …)` with its full flag
  set. Inside `src/design/`, a folder imports its own files relatively and other folders through
  `@/design/<folder>/<file>`; fixtures import primitives from `@/design` and gallery types from
  `@/design/gallery` with `import type`. **The R-1 proof is two tests, not inject-and-revert:**
  `tools/eslint-rules/design-import-policy.test.js` computes the effective
  `no-restricted-imports` options for one representative file per row (plus an environment file
  and a route) and asserts which design, route-entrypoint, storage, chrome-seam and `SymbolView`
  bans apply, so a block that forgets a flag fails naming the file; and
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
- **L9 — icons only through the `Icon` primitive** (`symbolViewImportPath`, appended to `paths`
  by the `banSymbolView` flag of `restrictedImports`): `SymbolView` is banned as a named import
  from `expo-symbols` everywhere except `src/design/icon/icon.tsx` and
  `src/design/icon/icon.test.tsx`, so every icon declares its text scaling. Type imports
  (`SFSymbol`, `AndroidSymbol`, `SymbolWeight`) stay allowed because `importNames` names only the
  component. The exemption is the `timecalendar/icon-seam` block, which re-calls
  `restrictedImports([routeEntrypointImportPattern], { banSymbolView: false, … })`; it is the last
  block for those files, so it restates the design-primitive flags. Same static-import-only caveat as raw-fetch;
  `jest.mock("expo-symbols", …)` factories are not imports. See
  [accessibility.md](./accessibility.md) → Icon scaling and ADR
  [065](./decisions/065-icon-text-scaling.md).
- **L11 — no device-zone-dependent offsets** (`zoneOffsetTrapImportPath`, appended to `paths` by
  the `banZoneOffsetTrap` flag of `restrictedImports`): `getTimezoneOffset` is banned as a named
  import from `date-fns-tz` everywhere. It reads a Date's device-local fields as the zone's wall
  clock, so outside UTC it returns the offset at a different instant. Zone offsets come from
  `zoneOffsetMinutes(instant, zone)` in `@/features/calendar/data` (`day-key.ts`), which formats the
  instant itself. `formatInTimeZone`, `toZonedTime` and `fromZonedTime` stay allowed. No file is
  exempt. Same static-import-only caveat as raw-fetch. See [testing.md](./testing.md) → Time zones.
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
  `src/design/button/button.tsx`, `src/components/chrome/**`, `src/features/calendar/renderer/**`,
  tests, and the files listed in `tools/eslint-rules/raw-button-allowlist.js`, each annotated with
  the slice that migrates it. `raw-button-allowlist.test.js` lints every entry with only this rule
  and fails on a stale entry (no report: remove it), a missing file, a duplicate, or a list longer
  than `RAW_BUTTON_ALLOWLIST_CEILING` (15); migrating a file means deleting its entry and lowering the
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
  (Activity 5.4, developer import 5.7, environment runtime gate 3.5).
  `ad-hoc-status-allowlist.test.js` fails on a stale entry, a missing file, a duplicate, or a list
  longer than `AD_HOC_STATUS_ALLOWLIST_CEILING` (3). `no-ad-hoc-status.test.js` is the RuleTester
  suite. **Caveats:** a plain-text empty outside a list slot, a `screen` `StatusView` nested in a
  scroll view or list, and a spinner from another package are invisible to it; review and the
  gallery cover them. Inject-and-revert proof: a migrated file added to the allowlist fails the
  contract test naming it; an `ActivityIndicator` import in an unlisted feature file fails
  `npm run lint`.
- **Status — `aria-describedby` banned** (third selector in the `restrictedSyntax` constant,
  `JSXAttribute[name.name='aria-describedby']`): React Native forwards no described-by relation to
  UIKit or Android, so a field error is folded into the input's `accessibilityHint` with
  `fieldErrorHint` ([accessibility.md](./accessibility.md) → Accessible async status). It applies
  to every file, tests included, wherever L8 applies. Inject-and-revert proof: the attribute in a
  feature screen and its test fails `npm run lint` in both.
- **Generated code** (`src/api/generated/`) is exempt from hand-written-code rules but
  still Prettier-formatted; Orval's `afterAllFilesWrite: prettier --write` keeps regen
  output aligned with the committed format.
