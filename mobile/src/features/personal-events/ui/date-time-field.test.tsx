import { act, fireEvent, render } from "@testing-library/react-native"
import { fromZonedTime, toZonedTime } from "date-fns-tz"
import * as Localization from "expo-localization"
import { useState } from "react"

import { formatShortDateTime } from "@/features/calendar/data"
import { usePlatform } from "@/test-support/platform"

import { DateTimeField } from "./date-time-field"

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
  }) {
    const { testID, mode, value, onValueChange, onDismiss, is24Hour, locale } =
      props
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

beforeEach(() => {
  deviceClock(true)
})

afterAll(() => {
  mockUseCalendars.mockRestore()
})

describe("feature-owned DateTimeField", () => {
  it("renders the inline picker on iOS and reports its change (identity under the device zone)", async () => {
    const onChange = jest.fn()
    const { getByTestId } = await render(
      <DateTimeField
        testID="field"
        value={INITIAL}
        locale="en"
        zone={DEVICE_ZONE}
        onChange={onChange}
      />,
    )

    await act(async () => {
      fireEvent.press(getByTestId("field"))
    })

    expect(onChange).toHaveBeenCalledWith(FIXED)
  })

  it("re-interprets the picked wall clock in a non-device display zone (iOS)", async () => {
    const onChange = jest.fn()
    const { getByTestId, getByText } = await render(
      <DateTimeField
        testID="field"
        value={INITIAL}
        locale="en"
        zone={NOUMEA}
        onChange={onChange}
      />,
    )

    expect(getByText(toZonedTime(INITIAL, NOUMEA).toISOString())).toBeTruthy()

    await act(async () => {
      fireEvent.press(getByTestId("field"))
    })

    expect(onChange).toHaveBeenCalledWith(fromZonedTime(FIXED, NOUMEA))
  })

  // @expo/ui applies a picker locale only when Foundation lists it, so an app
  // language paired with the device region or hour cycle is silently dropped.
  it("leaves the iOS picker on the device language and clock", async () => {
    deviceClock(false)
    const { getByTestId } = await render(
      <DateTimeField
        testID="field"
        value={INITIAL}
        locale="fr"
        zone={DEVICE_ZONE}
        onChange={jest.fn()}
      />,
    )
    expect(getByTestId("datetime-locale")).toHaveTextContent("undefined")
  })

  describe.each([DEVICE_ZONE, NOUMEA])("on Android in %s", (zone) => {
    usePlatform("android")

    async function renderField() {
      const onChange = jest.fn()
      const screen = await render(
        <DateTimeField
          testID="field"
          accessibilityLabel="Start"
          value={INITIAL}
          locale="en"
          zone={zone}
          onChange={onChange}
        />,
      )
      const press = async (testID: string) => {
        await act(async () => {
          fireEvent.press(screen.getByTestId(testID))
        })
      }
      return { ...screen, onChange, press }
    }

    function expectClosed(queryByTestId: (id: string) => unknown) {
      expect(queryByTestId("date-confirm")).toBeNull()
      expect(queryByTestId("time-confirm")).toBeNull()
    }

    it("commits the picked day and time together after the time dialog", async () => {
      const { getByText, getByTestId, queryByTestId, onChange, press } =
        await renderField()

      expect(
        getByText(formatShortDateTime(INITIAL, "en", zone, true)),
      ).toBeTruthy()
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

    it("announces the label and the displayed value, and follows a commit", async () => {
      function ControlledField() {
        const [value, setValue] = useState(INITIAL)
        return (
          <DateTimeField
            testID="field"
            accessibilityLabel="Starts"
            value={value}
            locale="en"
            zone={zone}
            onChange={setValue}
          />
        )
      }
      const view = await render(<ControlledField />)
      expect(view.getByTestId("field").props.accessibilityLabel).toBe(
        `Starts, ${formatShortDateTime(INITIAL, "en", zone, true)}`,
      )

      for (const id of ["field", "date-confirm", "time-confirm"]) {
        await act(async () => {
          fireEvent.press(view.getByTestId(id))
        })
      }

      const committed = fromZonedTime(new Date(2030, 0, 2, 9, 41), zone)
      expect(view.getByTestId("field").props.accessibilityLabel).toBe(
        `Starts, ${formatShortDateTime(committed, "en", zone, true)}`,
      )
    })

    it.each([
      [false, /^1 Jan \d{1,2}:\d{2} (AM|PM)$/],
      [true, /^1 Jan \d{2}:\d{2}$/],
    ] as const)(
      "displays and announces the device clock (uses24hourClock %s)",
      async (uses24hourClock, pattern) => {
        deviceClock(uses24hourClock)
        const view = await render(
          <DateTimeField
            testID="field"
            accessibilityLabel="Starts"
            value={INITIAL}
            locale="en"
            zone={zone}
            onChange={jest.fn()}
          />,
        )
        const display = formatShortDateTime(
          INITIAL,
          "en",
          zone,
          uses24hourClock,
        )
        expect(display).toMatch(pattern)
        expect(view.getByText(display)).toBeTruthy()
        expect(view.getByTestId("field").props.accessibilityLabel).toBe(
          `Starts, ${display}`,
        )
      },
    )

    it("sets no label without an accessibilityLabel prop, leaving the value text as the name", async () => {
      const view = await render(
        <DateTimeField
          testID="field"
          value={INITIAL}
          locale="en"
          zone={zone}
          onChange={jest.fn()}
        />,
      )
      const field = view.getByTestId("field")
      expect(field.props.accessibilityLabel).toBeUndefined()
      expect(field).toHaveTextContent(
        formatShortDateTime(INITIAL, "en", zone, true),
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
  })
})
