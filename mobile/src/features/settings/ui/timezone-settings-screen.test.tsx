import { fireEvent, render } from "@testing-library/react-native"
import { router } from "expo-router"

import { clearTimezoneRuntimeSupportCache } from "@/features/settings/data"
import { SETTINGS_KEYS } from "@/features/settings/prefs"
import { getString, remove, setString } from "@/storage"

import TimezoneSettingsScreen from "./timezone-settings-screen"

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  Stack: { Screen: () => null },
}))

afterEach(() => {
  remove(SETTINGS_KEYS.timezone)
  remove(SETTINGS_KEYS.lastManualTimezone)
  clearTimezoneRuntimeSupportCache()
  jest.mocked(router.push).mockClear()
  jest.restoreAllMocks()
})

describe("TimezoneSettingsScreen", () => {
  it("shows automatic mode with a readable effective zone", async () => {
    const view = await render(<TimezoneSettingsScreen />)
    expect(view.getByText("Use device time zone")).toBeTruthy()
    expect(
      view.getByTestId("settings-timezone-device-switch").props
        .accessibilityState.checked,
    ).toBe(true)
    expect(view.getByTestId("settings-timezone-effective-row")).toBeTruthy()
  })

  it("turning manual mode on seeds and remembers a selectable zone", async () => {
    const view = await render(<TimezoneSettingsScreen />)
    await fireEvent.press(view.getByTestId("settings-timezone-device-switch"))
    expect(getString(SETTINGS_KEYS.timezone)).toBeDefined()
    expect(getString(SETTINGS_KEYS.lastManualTimezone)).toBe(
      getString(SETTINGS_KEYS.timezone),
    )
    expect(view.getByTestId("settings-timezone-manual-row")).toBeTruthy()
  })

  it("retains the last manual identifier across automatic mode", async () => {
    setString(SETTINGS_KEYS.timezone, "Asia/Kathmandu")
    setString(SETTINGS_KEYS.lastManualTimezone, "Asia/Kathmandu")
    const view = await render(<TimezoneSettingsScreen />)
    await fireEvent.press(view.getByTestId("settings-timezone-device-switch"))
    expect(getString(SETTINGS_KEYS.timezone)).toBe("system")
    expect(getString(SETTINGS_KEYS.lastManualTimezone)).toBe("Asia/Kathmandu")
  })

  it("opens the worldwide chooser from manual mode", async () => {
    setString(SETTINGS_KEYS.timezone, "Europe/Paris")
    const view = await render(<TimezoneSettingsScreen />)
    await fireEvent.press(view.getByTestId("settings-timezone-manual-row"))
    expect(router.push).toHaveBeenCalledWith("/timezone-chooser")
  })

  it("shows corrupt stored intent and its effective fallback without rewriting", async () => {
    setString(SETTINGS_KEYS.timezone, "corrupt-zone")
    const view = await render(<TimezoneSettingsScreen />)

    expect(view.getByText("corrupt-zone")).toBeTruthy()
    expect(view.getByText("Unavailable on this device")).toBeTruthy()
    expect(view.getByTestId("settings-timezone-fallback-row")).toBeTruthy()
    expect(getString(SETTINGS_KEYS.timezone)).toBe("corrupt-zone")
  })

  it("shows runtime-unavailable intent separately from its fallback", async () => {
    const DateTimeFormat = Intl.DateTimeFormat
    jest.spyOn(Intl, "DateTimeFormat").mockImplementation((locale, options) => {
      if (options?.timeZone === "US/Eastern")
        throw new RangeError("unsupported")
      return new DateTimeFormat(locale, options)
    })
    setString(SETTINGS_KEYS.timezone, "US/Eastern")
    const view = await render(<TimezoneSettingsScreen />)

    expect(view.getByText("US/Eastern")).toBeTruthy()
    expect(view.getByText("Unavailable on this device")).toBeTruthy()
    expect(view.getByTestId("settings-timezone-fallback-row")).toBeTruthy()
    expect(getString(SETTINGS_KEYS.timezone)).toBe("US/Eastern")
  })
})
