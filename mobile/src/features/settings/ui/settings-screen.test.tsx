import { fireEvent, render } from "@testing-library/react-native"

import { SETTINGS_KEYS } from "@/features/settings/prefs"
import i18n from "@/i18n"
import { getString, remove } from "@/storage"

import SettingsScreen from "./settings-screen"

// Proof that the Settings screen wiring resolves through the real theme + i18n +
// A1 prefs (MMKV) trees (mirrors the splash / themed-text proofs). @expo/ui's
// native universal controls are mocked suite-wide in jest/setup-expo-ui.ts: Host
// passes children through, each Picker.Item renders as a pressable that drives
// the picker's onValueChange — so the screen → chrome wrapper → A1 hook → @/storage
// path is genuinely exercised (mock at the native seam, not the screen). What CI
// proves: render + control→hook wiring. The native picker feel / OS popup /
// VoiceOver / contrast are the on-device half (inbox, design D7).

beforeEach(async () => {
  // Reset both preferences to the "system" default (no stored value) so each
  // case starts from the documented default.
  remove(SETTINGS_KEYS.theme)
  remove(SETTINGS_KEYS.language)
  // The language case calls i18n.changeLanguage("fr") on the shared module-scoped
  // instance; reset to en so the suite stays hermetic regardless of order.
  await i18n.changeLanguage("en")
})

describe("SettingsScreen", () => {
  it("renders the localized title and both control labels (not raw keys)", async () => {
    const { getByText } = await render(<SettingsScreen />)

    // EN catalog values (jest-expo device locale resolves to en), not the keys.
    expect(getByText("Settings")).toBeTruthy()
    expect(getByText("Theme")).toBeTruthy()
    expect(getByText("Language")).toBeTruthy()
  })

  it("reflects the current preference (default 'system') in each control", async () => {
    const { getByTestId } = await render(<SettingsScreen />)

    // The mock marks the selected item accessibilityState.selected. Both
    // default to "system" until the user overrides.
    expect(
      getByTestId("settings-theme-picker-item-system").props.accessibilityState
        .selected,
    ).toBe(true)
    expect(
      getByTestId("settings-language-picker-item-system").props
        .accessibilityState.selected,
    ).toBe(true)
  })

  it("drives the theme preference setter when a theme option is selected", async () => {
    const { getByTestId } = await render(<SettingsScreen />)

    fireEvent.press(getByTestId("settings-theme-picker-item-dark"))

    // The setter persisted "dark" through the @/storage seam (the screen → hook
    // → store write path; the C1 seam re-resolves the theme off this value).
    expect(getString(SETTINGS_KEYS.theme)).toBe("dark")
  })

  it("drives the language preference setter and switches the active language", async () => {
    const { getByTestId } = await render(<SettingsScreen />)

    fireEvent.press(getByTestId("settings-language-picker-item-fr"))

    // The language setter persisted "fr" AND called i18n.changeLanguage (i18n is
    // real in the suite) — the live language switch A2 wires over A1's hook.
    expect(getString(SETTINGS_KEYS.language)).toBe("fr")
    expect(i18n.language).toBe("fr")
  })
})
