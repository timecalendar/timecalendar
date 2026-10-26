# mobile-design-system-header-action Specification

## Purpose
The shared navigation-bar action and floating action of the native-chrome seam. Every screen's
header buttons and its primary create button render the same native way on each platform, with a
required accessible name, and hand-built header actions cannot come back.

## Requirements

### Requirement: Header actions are declared through one chrome API

The chrome seam SHALL provide `useHeaderActions({ left?, right? })`. It SHALL return the
navigation options that a screen spreads into its own single `Stack.Screen options`. Each side
SHALL take an ordered list of `HeaderAction` items. An item SHALL be either an icon action (an
SF Symbol / Material Symbol pair) or a text action (a visible label), never both and never
neither. Every item SHALL require an accessibility label, a testID and a press handler. An item
MAY take an accessibility hint, a disabled flag and a platform restriction (iOS only or Android
only). When a declared side has no item for the current platform, the hook SHALL return that
side's option set to `undefined`, so a button from an earlier render is cleared. The hook SHALL
return no option for a side the caller does not declare.

#### Scenario: An item without an accessibility label does not compile

- **WHEN** a screen declares a header action with no `accessibilityLabel`
- **THEN** `npx tsc --noEmit` fails

#### Scenario: An item with both an icon and a label does not compile

- **WHEN** a screen declares a header action with both `icon` and `label`
- **THEN** `npx tsc --noEmit` fails

#### Scenario: A platform-only item is absent on the other platform

- **WHEN** the calendar declares its Add action for iOS only and renders on Android
- **THEN** the returned options contain only the Today action on the right side

#### Scenario: A side that empties is cleared

- **WHEN** the calendar's Today action goes away after the user taps it on Android
- **THEN** the hook returns `headerRight` set to `undefined`, no Today button remains, and the
  view menu in `headerLeft` is kept

### Requirement: iOS header actions are native bar button items

On iOS a header action SHALL render as a native navigation-bar button item, not a React Native
view. An icon action SHALL show its SF Symbol, and a text action SHALL show its label in the
system bar-button style. Both SHALL be tinted with the active scheme's primary label color, never
the brand color, and SHALL carry the accessibility label, the hint, the disabled state and the
testID as the item identifier. Screens SHALL NOT set a tint on header items.

#### Scenario: The calendar Today action on iOS

- **WHEN** the calendar screen renders on iOS in dark mode
- **THEN** its right header items are native button items with the `calendar` and `plus` SF
  Symbols, tinted with the dark `text` color, with accessibility labels "Go to today" and "Add an
  event"

#### Scenario: A disabled item

- **WHEN** a header action is declared `disabled`
- **THEN** the native item is disabled and pressing it does not call its handler

### Requirement: Android header actions are Material 3 top-app-bar actions

On Android a header action SHALL render inside a seeded Compose host in the header slot for its
side. An icon action SHALL be a Material 3 icon button with a minimum 48 dp target, the platform
state-layer ripple, and its Material Symbol carrying the accessibility label as content
description. A text action SHALL be a Material 3 text button. Its label SHALL use the primary text
color, never the brand color, and SHALL stay on one line. TalkBack SHALL announce one button whose
name is the accessibility label followed by the hint, and the button SHALL keep its click action.
The item's testID SHALL be a Compose test tag that Maestro can select.

#### Scenario: Programme Skip on Android

- **WHEN** the Programme screen renders on Android
- **THEN** its right header holds a text button labelled "Skip", with testID
  `onboarding-programme-skip`, whose accessible name is "Skip naming your programme", and
  pressing it skips naming

#### Scenario: The calendar Today action on Android

- **WHEN** the calendar screen renders on Android
- **THEN** its right header holds a 48 dp icon button with the `today` Material Symbol and
  testID `calendar-today`, announced as "Go to today"

### Requirement: The floating action is a Material 3 FAB on Android and absent on iOS

The chrome seam SHALL provide `FloatingAction` with a required icon pair, label, testID and press
handler. On Android it SHALL render a Material 3 floating action button in its own seeded Compose
host, at the bottom-right corner with 16 dp margins, with the label as the icon's content
description. Its colors and shape SHALL come from the seeded Material scheme, not from React
Native styles or shadow props. On iOS it SHALL render nothing. Every scroll body that sits under a
floating action SHALL keep a bottom inset of `Layout.fabClearance` so its last item can scroll
clear of the button.

#### Scenario: The Home add button on Android

- **WHEN** Home renders on Android
- **THEN** it shows one Material FAB with testID `home-add-personal-event`, announced as "Add
  personal event", and its scroll content ends with a `Layout.fabClearance` bottom inset

#### Scenario: No FAB on iOS

- **WHEN** Home, Calendar or User calendars renders on iOS
- **THEN** no floating action button is rendered, and the add action is reachable from the page's
  header or in-content add button

### Requirement: Primary create actions follow the platform idiom

A screen whose primary action is "add" SHALL show it as a trailing header action on iOS and as a
`FloatingAction` on Android. On each platform the two SHALL share one accessibility label. The
calendar and user calendars screens SHALL follow this rule. Home SHALL show the floating action on
Android and keep its in-content glass add button on iOS.

#### Scenario: The calendar add action on both platforms

- **WHEN** the calendar screen renders on iOS and then on Android
- **THEN** iOS shows a trailing "Add an event" header item, Android shows an "Add an event"
  floating action, and neither platform shows both

#### Scenario: The E2E flow adds through the shared label

- **WHEN** Maestro flow 02 taps "Add an event" on the calendar
- **THEN** the personal-event form opens on both iOS and Android through the same flow step

### Requirement: Header and floating actions have gallery fixtures

The component gallery SHALL register a `header-action` entry and a `floating-action` entry. Their
stories SHALL cover icon actions, text actions, both sides, a disabled item, platform-only items,
and the longest French labels. On the platform where a component renders nothing, each story
SHALL show a caption that says so. Every story SHALL render in light and dark on iOS and Android in
the registry test without adding an entry to the known accessibility violations list.

#### Scenario: Gallery stories render in both schemes

- **WHEN** the registry test renders every `header-action` and `floating-action` story in light and
  dark on both platforms
- **THEN** each renders without error and the known violations list is unchanged
