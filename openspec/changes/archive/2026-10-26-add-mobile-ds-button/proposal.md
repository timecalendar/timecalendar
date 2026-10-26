# Proposal

## Why

`PrimaryAction` is the app's only shared button. Every other button is a local `Pressable` with
its own fill, border, opacity, height and label color: four hand-rolled filled CTAs, six outlined,
four neutral fills, six text buttons (assessment issue 2, `duplication-and-drift.md` §A1–A4). The
copies disagree on press feedback (none, 0.65, 0.8), touch target (48 on iOS), border (2px brand
pink) and label tone, and `PrimaryAction` merges caller `style` first so a caller cannot lay it
out without fighting its own defaults. Roadmap slice 3.1
(`docs/mobile/design-system-audit/migration-roadmap.md`) replaces them with one `Button` family;
the phase 5 screen migrations need it.

## What Changes

- **New `Button` primitive** in `mobile/src/components/button.tsx`, next to `Icon` and
  `ThemedText`:
  - `variant` (required, closed union): `filled`, `tonal`, `outlined`, `text`, `destructive`.
  - `size` (`small` | `medium` | `large`, default `medium`), every size mapped to tokens and at
    least `MinTouchTarget` tall and wide.
  - States: pressed (Android ripple, iOS `StateOpacity.pressed`), `disabled`, `busy` (progress
    shown, label kept visible and as the accessible name, `accessibilityState` `{ disabled, busy }`).
  - Optional `icon` (`{ ios, android }` glyph pair rendered by `Icon` with `scaling="text"`) and
    `iconPosition` (`leading` default, `trailing`).
  - `accessibilityLabel`, `accessibilityHint`, `accessibilityRole` (`button` | `link`), `testID`.
  - `style` is typed layout-only (margins, flex, alignment, width, position) and merges **last**;
    colors, height, padding, radius and opacity cannot be passed.
  - The label wraps up to sixteen lines at every text size and never clips.
- **`PrimaryAction` is removed, not aliased.** It has eight product call sites; each becomes
  `Button variant="filled"` with its props and `testID` unchanged. **BREAKING** for in-repo
  imports of `@/components/primary-action` (deleted with its test and fixture).
- **Slice 3.1 call sites migrate** to `Button`, keeping every existing `testID`:
  onboarding welcome (Skip, Next, final CTA), connect (intranet link, Back, Continue), manual
  import (QR, iCal URL), institution name and programme Continue; changelog sheet Continue;
  personal-event Save and Delete (Delete becomes `destructive`, busy while deleting), personal
  events Add; hidden events Unhide; export guide Next and Back. Also the remaining
  `PrimaryAction` sites: feedback Submit, iCal URL Import, import result, `ErrorState` primary
  action, the keyboard-safe action layout fixture. The dead `stepStyles.cta` style goes.
- **Gallery**: `src/components/button.gallery.tsx` (meta `button`) replaces the
  `primary-action` fixture: one story per variant (sizes × enabled/disabled/busy), icons
  (leading and trailing), and longest French strings. New `gallery.button.*` strings in FR and
  EN; the `gallery.primaryAction.*` strings go.
- **Lint (Principle 1)**:
  - `react-native`'s `Button`, `TouchableOpacity`, `TouchableHighlight`,
    `TouchableWithoutFeedback` and `TouchableNativeFeedback` are banned as named imports
    everywhere (zero current users, no exemption).
  - New repo-local rule `local/no-raw-button`: a React Native `Pressable` with a `button` or
    `link` role and a direct text child is an error outside `src/components/button.tsx`, the
    chrome seam and the calendar renderer. Files not yet migrated sit in a committed allowlist
    (`tools/eslint-rules/raw-button-allowlist.js`); a contract test fails on a stale entry, a
    missing file, or a list longer than its pinned ceiling, so the list only shrinks.
  - `src/components/button.tsx` gets its own 90% lines/branches coverage threshold.
- **Contrast**: `actionText` on `backgroundElement` and `destructive` on `backgroundElement` (body
  floor) join `documentedContrastPairs`, since text and destructive button labels sit on those
  surfaces.
- **ADR 067** records the button contract, the removal of `PrimaryAction`, the component
  location and the raw-button ratchet.
- **Architecture Book**: `theming.md` (Buttons section; `PrimaryAction` prose rewritten),
  `accessibility.md` (button semantics), `lint-format.md` (both rules), `testing.md` (ratchet
  contract test, per-file threshold), `features.md` (gallery inventory), ADR index, dated
  `CHANGELOG.md` entry.

Out of scope (each stays on the raw-button allowlist for its phase 5 or phase 3 slice): header
actions (changelog Close, calendar and home header buttons: 3.8 `HeaderAction`), FABs (3.8),
rows that are buttons (school, provider, timezone, activity, personal-event rows: 3.6
`ListRow`), `ErrorTextAction` (3.3 `StatusView`), the date-time field trigger (3.4), the QR
permission `QrActionButton` (5.7), the school-group Confirm and missing-school action (5.5), the
calendar refresh button and view menu (5.10), event-details actions and the checklist add
button (5.8), Home "See all" and timeline/scroller presses (5.9), the environment row (developer).
Moving the primitives into `src/design/` is its own slice (see design.md D1).

## Capabilities

### New Capabilities

- `mobile-design-system-button`: the shared button contract (variants, sizes, states,
  accessibility, platform press feedback, text scaling, layout-only style), its gallery fixture,
  and the lint gates that keep buttons on it.

### Modified Capabilities

- `mobile-root-page-primitives`: the filled primary action requirement is met by the shared
  `Button` `filled` variant instead of a dedicated `PrimaryAction` component.
- `mobile-personal-events-ui`: Save is the shared filled button; Delete is the shared destructive
  button and shows busy state while deleting.
- `mobile-feedback`: Submit is the shared filled button.
- `mobile-onboarding-flow`: Programme Continue is the shared filled button; the welcome, connect
  and manual-import buttons use the shared button family.
- `mobile-lint-format`: raw React Native touchables are banned, and text buttons built from a raw
  `Pressable` are a ratcheted lint error.

## Impact

- Code (`mobile/`): new `src/components/button.tsx`, `button.test.tsx`, `button.gallery.tsx`,
  `button.gallery.test.tsx`; deleted `src/components/primary-action{,.test,.gallery,.gallery.test}.tsx`;
  changed `src/components/error-surfaces.tsx`, `keyboard-safe-action-layout.gallery.tsx`,
  `src/design/gallery/registry.ts`; feature UI under `onboarding`, `changelog`,
  `personal-events`, `hidden-events`, `export-guides`, `feedback`, `calendar-sources` and their
  colocated tests; `src/theme/contrast.ts`; `src/i18n/locales/{en,fr}.json`;
  `eslint.config.js`; new `tools/eslint-rules/no-raw-button{,.test}.js`,
  `raw-button-allowlist{,.test}.js`, `tools/eslint-rules/index.js`; `jest.config.js`.
- Visual: every migrated button changes on device (radius, padding, outlined border to the
  `outline` role, text labels to `actionText`, destructive label color, Android ripple where
  there was none). Behavior, labels, routes and selectors stay.
- No new dependency, no native module, no route added or removed, no `app.config.ts` or
  `eas.json` change.
- Docs: Architecture Book files above, new ADR `decisions/067-button-family.md`, inbox note
  `docs/react-native-migration/inbox/2026-10-26-mobile-ds-button-screen-reader-pass.md`.
