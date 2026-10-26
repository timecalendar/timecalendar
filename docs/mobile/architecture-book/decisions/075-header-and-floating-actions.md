# 075 — Header and floating actions

## Status

Accepted.

## Context

Navigation-bar actions were built four ways (`duplication-and-drift.md` §A5): RN `Pressable`s in
`headerRight` with hand-sized targets (calendar Today and Add, event details, changelog Close,
Android Programme Skip), iOS `unstable_headerRightItems` with a per-item `tintColor` (user
calendars), iOS `unstable_headerLeftItems` (school picker Back) and `Stack.Toolbar
placement="left"` (timezone Close). Android create buttons were two RN circles with a `#000000`
shadow and a literal "+" (Home, Calendar) beside a Compose M3 FAB (`NativeListFloatingAction`),
with three bottom clearances (§A6).

Platform facts:

- react-native-screens header items are native `UIBarButtonItem`s. Their `identifier` is the
  iOS 26 transition id, not an accessibility identifier, and the library sets none, so XCUITest
  and Maestro reach a bar item by its label only.
- Android react-native-screens has no header items. expo-router's `Stack.Toolbar` renders
  Compose `IconButton`s on Android, has no text action there, and has no testID on either
  platform.

## Decision

- **A hook returns options.** `useHeaderActions({ left?, right? })` from `@/components/chrome`
  returns the header slots a screen spreads into its one `Stack.Screen options`. A
  `HeaderAction` is an icon (`NativeIcon`) or a visible `label`, never both, with a required
  `accessibilityLabel`, a `testID`, an optional hint, `disabled` and `platform`. It has no color
  field: the chrome tints every action with `theme.text`. Only a declared side returns a key:
  `setOptions` merges options, so a declared side with no action for the platform returns its
  key as `undefined` to clear a button from an earlier render, and an undeclared side returns
  no key so a slot the screen sets by hand survives.
- **iOS: native bar items.** Each action is a `type: "button"` header item: SF Symbol or label,
  `accessibilityLabel`, hint, `identifier: testID`. Targets, highlight, Liquid Glass background,
  size caps and the Large Content Viewer are UIKit's.
- **Android: M3 top-app-bar actions.** `headerLeft` / `headerRight` render a `Row` of Compose
  `IconButton`s (Material Symbol at 24, content description = name) and `TextButton`s (one line,
  `labelLarge`, ellipsis) in `SeededComposeHost`. A text action's name sits on its label `Text`
  through `timecalendarSemantics` (label, then hint, ADR 073): `clearAndSetSemantics` on the
  button would clear its click action, while the M3 button merges the child's description into
  one button node.
- **One FAB.** `FloatingAction({ icon, label, testID, onPress })` is the Compose M3
  `FloatingActionButton` at the 16 dp margin, seeded by `theme.primary`, `null` on iOS.
  `Layout.fabClearance` (96) is the one bottom clearance (`NativeList reservesFloatingAction`,
  Home, the Android agenda).
- **The create idiom.** A trailing iOS header item and an Android FAB, never both, with one
  label and one testID per screen pair (calendar uses `calendar-add` / `calendar-fab`).
- **One icon pair.** `native-list-icons.ts` is `native-icons.ts` and its type is `NativeIcon`,
  with no alias.
- **Label selection in Maestro.** Flow 02 taps `"Add an event"`, which is the iOS bar item's
  label and the Android FAB's content description.
- **A ratchet.** `local/no-ad-hoc-header-action` reports `headerRight`, `headerLeft`,
  `unstable_headerRightItems`, `unstable_headerLeftItems` keys and a `Stack.Toolbar` with a
  non-`"bottom"` placement outside `src/components/chrome/` and tests, with a one-entry allowlist.

Rejected:

- `Stack.Toolbar` as the implementation: no testID, no Android text action.
- A component that renders its own `Stack.Screen`: options split over two `setOptions` calls whose
  merge depends on render order.
- RN `Pressable`s on either platform: they redraw the system control by hand.
- A patch that sets `accessibilityIdentifier` on bar items: native code against a fast-moving
  package for one selector (the ADR 065 reasoning).
- A `menu` field with no consumer.
- A `NativeListIcon` alias.

## Consequences

- iOS E2E reaches header actions by accessibility label only. The testIDs stay for Jest and
  Android.
- Android text actions are one line; the full name is in semantics. The `header-action--long-strings`
  gallery story shows the cut.
- The Android Home and Calendar FABs take the tonal M3 look of the user calendars FAB.
- Two deferrals: the Home iOS glass "+" stays an in-content button on the headerless tab (5.9),
  and the calendar view menu stays a hand-built `headerLeft`, the one allowlist entry (5.10).
- TalkBack naming, the Compose header layout at large font scale and the FAB look are device
  evidence (`docs/react-native-migration/inbox/2026-10-26-mobile-ds-header-action-device-pass.md`).

## Revisit if

- react-native-screens sets an accessibility identifier on bar items.
- A screen needs a header menu.
- expo-router's `Stack.Toolbar` gains testIDs and Android text actions.
- Home gains a native header.
