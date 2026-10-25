## Context

The six fixes are independent leaf edits over contracts that already exist. Motivation and the
claim-by-claim verification are in proposal.md. These code facts shape the approach:

- `@expo/ui`'s Android `DateTimePicker` with `presentation="dialog"` mounts a Compose dialog that
  opens on mount, fires `onValueChange` on confirm and `onDismiss` on cancel, and expects the caller
  to unmount it. `mode="datetime"` falls back to date only on Android. The date dialog's result is
  `DatePickerState.selectedDateMillis`, which is **UTC midnight** of the chosen day, and its
  `initialSelectedDateMillis` is read as a UTC day. The time dialog reads `initialDate` in the
  device-local `Calendar`, replaces `HOUR_OF_DAY`/`MINUTE` on it, and returns that device-local
  instant (`node_modules/@expo/ui/android/.../DatePickerView.kt`).
- `DateTimeField` maps stored instants to display-zone wall clocks with
  `toZonedTime`/`fromZonedTime` (timezone design D6). A "wall-clock Date" is a JS `Date` whose
  **device-local** fields equal the display zone's wall clock.
- The suite-wide `@expo/ui/community/datetime-picker` mock (`mobile/jest/setup-expo-ui.ts`) renders a
  Pressable that fires `onValueChange(…, 2030-01-02T03:04Z)`. It does not expose `mode` and has no
  dismiss trigger. `personal-event-form-screen.test.tsx` also relies on it.
- react-native-screens (`RNSScreenStackHeaderConfig.mm configureBackItem`) resolves a blank
  `backTitle` to `prevItem.title`. Expo Router's native stack sets that title to
  `getHeaderTitle(options, route.name)`, which is `"(tabs)"` for the anchor. With
  `backButtonDisplayMode = minimal` the title is hidden but stays the button's accessibility label.
- React Native's Android `Alert` keeps `buttons.slice(0, 3)` and defaults to `cancelable: false`.
- `expo-symbols` `SymbolView` accepts `name={{ ios, android }}`. On Android it renders a Material
  Symbols font glyph and is already used outside the chrome seam (`error-surfaces.tsx`,
  `checklist-progress-indicator.tsx`, `calendar-screen-actions.tsx`). `search` and `school` exist in
  its `symbols.json`.
- `common.back` ("Back" / "Retour") already exists in both catalogs.

## Goals / Non-Goals

**Goals:**

- Make each defect's corrected behavior observable in a Jest test that runs in the CI
  `test-mobile` gate (`npm test -- --coverage`, 90% per-file branch threshold).
- Reuse only existing tokens, chrome primitives, i18n keys and dependencies.

**Non-Goals:**

- No new design-system primitive, token, type-ramp change, lint rule, route or dependency.
- No iOS behavior change for the date field or the environment selector.
- No restyling of outlined-button borders, the onboarding arrow glyph, the page indicator, the Android
  FAB or the school-logo monogram. These are non-text or large uses of `primary` that meet the 3:1
  bar.
- No change to the Calendar tab header's own `headerStyle`/`headerShadowVisible` (tab-stack chrome,
  not the root Stack rule in question).

## Decisions

### Decision 1: Android date then time as a feature-local two-step state machine

`DateTimeField` (Android branch) holds `step: "closed" | "date" | "time"` and a pending wall-clock
`Date`. Only one `DateTimePicker` (`presentation="dialog"`) is mounted at a time:

1. Tap → `step = "date"`. The date dialog's `value` is a Date whose **UTC** Y/M/D equal the stored
   value's display-zone Y/M/D (`Date.UTC(y, m, d)`), so Compose highlights the right day in any zone.
2. Date confirm: read Y/M/D from the result with `getUTC*`, because the result is UTC midnight. Build
   the pending wall clock as a local Date with those Y/M/D and the current wall clock's hours and
   minutes. Then set `step = "time"`. Nothing is reported yet.
3. The time dialog's `value` is the pending wall clock. On confirm, the result is a device-local
   instant whose local fields are the final wall clock → `onChange(fromZonedTime(result, zone))` once
   → `step = "closed"`.
4. `onDismiss` at either step → `step = "closed"` and the pending value is dropped, with no `onChange`.

The date→time transition must unmount the date picker and mount a new time picker. Distinct `key`s
guarantee this, so the Compose host does not reuse the closed dialog. Seconds and milliseconds are
dropped, matching the native time dialog. The day/time merge is a small pure helper inside the
feature (`personal-events/ui`) so it can be branch-tested directly. It is not a shared primitive.

Alternatives considered:

- _Swap to `mode="time"` only_: loses day selection.
- _Inline Android `mode="datetime"`_: @expo/ui falls back to date only, and inline consumes the
  screen (the reason the dialog exists).
- _Commit the date immediately, then the time_: a cancel at step 2 would leave a half-applied value,
  which violates "cancel at either step leaves value unchanged".
- _Read the date result in local time_: wrong in negative-offset zones, where UTC midnight is the
  previous local day.

### Decision 2: The Android Delete label uses `destructive`, not `actionText`

Delete is a destructive action, and theming.md ("Status colors keep their meaning") assigns it the
`destructive` semantic, which is documented in `tokens.ts` at 5.3:1 light and 9.1:1 dark on
`backgroundElement`. The seven remaining brand labels use `actionText`, which is already documented
as the AA body-text brand tone.

