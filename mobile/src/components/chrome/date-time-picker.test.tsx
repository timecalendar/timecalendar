import { fireEvent, render } from "@testing-library/react-native"
import type { ComponentProps } from "react"

import { DateTimePicker } from "@/components/chrome"
import { usePlatform } from "@/test-support/platform"

let mockPicked = new Date(Date.UTC(2030, 0, 5))
const mockEvents = new Map<string, unknown>()
const mockDescribing = (date: Date) => ({
  timestamp: date.getTime(),
  utcOffset: -date.getTimezoneOffset(),
})

// The Compose date picker reads its value as a UTC-midnight day and confirms
// one, whatever the device zone (DatePickerView.kt, pinned in
// compose-date-day.test.ts). Events are built from the Date the way @expo/ui's
// buildChangeEvent does, and a dismissal without onDismiss reports `value`.
jest.mock("@expo/ui/community/datetime-picker", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text, View } = require("react-native")

  function DateTimePicker(props: {
    value: Date
    minimumDate?: Date
    maximumDate?: Date
    onValueChange?: (event: unknown, date: Date) => void
    onChange?: (event: unknown, date?: Date) => void
  }) {
    const { value, minimumDate, maximumDate, onValueChange, onChange } = props
    const eventOf = (date: Date) => ({ nativeEvent: mockDescribing(date) })
    return React.createElement(
      View,
      null,
      React.createElement(
        Pressable,
        {
          testID: "native-picker",
          minimumDate,
          maximumDate,
          receivedProps: props,
          onPress: () => {
            const changeEvent = eventOf(mockPicked)
            const setEvent = { ...changeEvent, type: "set" }
            mockEvents.set("onValueChange", changeEvent)
            mockEvents.set("onChange", setEvent)
            onValueChange?.(changeEvent, mockPicked)
            onChange?.(setEvent, mockPicked)
          },
        },
        React.createElement(Text, null, value.toISOString()),
      ),
      React.createElement(Pressable, {
        testID: "native-dismiss",
        onPress: () =>
          onChange?.({ ...eventOf(value), type: "dismissed" }, value),
      }),
      React.createElement(Pressable, {
        testID: "native-dismiss-without-date",
        onPress: () =>
          onChange?.({ ...eventOf(value), type: "dismissed" }, undefined),
      }),
    )
  }

  return { __esModule: true, default: DateTimePicker, DateTimePicker }
})

const VALUE = new Date(2030, 0, 2, 23, 30)

const localFields = (date: Date) => [
  date.getFullYear(),
  date.getMonth(),
  date.getDate(),
  date.getHours(),
  date.getMinutes(),
]

beforeEach(() => {
  mockPicked = new Date(Date.UTC(2030, 0, 5))
})

