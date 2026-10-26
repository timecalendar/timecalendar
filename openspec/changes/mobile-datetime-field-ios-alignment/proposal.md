## Why

On iOS, `DateTimeField` renders the chrome `DateTimePicker`, which is `@expo/ui`'s community
`DateTimePicker`: `<Host matchContents={{ vertical: true }}>` around a SwiftUI `DatePicker`. The
host takes its width from React Native layout and SwiftUI centres the compact pills inside it, so
the pills sit in the middle of the row while the field's label above and error below are
leading-aligned (`date-time-field--default`). A `flex-start` wrapper in `src/design/` collapses the
host to width 0 and the pills render half off-screen, so the fix belongs in the chrome seam
(`docs/react-native-migration/inbox/2026-10-26-mobile-ds-date-time-field-ios-alignment.md`).
VoiceOver also names the picker "Date and Time Picker" rather than the field's label, because the
community component takes no title (`inbox/2026-10-26-mobile-ds-text-field-screen-reader-pass.md`
item 7).

## What Changes

- The chrome `DateTimePicker` (`src/components/chrome/date-time-picker.tsx`) takes two iOS opt-in
  props: `alignment?: "leading"` and `accessibilityLabel?: string`. When either is set on iOS, the
  seam renders `Host matchContents={{ vertical: true }}` plus the SwiftUI `DatePicker` from
  `@expo/ui/swift-ui` itself (a private `date-time-picker-ios.tsx` in chrome) instead of the
  community component, so it can add modifiers:
  - `alignment: "leading"` adds `frame({ maxWidth: Infinity, alignment: "leading" })`: the host
    keeps its full-width proposal, so the pills still wrap at accessibility text sizes, and the
    pills hug the leading edge.
  - `accessibilityLabel` becomes the `DatePicker` `title` plus `labelsHidden()`: the label stays
    hidden visually and SwiftUI keeps it as the control's accessible name.
  - Every other iOS prop keeps the community component's behaviour (display style, range, disabled,
    tint, locale/color-scheme/time-zone environment, `testID` on the `DatePicker`, and the
    `onValueChange`-over-`onChange` event contract).
- Without the opt-in props, iOS renders the community component unchanged. On Android the two
  props are stripped and the Compose path, including the device-local day conversion and event
  rebuild (ADR 066), is untouched.
- `DateTimeField` on iOS passes `alignment="leading"` and `accessibilityLabel={label}`.
- The suite-wide Jest mocks gain the SwiftUI `DatePicker` and the `datePickerStyle`,
  `environment` and `labelsHidden` modifiers, so the composed path is exercised in tests.
- The alignment inbox note is resolved and deleted; item 7 of the screen-reader-pass note
  describes the picker named by the field label.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-design-system-text-field`: on iOS the date-time field's picker is leading-aligned with
  its label and error, and the field label is the picker's accessible name.

## Impact

- Code: `mobile/src/components/chrome/date-time-picker.tsx`, new
  `mobile/src/components/chrome/date-time-picker-ios.tsx`,
  `mobile/src/design/field/date-time-field.tsx`, `mobile/jest/setup-expo-ui.ts`, and the colocated
  tests (`date-time-picker.test.tsx`, `date-time-field.test.tsx`,
  `date-time-field.gallery.test.tsx`).
- No new dependency, route, native configuration, translation key or server change. Nothing
  changes in the Flutter `app/`.
- Book: `theming.md` (Fields, chrome inventory), `accessibility.md` (iOS picker name),
  `features.md` (chrome `DateTimePicker` bullet), and a dated `CHANGELOG.md` entry.
- Inbox: `2026-10-26-mobile-ds-date-time-field-ios-alignment.md` deleted;
  `2026-10-26-mobile-ds-text-field-screen-reader-pass.md` item 7 rewritten.
