# Proposal

## Why

Owner decision 1 of the design-system audit (`docs/mobile/design-system-audit/README.md`, "Owner
decisions (2026-10-25)"; `design-system-proposal.md` §3) puts the design system in
`mobile/src/design/` behind one `@/design` barrel, with tokens in `@/theme` and the native seam in
`@/components/chrome`. The code does not match: `src/design/index.ts` is the gallery runtime (it
imports `galleryModules`, so every fixture), and the shared primitives — `Button` (ADR 067),
`Icon` (ADR 065), `ThemedText`, the status surfaces and the page layouts — sit in
`src/components/`. Importing `@/design` from a screen today would put every fixture on that
screen's module-init path and close a require cycle through `error-surfaces`. The barrel is the
defect, not the folder.

The same graph has a live leak: Settings imports `isDeveloperSurfaceEnabled` from
`@/features/developer`, whose barrel re-exports the developer UI, which imports the gallery. The
Settings tab already evaluates the gallery registry and every fixture at module init.

Separately, the Button device pass (#493) found that the onboarding Connect footer (Back +
Continue side by side) wraps a label to about fourteen lines with mid-word breaks at the largest
text size. HIG and Material both turn a horizontal pair vertical at accessibility sizes; the app
has the threshold (`AccessibilityFontScale`, `useIsAccessibilityTextSize`) but no primitive for
the pair.

## What Changes

- **Barrel split.** `@/design` (`src/design/index.ts`) exports design primitives and their types
  only. The gallery runtime (entries, lookup, `GalleryStoryContent`, fixture types) moves to its
  own entry, `@/design/gallery` (`src/design/gallery/index.ts`), imported only by the developer
  feature's UI and by fixtures and gallery modules.
- **Primitives move into `src/design/<family>/`**, each with its test and fixture, all exported
  from `@/design`:
  - `text/`: `ThemedText`, `ThemedView` (new fixture + test).
  - `icon/`: `Icon`, `MATERIAL_GLYPHS` table (new fixture).
  - `button/`: `Button`, new `ButtonRow`.
  - `status/`: `EmptyState` + its artwork catalog, `ErrorState` / `ErrorNotice` / `FieldError` /
    `ErrorTextAction`.
  - `layout/`: `RootPage`, `PageIntro`, `KeyboardSafeActionLayout`, `AdaptiveContent` /
    `useAdaptiveLayout` (new fixture), `headerScrollProps`.
  - `useErrorAnnouncement` moves to `src/hooks/` (a shared hook used by chrome and design).
  Every import site switches to `@/design` (or `@/hooks/use-error-announcement`). **BREAKING**
  for in-repo imports of `@/components/{button,icon,icon-glyphs,themed-text,themed-view,
  root-page,keyboard-safe-action-layout,adaptive-content,header-scroll-props,empty-state,
  empty-state-artwork,error-surfaces,use-error-announcement}`; no shims.
- **Stays out of `src/design/`:** `app-tabs` and the route-structure test (app shell),
  `src/components/chrome/**` (the alpha/native seam, path-scoped lint), the personal-events
  `DateTimeField` (imports `@/features/calendar/data` and a `personalEvents.*` key; its
  promotion is a redesign slice), tokens (`@/theme`).
- **Layering, encoded.** `@/theme` ← `@/components/chrome` ← `@/design` ← features. Chrome never
  imports the `@/design` barrel (it may import a design leaf such as `@/design/text/themed-text`);
  design folders import each other by `@/design/<folder>/<file>`, never the barrel; nothing outside
  the developer UI, fixtures and `src/design/gallery/` imports `@/design/gallery`.
- **Developer gate off the UI barrel.** `isDeveloperSurfaceEnabled` moves to a non-UI
  `src/features/developer/access/` sublayer; the developer feature barrel exports only that, so
  Settings no longer reaches the gallery.
- **`ButtonRow`** (`@/design`): a `primary` + `secondary` `Button` pair laid side by side
  (secondary leading at intrinsic width up to half the row, primary trailing and filling the rest)
  that stacks full width, primary on top, when `useIsAccessibilityTextSize()` is true
  (`fontScale >= AccessibilityFontScale`, 1.786 = iOS AX1; Android 1.8 and 2.0). Applied to the
  Connect footer and the Button gallery's long row.
- **Gates (Principle 1):**
  - ESLint: `@/design/gallery` banned outside its allowed homes; `@/design` barrel banned inside
    `src/design/**` primitives and in `src/components/chrome/**` non-fixture files; deep
    `@/design/<folder>` imports stay banned outside `src/design/**` and chrome.
  - `tools/eslint-rules/design-import-policy.test.js` asserts the effective
    `no-restricted-imports` options per representative file (the flat-config replace trap).
  - `src/design/import-graph.contract.test.ts` walks the static value-import graph of `src/`:
    the `@/design` barrel never reaches a gallery module, only developer UI/routes, fixtures and
    gallery modules reach one, and no require cycle passes through `src/design/`.
  - `src/components/shell.contract.test.ts` pins `src/components/` to the app shell + `chrome/`.
  - L9 (`SymbolView`), `local/no-raw-button`, the coverage keys and lint messages point at the
    new paths.
- **Docs:** new ADR 068 (barrel split and layering); ADRs 064/065/067 amended to the current
  paths, ButtonRow added to 067; `architecture.md`, `theming.md`, `lint-format.md`,
  `features.md`, `accessibility.md`, `testing.md`, `golden-path.md` (+ template) updated; dated
  `CHANGELOG.md` entry.

## Capabilities

### New Capabilities

- `mobile-design-system-layer`: where design primitives live, the primitive-only `@/design`
  barrel, the developer-only gallery entry, the theme ← chrome ← design ← features layering, and
  the import-graph gates that keep fixtures off product screens.

### Modified Capabilities

- `mobile-design-system-button`: adds the side-by-side button pair that stacks at accessibility
  text sizes.

## Impact

- **Code (`mobile/src/`):** ~185 import lines across features, routes, chrome fixtures, theme
  fixture and tests; `src/design/` gains five family folders and a gallery entry;
  `src/components/` shrinks to `app-tabs` + `chrome/`; `src/hooks/use-error-announcement.ts`;
  `src/features/developer/access/`; connect screen footer; registry and its test.
- **Chrome churn (concurrent `fix/mobile-e2e-honesty`):** import lines only, in
  `native-settings-header.tsx`, `native-settings.tsx`, `native-error-notice.tsx` and the five
  chrome fixtures. No chrome file moves.
- **Tooling:** `eslint.config.js` (patterns, flags, blocks), `tools/eslint-rules/no-raw-button.js`
  message + test, `jest.config.js` coverage keys, `scripts/test-support/calendar-worklet-runtime.cjs`
  module stub.
- **Gallery:** existing story ids and deep links unchanged; new metas `themed-view`, `icon`,
  `adaptive-content`, `button-row` with FR/EN `gallery.*` keys.
- **Runtime behavior:** unchanged except the Connect footer at accessibility text sizes and
  Settings no longer evaluating gallery modules. No native dependency, no new package.
