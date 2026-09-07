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

jest.mock("@expo/ui/community/menu", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text, View } = require("react-native")

  const MenuView = React.forwardRef(function MenuView(
    props: {
      actions: { id?: string; title: string; state?: string }[]
      children?: unknown
      onPressAction?: (event: { nativeEvent: { event: string } }) => void
    },
    ref: unknown,
  ) {
    const [expanded, setExpanded] = React.useState(false)
    React.useImperativeHandle(ref, () => ({ show: () => setExpanded(true) }))
    return React.createElement(
      View,
      null,
      React.createElement(
        Pressable,
        { onPress: () => setExpanded(true) },
        props.children,
      ),
      expanded &&
        props.actions.map((action) =>
          React.createElement(
            Pressable,
            {
              key: action.id ?? action.title,
              testID: `menu-action-${action.id ?? action.title}`,
              accessibilityRole: "button",
              accessibilityLabel: action.title,
              onPress: () => {
                props.onPressAction?.({
                  nativeEvent: { event: action.id ?? action.title },
                })
                setExpanded(false)
              },
            },
            React.createElement(Text, null, action.title),
          ),
        ),
    )
  })

  return { __esModule: true, default: MenuView, MenuView }
})

jest.mock("@expo/ui/swift-ui/modifiers", () => {
  const modifier = (type: string, value?: unknown) => ({ $type: type, value })
  return {
    accessibilityIdentifier: (value: string) =>
      modifier("accessibilityIdentifier", value),
    accessibilityLabel: (value: string) =>
      modifier("accessibilityLabel", value),
    buttonStyle: (value: string) => modifier("buttonStyle", value),
    disabled: (value = true) => modifier("disabled", value),
    font: (value: unknown) => modifier("font", value),
    frame: (value: unknown) => modifier("frame", value),
    padding: (value: unknown) => modifier("padding", value),
    textFieldStyle: (value: string) => modifier("textFieldStyle", value),
  }
})

jest.mock("@expo/ui/swift-ui", () => {
  const React = jest.requireActual("react")

  const {
    Pressable,
    Text: NativeText,
    TextInput,
    View,
  } = jest.requireActual("react-native")

  const modifierValue = (
    modifiers: { $type: string; value: unknown }[] | undefined,
    type: string,
  ) => modifiers?.find((modifier) => modifier.$type === type)?.value

  function useNativeState(initialValue: unknown) {
    const state = React.useRef({
      value: initialValue,
      get() {
        return this.value
      },
      set(value: unknown) {
        this.value = value
      },
      onChange: null,
    })
    return state.current
  }

  function Host({ children, ...props }: { children?: unknown }) {
    return React.createElement(View, props, children)
  }
  function Stack({ children, ...props }: { children?: unknown }) {
    return React.createElement(View, props, children)
  }
  function Text({ children, ...props }: { children?: unknown }) {
    return React.createElement(NativeText, props, children)
  }
  function TextField(props: {
    testID?: string
    text: { get: () => string; set: (value: string) => void }
    placeholder?: string
    onTextChange?: (value: string) => void
    modifiers?: { $type: string; value: unknown }[]
  }) {
    const [value, setValue] = React.useState(props.text.get())
    const isDisabled = modifierValue(props.modifiers, "disabled") === true
    return React.createElement(TextInput, {
      testID: props.testID,
      value,
      placeholder: props.placeholder,
      editable: !isDisabled,
      accessibilityLabel: modifierValue(props.modifiers, "accessibilityLabel"),
      onChangeText: (nextValue: string) => {
        props.text.set(nextValue)
        setValue(nextValue)
        props.onTextChange?.(nextValue)
      },
    })
  }
  function Button(props: {
    testID?: string
    label?: string
    onPress?: () => void
    modifiers?: { $type: string; value: unknown }[]
  }) {
    const isDisabled = modifierValue(props.modifiers, "disabled") === true
    return React.createElement(
      Pressable,
      {
        testID: props.testID,
        accessibilityRole: "button",
        accessibilityLabel: props.label,
        accessibilityState: { disabled: isDisabled },
        disabled: isDisabled,
        onPress: props.onPress,
      },
      React.createElement(NativeText, null, props.label),
    )
  }
  function ProgressView(props: object) {
    return React.createElement(View, props)
  }
  function Spacer(props: object) {
    return React.createElement(View, props)
  }

  return {
    Button,
    HStack: Stack,
    Host,
    ProgressView,
    Spacer,
    Text,
    TextField,
    useNativeState,
    VStack: Stack,
  }
})

