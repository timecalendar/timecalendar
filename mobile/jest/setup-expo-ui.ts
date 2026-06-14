// Mock @expo/ui's native module for the whole suite: its universal controls
// bridge to SwiftUI / Jetpack Compose and have no off-device JS, so importing
// the Settings screen (which reaches @expo/ui through the chrome wrapper) would
// otherwise throw under Jest — exactly the setup-firebase / setup-splash /
// setup-storage situation. Registered globally here; mock at the native seam,
// not the screen, so the proof test exercises the real screen → chrome wrapper →
// A1 hook path (mirrors the "mock at the customFetch seam" posture).
//
// The mock reproduces the real universal API SHAPE so the wiring is genuinely
// exercised:
//  - Host renders its children (a plain pass-through, matching the real universal
//    web/RN fallback that renders a plain View).
//  - Picker carries its testID and renders each <Picker.Item> child as a
//    pressable element (testID `${picker testID}-item-${value}`, accessible by
//    role/label) whose press invokes the picker's onValueChange(value). The
//    currently-selected item is marked accessibilityState.selected so a test can
//    assert the control reflects the current preference.
//  - Picker.Item is a render marker re-attached as Picker.Item.
//
// The factory is deliberately plain JS (no TS type annotations / type refs): a
// jest.mock factory may not reference out-of-scope variables, and the babel
// jest-hoist plugin flags TS type identifiers used inside it before they are
// stripped — so types live at the consuming call site, not here. react /
// react-native are require()d lazily inside the closure for the same reason.
jest.mock("@expo/ui", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text, View } = require("react-native")

  function Host(props: { children?: unknown }) {
    return React.createElement(View, null, props.children)
  }

  // Data-only marker; never rendered directly — Picker reads its props.
  function Item() {
    return null
  }

  function Picker(props: {
    testID?: string
    selectedValue: string | number
    onValueChange: (value: string | number) => void
    children?: unknown
  }) {
    const { testID, selectedValue, onValueChange, children } = props
    const items = React.Children.toArray(children).filter(
      (
        child: unknown,
      ): child is { props: { label: string; value: string | number } } =>
        React.isValidElement(child),
    )

    return React.createElement(
      View,
      { testID },
      items.map(
        (item: { props: { label: string; value: string | number } }) => {
          const { label, value } = item.props
          return React.createElement(
            Pressable,
            {
              key: String(value),
              testID: `${testID ?? "picker"}-item-${String(value)}`,
              accessibilityRole: "button",
              accessibilityLabel: label,
              accessibilityState: { selected: value === selectedValue },
              onPress: () => onValueChange(value),
            },
            React.createElement(Text, null, label),
          )
        },
      ),
    )
  }

  return { Host, Picker: Object.assign(Picker, { Item }) }
})

// The DateTimePicker is @expo/ui's OWN native date/time control (the
// `@expo/ui/community/datetime-picker` subpath, ADR 012) — SwiftUI/Compose, no
// off-device JS, so it must be mocked too. The existing jest.mock("@expo/ui")
// above does NOT cover subpaths, so mock the subpath module explicitly (B2 /
// TIM-133, design D6). The mock renders an assertable element carrying its
// testID and a pressable that fires onValueChange(changeEvent, FIXED_DATE), so a
// proof test can drive the picker → form state wiring deterministically. It
// matches the real prop shape (value, mode, onValueChange, testID).
//
// The fixed test date the mock fires; the proof test asserts the form state
// becomes this value after driving the picker.
jest.mock("@expo/ui/community/datetime-picker", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text } = require("react-native")

  const FIXED_DATE = new Date("2030-01-02T03:04:00.000Z")

  function DateTimePicker(props: {
    testID?: string
    value: Date
    onValueChange?: (event: unknown, date: Date) => void
  }) {
    const { testID, value, onValueChange } = props
    return React.createElement(
      Pressable,
      {
        testID,
        accessibilityRole: "adjustable",
        onPress: () =>
          onValueChange?.(
            { nativeEvent: { timestamp: 0, utcOffset: 0 } },
            FIXED_DATE,
          ),
      },
      React.createElement(Text, null, value.toISOString()),
    )
  }

  return { __esModule: true, default: DateTimePicker, DateTimePicker }
})
