# Proposal

## Why

Two defects block the last list primitive. First, on Android `NativeListRow` drops its `hint`
and `accessibilityLabel` and declares no role: the Compose row carries only `testID` and Expo UI's
`clickable`, which in `@expo/ui` 56.0.17 exposes no role, no content description and no click label.
TalkBack therefore reads the visible text with no hint, and an action row is not announced as a
button. The Jest mock hides this because it invents a `button` role for any `clickable`. Second,
the eight long or custom lists that cannot use the native seam each build their own rows
(`duplication-and-drift.md` §A7). They differ in height (48/56/64), press feedback (none, opacity,
ripple, gray highlight), chevrons (iOS-only in one place) and separators (one iOS-only inset view,
two hairline borders; §A10). Roadmap slice 3.6 (`migration-roadmap.md`, phase 3) gives them one
row, one section and one separator, matched to the seam's geometry. Phase 5 screen slices and the
3.7 `Badge`/`ColorDot` slice build on them.

## What Changes

- **Part A — Android `NativeListRow` semantics (prerequisite).** A new local Expo module,
  `mobile/modules/compose-semantics/` (Android only), registers a custom Compose modifier with
  `@expo/ui`'s public `ModifierRegistry.register`. The modifier applies
  `clearAndSetSemantics { contentDescription; role = Role.Button }`.
  `chrome/compose-semantics.ts` builds its config. `ComposeListRow` passes the composed
  description (accessible name, then value, then hint) and the `button` role for navigation and
  action rows. The value row gets the description without a role. iOS is unchanged. The Expo UI
  Jest mock stops inventing a role for a bare `clickable` and reads the new modifier instead, so the
  registry a11y check sees what TalkBack sees. An Android Jest test proves that label, value, hint
  and role reach the native node. An Android-only Maestro assertion in flow 03 proves the hint
  reaches the real accessibility node.
- **Part B — new design-layer list family** in `mobile/src/design/list/`, exported from `@/design`:
  - `ListRow`: `label`, `subtitle?`, `details?` (extra supporting lines), `overline?` (a status
    word in a status tone), `value?`, `leading?` (a standard `Icon`, or a caller element with its
    width), `selected?` (a trailing check), `destructive?`, `disabled?`, `hint?`,
    `accessibilityLabel?` and a required `testID`. Activation is `onPress` or `href`. A row with
    neither is static and may take one trailing accessory element; the union type rules out an
    accessory inside a pressable row. `trailing="chevron"` draws an iOS disclosure chevron and
    nothing on Android, matching the seam.
  - The row is native on each platform. It is at least 44 pt tall on iOS and 56 dp on Android (the
    M3 one-line list item). iOS highlights the whole row in `backgroundSelected` on press; Android
    draws a clipped foreground ripple. Disabled dims to `StateOpacity.disabled` and blocks press.
    Every text line has a line cap (N > 0, never `clip`). At accessibility text sizes the value
    stacks under the label, and a single-word label shrinks instead of breaking mid-word, as the
    seam does.
  - Accessibility: an interactive row is one element with role `button`, the seam's default name
    (`label, subtitle, details…`), the value as `accessibilityValue`, the hint, and derived
    `selected`/`disabled` state. A static row groups its text into one stop, and its accessory
    stays its own stop.
  - `ListSection` (`title?`, `footer?`): the grouped container. On iOS it is an inset-grouped card
    on `backgroundElement` with inset separators between rows. On Android it is the seam's M3
    segments (2 dp gaps, 20/4 dp corners) on the seeded `surfaceContainer`. The title is a header
    for assistive technology. `listRowPosition(index, count)` gives virtualized lists the same
    grouped geometry without a wrapper.
  - `Separator` (`inset?: "none" | "leading" | { leadingWidth }`) and `ListRowSeparator` (the
    plain-list `ItemSeparatorComponent`: an inset separator on iOS, nothing on Android).
  - The seam's list geometry (inset, segment gap, corner radii, minimum row height) moves to one
    `ListGeometry` token in `@/theme`. `native-list.tsx` and the design list read the same numbers.
    Android grouped colors come from a chrome hook, `useListPalette()`. It derives the palette
    from the same seed color and scheme as every Compose host, so the RN rows match the seam's
    `surfaceContainer`/`onSurface`/`onSurfaceVariant` without sampled constants.
