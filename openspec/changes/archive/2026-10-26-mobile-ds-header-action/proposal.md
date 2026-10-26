# Proposal

## Why

Header actions and floating action buttons are built a different way on almost every screen
(`duplication-and-drift.md` §A5, §A6). Navigation-bar actions use four mechanisms: native
`unstable_headerRightItems` / `unstable_headerLeftItems` items (user calendars, school picker,
iOS Programme), `Stack.Toolbar` (timezone chooser), a `headerRight` RN `Pressable` holding text
(event details, changelog sheet Close, Android Programme Skip), and a `headerRight` row of
hand-sized icon `Pressable`s (calendar Today and Add). Each screen picks its own target size,
tint, press feedback and accessibility wiring. Three of these files are on the raw-button
allowlist marked "3.8". There are also three floating action buttons: the native Compose
`NativeListFloatingAction`, and two RN FABs (`HomeAddFab`, `CalendarAddFab`) that repeat the same
`#000000` shadow block. One draws a Material symbol and the other a "+" text glyph at a literal
`fontSize: 30`. Roadmap slice 3.8 (`migration-roadmap.md`, phase 3) gives the app one header
action and one floating action in `src/components/chrome/`. Phase 5 slices 5.4 (changelog), 5.9
(Home) and 5.10 (calendar chrome) build on them.

## What Changes

- **`useHeaderActions` + `HeaderAction` (chrome).** `src/components/chrome/header-action.tsx`
  exports `useHeaderActions({ left?, right? })`. It returns the navigation options a screen
  spreads into its single `Stack.Screen options`. Each `HeaderAction` item is either an icon
  action (`icon: NativeIcon`) or a text action (`label: string`). Every item requires an
  `accessibilityLabel` and a `testID`, and may take `accessibilityHint`, `disabled` and
  `platform` (`"ios" | "android"`, default both). All of this is in the types.
  - **iOS:** native `UIBarButtonItem`s through react-native-screens' header items. Icons are SF
    Symbols, text items use the system bar-button font, and both are tinted with the theme's
    primary label color (`text`, never brand pink). UIKit gives them their 44 pt targets, the
    Liquid Glass grouping and the Large Content Viewer. The `testID` becomes the item
    `identifier`.
  - **Android:** `headerLeft` / `headerRight` render a seeded Compose host holding Material 3
    actions. Icon actions are an `IconButton` (48 dp, state-layer ripple, Material Symbol with
    the label as its content description). Text actions are a `TextButton` in the `text` color,
    one line. The `testID` is a Compose test tag.
- **`FloatingAction` (chrome) generalizes `NativeListFloatingAction`.** It moves to
  `src/components/chrome/floating-action.tsx` as `FloatingAction`, with the same props (`icon`,
  `label`, `testID`, `onPress`) and no alias. It is a Material 3 `FloatingActionButton` in a
  seeded Compose host at the bottom-right corner (16 dp margins), and renders nothing on iOS,
  where the page adds through a header action (theming.md "Native platform expression").
  `NativeList reservesFloatingAction` and every RN scroll body that sits under the FAB clear it
  with the single `Layout.fabClearance` token. The 88 dp private constant goes away.
- **The icon pair type is named for chrome, not lists.** `NativeListIcon` /
  `NativeListMaterialSymbol` / `native-list-icons.ts` become `NativeIcon` /
  `NativeMaterialSymbol` / `native-icons.ts`, with no alias. A Material `today` vector drawable
  is added for the calendar Today action.
