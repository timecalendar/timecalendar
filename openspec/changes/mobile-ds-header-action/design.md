# Design

## Context

Header actions today (`mobile/src`, at `04d88cca`):

| Screen | File | Mechanism | Maestro |
| --- | --- | --- | --- |
| Calendar Today + Add | `features/calendar/ui/calendar-screen/calendar-screen-actions.tsx` (`HeaderIconAction`), wired in `calendar-screen-header.tsx:77` | `headerRight` RN `Pressable`s, `Icon` at 24, 44/48 by hand, `theme.text` tint (no longer pink) | flow 02 taps `id: "calendar-(add|fab)"` |
| Calendar view menu | `calendar-screen-header.tsx:67`, `calendar-view-menu.tsx` | `headerLeft` RN pill inside `MenuView` | `calendar-view` (helpers) |
| Event details Edit / Hide / Un-hide | `features/calendar/ui/event-details-actions.tsx:101` | `headerRight` `Pressable` + `ThemedText smallBold` | flow 02 taps `"Edit this event"` (label) |
| Changelog sheet Close | `features/changelog/ui/changelog-sheet-screen.tsx:53` | `headerRight` `Pressable` + `ThemedText`, `hitSlop` 12 | — |
| Programme Skip | `features/onboarding/ui/programme-screen.tsx:99,110` | iOS `unstable_headerRightItems` text item; Android `headerRight` `Pressable` | — |
| User calendars Add | `features/calendar-sources/ui/user-calendars-screen.tsx:40` | iOS `unstable_headerRightItems` icon item with its own `tintColor` | — |
| School picker Back | `features/school-selection/ui/school-picker-screen.tsx:79` | iOS `unstable_headerLeftItems` (nested-stack first screen) | — |
| Timezone Close | `features/settings/ui/timezone-chooser-screen.tsx:101,111` | `Stack.Toolbar placement="left"` (iOS), `placement="bottom"` with `SearchBarSlot` (iOS 26 bottom search) | — |

Floating actions:

- `HomeAddFab` (`home-screen-header.tsx:50`): Android, `Icon android="add"`, `primary` fill, a
  borderless ripple, and the `#000000` shadow plus `elevation: 6`.
- `CalendarAddFab` (`calendar-screen-actions.tsx:76`): Android, a "+" `ThemedText` at
  `fontSize: 30` and the same shadow. Its testID is `calendar-fab`.
- `NativeListFloatingAction` (`chrome/native-list.tsx:292`): a Compose M3 `FloatingActionButton`
  in the private seeded `ComposeListHost`, at right 16 / bottom 16. `NativeList
  reservesFloatingAction` pads by `LIST_BOTTOM_PADDING + FAB_CLEARANCE` (24 + 88). Home pads its
  Android scroll by a literal 96 (`home-screen.tsx:121`). `Layout.fabClearance` (96) exists in
  `@/theme` and has no consumer.

Platform facts that shape the design (read from `node_modules`, not assumed):

- react-native-screens 4.25.2 header items (`unstable_headerRightItems` / `…LeftItems`) are
  native `UIBarButtonItem`s (`ios/RNSBarButtonItem.mm`). They carry `label`, `icon` (`sfSymbol`
  or image), `tintColor`, `disabled`, `accessibilityLabel`, `accessibilityHint` and
  `identifier`. `identifier` sets `UIBarButtonItem.identifier` (the iOS 26 transition id), not an
  accessibility identifier, and the file sets none. So XCUITest and Maestro can reach a native bar
  item by its label only.
- Android react-native-screens has no header items. expo-router 56.2's own `Stack.Toolbar` fills
  that gap by rendering `@expo/ui` Compose `IconButton`s inside `Host matchContents` + `Row` in
  `headerLeft` / `headerRight` (`processHeaderItemsForPlatform.android.js`). Its Android button
  returns `null` without an image icon (so it has no text actions), and it has no testID prop on
  either platform.
- `@expo/ui` 56 Compose exports `IconButton` and `TextButton` with `colors`, `enabled` and
  `modifiers`. `modules/compose-semantics` registers `timecalendarSemantics`, which runs
  `clearAndSetSemantics { contentDescription; role }` (ADR 073).