describe("on Android", () => {
  usePlatform("android")

  describe.each([
    ["date", "dialog"],
    ["date", "inline"],
    ["datetime", "dialog"],
  ] as const)("in %s mode (%s)", (mode, presentation) => {
    it("hands the native picker the local day as UTC midnight", async () => {
      const view = await render(
        <DateTimePicker
          mode={mode}
          presentation={presentation}
          value={VALUE}
        />,
      )
      expect(view.getByText("2030-01-02T00:00:00.000Z")).toBeOnTheScreen()
    })

    it("maps the picked UTC day back to a local Date at the value's time", async () => {
      const onValueChange = jest.fn()
      const onChange = jest.fn()
      const view = await render(
        <DateTimePicker
          mode={mode}
          presentation={presentation}
          value={VALUE}
          onValueChange={onValueChange}
          onChange={onChange}
        />,
      )
      await fireEvent.press(view.getByTestId("native-picker"))
      expect(localFields(onValueChange.mock.calls[0][1])).toEqual([
        2030, 0, 5, 23, 30,
      ])
      expect(localFields(onChange.mock.calls[0][1])).toEqual([
        2030, 0, 5, 23, 30,
      ])
    })

    it("reports events that describe the reported Date", async () => {
      const onValueChange = jest.fn()
      const onChange = jest.fn()
      const view = await render(
        <DateTimePicker
          mode={mode}
          presentation={presentation}
          value={VALUE}
          onValueChange={onValueChange}
          onChange={onChange}
        />,
      )
      await fireEvent.press(view.getByTestId("native-picker"))
      const [changeEvent, changed] = onValueChange.mock.calls[0]
      expect(changeEvent.nativeEvent).toEqual(mockDescribing(changed))
      const [setEvent, set] = onChange.mock.calls[0]
      expect(setEvent).toEqual({
        type: "set",
        nativeEvent: mockDescribing(set),
      })
    })

    it("reports a dismissal with the original value and a matching event", async () => {
      const onChange = jest.fn()
      const view = await render(
        <DateTimePicker
          mode={mode}
          presentation={presentation}
          value={VALUE}
          onChange={onChange}
        />,
      )
      await fireEvent.press(view.getByTestId("native-dismiss"))
      const [event, date] = onChange.mock.calls[0]
      expect(date.getTime()).toBe(VALUE.getTime())
      expect(event).toEqual({
        type: "dismissed",
        nativeEvent: mockDescribing(VALUE),
      })
    })
  })

  it("reports a dismissal through the deprecated onChange without a Date", async () => {
    const onChange = jest.fn()
    const view = await render(
      <DateTimePicker mode="date" value={VALUE} onChange={onChange} />,
    )
    await fireEvent.press(view.getByTestId("native-dismiss-without-date"))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: "dismissed" }),
      undefined,
    )
  })

  it("treats a missing mode as a date picker", async () => {
    const view = await render(<DateTimePicker value={VALUE} />)
    expect(view.getByText("2030-01-02T00:00:00.000Z")).toBeOnTheScreen()
  })

  it("passes the time picker through unchanged", async () => {
    const onValueChange = jest.fn()
    const view = await render(
      <DateTimePicker
        mode="time"
        presentation="dialog"
        value={VALUE}
        onValueChange={onValueChange}
      />,
    )
    expect(view.getByText(VALUE.toISOString())).toBeOnTheScreen()
    await fireEvent.press(view.getByTestId("native-picker"))
    expect(onValueChange.mock.calls[0][1]).toBe(mockPicked)
  })

  it.each([
    ["an invalid", new Date(Number.NaN)],
    ["the epoch", new Date(0)],
  ])("passes %s picked Date through unchanged", async (_name, picked) => {
    mockPicked = picked
    const onValueChange = jest.fn()
    const onChange = jest.fn()
    const view = await render(
      <DateTimePicker
        mode="date"
        value={VALUE}
        onValueChange={onValueChange}
        onChange={onChange}
      />,
    )
    await fireEvent.press(view.getByTestId("native-picker"))
    expect(onValueChange.mock.calls[0][1]).toBe(picked)
    expect(onChange.mock.calls[0][1]).toBe(picked)
    expect(onValueChange.mock.calls[0][0]).toBe(mockEvents.get("onValueChange"))
    expect(onChange.mock.calls[0][0]).toBe(mockEvents.get("onChange"))
  })

  it("hands the community picker neither the alignment nor the label", async () => {
    const view = await render(
      <DateTimePicker
        mode="date"
        value={VALUE}
        alignment="leading"
        accessibilityLabel="Starts"
      />,
    )
    const received = view.getByTestId("native-picker").props.receivedProps
    expect(received).not.toHaveProperty("alignment")
    expect(received).not.toHaveProperty("accessibilityLabel")
    expect(view.queryByTestId("swiftui-host")).toBeNull()
  })

  it("passes the bounds through unchanged", async () => {
    const minimumDate = new Date(2030, 0, 1)
    const maximumDate = new Date(2030, 0, 31, 23, 59)
    const view = await render(
      <DateTimePicker
        mode="date"
        value={VALUE}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
      />,
    )
    const picker = view.getByTestId("native-picker")
    expect(picker.props.minimumDate).toBe(minimumDate)
    expect(picker.props.maximumDate).toBe(maximumDate)
  })
})

describe("on iOS", () => {
  usePlatform("ios")

  it("passes the value and the picked Date through unchanged", async () => {
    const onValueChange = jest.fn()
    const view = await render(
      <DateTimePicker
        mode="date"
        value={VALUE}
        onValueChange={onValueChange}
      />,
    )
    expect(view.getByText(VALUE.toISOString())).toBeOnTheScreen()
    await fireEvent.press(view.getByTestId("native-picker"))
    expect(onValueChange.mock.calls[0][1]).toBe(mockPicked)
  })
})

