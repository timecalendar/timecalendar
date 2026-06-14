import { act, fireEvent, render } from "@testing-library/react-native"
import { Platform } from "react-native"

import { DateTimeField } from "./date-time-field"

// The @expo/ui DateTimePicker is mocked suite-wide (jest/setup-expo-ui.ts): it
// renders a Pressable carrying its testID + value.toISOString() as text, and
// fires onValueChange(event, 2030-01-02T03:04Z) on press.
const FIXED = new Date("2030-01-02T03:04:00.000Z")
const INITIAL = new Date("2026-01-01T00:00:00.000Z")

afterEach(() => {
  jest.restoreAllMocks()
})

describe("DateTimeField", () => {
  it("renders the inline picker on iOS and reports its change", async () => {
    const onChange = jest.fn()
    const { getByTestId } = await render(
      <DateTimeField testID="field" value={INITIAL} onChange={onChange} />,
    )

    await act(async () => {
      fireEvent.press(getByTestId("field"))
    })

    expect(onChange).toHaveBeenCalledWith(FIXED)
  })

  it("opens the dialog on tap and reports the selected date on Android", async () => {
    jest.replaceProperty(Platform, "OS", "android")
    const onChange = jest.fn()
    const { getByTestId, queryByText, getByText } = await render(
      <DateTimeField
        testID="field"
        accessibilityLabel="Start"
        value={INITIAL}
        onChange={onChange}
      />,
    )

    // The compact field is a Pressable; the dialog is not mounted until tapped.
    expect(queryByText(INITIAL.toISOString())).toBeNull()

    await act(async () => {
      fireEvent.press(getByTestId("field"))
    })

    // The dialog (mock DateTimePicker) is now mounted, rendering the ISO value.
    await act(async () => {
      fireEvent.press(getByText(INITIAL.toISOString()))
    })

    expect(onChange).toHaveBeenCalledWith(FIXED)
    // Confirming closes the dialog (unmounts it).
    expect(queryByText(INITIAL.toISOString())).toBeNull()
  })
})
