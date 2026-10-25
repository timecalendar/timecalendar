import { act, fireEvent, render } from "@testing-library/react-native"
import { fromZonedTime, toZonedTime } from "date-fns-tz"

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
  }) {
    const { testID, mode, value, onValueChange, onDismiss } = props
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
    )
  }

  return { __esModule: true, default: DateTimePicker, DateTimePicker }
})

const FIXED = new Date("2030-01-02T03:04:00.000Z")
const INITIAL = new Date("2026-01-01T00:00:00.000Z")
const DEVICE_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone
const NOUMEA = "Pacific/Noumea"

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

      expect(getByText(formatShortDateTime(INITIAL, "en", zone))).toBeTruthy()
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