- **Call sites migrate:**
  - Calendar: Today and iOS Add become header actions, and the Android FAB becomes
    `FloatingAction`. `calendar-screen-actions.tsx` is deleted.
  - Home: the Android FAB becomes `FloatingAction`, and `HomeAddFab` is deleted.
  - Event details: Edit, Hide and Un-hide.
  - Changelog sheet: Close, with its hint.
  - Programme: Skip, one item on both platforms.
  - User calendars: iOS Add, and `FloatingAction` on Android.
  - School picker: the iOS Back item.
  - Timezone chooser: the iOS left Close. The iOS 26 bottom-toolbar Close stays a
    `Stack.Toolbar placement="bottom"` beside the search slot.

  **Deferred with reasons** (design D9): Home's iOS glass "+" (Home is a headerless tab, so the
  button is in-content, not a bar item; 5.9 decides Home's header), and the calendar view menu in
  `headerLeft` (a labelled menu pill, which belongs to 5.10's chrome work).
- **Visible behavior changes:**
  - Calendar Today and Add on iOS become native bar buttons.
  - Event details, changelog Close and Programme Skip become native text bar buttons on iOS and
    Material `TextButton`s on Android.
  - The Android Home and Calendar FABs become the Material 3 FAB: the seeded `primaryContainer`
    surface, the rounded-square shape and the M3 elevation, replacing a solid pink circle with a
    hard-coded shadow.
  - The NativeList FAB clearance changes from 112 to 96 dp.
- **E2E selector:** react-native-screens 4.25 gives a native bar item no accessibility
  identifier. Flow 02 therefore taps the calendar add action by its accessibility label (`"Add an
  event"`), which the iOS bar item and the Android FAB share. This is the same mechanism the flow
  already uses for the event-details header action (`"Edit this event"`). The flow stays one
  cross-platform path, and `e2e/maestro-selectors.test.ts` pins the new step.
- **Lint (Principle 1):** a new `local/no-ad-hoc-header-action` rule reports these outside
  `src/components/chrome/` and tests:
  - the navigation options `headerRight`, `headerLeft`, `unstable_headerRightItems` and
    `unstable_headerLeftItems`;
  - a `Stack.Toolbar` whose placement is not the literal `"bottom"`.

  Its allowlist (the calendar view menu, 5.10) is pinned at ceiling 1. Four files leave the
  raw-button allowlist, so its ceiling drops from 13 to 9.
- **Gallery:** `header-action` and `floating-action` fixtures cover every state, the longest
  French labels, and platform-only items, with a caption naming each story's platform behavior.
  The `native-list--floating-action` story moves to `floating-action`. `known-a11y-violations.ts`
  does not grow.
- **Docs:**
  - ADR 075 (header and floating actions are chrome).
  - navigation.md (header actions), theming.md (Header and floating actions, the seam bullet).
  - accessibility.md, lint-format.md, testing.md (native bar items have no accessibility
    identifier), features.md.
  - A dated CHANGELOG entry.
  - An inbox note for the Android device and screen-reader pass.

## Capabilities

### New Capabilities

- `mobile-design-system-header-action`: the shared navigation-bar action and floating action in
  the chrome seam. It covers their per-platform rendering, the required accessibility label,
  tint, targets, platform-only items, FAB clearance and the gallery.

### Modified Capabilities

- `mobile-lint-format`: a new ratcheted rule bans hand-built header actions outside chrome.
- `mobile-design-system-native-list`: the seam's name-family requirement no longer lists a
  floating action or an icon type. The floating action is `FloatingAction`, and the icon pair is
  the chrome-wide `NativeIcon`.

## Impact

- **Code:**
  - New in `mobile/src/components/chrome/`: `header-action.tsx`, `floating-action.tsx`,
    `compose-host.tsx` (the seeded Compose host extracted from `native-list.tsx`), and their tests
    and gallery fixtures. `native-icons.ts` (renamed) and `assets/icons/material/today.xml`.
  - Changed: `native-list.tsx`, `native-list.gallery.tsx`, `chrome/index.ts`,
    `design/gallery/registry.ts`, `jest/setup-expo-ui.ts` (Compose `IconButton`, `Text`
    semantics).
  - Feature screens: calendar header and screen, Home, event details, changelog sheet,
    Programme, user calendars, school picker, timezone chooser, and their tests.
  - Lint: `tools/eslint-rules/` and `eslint.config.js`.
  - E2E: `.maestro/02-personal-event.yaml` and `e2e/maestro-selectors.test.ts`.
  - i18n: `gallery.headerAction.*` and `gallery.floatingAction.*` in FR and EN.
- **Dependencies:** none new. It uses expo-router 56 / react-native-screens 4.25 header items,
  `@expo/ui` 56 Compose `IconButton` / `TextButton` / `FloatingActionButton`, and the existing
  `modules/compose-semantics`.
- **Native:** one new Android vector drawable. No new native module and no config plugin.
- **Docs:**
  - `docs/mobile/architecture-book/`: ADR 075 + index row; navigation.md, theming.md,
    accessibility.md, lint-format.md, testing.md, features.md; the CHANGELOG.
  - `docs/react-native-migration/inbox/2026-10-26-mobile-ds-header-action-device-pass.md`.
