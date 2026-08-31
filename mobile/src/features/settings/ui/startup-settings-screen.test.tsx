import { fireEvent, render } from "@testing-library/react-native"
import { router } from "expo-router"

import { SETTINGS_KEYS } from "@/features/settings/prefs"
import { getString, remove } from "@/storage"

import StartupSettingsScreen from "./startup-settings-screen"

const pushSpy = jest.spyOn(router, "push")
const replaceSpy = jest.spyOn(router, "replace")

describe("StartupSettingsScreen", () => {
  beforeEach(() => {
    remove(SETTINGS_KEYS.startupTab)
    pushSpy.mockClear()
    replaceSpy.mockClear()
  })

  it("renders localized accessible copy and selects the current preference", async () => {
    const { getByLabelText, getByTestId, getByText } = await render(
      <StartupSettingsScreen />,
    )

    expect(getByText("Startup screen")).toBeTruthy()
    expect(getByText("Open on")).toBeTruthy()
    expect(getByText("Used the next time the app starts.")).toBeTruthy()
    expect(
      getByLabelText("Choose the screen shown when the app starts"),
    ).toBeTruthy()
    expect(
      getByTestId("settings-startup-picker-item-home").props.accessibilityState
        .selected,
    ).toBe(true)
  })

  it("persists both choices without navigating the current session", async () => {
    const { getByTestId } = await render(<StartupSettingsScreen />)

    await fireEvent.press(getByTestId("settings-startup-picker-item-calendar"))
    expect(getString(SETTINGS_KEYS.startupTab)).toBe("calendar")
    await fireEvent.press(getByTestId("settings-startup-picker-item-home"))
    expect(getString(SETTINGS_KEYS.startupTab)).toBe("home")
    expect(pushSpy).not.toHaveBeenCalled()
    expect(replaceSpy).not.toHaveBeenCalled()
  })
})
