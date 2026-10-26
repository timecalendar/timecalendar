# Design

## Context

- `src/design/` holds only the gallery runtime: `gallery/{types,stories,registry,story-content,
  known-a11y-violations}.ts(x)` and their tests. `src/design/index.ts` imports `galleryModules`
  from `gallery/registry.ts`, which statically imports all thirteen fixtures (six under
  `src/components/`, six under `src/components/chrome/`, `src/theme/tokens.gallery.tsx`).
  Thirteen fixtures `import type { GalleryMeta, GalleryStory } from "@/design"`; the developer
  gallery screens import `availableGalleryEntries`, `findGalleryEntry` and `GalleryStoryContent`
  from it.
- `src/components/` holds the shared primitives and helpers with these value imports (verified):
  - `themed-text` → `@/theme`; `themed-view` → `@/theme` (no test, no fixture).
  - `icon` → `expo-symbols`, `expo-font`, `./icon-glyphs` (test, no fixture).
  - `button` → `icon`, `themed-text`, `@/theme`.
  - `empty-state` → `themed-text`, `@/hooks/use-color-scheme`, `@/theme`, `expo-image`;
    `empty-state-artwork` → type from `empty-state`, two PNG pairs via `require("../../assets/…")`.
  - `error-surfaces` → `button`, `icon`, `themed-text`, `use-error-announcement`, `@/theme`.
  - `adaptive-content` → `@/theme` (test, no fixture); `header-scroll-props` → nothing.
  - `keyboard-safe-action-layout` → `adaptive-content`, `header-scroll-props`, safe-area, `@/theme`.
  - `root-page` → `adaptive-content`, **`@/components/chrome`** (`useHeaderOverlapInset`),
    `themed-text`, `@/theme`.
  - `use-error-announcement` → `react-native` only.
  - `app-tabs` → `@/components/chrome` (`NativeTabs`), i18n: the tab shell.
- Chrome → shared-component edges: `chrome/native-settings-header.tsx` → `themed-text`;
  `chrome/native-settings.tsx` and `chrome/native-error-notice.tsx` → `use-error-announcement`.
  Chrome fixtures import `RootPage`, `ThemedText`, `Icon`.
- `src/features/settings/ui/settings-screen.tsx` imports `isDeveloperSurfaceEnabled` from
  `@/features/developer`; `src/features/developer/index.ts` is `export * from "./ui"`, and
  `ui/index.ts` exports the gallery screens. Settings therefore evaluates the registry and every
  fixture at module init today.
- `src/theme/text-scale.ts` already owns `AccessibilityFontScale` (1.786),
  `isAccessibilityTextSize` and `useIsAccessibilityTextSize()`; `native-settings.tsx` and the
  welcome screen stack/resize on it.
- The only side-by-side `Button` pairs: the onboarding Connect footer (`connect-screen.tsx`,
  `styles.footer` row: Back outlined, Continue filled with `flex: 1`) and the Button fixture's
  `LongStrings` row (`gallery-button-long-row-*`). Every other two-button site already stacks
  (export guide Next/Back, manual import QR/URL, personal-event Save/Delete, `ErrorState`).
- Lint: `designDeepImportPattern` (`^@/design/`) bans deep design imports outside `src/design/**`
  (block `timecalendar/design-home` lifts it there); L9 exempts `src/components/icon{,.test}.tsx`
  (`timecalendar/icon-seam`); `timecalendar/raw-button` ignores `src/components/button.tsx`;
  `restrictedImports()` options are replaced, not merged, by each later block (lint-format.md
  caveat). B-7 (`boundaries`, element `design`) keeps features/routes/api/db out of `src/design`.
- Another branch (`fix/mobile-e2e-honesty`) is editing `src/components/chrome/` and
  `DateTimePicker` event handling concurrently.

## Goals / Non-Goals

**Goals:**

- `import { Button } from "@/design"` is safe from any screen: no fixture, no gallery module and
  no cycle on its module-init path, proven by a test rather than by review.
- `src/components/` is the app shell plus the chrome seam, and stays that way by test.
- A two-button row reads at AX5 / Android 2.0 without mid-word breaks.

**Non-Goals:**

- New primitives from the proposal (`StatusView`, `TextField`, `ListRow`, `Badge`, …) or API
  changes to the moved ones. Moves are path-only; behavior and props are unchanged.
- Promoting `DateTimeField` (D7).
- Moving any file under `src/components/chrome/` or changing chrome behavior.
- Route-level code splitting: the developer routes stay in every bundle, inert behind the gate
  (ADR 064).