- The theming rule already says header items use the `text` tint and screens set no tint on
  header items (navigation.md). User calendars breaks it today with a per-item `tintColor`.
- `raw-button-allowlist.js` marks `calendar-screen-actions.tsx`, `changelog-sheet-screen.tsx` and
  `programme-screen.tsx` as "3.8". `event-details-actions.tsx` ("5.8") has no `Pressable` other
  than the header action.

## Goals / Non-Goals

**Goals:**

- One way to declare a navigation-bar action. It renders as the platform's own control: a
  `UIBarButtonItem` on iOS, an M3 top-app-bar `IconButton` / `TextButton` on Android.
- An accessible name required by the type on every action, and a testID on every action.
- One floating action (the Compose M3 FAB) for every Android primary create button, and one FAB
  clearance token.
- Every listed call site migrated, with the deferrals written down.
- A lint ratchet so new hand-built header buttons cannot land.

**Non-Goals:**

- Header menus. The proposal sketches `menu?`, but no call site in this slice needs a native
  header menu. The calendar view menu is a labelled pill whose redesign belongs to 5.10, so the
  API gets no `menu` field until a consumer exists (R-2).
- Home's header. Home is a headerless tab, and its iOS "+" is an in-content glass button (5.9).
- The calendar `headerTitle`, the calendar renderer (ADR 033), and the `MenuView` gallery
  trigger's AX5 capsule (`inbox/2026-10-25-mobile-gallery-fixtures-findings.md`). That trigger
  is a body `Pressable` in a fixture, not a header action.
- The Android M3 dialog work in the inbox.
- Extended FABs, small or large FABs, and FAB menus.

## Decisions

### D1. The API is a hook that returns options

`useHeaderActions({ left?: HeaderAction[], right?: HeaderAction[] }): HeaderActionOptions`. It
returns a `Partial<NativeStackNavigationOptions>` that a screen spreads into its own
`<Stack.Screen options={{ title, ...headerActions }} />`.

```ts
type HeaderActionBase = {
  accessibilityLabel: string
  accessibilityHint?: string | undefined
  testID: string
  onPress: () => void
  disabled?: boolean | undefined
  platform?: "ios" | "android" | undefined
}
export type HeaderAction =
  | (HeaderActionBase & { icon: NativeIcon; label?: never })
  | (HeaderActionBase & { label: string; icon?: never })
```

The hook resolves `useTheme()` for the tint and filters items by `Platform.OS`. An empty side
returns no key, so a screen with no Android items does not replace the native back arrow area.

Why a hook and not a `<HeaderAction>` component that renders its own `Stack.Screen`:

