# Gallery fixtures for the existing shared components

## Why

The component gallery (ADR 064) holds two fixtures, both for the native-settings seam. The
shared primitives every screen is built from (page layout, empty and error states, the primary
button, the keyboard-safe action layout, the native numeric editor, glass, menus, date pickers,
the type ramp and the token layer) have no deep-linkable state a reviewer can open on device in
both schemes, at the largest text size and under a screen reader. Phase 3 primitives replace
several of them, and each of those slices needs the current rendering as its baseline. The
device pass of the gallery also found that a story opened by deep link has no index beneath it,
so Back leaves the gallery. This is roadmap slice 2.3
(`docs/mobile/design-system-audit/migration-roadmap.md`).

## What Changes

- **Eleven new fixture modules**, each a CSF3-shaped `*.gallery.tsx` colocated with its
  component, registered in `src/design/gallery/registry.ts`, with a default story and stress
  stories (longest French copy everywhere the component shows copy; disabled, busy and error
  where the component has them):
  - `src/components/root-page.gallery.tsx` (`RootPage` + `PageIntro`)
  - `src/components/empty-state.gallery.tsx` (`EmptyState`)
  - `src/components/error-surfaces.gallery.tsx` (`ErrorState`, `ErrorNotice`, `ErrorTextAction`,
    `FieldError`)
  - `src/components/primary-action.gallery.tsx` (`PrimaryAction`)
  - `src/components/keyboard-safe-action-layout.gallery.tsx` (`KeyboardSafeActionLayout`)
  - `src/components/themed-text.gallery.tsx` (every type-ramp step and every text tone)
  - `src/components/chrome/native-settings-numeric-editor.gallery.tsx`
    (`NativeSettingsNumericEditor`, which also exercises `NativeErrorNotice`)
  - `src/components/chrome/glass-surface.gallery.tsx` (`GlassSurface`)
  - `src/components/chrome/menu-view.gallery.tsx` (`MenuView`)
  - `src/components/chrome/date-time-picker.gallery.tsx` (`DateTimePicker`)
  - `src/theme/tokens.gallery.tsx` (every `Colors` role light and dark, every documented contrast
    pair with its computed ratio, `Spacing`, `Radii`, `IconSize`, `Elevation`)
- **Contrast data moves out of a test**: the WCAG `contrastRatio` helper and the documented pair
  table move from `src/theme/theme.test.tsx` to `src/theme/contrast.ts`, so the swatch page and
  the contrast gate read one table. The gate is unchanged.
- **Back from a deep-linked story returns to the gallery index.** When a story opens with
  anything other than the gallery index beneath it (cold or warm deep link), the story screen
  inserts the index beneath itself in the root Stack. Both routes stay layout-less root Stack
  siblings.
- **Text-size change while a story is open**: investigated on the iOS simulator. The clip the
  gallery device pass found is in `NativeSettingsHeader`, a component this change does not touch;
  the evidence and a proposed fix go to an inbox note, and the gallery does not mask it.
- **Jest native mocks follow the native semantics** where a fixture shows the mock diverging (the
  `MenuView` mock's wrapper), per the accessibility.md rule that a mock which drops real
  semantics is fixed in the mock.
- **L10 gate** (design-system proposal §4): a contract test fails when a `.tsx` under
  `src/design/**` outside an explicit helper list has no sibling `*.gallery.tsx` and `*.test.tsx`.
- **Strings**: every fixture title, story name and fixture copy under `gallery.*` in FR and EN,
  including a shared `gallery.stress.*` set of long French strings.
- **Architecture Book**: `features.md` gallery entry lists the fixture inventory;
  `navigation.md` (Back from a deep-linked story); `theming.md` and `accessibility.md`
  (contrast table location); `testing.md` (L10 gate); dated `CHANGELOG.md` entry.

Out of scope: any change to the components themselves (a concurrent change fixes shared-row,
onboarding, date-field, color-swatch and Android-dialog accessibility); a fixture for the
personal-events `DateTimeField` (a feature component the design layer may not import, B-7; its
promotion to `src/design` is a phase 3 slice); the native-text-entry-dialog fixture (already
exists).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-design-system-gallery`: deep-linked stories keep the gallery index beneath them; the
  fixture inventory covers the shared primitives, the type ramp and the token layer with named
  stress states; every `src/design/**` primitive must ship with a fixture and a test.

## Impact

- Code (`mobile/`): eleven new `*.gallery.tsx` files plus `*.gallery.test.tsx` for the stateful
  ones; `src/design/gallery/registry.ts`, `known-a11y-violations.ts` (only if a fixture exposes a
  real violation), new `src/design/gallery/fixture-coverage.contract.test.ts`; new
  `src/theme/contrast.ts`, changed `src/theme/theme.test.tsx`; changed
  `src/features/developer/ui/gallery-story-screen.tsx` + new `gallery-anchor.ts` and their tests,
  `gallery-index-screen.test.tsx`, `developer-routes.contract.test.tsx`; `jest/setup-expo-ui.ts`
  (menu mock); `src/i18n/locales/{en,fr}.json`.
- No new dependency, no route file added or removed, no `app.config.ts`, `eas.json`, Metro or
  Babel change, no native asset. Fixtures ship inert behind the developer gate.
- Docs: Architecture Book files above; inbox note
  `docs/react-native-migration/inbox/2026-10-25-mobile-gallery-fixtures-findings.md`.
