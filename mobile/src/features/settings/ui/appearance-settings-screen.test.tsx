import { act, fireEvent, render } from "@testing-library/react-native"
import { router } from "expo-router"

import { SETTINGS_KEYS } from "@/features/settings/prefs"
import i18n from "@/i18n"
import { getString, remove } from "@/storage"
import { usePlatform } from "@/test-support/platform"

import AppearanceSettingsScreen from "./appearance-settings-screen"

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  Stack: { Screen: () => null },
}))

const mockPush = router.push as jest.Mock

beforeEach(async () => {
  remove(SETTINGS_KEYS.theme)
  remove(SETTINGS_KEYS.language)
  mockPush.mockReset()
  await i18n.changeLanguage("en")
})

describe("AppearanceSettingsScreen on iOS", () => {
  usePlatform("ios")

  it.each(["system", "light", "dark"] as const)(
    "persists and selects the %s theme inline",
    async (preference) => {
      const view = await render(<AppearanceSettingsScreen />)
      await fireEvent.press(
        view.getByTestId(`settings-theme-choice-${preference}`),
      )
      expect(getString(SETTINGS_KEYS.theme)).toBe(preference)
      expect(
        view.getByTestId(`settings-theme-choice-${preference}`).props
          .accessibilityState.selected,
      ).toBe(true)
    },
  )

  it("pushes the Router-owned language page", async () => {
    const view = await render(<AppearanceSettingsScreen />)
    await fireEvent.press(view.getByTestId("settings-language-row"))
    expect(mockPush).toHaveBeenCalledWith("/language-settings")
    expect(view.getAllByTestId("swiftui-form-scroll-owner")).toHaveLength(1)
  })
})

describe("AppearanceSettingsScreen on Android", () => {
  usePlatform("android")

  it.each(["system", "light", "dark"] as const)(
    "commits and closes the %s theme choice",
    async (preference) => {
      const view = await render(<AppearanceSettingsScreen />)
      await fireEvent.press(view.getByTestId("settings-theme-row"))
      await fireEvent.press(
        view.getByTestId(`settings-theme-dialog-${preference}`),
      )
      expect(getString(SETTINGS_KEYS.theme)).toBe(preference)
      expect(view.queryByTestId("settings-theme-dialog")).toBeNull()
    },
  )

  it("does not persist on Cancel, outside tap, or Back dismissal", async () => {
    const view = await render(<AppearanceSettingsScreen />)
    await fireEvent.press(view.getByTestId("settings-theme-row"))
    await fireEvent.press(view.getByTestId("settings-theme-dialog-cancel"))
    expect(getString(SETTINGS_KEYS.theme)).toBeUndefined()

    await fireEvent.press(view.getByTestId("settings-theme-row"))
    await act(() =>
      view.getByTestId("settings-theme-dialog").props.onDismissRequest(),
    )
    expect(getString(SETTINGS_KEYS.theme)).toBeUndefined()
  })

  it("does not persist language on Cancel, outside tap, or Back dismissal", async () => {
    const view = await render(<AppearanceSettingsScreen />)
    await fireEvent.press(view.getByTestId("settings-language-row"))
    await fireEvent.press(view.getByTestId("settings-language-dialog-cancel"))
    expect(getString(SETTINGS_KEYS.language)).toBeUndefined()

    await fireEvent.press(view.getByTestId("settings-language-row"))
    await act(() =>
      view.getByTestId("settings-language-dialog").props.onDismissRequest(),
    )
    expect(getString(SETTINGS_KEYS.language)).toBeUndefined()
  })

  it("translates the mounted page after a language selection", async () => {
    const view = await render(<AppearanceSettingsScreen />)
    await fireEvent.press(view.getByTestId("settings-language-row"))
    await fireEvent.press(view.getByTestId("settings-language-dialog-fr"))
    expect(getString(SETTINGS_KEYS.language)).toBe("fr")
    expect(i18n.resolvedLanguage).toBe("fr")
    expect(view.getAllByText("Thème").length).toBeGreaterThan(0)
  })

  it("has one Compose scroll owner", async () => {
    const view = await render(<AppearanceSettingsScreen />)
    expect(
      view.getAllByTestId("compose-lazy-column-scroll-owner"),
    ).toHaveLength(1)
  })
})
