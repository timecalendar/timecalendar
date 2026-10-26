import { act, fireEvent, render } from "@testing-library/react-native"
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz"
import * as Localization from "expo-localization"
import { useState } from "react"
import { StyleSheet } from "react-native"

import { usePlatform } from "@/test-support/platform"
import { Colors, StateOpacity } from "@/theme"

import { DateTimeField, type DateTimeFieldProps } from "./date-time-field"

// Overrides the suite-wide picker mock (jest/setup-expo-ui.ts) for this file to
// mirror the @expo/ui Android Compose contract (DatePickerView.kt): the date
// dialog confirms UTC midnight of the picked day, the time dialog confirms the
// received value with its local hour and minute replaced, and either dialog can
// be dismissed. `datetime` (iOS) confirms the fixed instant the suite mock uses.
jest.mock("@expo/ui/community/datetime-picker", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text, View } = require("react-native")

  function confirmed(mode: string, value: Date): Date {
    if (mode === "date") return new Date(Date.UTC(2030, 0, 2))
    if (mode === "time") {
      const date = new Date(value)
      date.setHours(9, 41, 0, 0)
      return date
    }
    return new Date("2030-01-02T03:04:00.000Z")
  }

  function DateTimePicker(props: {
    testID?: string
    mode: string
    value: Date
    onValueChange?: (event: unknown, date: Date) => void
    onDismiss?: () => void
    is24Hour?: boolean
    locale?: string
    disabled?: boolean
  }) {
    const {
      testID,
      mode,
      value,
      onValueChange,
      onDismiss,
      is24Hour,
      locale,
      disabled,
    } = props
    return React.createElement(
      View,
      null,
      React.createElement(
        Pressable,
        {
          testID: testID ?? `${mode}-confirm`,
          onPress: () =>
            onValueChange?.(
              { nativeEvent: { timestamp: 0, utcOffset: 0 } },
              confirmed(mode, value),
            ),
        },
        React.createElement(Text, null, value.toISOString()),
      ),
      React.createElement(Pressable, {
        testID: `${mode}-dismiss`,
        onPress: () => onDismiss?.(),
      }),
      React.createElement(Pressable, {
        testID: `${mode}-confirm-invalid`,
        onPress: () =>
          onValueChange?.(
            { nativeEvent: { timestamp: 0, utcOffset: 0 } },
            new Date(NaN),
          ),
      }),
      React.createElement(Pressable, {
        testID: `${mode}-confirm-epoch`,
        onPress: () =>
          onValueChange?.(
            { nativeEvent: { timestamp: 0, utcOffset: 0 } },
            new Date(0),
          ),
      }),
      React.createElement(
        Text,
        { testID: `${mode}-is24Hour` },
        String(is24Hour),
      ),
      React.createElement(Text, { testID: `${mode}-locale` }, String(locale)),
      React.createElement(
        Text,
        { testID: `${mode}-disabled` },
        String(disabled),
      ),
    )
  }

  return { __esModule: true, default: DateTimePicker, DateTimePicker }
})

const FIXED = new Date("2030-01-02T03:04:00.000Z")
const INITIAL = new Date("2026-01-01T00:00:00.000Z")
const DEVICE_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone
const NOUMEA = "Pacific/Noumea"

const mockUseCalendars = jest.spyOn(Localization, "useCalendars")

function deviceClock(uses24hourClock: boolean | null) {
  mockUseCalendars.mockReturnValue([
    { calendar: "gregory", uses24hourClock, firstWeekday: 1, timeZone: null },
  ] as unknown as ReturnType<typeof Localization.useCalendars>)
}

const formatIn = (zone: string) => (date: Date) =>
  formatInTimeZone(date, zone, "yyyy-MM-dd HH:mm")

beforeEach(() => {
  deviceClock(true)
})

afterAll(() => {
  mockUseCalendars.mockRestore()
})

function Field(props: Partial<DateTimeFieldProps>) {
  const zone = props.zone ?? DEVICE_ZONE
  return (
    <DateTimeField
      testID="field"
      label="Starts"
      value={INITIAL}
      zone={zone}
      formatValue={formatIn(zone)}
      onChange={jest.fn()}
      {...props}
    />
  )
}