describe("on iOS with the leading alignment or a label", () => {
  usePlatform("ios")

  type Modifier = { $type: string; value: unknown }
  const PICKED = new Date("2030-01-02T03:04:00.000Z")

  async function renderComposed(
    props: Partial<ComponentProps<typeof DateTimePicker>> = {},
  ) {
    const view = await render(
      <DateTimePicker
        testID="picker"
        value={VALUE}
        alignment="leading"
        {...props}
      />,
    )
    const picker = view.getByTestId("picker")
    return {
      ...view,
      picker,
      modifiers: (picker.props.modifiers ?? []) as Modifier[],
    }
  }

  const typesOf = (modifiers: Modifier[]) => modifiers.map((m) => m.$type)

  it("renders the SwiftUI picker in the host, aligned to the leading edge", async () => {
    const { picker, modifiers, getByTestId, queryByTestId } =
      await renderComposed()
    expect(queryByTestId("native-picker")).toBeNull()
    expect(getByTestId("swiftui-host")).toContainElement(picker)
    expect(modifiers).toContainEqual({
      $type: "frame",
      value: { maxWidth: Infinity, alignment: "leading" },
    })
    expect(typesOf(modifiers)).not.toContain("labelsHidden")
    expect(picker.props.title).toBeUndefined()
    expect(picker).toHaveTextContent(VALUE.toISOString())
  })

  it("names the picker by a hidden title", async () => {
    const view = await render(
      <DateTimePicker
        testID="picker"
        value={VALUE}
        accessibilityLabel="Starts"
      />,
    )
    const picker = view.getByTestId("picker")
    expect(picker.props.title).toBe("Starts")
    expect(typesOf(picker.props.modifiers)).toEqual([
      "datePickerStyle",
      "labelsHidden",
    ])
  })

  it.each([
    [undefined, "automatic"],
    ["default", "automatic"],
    ["spinner", "wheel"],
    ["compact", "compact"],
    ["inline", "graphical"],
  ] as const)("maps display %s to the %s style", async (display, style) => {
    const { modifiers } = await renderComposed(display ? { display } : {})
    expect(modifiers[0]).toEqual({ $type: "datePickerStyle", value: style })
  })

  it.each([
    [undefined, ["date"]],
    ["date", ["date"]],
    ["time", ["hourAndMinute"]],
    ["datetime", ["date", "hourAndMinute"]],
  ] as const)("maps mode %s to its components", async (mode, components) => {
    const { picker } = await renderComposed(mode ? { mode } : {})
    expect(picker.props.displayedComponents).toEqual(components)
  })

  it("turns the bounds into a range", async () => {
    const minimumDate = new Date(2030, 0, 1)
    const maximumDate = new Date(2030, 0, 31)
    expect(
      (await renderComposed({ minimumDate, maximumDate })).picker.props.range,
    ).toEqual({ start: minimumDate, end: maximumDate })
    expect((await renderComposed({ minimumDate })).picker.props.range).toEqual({
      start: minimumDate,
    })
    expect((await renderComposed({ maximumDate })).picker.props.range).toEqual({
      end: maximumDate,
    })
    expect((await renderComposed()).picker.props.range).toBeUndefined()
  })

  it("adds no optional modifier for props left unset", async () => {
    const { modifiers } = await renderComposed()
    expect(typesOf(modifiers)).toEqual(["datePickerStyle", "frame"])
  })

  it("maps the tint, disabled and environment props in the community order", async () => {
    const { modifiers } = await renderComposed({
      accentColor: "#ff0000",
      disabled: false,
      locale: "fr_FR",
      themeVariant: "dark",
      timeZoneName: "Pacific/Noumea",
      accessibilityLabel: "Starts",
    })
    expect(modifiers).toEqual([
      { $type: "datePickerStyle", value: "automatic" },
      { $type: "tint", value: "#ff0000" },
      { $type: "disabled", value: false },
      { $type: "environment", value: { key: "locale", value: "fr_FR" } },
      { $type: "environment", value: { key: "colorScheme", value: "dark" } },
      {
        $type: "environment",
        value: { key: "timeZone", value: "Pacific/Noumea" },
      },
      { $type: "frame", value: { maxWidth: Infinity, alignment: "leading" } },
      { $type: "labelsHidden", value: undefined },
    ])
  })

  it("disables the picker", async () => {
    const { modifiers, picker } = await renderComposed({ disabled: true })
    expect(modifiers).toContainEqual({ $type: "disabled", value: true })
    expect(picker.props.accessibilityState).toEqual({ disabled: true })
  })

  it("puts the testID on the picker, not the host", async () => {
    const { getByTestId } = await renderComposed()
    expect(getByTestId("swiftui-host").props.testID).toBe("swiftui-host")
    expect(getByTestId("picker").props.accessibilityRole).toBe("adjustable")
  })

  it("renders without a testID", async () => {
    const view = await render(
      <DateTimePicker value={VALUE} accessibilityLabel="Starts" />,
    )
    expect(view.getByLabelText("Starts")).toBeOnTheScreen()
  })

  it("reports a pick through onValueChange only", async () => {
    const onValueChange = jest.fn()
    const onChange = jest.fn()
    const { picker } = await renderComposed({ onValueChange, onChange })
    await fireEvent.press(picker)
    expect(onValueChange).toHaveBeenCalledWith(
      { nativeEvent: mockDescribing(PICKED) },
      PICKED,
    )
    expect(onChange).not.toHaveBeenCalled()
  })

  it("reports a pick as a set event through onChange alone", async () => {
    const onChange = jest.fn()
    const { picker } = await renderComposed({ onChange })
    await fireEvent.press(picker)
    expect(onChange).toHaveBeenCalledWith(
      { type: "set", nativeEvent: mockDescribing(PICKED) },
      PICKED,
    )
  })

  it("ignores a pick with no listener", async () => {
    const { picker } = await renderComposed()
    await fireEvent.press(picker)
    expect(picker).toBeOnTheScreen()
  })
})