- **Call sites migrate** (every Maestro selector and every row `testID` kept): timezone chooser,
  school picker (`SchoolRow` and `RowSeparator`; `row-separator.tsx` is deleted), hidden events,
  activity, personal events list and provider selection. **Deferred with reasons** (design D10):
  the school-group picker's `GroupNode` (a dormant route the spec says nothing reaches, with a
  tree disclosure no other row has), Home's timeline divider (slice 5.9) and the calendar renderer
  (ADR 033).
- **Visible behavior changes**: the timezone chooser marks the current zone with a check and a
  selected state instead of a "Selected" word, so the `settings.timezone.selected` key is
  removed. The activity row's accessible name now carries its time and spoken change lines, which
  VoiceOver and TalkBack could not reach before. Hidden-events groups use list section headers.
- **Lint (Principle 1)**: a new `local/no-ad-hoc-separator` rule reports a style property
  `borderBottomWidth`, `borderTopWidth` or `height` set to `StyleSheet.hairlineWidth` outside
  `src/design/`, `src/theme/`, the calendar renderer and tests. Its allowlist (Home's timeline,
  slice 5.9) is pinned at ceiling 1. `school-row.tsx` leaves the raw-button allowlist and the
  ceiling drops to 13.
- **Gallery**: `list-row`, `list-section` and `separator` fixtures. They cover every state and
  stress strings, with a caption naming the text-size branch, and a `list-section--seam-comparison`
  story draws the same rows through `ListSection` and `NativeList`. `known-a11y-violations.ts`
  does not grow.
- **Docs**: ADR 073 (list family and the Compose semantics modifier), theming.md (new Lists section
  and the native-list Android semantics), accessibility.md, lint-format.md, testing.md, features.md,
  runtime.md (the local module), architecture.md (the `list/` family), the dated CHANGELOG entry,
  and an inbox note for the TalkBack/VoiceOver and geometry device pass.

## Capabilities

### New Capabilities

- `mobile-design-system-list-row`: the `ListRow` / `ListSection` / `Separator` contract (anatomy,
  geometry shared with the seam, states, font scaling, accessibility, layout-only style), its
  gallery fixtures, and the call-site migration that keeps selectors and accessible names.

### Modified Capabilities

- `mobile-design-system-native-list`: Android `NativeListRow` exposes its accessible name, value,
  hint and button role to TalkBack. The seam's list geometry is one shared token.
- `mobile-lint-format`: a hand-drawn hairline separator is a ratcheted lint error.
- `mobile-worldwide-timezone-search`: the chooser marks the current selection with a check and a
  selected state, and unavailable rows are disabled rows.
- `mobile-activity-ui`: an Activity item's accessible name includes its time and its change lines.

## Impact

- **Code (`mobile/`)**: new `modules/compose-semantics/` (Kotlin module, `expo-module.config.json`,
  `android/build.gradle`). New `src/components/chrome/compose-semantics.ts` and
  `list-palette.ts`, with tests. Changed `chrome/native-list.tsx`, `chrome/index.ts`,
  `native-list.test.tsx` and `jest/setup-expo-ui.ts`. New
  `src/design/list/{list-row,list-section,separator}{,.test,.gallery,.gallery.test}.tsx`. Changed
  `src/design/index.ts`, `src/design/gallery/registry.ts`, `src/theme/tokens.ts` (`ListGeometry`)
  and `theme.test.tsx`. Feature UI under `settings`, `school-selection`, `hidden-events`,
  `activity`, `personal-events` and `export-guides`, with their tests. `src/i18n/locales/{en,fr}.json`,
  `eslint.config.js`, `tools/eslint-rules/` (new rule, allowlist and tests;
  `raw-button-allowlist{,.test}.js`), `jest.config.js` (90% tiers) and
  `.maestro/03-calendar-visibility.yaml` (one Android-only assertion).
- **Native**: one new local Android module that autolinks from `modules/` and depends on the
  `expo-ui` Gradle project and Compose. It changes the Android fingerprint, which costs nothing
  before the v4 cutover. No new npm dependency, no `app.config.ts` plugin, and no iOS native change.
- **Visual**: the migrated lists converge on the seam's look (heights, press feedback, grouped
  surfaces, iOS-only chevrons, separators). Copy and routes stay. One i18n key is removed.
- **Out of scope**: event tiles and Home (slice 3.9 / 5.9), `Badge`/`ColorDot` (3.7; the
  personal-event swatch stays a caller element), header actions (3.8), the group picker, the
  calendar renderer and its chooser.
