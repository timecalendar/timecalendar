## Context

- `@expo/ui` 56.0.17 `src/community/datetime-picker/DateTimePicker.tsx` (iOS) renders
  `<Host matchContents={{ vertical: true }} style={style} ignoreSafeArea="all">` around
  `<DatePicker selection displayedComponents range onDateChange modifiers testID />` with
  modifiers `datePickerStyle(...)`, then `tint`, `disabled`, `environment("locale" | "colorScheme" |
  "timeZone")` when set. It accepts no extra modifier and no title.
- `ios/DatePickerView.swift` applies `.labelsHidden()` only when `title == nil` and there are no
  children. Modifiers from `modifiers` wrap the whole picker view.
- `@expo/ui/swift-ui/modifiers` exports `frame` (`maxWidth`, `alignment: "leading" | …`),
  `labelsHidden`, `accessibilityLabel`, `datePickerStyle`, `environment`, `tint`, `disabled`.
- The chrome-boundary lint rule allows `@expo/ui` imports only under `src/components/chrome/`;
  `native-settings.tsx` and siblings already import `@expo/ui/swift-ui` directly there.
- L12 (`local/no-swiftui-container-identifier`): no `testID` or identifier modifier on a SwiftUI
  container; `Host` may keep a `testID`, `DatePicker` is an element and keeps its own.
- Jest: `jest/setup-expo-ui.ts` mocks `@expo/ui/community/datetime-picker`, `@expo/ui/swift-ui`
  (no `DatePicker` yet) and `@expo/ui/swift-ui/modifiers` (no `datePickerStyle`, `environment`,
  `labelsHidden` yet). `date-time-field.test.tsx` overrides the community mock and its iOS tests
  read `datetime-locale` / `datetime-disabled` test IDs from that override.
- The only product consumer of the chrome picker is `DateTimeField`; the `date-time-picker`
  gallery fixture is the other caller.

## Goals / Non-Goals

**Goals:**

- The iOS compact pills start at the field's leading edge, under the label, at every text size,
  and never clip.
- The iOS field picker carries the field label as its hidden SwiftUI title (the furthest `@expo/ui` reaches: the inner UIKit picker keeps its system name).
- Callers that do not opt in render exactly what they render today, on both platforms.

**Non-Goals:**

- Replacing the community component for every iOS caller.
- Android changes: the field's Android row and dialogs and the chrome Android day conversion stay
  as they are.
- The iOS picker language (`inbox/2026-10-25-mobile-ios-picker-device-language.md`).

## Decisions

### D1 — Opt-in props on the chrome picker, composed SwiftUI path behind them

`DateTimePickerProps` becomes the community props plus `alignment?: "leading"` and
`accessibilityLabel?: string`. On iOS, when either is set, `DateTimePicker` renders
`IosDateTimePicker` (private `date-time-picker-ios.tsx`, not on the chrome barrel), which composes
`Host` and `DatePicker` from `@expo/ui/swift-ui`. Otherwise iOS renders the community component.

Alternatives:

- **Always compose on iOS.** One iOS path, but every caller moves off the maintained community
  component for a fix only the field needs. Rejected for blast radius; revisit if a second caller
  opts in.
- **Fix in `src/design/` with a wrapper.** Collapses the host to width 0 (inbox evidence).
- **A `flex-start` / fixed-width host style.** The host would size to the pills and stop wrapping
  at accessibility sizes, or clip.

### D2 — Full iOS prop parity in the composed path

The composed path handles every prop the community iOS path reads: `value`, `mode` →
`displayedComponents` (`date` default), `display` → `datePickerStyle` (`spinner` → `wheel`,
`compact`, `inline` → `graphical`, else `automatic`), `minimumDate`/`maximumDate` → `range`,
`accentColor` → `tint`, `disabled` → `disabled` when not `undefined`, `locale` / `themeVariant` /
`timeZoneName` → `environment`, `testID` on the `DatePicker`, `style` on the `Host`, and
`onDateChange` → `onValueChange(buildChangeEvent)` when given, else `onChange(buildEvent with type
"set")`. Android-only props (`is24Hour`, `presentation`, `onDismiss`, button labels) are ignored, as
the community iOS path ignores them. Modifier order follows the community path, then `frame`, then
the name modifier. No prop is silently dropped relative to the default path, so opting in never
changes behaviour beyond alignment and name.

The event builders are small and local (the community `buildEvent`/`buildChangeEvent` are not
exported from the package entry); a test pins their shape against the default path's mock.

### D3 — Name: `title` + `labelsHidden()`, with a measured fallback

`accessibilityLabel` maps to `title={label}` plus `labelsHidden()`: SwiftUI's idiom for a labelled
control whose label is drawn elsewhere, and the hidden label stays the accessibility label. If the
iOS simulator's accessibility tree does not report the label on the picker, the implementation
swaps to the `accessibilityLabel(label)` modifier (no title). The swap is one place in
`date-time-picker-ios.tsx`; the Jest assertion follows whichever mapping ships, and the Book and
inbox note state the shipped mapping.

### D4 — `testID` stays on the `DatePicker`

As in the community path: the `DatePicker` is an element, so L12 allows it, and Maestro/Jest keep
the same selector. The `Host` carries no `testID` and no identifier modifier.

### D5 — Android strips the opt-in props

`date-time-picker.tsx` removes `alignment` and `accessibilityLabel` before forwarding to the
community component on Android, so the Compose path receives exactly today's props. `DateTimeField`
passes them only in its iOS branch.

### D6 — Tests through the suite-wide SwiftUI mock

`jest/setup-expo-ui.ts` adds a `DatePicker` to the `@expo/ui/swift-ui` mock that mirrors the
community mock (pressable with the `testID`, role `adjustable`, `accessibilityLabel` from `title`,
disabled from the `disabled` modifier, the selection's ISO string as text, a press confirms
2030-01-02T03:04Z through `onDateChange`, and `modifiers` kept on the element for assertions) and
adds `datePickerStyle`, `environment` and `labelsHidden` to the modifiers mock. The personal-event
form's iOS path then runs through the composed path with the same observable contract.

No ADR: this is a seam-local rendering choice inside the ADR 010/012 chrome posture and does not
change a rule.

## Risks / Trade-offs

- **Two iOS renderers for one control.** The composed path can drift from the community component
  on an `@expo/ui` upgrade. Mitigation: D2 parity tests in `date-time-picker.test.tsx` cover each
  mapped prop; the SDK bump checklist re-reads `community/datetime-picker/DateTimePicker.tsx`.
- **VoiceOver reading of a hidden title on compact pills is not provable in Jest.** Mitigation: D3
  fallback, checked on the simulator accessibility tree, and inbox item 7 stays open for a human
  VoiceOver pass.
- **`frame(maxWidth: Infinity)` inside a vertically-matching host.** Expected to keep the height
  measurement intact; the device pass at the largest text size is the check.
