# Lint & format

The exact rules and their options live in `mobile/eslint.config.js` (named blocks:
`timecalendar/architecture`, `routes-not-importable`, `mutator-owns-fetch`,
`generated-code`, `timecalendar/feature-boundaries`, `timecalendar/chrome-seams`,
`timecalendar/storage-seams`, `timecalendar/tests`). The config is the source of
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
- **Native-chrome alpha APIs only through `src/components/chrome/`**
  (`chromeAlphaImportPatterns`, applied via the shared `restrictedImports` and re-set
  without the ban for the `timecalendar/chrome-seams` block): `expo-router/unstable-native-tabs`,
  `expo-glass-effect`, and `@expo/ui` (+ subpaths) are banned everywhere except the
  chrome wrapper dir. Same static-import-only caveat as raw-fetch. The seam it guards
  lives in the theming rules.
- **Generated code** (`src/api/generated/`) is exempt from hand-written-code rules but
  still Prettier-formatted; Orval's `afterAllFilesWrite: prettier --write` keeps regen
  output aligned with the committed format.
