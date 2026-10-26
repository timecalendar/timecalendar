# Tasks

All commands run in `mobile/` unless stated. Decisions are D1–D10 in `design.md`. Use `git mv` for
every move so history follows the file. Moves are path-only: no prop, style, testID, story id or
behavior change except `ButtonRow` (D9) and the developer gate (D6). Await every RNTL 14 helper;
no fake timers; `usePlatform` from `@/test-support/platform` for platform branches; mock font
scale the way `src/theme/text-scale.test.ts` does (`react-native/Libraries/Utilities/useWindowDimensions`).
Chrome files (`src/components/chrome/**`) get import-line edits only — another branch is editing
them. No code comments except a non-obvious why. Docs describe the current state only (no "moved
from", no history).

## 1. Gallery entry split

- [x] 1.1 Create `src/design/gallery/index.ts` with the current body of `src/design/index.ts`
      (entries, `availableGalleryEntries`, `findGalleryEntry`, `GalleryStoryContent`, the gallery
      types), importing its siblings relatively. Empty `src/design/index.ts` for now
      (`export {}`). Point `features/developer/ui/gallery-index-screen.tsx`,
      `gallery-story-screen.tsx`, `src/design/gallery/registry.test.ts` and every
      `import type { GalleryMeta, GalleryStory } from "@/design"` (13 fixtures) at
      `@/design/gallery`, keeping fixtures on `import type`. Verify: `npx tsc --noEmit`;
      `npx jest src/design src/features/developer` passes.
- [x] 1.2 Move `src/features/developer/ui/developer-access.ts` to
      `src/features/developer/access/developer-access.ts` with `access/index.ts`; make
      `src/features/developer/index.ts` export only `isDeveloperSurfaceEnabled` from `./access`;
      remove it from `ui/index.ts`; import `@/features/developer/access` in the three developer
      screens (D6). Add `access/developer-access.test.ts` (production capability → false, the
      other capabilities → true, mocking `@/features/environment`). Verify:
      `npx jest src/features/developer src/features/settings` passes and
      `npx jest --coverage --collectCoverageFrom='src/features/developer/access/**' src/features/developer/access`
      reports 100%.

## 2. Move primitives into `src/design/` (D1, D2)

- [x] 2.1 `git mv` into `src/design/text/`: `themed-text.tsx`, `themed-text.test.tsx`,
      `themed-text.gallery.tsx`, `themed-view.tsx`. Into `src/design/icon/`: `icon.tsx`,
      `icon-glyphs.ts`, `icon.test.tsx`. Into `src/design/button/`: `button.tsx`,
      `button.test.tsx`, `button.gallery.tsx`, `button.gallery.test.tsx`. Into
      `src/design/status/`: `empty-state.tsx`, `empty-state.test.tsx`, `empty-state.gallery.tsx`,
      `empty-state-artwork.ts`, `empty-state-artwork.test.ts`, `error-surfaces.tsx`,
      `error-surfaces.test.tsx`, `error-surfaces.gallery.tsx`, `error-surfaces.gallery.test.tsx`.
      Into `src/design/layout/`: `root-page.tsx`, `root-page.test.tsx`, `root-page.gallery.tsx`,
      `keyboard-safe-action-layout.tsx` (+ `.test.tsx`, `.gallery.tsx`, `.gallery.test.tsx`),
      `adaptive-content.tsx`, `adaptive-content.test.tsx`, `header-scroll-props.ts`. Move
      `src/components/use-error-announcement.ts` to `src/hooks/use-error-announcement.ts`.
      Fix `empty-state-artwork.ts` `require` depths (`../../../assets/…`). Verify: `ls
      src/components` shows only `app-tabs.tsx`, `app-tabs.test.tsx`,
      `settings-route-structure.test.ts`, `chrome/`.
- [x] 2.2 Inside `src/design/`, rewrite cross-file imports: same folder relative (`./icon-glyphs`),
      other folders `@/design/<folder>/<file>` (e.g. `button.tsx` → `@/design/icon/icon`,
      `@/design/text/themed-text`; `root-page.tsx` → `./adaptive-content`); never `@/design`. Error surfaces import
      `@/hooks/use-error-announcement`. Fixtures under `src/design/` import primitives from
      `@/design` and gallery types from `@/design/gallery` (`import type`). Verify: `rg
      'from "@/design"' src/design --glob '!*.gallery.tsx' --glob '!*.test.ts*' --glob
      '!gallery/**'` returns nothing.
- [x] 2.3 Fill `src/design/index.ts` with the primitive exports listed in D1 (components,
      `useAdaptiveLayout`, `headerScrollProps`, the artwork constants and every public type a
      consumer imports today); no token, no gallery export. Verify: `npx tsc --noEmit` after 2.4.
- [x] 2.4 Rewrite every other import of `@/components/{themed-text,themed-view,icon,button,
      empty-state,empty-state-artwork,error-surfaces,root-page,keyboard-safe-action-layout,
      adaptive-content,header-scroll-props}` to `@/design` (features, routes, `theme/tokens.gallery.tsx`,
      chrome fixtures), and `@/components/use-error-announcement` to
      `@/hooks/use-error-announcement` (chrome `native-settings.tsx`, `native-error-notice.tsx`).
      `chrome/native-settings-header.tsx` imports `ThemedText` from
      `@/design/text/themed-text` (D5, never the barrel). Update `jest.mock("@/components/icon", …)`
      in `calendar-header-tint.test.tsx` and `status-symbol.test.tsx` to mock the module the
      subject now imports (`@/design`, spreading `jest.requireActual("@/design")` so the other
      primitives stay real). In `scripts/test-support/calendar-worklet-runtime.cjs` replace the
      `"@/components/themed-text"` stub key with `"@/design"`. Merge duplicate `@/design` imports
      (`npx expo lint --fix` or by hand). Verify: `rg '@/components/(?!chrome)' src scripts`
      returns only `app-tabs` and the route-structure test; `npx tsc --noEmit` passes.
- [x] 2.5 Registry: update `src/design/gallery/registry.ts` import paths (`@/design/<folder>/…`
      fixtures, chrome and theme unchanged) and add the four new fixtures (3.x) in family order:
      layout (`root-page`, `adaptive-content`, `keyboard-safe-action-layout`), text
      (`themed-text`, `themed-view`), `icon`, status (`empty-state`, `error-surfaces`), button
      (`button`, `button-row`), then chrome and tokens as today. Verify:
      `npx jest src/design/gallery` passes (orphan, ids, render matrix, a11y).

## 3. New fixtures and tests required by L10

- [x] 3.1 `src/design/text/themed-view.test.tsx` (default `background`, a `type` override, caller
      style merged last, both schemes) and `themed-view.gallery.tsx` (meta `themed-view`, story
      `Surfaces`: `background`, `backgroundElement`, `backgroundSelected` with captions). Verify:
      `npx jest src/design/text` passes.
- [x] 3.2 `src/design/icon/icon.gallery.tsx` (meta `icon`): `Scaling` (a `text` icon beside a
      label vs. a `fixed` icon, at each `IconSize`) and `Glyphs` (`platforms: ["android"]`, every
      `MATERIAL_GLYPHS` key rendered with its name from a variable). Verify: `npx jest
      src/design` passes and L10 is green.
- [x] 3.3 `src/design/layout/adaptive-content.gallery.tsx` (meta `adaptive-content`):
      `StandardLane`, `ReadableLane`, `LongStrings` (`gallery.stress.*`). Verify: registry
      matrix passes.
- [x] 3.4 Add FR/EN `gallery.*` keys for the four metas and their stories (titles, story names,
      captions, `gallery.buttonRow.layout.row` / `.stacked`). Verify: the i18n parity test and
      `npx tsc --noEmit` (typed `GalleryKey`) pass.

## 4. `ButtonRow` (D9)

- [x] 4.1 Create `src/design/button/button-row.tsx` exporting `ButtonRow` and `ButtonRowProps`
      (`primary`, `secondary`, `testID?`, layout-only `style?: StyleProp<ButtonLayoutStyle>`
      merged last); `useIsAccessibilityTextSize()` from `@/theme` picks row (secondary wrapper
      `{ flexShrink: 1, maxWidth: "50%" }` then primary wrapper `{ flex: 1 }`, `alignItems:
      "center"`) or stacked (`alignItems: "stretch"`, primary first); `gap: Spacing.three`.
      Export from `@/design`. Verify: `npx tsc --noEmit`.
- [x] 4.2 `src/design/button/button-row.test.tsx`, `describe.each` over iOS and Android: font
      scale 1.0 and 1.353 (iOS) / 1.5 (Android) → row, secondary before primary, primary wrapper
      `flex: 1`; 1.786 (iOS) / 1.8 and 2.0 (Android) and 3.571 → column, primary before
      secondary, both stretched; a live font-scale change re-lays out without remount (same
      testIDs, handlers still fire); caller `style` merges last. Verify: `npx jest
      src/design/button --coverage --collectCoverageFrom='src/design/button/button-row.tsx'`
      reports ≥ 90% lines and branches.
- [x] 4.3 `src/design/button/button-row.gallery.tsx` (meta `button-row`): `Pair` (Back outlined /
      Continue filled) and `LongStrings` (`gallery.stress.action` on the primary, testIDs
      `gallery-button-long-row-short` / `gallery-button-long-row-long`), each captioned with the
      active layout. Remove the row from `button.gallery.tsx` `LongStrings` and its assertions
      from `button.gallery.test.tsx`. Verify: `npx jest src/design` passes.
- [x] 4.4 Connect footer: in `src/features/onboarding/ui/connect-screen.tsx` replace the
      `styles.footer` row with `<ButtonRow secondary={Back} primary={Continue} />`, keeping
      `onboarding-connect-back` / `onboarding-connect-continue` and their handlers; drop
      `footer`/`grow` styles. Extend the connect-screen test with an accessibility-size case
      (Continue before Back). Verify: `npx jest src/features/onboarding` passes; `rg -n
      'flexDirection: "row"' src/features --glob '*.tsx'` shows no remaining pair of sibling
      `Button`s (review the hits).

## 5. Lint and gates (D5, D8)

- [x] 5.1 `eslint.config.js`: split `designDeepImportPattern` to `^@/design/(?!gallery(/|$))`;
      add `galleryEntryImportPattern` (`banGalleryEntry`, default true) and
      `designBarrelImportPattern` (`^@/design$`, `banDesignBarrel`, default false) with messages
      naming ADR 068; restructure `developer-tools-home`, `design-home`, `chrome-seams`,
      `icon-seam` and add the fixture/gallery blocks so every file class gets the D5 table's
      policy while keeping every existing ban and the route-entrypoint pattern. `icon-seam`
      files → `src/design/icon/icon.tsx`, `src/design/icon/icon.test.tsx`. Messages: L9 "Render
      icons through Icon from @/design", touchables "Use Button from @/design". Update the
      `boundaries` comments for B-3/B-7 (components = app shell + chrome). Verify: `npm run lint`
      passes with zero warnings.
- [x] 5.2 `tools/eslint-rules/design-import-policy.test.js`: real config via `new ESLint({ cwd
      })`, `calculateConfigForFile()` per D8 file class (non-developer feature, developer
      feature, environment feature, route, design primitive, `src/design/icon/icon.tsx`, design
      gallery module, design fixture, design test, chrome runtime file, chrome fixture, theme
      fixture); assert presence/absence of the three design regexes, the route-entrypoint regex,
      and `SymbolView` path only where L9 applies. Verify: `npx jest tools/eslint-rules` passes;
      then inject-and-revert: temporarily drop `banGalleryEntry: false` from the developer block
      and confirm this test fails naming the developer file.
- [x] 5.3 `local/no-raw-button`: ignore `src/design/button/button.tsx`
      instead of `src/components/button.tsx`; message and file header point at `@/design`;
      update `no-raw-button.test.js` header import to `@/design`. Verify: `npx jest
      tools/eslint-rules` passes and the allowlist ceiling is unchanged.
- [x] 5.4 `src/design/import-graph.contract.test.ts` per D8 (value-import graph, three
      assertions, witness paths in failures, unresolved `@/` specifier fails). Include walker
      self-checks: it finds `features/developer/ui/gallery-index-screen.tsx →
      src/design/gallery/index.ts` and `registry.ts → design/button/button.gallery.tsx`. Verify:
      `npx jest src/design/import-graph` passes; inject-and-revert (a) add `import { galleryEntries }
      from "@/design/gallery"` to `src/design/index.ts`-reachable `button.tsx` with an eslint-disable,
      (b) restore `export * from "./ui"` in `src/features/developer/index.ts`, (c) turn one
      fixture's `import type` into a value import — each fails naming the module; revert.
- [x] 5.5 `src/components/shell.contract.test.ts` (top-level entries equal the shell set). Verify:
      passes; creating a scratch `src/components/badge.tsx` fails it naming the file; remove.
- [x] 5.6 `jest.config.js` coverage keys: `src/design/button/button.tsx` and
      `src/design/button/button-row.tsx` at 90/90 (replacing `src/components/button.tsx`).
      Verify: `npx jest jest.config.test.ts` passes and `npm test -- --coverage` enforces both.

## 6. Architecture Book and ADRs (`docs/mobile/architecture-book/`)

- [x] 6.1 New `decisions/068-design-layer-barrel-and-gallery-entry.md` (template): context (the
      gallery-as-barrel cycle, Settings leak), decision (D1, D3, D4, D5 layering, D6, D8 gates),
      rejected alternatives (lazy registry require, token re-export, chrome importing the barrel,
      madge dependency, bundle grep), consequences, revisit (a gallery consumer outside developer
      UI; chrome needing a design module beyond `text/`; Expo Router async routes making route
      splitting real). Add the row to `decisions/README.md`. Verify: link check by `rg
      068 docs/mobile/architecture-book`.
- [x] 6.2 Amend ADR 064 (gallery entry `@/design/gallery`, consumers), 065 (`src/design/icon/icon.tsx`,
      `icon-glyphs.ts`, L9 exemption paths), 067 (`src/design/button/button.tsx` exported from
      `@/design`; drop the barrel-split rejection and revisit; add the `ButtonRow` bullet per D9
      with the 1.786 threshold and stacking order). Present tense only. Verify: `rg
      'src/components/(button|icon)' docs/mobile/architecture-book` returns nothing.
- [x] 6.3 `architecture.md` Structure: `src/design/` families behind `@/design`, the
      `@/design/gallery` developer entry, `src/components/` = app shell + chrome seam, the
      layering line, links to ADR 068. `theming.md`: Buttons section path + `ButtonRow`, Icon
      bullet path, `Themed*` bullets import `@/design`, the chrome/design/feature boundary rule
      (proposal §3) with its gates. `lint-format.md`: Design layer bullet rewritten to the D5
      table, B-3/B-7 wording, L9 paths, Buttons paths/messages, the policy test and graph test as
      the R-1 proof. `features.md`: developer row reads `@/design/gallery`; gallery section and
      registry table (new paths, four new metas); `DateTimeField` note (B-7 + slice 3.4, D7).
      `accessibility.md`: Icon/Button paths, `ButtonRow` stacking under Dynamic Type with the
      "lint can't detect a hand-built row" caveat (D9). `testing.md`: coverage keys, fixture
      tiers, the three contract tests. `golden-path.md` and
      `golden-path-template/feature/ui/feature-screen.tsx.txt`: primitives from `@/design`.
      Verify: `rg '@/components/(?!chrome)|src/components/(?!chrome|app-tabs)'
      docs/mobile/architecture-book` returns only intentional shell references.
- [x] 6.4 `CHANGELOG.md`: a `## 2026-10-26 — Design layer barrel and ButtonRow` entry, newest
      first, with links to ADR 068/064/065/067 and the topical sections. Verify: entry is at the
      top and every link resolves.

## 7. Verification

- [x] 7.1 `npx tsc --noEmit` passes.
- [x] 7.2 `npm run lint` passes with `--max-warnings 0` (the script's flag).
- [x] 7.3 `npm test -- --coverage` passes, including the 90% per-file branch keys
      (`button.tsx`, `button-row.tsx`, hooks, developer access), the registry matrix, L10 and the
      three new contract tests. Record suite/test counts for the PR.
- [x] 7.4 Graph proof for the PR body: paste the import-graph contract test's assertion list
      (and, from a scratch run, the reverse closure of the gallery nodes) showing
      `settings-screen.tsx` and every non-developer screen outside it.
Not an implementer task: the conductor runs the iOS simulator check of the Connect
      footer and `button-row--long-strings` at default size and AX5, and a cold start through
      Settings, is done separately.
