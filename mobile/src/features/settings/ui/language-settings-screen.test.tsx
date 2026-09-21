import { fireEvent, render } from "@testing-library/react-native"

import { SETTINGS_KEYS } from "@/features/settings/prefs"
import i18n from "@/i18n"
import { getString, remove } from "@/storage"
import { usePlatform } from "@/test-support/platform"

import { LanguageSettingsScreen } from "./language-settings-screen"

jest.mock("expo-router", () => ({ Stack: { Screen: () => null } }))

beforeEach(async () => {
  remove(SETTINGS_KEYS.language)
  await i18n.changeLanguage("en")
})

describe("LanguageSettingsScreen", () => {
  usePlatform("ios")

  it.each([
    ["system", "Use device language"],
    ["fr", "Français"],
    ["en", "English"],
  ] as const)(
    "persists %s from the single native list",
    async (value, _label) => {
      const view = await render(<LanguageSettingsScreen />)
      await fireEvent.press(
        view.getByTestId(`settings-language-choice-${value}`),
      )
      expect(getString(SETTINGS_KEYS.language)).toBe(value)
      expect(
        view.getByTestId(`settings-language-choice-${value}`).props
          .accessibilityState.selected,
      ).toBe(true)
      expect(view.getAllByTestId("swiftui-form-scroll-owner")).toHaveLength(1)
    },
  )

  it("translates the mounted title and choices without losing selection", async () => {
    const view = await render(<LanguageSettingsScreen />)
    await fireEvent.press(view.getByTestId("settings-language-choice-fr"))
    expect(i18n.resolvedLanguage).toBe("fr")
    expect(
      view.getByTestId("settings-language-choice-fr").props.accessibilityState
        .selected,
    ).toBe(true)
    expect(view.getByText("Langue de l’appareil")).toBeOnTheScreen()
  })
})
