import { act, fireEvent, render } from "@testing-library/react-native"
import { fromZonedTime, toZonedTime } from "date-fns-tz"
import { Platform } from "react-native"

import { formatShortDateTime } from "@/features/calendar/data"

import { DateTimeField } from "./date-time-field"

// The @expo/ui DateTimePicker is mocked suite-wide (jest/setup-expo-ui.ts): it
// renders a Pressable carrying its testID + value.toISOString() as text, and
// fires onValueChange(event, 2030-01-02T03:04Z) on press.
//
// The field interprets the picked wall clock in the DISPLAY zone (design D6).
// The machine zone stands in for the "system" preference (identity round-trip);
// Nouméa proves the non-device-zone conversion is applied on both directions.
const FIXED = new Date("2030-01-02T03:04:00.000Z")
const INITIAL = new Date("2026-01-01T00:00:00.000Z")
const DEVICE_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone
const NOUMEA = "Pacific/Noumea"

afterEach(() => {
  jest.restoreAllMocks()
})

describe("DateTimeField", () => {
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

    // Under the device zone toZonedTime/fromZonedTime are identity — the picked
    // instant comes back byte-for-byte (the "system" behavior guarantee).
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

    // The picker is fed the zone's wall clock for the stored instant…
    expect(getByText(toZonedTime(INITIAL, NOUMEA).toISOString())).toBeTruthy()

    await act(async () => {
      fireEvent.press(getByTestId("field"))
    })

    // …and the picked wall clock is anchored back as a Nouméa instant.
    expect(onChange).toHaveBeenCalledWith(fromZonedTime(FIXED, NOUMEA))
  })

  it("opens the dialog on tap and reports the selected date on Android", async () => {
    jest.replaceProperty(Platform, "OS", "android")
    const onChange = jest.fn()
    const dialogValue = toZonedTime(INITIAL, NOUMEA).toISOString()
    const { getByTestId, queryByText, getByText } = await render(
      <DateTimeField
        testID="field"
        accessibilityLabel="Start"
        value={INITIAL}
        locale="en"
        zone={NOUMEA}
        onChange={onChange}
      />,
    )

    // The compact field echoes through the zone-aware format seam (no raw
    // toLocaleString), and the dialog is not mounted until tapped.
    expect(getByText(formatShortDateTime(INITIAL, "en", NOUMEA))).toBeTruthy()
    expect(queryByText(dialogValue)).toBeNull()

    await act(async () => {
      fireEvent.press(getByTestId("field"))
    })

    // The dialog (mock DateTimePicker) is now mounted, rendering the zone
    // wall-clock value.
    await act(async () => {
      fireEvent.press(getByText(dialogValue))
    })

    expect(onChange).toHaveBeenCalledWith(fromZonedTime(FIXED, NOUMEA))
    // Confirming closes the dialog (unmounts it).
    expect(queryByText(dialogValue)).toBeNull()
  })
})