- A lint rule that detects hand-built button rows (D9).

## Decisions

### D1. Family folders under `src/design/`, one primitive barrel

```
src/design/
  index.ts            @/design — primitives + public types only
  text/               themed-text.tsx, themed-view.tsx
  icon/               icon.tsx, icon-glyphs.ts
  button/             button.tsx, button-row.tsx
  status/             empty-state.tsx, empty-state-artwork.ts, error-surfaces.tsx
  layout/             root-page.tsx, keyboard-safe-action-layout.tsx, adaptive-content.tsx,
                      header-scroll-props.ts
  gallery/            index.ts (@/design/gallery), registry, stories, types, story-content, …
```

Each component keeps its `*.test.tsx`, `*.gallery.tsx` and `*.gallery.test.tsx` beside it. The
barrel exports exactly today's public surface: `ThemedText`, `ThemedTextProps`,
`ThemedTextType`, `TextTone`, `ThemedView`, `ThemedViewProps`, `Icon`, `IconProps`,
`IconScaling`, `MaterialGlyph`, `Button`, `ButtonProps`, `ButtonVariant`, `ButtonSize`,
`ButtonIcon`, `ButtonLayoutStyle`, `ButtonRow`, `ButtonRowProps`, `EmptyState`,
`EmptyStateArtwork`, `developerActivityArtwork`, `noDataArtwork`, `ErrorState`, `ErrorNotice`,
`FieldError`, `ErrorTextAction`, `ErrorAction`, `RootPage`, `PageIntro`,
`KeyboardSafeActionLayout`, `AdaptiveContent`, `AdaptiveContentProps`, `AdaptiveLayout`,
`useAdaptiveLayout`, `headerScrollProps` (plus any other type a consumer imports today —
`tsc` finds them). `MATERIAL_GLYPHS` stays internal (only `icon.test.tsx` reads it, relatively).

Folder names follow the proposal §3 (`button/`, `text/`, `icon/`, `layout/`); `status/` groups the
empty and error surfaces that the proposal's future `StatusView` will absorb, so 3.3 lands in the
folder that already holds its aliases.

