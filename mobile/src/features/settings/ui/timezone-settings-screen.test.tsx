import { act, fireEvent, render } from "@testing-library/react-native"

import { CURATED_TIMEZONES, SETTINGS_KEYS } from "@/features/settings/prefs"
import { getString, remove } from "@/storage"

import TimezoneSettingsScreen from "./timezone-settings-screen"

// The screen sets its localized nav title via <Stack.Screen>; no navigator is
// mounted here (the hidden-events test pattern).
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
}))

// Proof that the timezone picker wiring resolves through the real i18n + prefs
// (MMKV) trees (the appearance-settings proof pattern): @expo/ui's Picker is
// mocked suite-wide at the native seam (jest/setup-expo-ui.ts), so the
// screen → chrome wrapper → hook → @/storage path is genuinely exercised.

beforeEach(() => {
  remove(SETTINGS_KEYS.timezone)
})

describe("TimezoneSettingsScreen", () => {
  it("renders the localized control label and all 11 options", async () => {
    const { getByText, getByTestId } = await render(<TimezoneSettingsScreen />)

    expect(getByText("Displayed time zone")).toBeTruthy()
    expect(getByTestId("settings-timezone-picker-item-system")).toBeTruthy()
    for (const zone of CURATED_TIMEZONES) {
      expect(getByTestId(`settings-timezone-picker-item-${zone}`)).toBeTruthy()
    }
    // Zone labels come from the catalog (with the UTC offset), not raw keys.
    expect(getByText("Automatic (device time zone)")).toBeTruthy()
    expect(getByText("Réunion (UTC+4)")).toBeTruthy()
  })

  it("reflects the current preference (default 'system')", async () => {
    const { getByTestId } = await render(<TimezoneSettingsScreen />)

    expect(
      getByTestId("settings-timezone-picker-item-system").props
        .accessibilityState.selected,
    ).toBe(true)
  })

  it("persists a selected zone immediately through the preference hook", async () => {
    const { getByTestId } = await render(<TimezoneSettingsScreen />)

    await act(async () => {
      fireEvent.press(
        getByTestId("settings-timezone-picker-item-Pacific/Noumea"),
      )
    })

    expect(getString(SETTINGS_KEYS.timezone)).toBe("Pacific/Noumea")
    expect(
      getByTestId("settings-timezone-picker-item-Pacific/Noumea").props
        .accessibilityState.selected,
    ).toBe(true)
  })

  it("selecting Automatic restores the system preference", async () => {
    const { getByTestId } = await render(<TimezoneSettingsScreen />)

    fireEvent.press(getByTestId("settings-timezone-picker-item-Indian/Reunion"))
    fireEvent.press(getByTestId("settings-timezone-picker-item-system"))

    expect(getString(SETTINGS_KEYS.timezone)).toBe("system")
  })
})