### Decision 3: The school status glyph uses `expo-symbols` platform names

`StatusSymbol` renders `SymbolView name={{ ios: <sf>, android: <material> }}` on both platforms. The
prop type changes from a bare `SFSymbol` to an `{ ios, android }` pair, and the two call sites pass
`magnifyingglass`/`search` and `graduationcap`/`school`. The glyph is hidden from assistive tech
(`accessible={false}`, `accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`),
the same as `error-surfaces.tsx`.

Alternative rejected: the vector-drawable registry in `chrome/native-settings-icons.ts`. It is
consumed only inside the native-settings primitives (Compose `Icon`). Exposing it to a feature list
state would widen the seam, and it would need new committed XML for no benefit. The
`expo-symbols` path is already the established non-seam Android icon path and adds nothing.

### Decision 4: The environment selector on Android uses `NativeSettingsRadioDialog`; iOS keeps `Alert`

Android: the row's `onPress` opens a `NativeSettingsRadioDialog` with `title =
environment.selector.title`, `cancelLabel = environment.confirm.cancel`, `value = current`, and options
from `getAllowedBackendEnvironments(capability)` labelled `environment.choice.*`. `onSelect`
closes the dialog and calls the existing `confirm(target)`, which keeps the current-environment no-op,
the `switching` guard and the 2-button destructive `Alert` confirmation. Two buttons are within the
Android cap. The row uses the existing `notification-settings-screen` pattern, `kind="action"` on
Android. This matches the Settings sibling pattern (notification frequency and days-ahead: a radio
dialog on Android).

iOS: keep the existing `Alert`. iOS alerts stack any number of actions vertically, so nothing is
unreachable. The iOS sibling pattern (a pushed SwiftUI Form route with checkmark rows, as in
appearance and notification frequency) would add a route, a route-structure registration and a thin
screen. That is new surface in a fixes-only change, for a dev/preview-only control. Recorded as a
deliberate deferral, not a divergence: the iOS presentation is already native and complete.

The `environment.selector.body` copy is shown only on iOS (the radio dialog has no body slot). This is
acceptable because the title and the destructive confirmation body carry the meaning.

### Decision 5: The `(tabs)` anchor carries `title: t("common.back")`

`RootLayout` calls `useTranslation()` and registers
`<Stack.Screen name="(tabs)" options={{ headerShown: false, title: t("common.back") }} />`. iOS then
resolves every tab-anchored back button's accessibility label to "Back"/"Retour". Nested sibling
pushes (for example `user-calendars` → `user-calendars/[id]`) keep the previous screen's own title.
The visible chevron is unchanged (`headerBackButtonDisplayMode: "minimal"` is untouched), and Android
is unaffected (`(tabs)` is headerless, and the Android back arrow has its own platform label).

Alternatives considered:

- _The focused tab's label (for example "Settings")_: closer to UIKit's default, but the root layout
  would have to read the nested tab state. `getFocusedRouteNameFromRoute` is not on expo-router's
  public surface (`expo-router/react-navigation` re-exports only `native` and `elements`), and
  `@react-navigation/*` imports are lint-banned. Deep-importing expo-router build internals, or
  reading the private route child-state symbol, would be an alpha-churn liability.
- _`title: ""` so that UIKit falls back to its system "Back"_: its localization depends on the
  bundle's declared localizations and the `findHeaderConfig.title` fallback path, so it is fragile.
- _`headerBackTitle` in `buildCompactRootScreenOptions`_: this would override the useful
  previous-title label on nested sibling pushes too.

Enforcement (R-1): the existing source-scan route-structure test
(`src/components/settings-route-structure.test.ts`) asserts that the `(tabs)` registration keeps
`headerShown: false` and contains `title: t("common.back")`, beside the existing headerless
classification. A VoiceOver confirmation on the simulator is the device proof.

### Decision 6: Calendar header tint is `theme.text`

`HeaderIconAction`'s `SymbolView tintColor` and the view-menu chevron's `borderColor` use `theme.text`.
This applies the existing navigation.md rule to the two items that bypassed it. The FAB is untouched.

## Risks / Trade-offs

- [Compose may reuse the dialog host across the date→time swap] → distinct `key` per step, plus the
  owner device check in the inbox.
- [Jest cannot exercise the real Compose conversion] → `date-time-field.test.tsx` declares its own
  file-level `jest.mock("@expo/ui/community/datetime-picker")`, which overrides the suite mock for
  that file only. It mirrors the Kotlin contract: `mode` is exposed, the date step confirms UTC
  midnight of a fixed day, the time step confirms a device-local instant built from the received
  `value` with a fixed hour and minute, and a dismiss trigger calls `onDismiss`. The suite-wide mock
  stays unchanged, so `personal-event-form-screen.test.tsx` is not affected. The tests run under the
  device zone and Pacific/Noumea (UTC+11). A unit test of the merge helper also covers a
  negative-offset zone (America/Los_Angeles).
- [The "Back" label is less specific than the previous tab's title] → accepted. It is localized and
  meaningful, and it replaces an unintelligible "(tabs)". Revisit if expo-router exposes focused-route
  state publicly.
- [iOS environment selector differs in shape from Android] → both are native for their platform
  (R-2/R-3). Recorded in Decision 4.

## Migration Plan

Leaf UI changes only, with no persisted data, schema or config. Ships with the next build or OTA.
Rollback is reverting the commit.