Rejected: a flat `src/design/*.tsx` (the proposal and the existing "a folder imports its own
files relatively and other folders through `@/design/<folder>/…`" rule assume folders); one folder
per primitive (`empty-state/`, `error-surfaces/`, `root-page/` …, ten folders for thirteen files
with no ownership gain).

### D2. Move / stay list

| Module | Decision | Reason |
| --- | --- | --- |
| `button.tsx` (+test, fixture, fixture test) | → `design/button/` | Proposal §2 primitive; ADR 067 revisit trigger |
| `icon.tsx`, `icon-glyphs.ts` (+test) | → `design/icon/`; new `icon.gallery.tsx` | Proposal §2 primitive; L10 needs a fixture |
| `themed-text.tsx` (+test, fixture) | → `design/text/` | Proposal §2 primitive (type ramp renderer) |
| `themed-view.tsx` | → `design/text/`; new test + fixture | Pure RN, `@/theme` only, 6 consumers; same family as `ThemedText` |
| `empty-state.tsx`, `empty-state-artwork.ts` (+tests, fixture) | → `design/status/` | Proposal: `EmptyState` → `StatusView`; artwork is the illustration catalog `EmptyState` renders |
| `error-surfaces.tsx` (+test, fixture, fixture test) | → `design/status/` | Proposal: `ErrorNotice`, `FieldError` are `design/` |
| `root-page.tsx` (`RootPage`, `PageIntro`) (+test, fixture) | → `design/layout/` | Proposal "Page layout `design/layout/`" |
| `keyboard-safe-action-layout.tsx` (+test, fixture, fixture test) | → `design/layout/` | Same |
| `adaptive-content.tsx` (+test) | → `design/layout/`; new fixture | Same; L10 needs a fixture |
| `header-scroll-props.ts` | → `design/layout/` | Pairs with `RootPage`'s `scrollsUnderHeader`; `.ts` helper (no L10 fixture) |
| `use-error-announcement.ts` | → `src/hooks/` | A non-visual hook used by both chrome and design; `src/hooks` sits below both, so chrome does not import design for it |
| `app-tabs.tsx` (+test) | stays | App shell (the `(tabs)` layout component), product nouns via i18n |
| `settings-route-structure.test.ts` | stays | Route-structure contract for the shell |
| `components/chrome/**` | stays | The alpha/native seam: L-rule path-scoped to the directory (theming.md), proposal §3 keeps it; concurrent branch |
| `features/personal-events/ui/date-time-field.tsx` | stays | D7 |
| tokens (`@/theme`) | stay, not re-exported | D3 |

### D3. `@/design` does not re-export tokens

The proposal allows a convenience re-export. One symbol, one import source: theming.md says call
sites import `@/theme`, and 300+ call sites do. A second path would make
`import { Spacing } from "@/design"` and `"@/theme"` both valid and let them drift. The type-level
scenario in the spec (importing `Spacing` from `@/design` fails `tsc`) holds because the barrel
never exports it.

### D4. Gallery entry `@/design/gallery`, imported by developer UI and fixtures only

`src/design/gallery/index.ts` takes today's `src/design/index.ts` body verbatim
(`galleryEntries`, `availableGalleryEntries`, `findGalleryEntry`, `GalleryStoryContent`, the
types). Consumers: `features/developer/ui/gallery-{index,story}-screen.tsx` (value),
`registry.test.ts` (inside gallery), every fixture (`import type` only). Routes keep re-exporting
the developer UI and never name the gallery.

Rejected: keeping gallery and primitives in one barrel with a lazy `require()` of the registry
inside `availableGalleryEntries` (still one module, hides the cycle from static analysis, and the
developer feature would be the only consumer paying for a lazy-load pattern nobody else uses);
`src/gallery/` outside the design folder (ADR 064 and the owner decision place the registry in
`src/design/`).

### D5. Layering `@/theme` ← `@/hooks` ← `@/components/chrome` ← `@/design` ← features, and its lint encoding

`RootPage` reads `useHeaderOverlapInset` from the chrome barrel, so design depends on chrome.
Chrome's `native-settings-header.tsx` renders `ThemedText`. If chrome imported the `@/design`
barrel, the graph would be `chrome/index → native-settings-header → design/index →
layout/root-page → chrome/index`, a require cycle. Chrome therefore imports the leaf
`@/design/text/themed-text` (which imports only `@/theme`), and `useErrorAnnouncement` moves to
`@/hooks`. Inside `src/design/`, primitives import siblings by `@/design/<folder>/<file>`
(`button.tsx` → `@/design/icon/icon`, `@/design/text/themed-text`) and never the barrel, which
would cycle `design/index → button → design/index`.

Effective `no-restricted-imports` policy (beyond today's bans, which every block keeps):

| Files | `@/design` | `@/design/<folder>/…` | `@/design/gallery` (+ below) |
| --- | --- | --- | --- |
| features (not developer), routes, `components/app-tabs`, `theme`, `hooks`, others | allowed | banned | banned |
| `src/features/developer/**` | allowed | banned | allowed |
| `src/design/**` primitives (not fixtures, not tests, not `gallery/`) | **banned** | allowed | banned |
| `src/design/gallery/**` | allowed | allowed | allowed |
| `src/components/chrome/**` (not fixtures) | **banned** | allowed | banned |
| `src/**/*.gallery.tsx`, `src/**/*.gallery.test.tsx` | allowed | allowed only under `src/design/**` and chrome | allowed |
| `src/**/*.test.tsx` under `src/design/**` | allowed | allowed | banned |

Encoding: `restrictedImports()` gains two flags and one pattern split.
- `designDeepImportPattern` becomes `^@/design/(?!gallery(/|$))` (flag `banDesignDeepImports`).
- `galleryEntryImportPattern` `^@/design/gallery(/|$)`, flag `banGalleryEntry` (default true),
  message "The component gallery is developer-only: import @/design/gallery only from
  src/features/developer, fixtures and src/design/gallery (ADR 068)."
- `designBarrelImportPattern` `^@/design$`, flag `banDesignBarrel` (default **false**; true for
  design primitives and chrome non-fixtures), message naming the leaf path and the cycle.

Blocks: the existing `developer-tools-home` splits so `src/features/developer/**` gets
`{ banDeveloperTools: false, banGalleryEntry: false }` and `src/features/environment/**` keeps
`{ banDeveloperTools: false }`; `design-home` gets `{ banDesignDeepImports: false,
banDesignBarrel: true }` with `ignores` for `src/design/gallery/**`, fixtures and tests;
`chrome-seams` gets `{ banChromeSeam: false, banDesignDeepImports: false, banDesignBarrel: true }`
with fixtures ignored; new trailing blocks restate the full flag set for `src/design/gallery/**`,
design fixtures/tests, chrome fixtures and other fixtures. Every block re-calls
`restrictedImports([routeEntrypointImportPattern], …)` where `routes-not-importable` also matches
(the lint-format.md caveat). `icon-seam` moves to `src/design/icon/icon{,.test}.tsx` and must
carry `banDesignDeepImports: false, banDesignBarrel: true` too, because it is the last block for
those files.

Because a wrong block is a silent pass, the policy is pinned by a test, not by inject-and-revert
alone (D8).

Rejected: allowing chrome to import the barrel and tolerating the cycle (Metro logs `Require
cycle` in development and a module-init use would read `undefined`); moving
`useHeaderOverlapInset` out of chrome (a chrome-file move on a branch under concurrent edit, and
the hook reads native header metrics that belong to the seam); a `boundaries` rule for the
barrel (boundaries classifies elements, not the specific barrel file vs. a leaf in the same
element without `internalPath` gymnastics; `no-restricted-imports` already carries every seam).

### D6. The developer gate leaves the UI barrel

`ui/developer-access.ts` moves to `src/features/developer/access/developer-access.ts` with
`access/index.ts`. `src/features/developer/index.ts` exports only `isDeveloperSurfaceEnabled`
from `./access`; the developer UI imports `@/features/developer/access` (a sibling sub-barrel,
B-2 compliant). Routes keep importing `@/features/developer/ui`. The new sublayer enters the 90%
`src/features/*/!(ui|renderer)/**` tier, so it gets `developer-access.test.ts` (production vs.
non-production capability). This removes the Settings → gallery edge the graph test would
otherwise report.

### D7. `DateTimeField` stays in personal-events

It imports `AppLocale`, `formatShortDateTime` and `useUses24HourClock` from
`@/features/calendar/data` and the `personalEvents.form.dateTimeAccessibilityLabel` key: under
`src/design/` that is a B-7 violation. Making it product-agnostic means injecting the display
string and the 12/24-hour choice, which is the API redesign the proposal assigns to its promoted
`DateTimeField` (`mode`, Android date-then-time chaining) and the raw-button allowlist tags as
slice 3.4. `DateTimePicker` event handling is also under concurrent change. It keeps no fixture
(the registry still may not import a feature); features.md records why and which slice moves it.

### D8. Gates

- **`src/design/import-graph.contract.test.ts`** (jest, `node:fs` + `typescript` via
  `jest.requireActual`). Nodes: every `src/**/*.{ts,tsx}` except `*.test.ts(x)`. Edges: value
  imports from `ImportDeclaration` (skip `import type`, and skip a declaration whose every named
  specifier is `type`), `ExportDeclaration` with a module specifier (skip `export type`), and
  `require("<@/ or ./ spec>")` calls; resolve `@/x` → `src/x` and `./x` against the file's
  directory, trying `.ts`, `.tsx`, `.ios.tsx`, `.android.tsx`, `/index.ts`, `/index.tsx`;
  non-source specifiers (packages, assets) are dropped. Gallery nodes: `src/design/gallery/**`
  and `**/*.gallery.tsx`. Assertions, each failing with the offending module and one witness path:
  1. no gallery node is reachable from `src/design/index.ts`;
  2. the reverse closure of the gallery nodes ⊆ gallery nodes ∪ `src/features/developer/ui/**` ∪
     `src/app/developer.tsx` ∪ `src/app/developer/**` — in particular
     `src/features/settings/ui/settings-screen.tsx` is outside it;
  3. no strongly connected component of size > 1 contains a `src/design/**` node.
  This is also the bundle-sanity check: Metro includes every route, so the developer gallery is
  in every bundle by ADR 064 and a bundle grep proves nothing; what matters is that no product
  module evaluates gallery code at init, which is exactly assertion 2.
- **`src/components/shell.contract.test.ts`**: the top-level entries of `src/components/` equal
  `{app-tabs.tsx, app-tabs.test.tsx, settings-route-structure.test.ts, chrome}`.
- **`tools/eslint-rules/design-import-policy.test.js`**: `new ESLint({ cwd })` with the real
  config; `calculateConfigForFile()` for one representative path per row of the D5 table (plus
  `src/features/environment/ui/x.tsx` and `src/design/icon/icon.tsx`); asserts which of the three
  design regexes and the route-entrypoint regex are present in the effective
  `no-restricted-imports` patterns. The config load goes in `beforeAll`; if it approaches the
  30 s per-test budget (ADR 044), give that hook an explicit timeout rather than raising the
  global one.
- L10 (`fixture-coverage.contract.test.ts`) unchanged; the moves and four new fixtures satisfy it.
  L11 registry render matrix covers the new fixtures.
- Coverage: `src/components/button.tsx` key → `src/design/button/button.tsx`; add
  `src/design/button/button-row.tsx` (90/90). `src/hooks/use-error-announcement.ts` and
  `src/features/developer/access/**` land in existing 90% tiers.

### D9. `ButtonRow`

```ts
type ButtonRowProps = {
  primary: ReactElement<ButtonProps>
  secondary: ReactElement<ButtonProps>
  testID?: string
  style?: StyleProp<ButtonLayoutStyle>
}
```

- `stacked = useIsAccessibilityTextSize()` (reuse `src/theme/text-scale.ts`; no new threshold).
  1.786 is UIKit's `accessibilityMedium` multiplier as React Native reports it (RN
  `RCTAccessibilityManager.mm`: XXXL 1.353 → AX1 1.786 … AX5 3.571), so iOS stacks exactly on
  `UIContentSizeCategory.isAccessibilityCategory`, HIG's switch point for horizontal → vertical.
  Android system scales are 0.85/1.0/1.15/1.3/1.5/1.8/2.0: rows through 1.5, stacked at 1.8 and
  2.0. Material 3 sets no number; aligning with the native-settings stacking already on this
  seam keeps one threshold app-wide.
- Row: `flexDirection: "row"`, `alignItems: "center"`, `gap: Spacing.three`; children wrapped in
  layout `View`s: secondary `{ flexShrink: 1, maxWidth: "50%" }` first, primary `{ flex: 1 }`
  second (HIG/M3 put the confirming action trailing). RN mirrors the row under RTL.
- Stacked: `flexDirection: "column"`, `alignItems: "stretch"`, `gap: Spacing.three`; primary
  first, secondary second (HIG stacked actions and M3 stacked dialog actions put the confirming
  action on top).
- Wrapper `View`s rather than `cloneElement` keep `Button`'s typed layout `style` the caller's
  own; the same element instances render in both branches, so `testID`s and handlers survive.
  Reading order equals visual order in both layouts; no `accessibilityElements` override.
- Applied: Connect footer (`secondary` Back, `primary` Continue; the screen drops
  `styles.footer`/`styles.grow`); Button fixture's long row is removed from `LongStrings` and
  becomes `button-row--long-strings` (same `gallery-button-long-row-*` testIDs).
- Fixture `button-row.gallery.tsx`: stories `Pair` (Back / Continue) and `LongStrings`
  (`gallery.stress.action` copy), each with a caption stating the active layout
  (`gallery.buttonRow.layout.row` / `.stacked`). The gallery does not force a font scale: no
  existing story does, a forced layout would show a stacked row at small text (not what a user
  sees), and an override would put a test seam in a production primitive. The reviewer sets the
  device text size; the caption confirms the branch. Stateless, so no `*.gallery.test.tsx`.

### D10. Docs and ADRs

New ADR 068 records D1, D3–D5 and D8 (load-bearing: where every future primitive lives and why
chrome may not import the barrel). ADR 064 names `@/design/gallery` as the gallery entry; 065
names `src/design/icon/`; 067 names `src/design/button/`, drops the "barrel split" rejection and
revisit trigger (now satisfied) and adds the `ButtonRow` bullet (D9). Amendments are written in
the present tense with no transition narrative (ADR README: "Amend an ADR when the decision
changes; use Git for its history").

## Risks / Trade-offs

- [Merge conflicts with `fix/mobile-e2e-honesty` in chrome] → chrome edits are import lines only
  (3 runtime files, 5 fixtures); rebase onto whichever lands first and re-run lint + the graph test.
- [The flag matrix in `eslint.config.js` grows and a block silently drops a ban] →
  `design-import-policy.test.js` pins the effective config per file class.
- [Graph walker misses an edge style (dynamic `import()`, platform file) and passes falsely] →
  the walker's own test cases: a fixture-pair self-test asserting it finds the known
  `developer/ui → gallery` edge and the `registry → fixture` edges; any unresolved `@/` specifier
  fails the test rather than being dropped.
- [Codemod churn hides a behavior change] → moves are `git mv` + import rewrites only; story ids,
  testIDs and props are unchanged, and the full suite (3100+ tests) plus the registry matrix run.
- [Threshold 1.786 leaves Android 1.5 as a row] → at 1.5 the Connect labels fit on one or two
  lines in the readable lane; the gallery `long-strings` story is the review point on device.
- [`empty-state-artwork.ts` require paths change depth] → its test asserts both artworks resolve
  (`require` of the PNGs); a wrong depth fails Jest's module resolution.

## Migration Plan

Single PR on `refactor/mobile-design-folder`. No data, no native change, no runtime-version
impact beyond the JS bundle. Rollback is a revert.