- A second `Stack.Screen` (or `Stack.Toolbar`'s composition option) in the same page splits the
  options over two `setOptions` calls. Their merge order then depends on render order.
- Every feature test that captures `Stack.Screen options` would see two partial objects.
- The hook keeps one atomic options object per screen, and its output can be tested as data.

Rejected:

- `Stack.Toolbar` as the implementation: it has no testID, and no text action on Android.
- A component per side: same split-options problem.
- `items` on a `side` prop as in the proposal sketch: `{ left, right }` lets the timezone chooser
  and a future screen declare both sides in one call. Each item stays the proposal's
  `{ icon | label, onPress }` shape.

### D2. iOS: native bar button items

Each iOS item maps to `{ type: "button", label, icon?, tintColor: theme.text, accessibilityLabel,
accessibilityHint, identifier: testID, disabled, onPress }` on `unstable_headerRightItems` /
`unstable_headerLeftItems`:

- Icon items pass `label: accessibilityLabel`. UIKit shows the icon only and uses the label for
  the Large Content Viewer.
- Text items pass their visible `label`.
- `icon` is `{ type: "sfSymbol", name: icon.ios }`.
- Targets, the Liquid Glass shared background and press highlight are UIKit's, and so is
  Dynamic Type behavior: bar items cap their size and offer the Large Content Viewer on long
  press at accessibility sizes.

The chrome owns the `text` tint. A screen cannot pass a tint because `HeaderAction` has no color
field.

Rejected: RN `Pressable`s in `headerRight` on iOS. They would keep testIDs, but they re-draw a
system control: hand-sized targets, no Large Content Viewer, no native highlight, custom text
metrics. R-3 makes the native platform the reference.

### D3. Android: M3 actions in a seeded Compose host

`headerRight` / `headerLeft` return `<HeaderActionBar side items />`. It is a `SeededComposeHost
matchContents` (D5) holding a Compose `Row` with vertically centered children:

- **Icon item:** `IconButton` with `enabled={!disabled}`, `modifiers={[testID(id)]}` and
  `onClick`. Its child is the Compose `Icon` with `source={materialSymbolSource(icon.android)}`,
  `size={24}`, `contentDescription={name}`, and tint `theme.text` (`colors.contentColor`). The
  M3 `IconButton` supplies the 48 dp minimum target and the state-layer ripple.
- **Text item:** `TextButton` with the same `enabled` / `testID` / `onClick` and
  `colors.contentColor = theme.text`. Its child is a Compose `Text` with `maxLines={1}`, the M3
  `labelLarge` style, and the `timecalendarSemantics` modifier carrying `contentDescription:
  name` with no role. The modifier goes on the label `Text`, not on the button.
  `clearAndSetSemantics` on the button would clear its own click action. On the child, the M3
  button merges its descendants into one node with `Role.Button`, the click action, and the
  child's description as its name.
- `name` is `accessibilityLabel` alone, or `` `${accessibilityLabel}, ${accessibilityHint}` ``
  when a hint is given (the ADR 073 composition, which has no separate TalkBack hint).
- **One line.** Android text actions keep one line (`maxLines={1}`, ellipsis): a 64 dp top app
  bar has no room for a second line, and the full name is in the semantics. This is the one place
  a label may ellipsize, so the gallery `long-strings` story makes it visible.

Rejected:

- expo-router's Android `Stack.Toolbar` path: no testID, no text actions.
- RN `Pressable` + `android_ripple`: it re-draws the M3 button by hand, which is what §A5
  complains about.

### D4. `FloatingAction` replaces `NativeListFloatingAction`

`src/components/chrome/floating-action.tsx` exports `FloatingAction({ icon, label, testID,
onPress })`, the body of `NativeListFloatingAction` moved as is:

- It is a `SeededComposeHost matchContents` positioned absolutely at `right: Spacing.three,
  bottom: Spacing.three` (16 dp, the M3 FAB margin). It holds a `FloatingActionButton` with
  `testID`, and inside it a `FloatingActionButton.Icon` / `Icon` at 24 with `contentDescription:
  label`.
- On iOS it returns `null`.
- It has no color, size or variant prop. Colors (`primaryContainer` / `onPrimaryContainer`),
  shape and elevation come from the scheme seeded by `theme.primary`.

`NativeListFloatingAction` is deleted from `native-list.tsx` and the barrel, with no alias, as in
ADR 072.

**Clearance.** `FAB_CLEARANCE` (88) is deleted. `NativeList reservesFloatingAction` pads its
Android bottom by `Layout.fabClearance` (96) instead of `24 + 88`. Home's Android
`paddingBottom: 96` becomes `Layout.fabClearance`. 56 dp FAB + 16 dp margin + 24 dp gap = 96. The
calendar has no reserve today, and its RN FAB sits over the agenda list and the owned grid. On
Android the agenda `SectionList` gains a `Layout.fabClearance` bottom content inset, so its last
event can scroll clear. The owned grid is a fixed-height day canvas under ADR 033: the FAB covers
the lower right of the last hours as it does today, and the grid is not changed.

Visible change: the Android Home and Calendar FABs stop being solid pink circles with an RN
shadow. They become the M3 FAB: the tonal `primaryContainer` fill, the rounded-square M3 shape and
M3 elevation, which is what the user calendars FAB already looks like. This is the platform
reference (R-3), and it deletes both `#000000` shadow blocks and the literal "+" glyph.

### D5. One seeded Compose host

`ComposeListHost` (`native-list.tsx:240`) is extracted to `src/components/chrome/compose-host.tsx`
as `SeededComposeHost`: it sets `colorScheme` from `useResolvedScheme()` and `seedColor` from
`theme.primary`. It is chrome-internal and not exported from the barrel. `native-list.tsx`,
`floating-action.tsx` and `header-action.tsx` import it by path. Every Compose surface (list, FAB,
header) therefore derives the same Material palette.

### D6. `NativeIcon` is the chrome icon pair

`native-list-icons.ts` becomes `native-icons.ts`:

- `NativeListIcon` becomes `NativeIcon`.
- `NativeListMaterialSymbol` becomes `NativeMaterialSymbol`.
- `materialSymbolSource` keeps its name.

The barrel exports `NativeIcon`. Header actions and the FAB are not list parts, and a list name on
their icon type would carry the wrong meaning into every future header (the reasoning ADR 072
used against `NativeSettings*`). The rename has no alias. `tsc` is the gate, because a removed
export cannot be imported. Add `today` (the calendar Today icon, already a `MATERIAL_GLYPHS`
codepoint for the RN `Icon`) as `assets/icons/material/today.xml`, copied in the same Material
Symbols vector format as the existing files.

This is not the proposal's full `IconName` catalogue (one named table for `Icon` and chrome). That
merge touches `Icon`'s `ios=` / `android=` props on every call site, and it is not this slice.

### D7. The primary create action

The idiom is theming.md's: a trailing iOS header item and an Android FAB, never both, sharing one
accessibility label:

- **Calendar:** `useHeaderActions({ right: [today?, { icon: add, platform: "ios", testID:
  "calendar-add", accessibilityLabel: t("calendar.addLabel") }] })`, plus `<FloatingAction
  testID="calendar-fab" label={t("calendar.addLabel")} />`.
- **User calendars:** the same shape with `user-calendars-add` on both.
- **Home:** `FloatingAction testID="home-add-personal-event"` on Android only. Its iOS glass
  button stays (D9).

The `Platform.OS === "android" && <…Fab/>` branches at the call sites go away, because
`FloatingAction` renders `null` on iOS.

### D8. Maestro selects the calendar add by its label

Flow 02's `tapOn: id: "calendar-(add|fab)"` becomes `- tapOn: "Add an event"`:

- On iOS the add is now a native bar item with no accessibility identifier (Context). On Android
  the FAB's icon carries the same label as its content description, which Maestro reads as text.
- One step therefore serves both platforms, and the cross-platform flow requirement holds (no
  platform fork). Flow 02 already reaches the event-details header action the same way
  (`"Edit this event"`).
- `e2e/maestro-selectors.test.ts`'s ordered snippet for flow 02 changes to match.
- The testIDs `calendar-add` (iOS item identifier) and `calendar-fab` (Android test tag) stay in
  code for Jest and future Android-only selection.

Rejected:

- A patch or local module that sets `accessibilityIdentifier` on react-native-screens' items:
  native code against a fast-moving package for one selector, which ADR 065 rejected for the same
  reason.
- Keeping an RN view on iOS for testability: D2.

### D9. Call-site mapping and deferrals

| Site | Becomes | Leaves raw-button allowlist |
| --- | --- | --- |
| `calendar-screen-header.tsx` `headerRight` | `useHeaderActions({ right: [today (when `onToday`), add (iOS)] })`; Today `icon: { ios: "calendar", android: "today" }`, testID `calendar-today` | — |
| `calendar-screen.tsx` `CalendarAddFab` | `FloatingAction` (`add`, `calendar-fab`) | — |
| `calendar-screen-actions.tsx` | deleted | yes |
| `home-screen-header.tsx` `HomeAddFab`, `home-screen.tsx` | `FloatingAction` (`add`, `home-add-personal-event`); `androidContent` padding → `Layout.fabClearance` | — |
| `event-details-actions.tsx` `EventDetailsHeader` | text action `{ label: action.text, accessibilityLabel: action.accessibilityLabel, testID: "event-details-action" }` | yes |
| `changelog-sheet-screen.tsx` | text action Close with hint, testID `changelog-close` | yes |
| `programme-screen.tsx` | one text action Skip on both platforms, testID `onboarding-programme-skip`; the platform-split comment goes away | yes |
| `user-calendars-screen.tsx` | icon action `add` iOS-only + `FloatingAction`; per-item `tintColor` removed | — |
| `school-picker-screen.tsx` | left icon action `{ ios: "chevron.backward", android: … }`, `platform: "ios"`, testID `onboarding-school-back`, only when `fromCalendarManagement` | — |
| `timezone-chooser-screen.tsx` | left text action Close, `platform: "ios"`, only when `!bottomSearch`; the `placement="bottom"` toolbar stays | — |

The school-picker Back item is iOS-only, but `NativeIcon` requires a Material symbol too. Add
`assets/icons/material/arrow_back.xml` and `arrow_back` to the table. The type stays honest, and
no item type needs an iOS-only icon variant for one call site.

Deferred:

- **Home iOS glass "+"**: an in-content button on a headerless tab (navigation.md lists `(tabs)`
  as a headerless exception). Moving it into a bar means giving Home a native header, which is
  5.9's decision.
- **Calendar view menu** (`headerLeft`): a labelled pill with a chevron inside `MenuView`, plus
  zoom actions. It needs a header menu item (`type: "menu"` / Compose dropdown) that this slice
  does not build. It is 5.10, and it is the one allowlist entry of D10.

The raw-button allowlist loses four entries, so its ceiling goes from 13 to 9.

### D10. Lint: `local/no-ad-hoc-header-action`

`tools/eslint-rules/no-ad-hoc-header-action.js` reports:

1. A `Property` (in an object literal) whose key is the identifier or string `headerRight`,
   `headerLeft`, `unstable_headerRightItems` or `unstable_headerLeftItems`.
2. A `JSXOpeningElement` named `Stack.Toolbar` that has a `placement` attribute whose value is
   not the string literal `"bottom"` (an expression or `"left"` / `"right"`). With no attribute,
   expo-router defaults to `"bottom"`, so the bare form is allowed.

The message names `useHeaderActions` from `@/components/chrome`.

- **Scope:** `src/**/*.{ts,tsx}`, ignoring `src/components/chrome/**` (the seam itself and
  `root-screen-options.ts`) and `**/*.test.{ts,tsx}`.
- **Allowlist:** `tools/eslint-rules/header-action-allowlist.js`, which holds `calendar-screen-header.tsx` (5.10
  view menu). Its test pins ceiling 1, with the same four checks as the separator allowlist: the
  ceiling, uniqueness, the files exist, and each file still violates.
- **Wiring:** in `eslint.config.js` as block `timecalendar/header-action`, following the
  `restrictedImports` re-call caveat in lint-format.md.
- **Proof:** RuleTester cases, plus an inject-and-revert proof.
- **Limit:** options built through a computed key or spread from another module are not seen.
  Review covers those.

This encodes the proposal's boundary rule ("`unstable_header*Items` → `chrome/`") as a gate
(Principle 1).

### D11. Gallery

`src/components/chrome/header-action.gallery.tsx` (meta `id: "header-action"`) has these
stories:

- `Icons`: two right icon actions.
- `Text`: a right text action with a hint.
- `BothSides`: a left text action and a right icon action.
- `Disabled`.
- `PlatformOnly`: an iOS-only item and an Android-only item, with a caption naming which one this
  platform shows.
- `LongStrings`: the `gallery.stress.*` labels and the longest FR action label, "Ajouter un
  événement".

Each story renders a `Stack.Screen` whose options are its `useHeaderActions` output, so the actions
appear in the story screen's real navigation bar. The body is a `RootPage` with a caption that
describes what the bar shows and the press count of the last action pressed. `press` updates
state, so the activation is visible on device.

`floating-action.gallery.tsx` (`id: "floating-action"`) has these stories:

- `Default`.
- `OverList`: a `NativeList reservesFloatingAction` with enough rows to scroll.
- `OverScroll`: an RN `ScrollView` with the `Layout.fabClearance` inset.
- `LongLabel`: the FR label carried as content description.

On iOS each story shows a caption ("Android only: iOS adds through the navigation bar").

The `floating-action` story leaves `native-list.gallery.tsx`. Register both in
`src/design/gallery/registry.ts`, and add the `gallery.headerAction.*` / `gallery.floatingAction.*`
keys in FR and EN. `known-a11y-violations.ts` must not grow. The registry test renders through
the existing expo-router mock: if `Stack.Screen` is not mocked there, mock it the way the feature
tests do (capture options), and render the captured Android `headerRight` so the matrix sees the
buttons.

### D12. Tests and coverage

- **`header-action.test.tsx`** (`describe.each(["ios", "android"])` with `usePlatform`). It
  covers:
  - Item filtering by `platform`, and the empty side returning no key.
  - iOS item mapping per kind: icon vs text, tint `text` in both schemes, hint, identifier,
    disabled.
  - Android: render the returned `headerRight` / `headerLeft`. Find by testID. Press calls the
    handler, and a disabled item does not. The icon content description equals the label, the
    text child carries the composed semantics (label, then hint), and the text color is
    `theme.text`.
  - `@ts-expect-error` cases: a missing `accessibilityLabel`, `icon` with `label`, neither.
- **`floating-action.test.tsx`**: iOS renders nothing. Android renders the FAB with its testID,
  content description and press. The seeded host carries the scheme and seed.
- **`native-list.test.tsx`**: the FAB cases move out, and the clearance case asserts
  `Layout.fabClearance`.
- **Feature tests:**
  - Update the calendar, Home, event details, changelog, Programme, user calendars, school picker
    and timezone tests to assert through the returned options (iOS items / Android rendered
    header) and `FloatingAction`.
  - The Programme Skip, changelog Close and event-details action presses stay covered on both
    platforms.
  - Delete `calendar-screen-actions` coverage with the file.
- **`jest/setup-expo-ui.ts`**: add a Compose `IconButton` mock (role `button` only from real
  semantics, as the mock now does for rows), and make `TextButton` merge its `Text` child's
  `timecalendarSemantics` description into its accessible name. Then the registry a11y check sees
  what TalkBack sees.
- **Coverage:** `header-action.tsx` and `floating-action.tsx` must pass the 90% per-file branch
  gate (`npm test -- --coverage`).

### D13. ADR 075

`decisions/075-header-and-floating-actions.md` records D1 (hook over options), D2 / D3 (native
per platform, the Android semantics placement), D4 / D7 (one FAB, the create-action idiom, one
clearance), D6 (the `NativeIcon` rename) and D8 (label selection for native bar items). Its
rejected options are the alternatives listed in D1–D4 and D8.

## Risks / Trade-offs

- **Android text-button semantics.** The semantics modifier on the child `Text` must make TalkBack
  read the accessibility label rather than the visible text, and leave the click action in place.
  This depends on M3 `Button` merging descendant semantics. Jest models it, but only a device
  proves it. → The Android device pass in the inbox covers it, and Android Maestro flow 02 proves
  the "Edit this event" header action by label.
- **Header layout of a Compose host in `headerRight`.** expo-router itself ships this pattern, but
  this slice uses it with text buttons for the first time. → The `long-strings` gallery story and
  the inbox device pass at font scale 2.0. The one-line cap keeps the bar height stable.
- **Native bar items lose the Maestro id on iOS.** → The label selector (D8), pinned by
  `maestro-selectors.test.ts`, and the native E2E dispatch on the final commit.
- **FAB look change on Android Home and Calendar.** It is intended (M3 reference). The inbox note
  asks for a side-by-side check with the user calendars FAB.
- **Clearance change 112 → 96 on NativeList.** → The `floating-action--over-list` story scrolls
  to the last row on device.
- **Programme Skip on iOS stays text,** in the system style. No behavior change.

## Migration Plan

Land on `feat/mobile-ds-header-action` in three commits:

1. Chrome: `compose-host.tsx`, `native-icons.ts` rename, `today.xml`, `header-action.tsx`,
   `floating-action.tsx`, mocks, tests and gallery. `NativeListFloatingAction` is removed, and user
   calendars and the native-list gallery move to `FloatingAction`.
2. Call sites, the lint rule and allowlists, flow 02 and the selector test.
3. Docs: ADR 075, Book files, CHANGELOG, inbox note.

Rollback is a revert of the branch. Nothing persists and there is no data migration.