const press = async (
  view: { getByTestId: (id: string) => unknown },
  id: string,
) => {
  await act(async () => {
    fireEvent.press(view.getByTestId(id) as never)
  })
}

it("imports no product feature", () => {
  const { readFileSync } = jest.requireActual(
    "node:fs",
  ) as typeof import("node:fs")
  const { resolve } = jest.requireActual(
    "node:path",
  ) as typeof import("node:path")
  const source = readFileSync(resolve(__dirname, "date-time-field.tsx"), "utf8")
  expect(source).not.toMatch(/from "@\/features/)
  expect(source).not.toMatch(/useTranslation|i18next/)
})

describe("DateTimeField on iOS", () => {
  usePlatform("ios")

  it("shows the label and reports the inline picker's change (identity under the device zone)", async () => {
    const onChange = jest.fn()
    const view = await render(<Field onChange={onChange} />)
    expect(view.getByTestId("field-label")).toHaveTextContent("Starts")

    await press(view, "field")

    expect(onChange).toHaveBeenCalledWith(FIXED)
  })

  it("re-interprets the picked wall clock in a non-device display zone", async () => {
    const onChange = jest.fn()
    const view = await render(<Field zone={NOUMEA} onChange={onChange} />)

    expect(
      view.getByText(toZonedTime(INITIAL, NOUMEA).toISOString()),
    ).toBeTruthy()

    await press(view, "field")

    expect(onChange).toHaveBeenCalledWith(fromZonedTime(FIXED, NOUMEA))
  })

  // @expo/ui applies a picker locale only when Foundation lists it, so an app
  // language paired with the device region or hour cycle is silently dropped.
  it("leaves the iOS picker on the device language and clock", async () => {
    deviceClock(false)
    const view = await render(<Field />)
    expect(view.getByTestId("datetime-locale")).toHaveTextContent("undefined")
  })

  it("shows the error as text after the picker, which takes no hint", async () => {
    const view = await render(<Field error="Ends before it starts" />)
    expect(view.getByTestId("field-error")).toHaveTextContent(
      "Ends before it starts",
    )
    expect(view.getByTestId("field-error").props.accessibilityRole).toBe(
      "alert",
    )
    expect(view.getByTestId("field").props.accessibilityHint).toBeUndefined()
  })

  it("passes disabled to the picker and dims the field", async () => {
    const view = await render(<Field disabled />)
    expect(view.getByTestId("datetime-disabled")).toHaveTextContent("true")
    expect(
      StyleSheet.flatten(view.getByTestId("field-label").parent?.props.style)
        .opacity,
    ).toBe(StateOpacity.disabled)
  })

  it("merges the caller's layout style last", async () => {
    const view = await render(<Field style={{ marginTop: 99 }} />)
    expect(
      StyleSheet.flatten(view.getByTestId("field-label").parent?.props.style)
        .marginTop,
    ).toBe(99)
  })

  it("renders without a testID", async () => {
    const view = await render(
      <DateTimeField
        label="Starts"
        value={INITIAL}
        zone={DEVICE_ZONE}
        formatValue={formatIn(DEVICE_ZONE)}
        onChange={jest.fn()}
      />,
    )
    expect(view.getByText("Starts")).toBeOnTheScreen()
  })
})

describe.each([DEVICE_ZONE, NOUMEA])(
  "DateTimeField on Android in %s",
  (zone) => {
    usePlatform("android")

    async function renderField(props: Partial<DateTimeFieldProps> = {}) {
      const onChange = jest.fn()
      const view = await render(
        <Field zone={zone} onChange={onChange} {...props} />,
      )
      return { ...view, onChange, press: (id: string) => press(view, id) }
    }

    function expectClosed(queryByTestId: (id: string) => unknown) {
      expect(queryByTestId("date-confirm")).toBeNull()
      expect(queryByTestId("time-confirm")).toBeNull()
    }

    it("commits the picked day and time together after the time dialog", async () => {
      const { getByText, getByTestId, queryByTestId, onChange, press } =
        await renderField()

      expect(getByText(formatIn(zone)(INITIAL))).toBeTruthy()
      expectClosed(queryByTestId)

      await press("field")
      const wallClock = toZonedTime(INITIAL, zone)
      expect(getByTestId("date-confirm")).toHaveTextContent(
        new Date(
          Date.UTC(
            wallClock.getFullYear(),
            wallClock.getMonth(),
            wallClock.getDate(),
          ),
        ).toISOString(),
      )

      await press("date-confirm")
      expect(onChange).not.toHaveBeenCalled()
      expect(queryByTestId("date-confirm")).toBeNull()
      const pending = new Date(
        2030,
        0,
        2,
        wallClock.getHours(),
        wallClock.getMinutes(),
      )
      expect(getByTestId("time-confirm")).toHaveTextContent(
        pending.toISOString(),
      )

      await press("time-confirm")
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith(
        fromZonedTime(new Date(2030, 0, 2, 9, 41), zone),
      )
      expectClosed(queryByTestId)
    })

    it.each([
      ["date", "invalid"],
      ["date", "epoch"],
      ["time", "invalid"],
      ["time", "epoch"],
    ])(
      "ignores an %s dialog confirming an %s date",
      async (emptyStep, kind) => {
        const { getByTestId, queryByTestId, onChange, press } =
          await renderField()

        await press("field")
        if (emptyStep === "time") await press("date-confirm")
        await press(`${emptyStep}-confirm-${kind}`)

        expect(onChange).not.toHaveBeenCalled()
        expectClosed(queryByTestId)

        await press("field")
        expect(getByTestId("date-confirm")).toBeTruthy()
      },
    )

    it.each([
      [true, "true"],
      [false, "false"],
      [null, "undefined"],
    ])(
      "opens the time dialog with the device clock (uses24hourClock %s)",
      async (uses24hourClock, expected) => {
        deviceClock(uses24hourClock)
        const { getByTestId, press } = await renderField()

        await press("field")
        await press("date-confirm")

        expect(getByTestId("time-is24Hour")).toHaveTextContent(expected)
      },
    )

    it("names the row with the label and the displayed value, and follows a commit", async () => {
      function ControlledField() {
        const [value, setValue] = useState(INITIAL)
        return <Field zone={zone} value={value} onChange={setValue} />
      }
      const view = await render(<ControlledField />)
      expect(view.getByTestId("field-label")).toHaveTextContent("Starts")
      expect(view.getByTestId("field").props.accessibilityRole).toBe("button")
      expect(view.getByTestId("field").props.accessibilityLabel).toBe(
        `Starts, ${formatIn(zone)(INITIAL)}`,
      )

      for (const id of ["field", "date-confirm", "time-confirm"]) {
        await press(view, id)
      }

      const committed = fromZonedTime(new Date(2030, 0, 2, 9, 41), zone)
      expect(view.getByTestId("field").props.accessibilityLabel).toBe(
        `Starts, ${formatIn(zone)(committed)}`,
      )
    })

    it.each(["date", "time"])(
      "cancelling at the %s step leaves the value unchanged and reopens",
      async (cancelStep) => {
        const { getByTestId, queryByTestId, onChange, press } =
          await renderField()

        await press("field")
        if (cancelStep === "time") await press("date-confirm")
        await press(`${cancelStep}-dismiss`)

        expect(onChange).not.toHaveBeenCalled()
        expectClosed(queryByTestId)

        await press("field")
        expect(getByTestId("date-confirm")).toBeTruthy()
      },
    )

    it("shows the error and carries it in the row's hint", async () => {
      const { getByTestId } = await renderField({ error: "Ends too early" })
      expect(getByTestId("field-error")).toHaveTextContent("Ends too early")
      expect(getByTestId("field").props.accessibilityHint).toBe(
        "Ends too early",
      )
      expect(
        StyleSheet.flatten(getByTestId("field").props.style).borderColor,
      ).toBe(Colors.light.error)
    })

    it("draws the row like a resting text field", async () => {
      const { getByTestId } = await renderField()
      expect(
        StyleSheet.flatten(getByTestId("field").props.style),
      ).toMatchObject({
        borderWidth: 1,
        borderColor: Colors.light.outline,
      })
      expect(getByTestId("field").props.accessibilityHint).toBeUndefined()
    })

    it("ignores presses while disabled and exposes the state", async () => {
      const { getByTestId, queryByTestId, press } = await renderField({
        disabled: true,
      })
      expect(getByTestId("field").props.accessibilityState).toEqual({
        disabled: true,
      })
      await press("field")
      expectClosed(queryByTestId)
    })
  },
)