jest.mock("@expo/ui/jetpack-compose/modifiers", () => {
  const modifier = (type: string, value?: unknown) => ({ $type: type, value })
  return {
    fillMaxWidth: (value = 1) => modifier("fillMaxWidth", value),
    imePadding: () => modifier("imePadding"),
    testID: (value: string) => modifier("testID", value),
  }
})

jest.mock("@expo/ui/jetpack-compose", () => {
  const React = jest.requireActual("react")

  const {
    Pressable,
    Text: NativeText,
    TextInput,
    View,
  } = jest.requireActual("react-native")

  const testID = (modifiers: { $type: string; value: unknown }[] | undefined) =>
    modifiers?.find((modifier) => modifier.$type === "testID")?.value

  function useNativeState(initialValue: unknown) {
    const state = React.useRef({
      value: initialValue,
      get() {
        return this.value
      },
      set(value: unknown) {
        this.value = value
      },
      onChange: null,
    })
    return state.current
  }
  function Host({
    children,
    modifiers,
    ...props
  }: {
    children?: unknown
    modifiers?: { $type: string; value: unknown }[]
  }) {
    return React.createElement(
      View,
      { ...props, testID: testID(modifiers) },
      children,
    )
  }
  function Slot({ children }: { children?: unknown }) {
    return React.createElement(React.Fragment, null, children)
  }
  function AlertDialog(props: {
    children?: unknown
    modifiers?: { $type: string; value: unknown }[]
    properties?: unknown
    onDismissRequest?: () => void
  }) {
    return React.createElement(
      View,
      {
        testID: testID(props.modifiers),
        properties: props.properties,
        onDismissRequest: props.onDismissRequest,
      },
      props.children,
    )
  }
  Object.assign(AlertDialog, {
    Title: Slot,
    Text: Slot,
    ConfirmButton: Slot,
    DismissButton: Slot,
    Icon: Slot,
  })
  function OutlinedTextField(props: {
    value: { get: () => string; set: (value: string) => void }
    enabled?: boolean
    onValueChange?: (value: string) => void
    modifiers?: { $type: string; value: unknown }[]
    children?: unknown
  }) {
    const [value, setValue] = React.useState(props.value.get())
    return React.createElement(
      View,
      null,
      React.createElement(TextInput, {
        testID: testID(props.modifiers),
        value,
        editable: props.enabled,
        onChangeText: (nextValue: string) => {
          props.value.set(nextValue)
          setValue(nextValue)
          props.onValueChange?.(nextValue)
        },
      }),
      props.children,
    )
  }
  Object.assign(OutlinedTextField, {
    Label: Slot,
    Placeholder: Slot,
    LeadingIcon: Slot,
    TrailingIcon: Slot,
    Prefix: Slot,
    Suffix: Slot,
    SupportingText: Slot,
  })
  function TextButton(props: {
    children?: unknown
    enabled?: boolean
    onClick?: () => void
    modifiers?: { $type: string; value: unknown }[]
  }) {
    return React.createElement(
      Pressable,
      {
        testID: testID(props.modifiers),
        accessibilityRole: "button",
        accessibilityState: { disabled: props.enabled === false },
        disabled: props.enabled === false,
        onPress: props.onClick,
      },
      props.children,
    )
  }
  function Column(props: {
    children?: unknown
    modifiers?: { $type: string; value: unknown }[]
  }) {
    return React.createElement(
      View,
      { testID: testID(props.modifiers) },
      props.children,
    )
  }
  function Text(props: {
    children?: unknown
    modifiers?: { $type: string; value: unknown }[]
  }) {
    return React.createElement(
      NativeText,
      { testID: testID(props.modifiers) },
      props.children,
    )
  }
  function CircularProgressIndicator(props: {
    modifiers?: { $type: string; value: unknown }[]
  }) {
    return React.createElement(View, { testID: testID(props.modifiers) })
  }

  return {
    AlertDialog,
    CircularProgressIndicator,
    Column,
    Host,
    OutlinedTextField,
    Text,
    TextButton,
    useNativeState,
  }
})
