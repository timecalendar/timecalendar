import { act, renderHook } from "@testing-library/react-native"

import i18n from "@/i18n"
import { remove } from "@/storage"

import { useLanguagePreference, useThemePreference } from "./hooks"
import { SETTINGS_KEYS } from "./types"

// Renders the reactive hooks through RNTL renderHook over the real @/storage
// seam (MMKV in-memory mock): asserts the hook reflects the current value, that
// setPreference persists AND re-renders (the reactive read updates), and that
// the language setter drives i18n.changeLanguage with the resolved locale.

describe("settings prefs hooks", () => {
  beforeEach(() => {
    remove(SETTINGS_KEYS.theme)
    remove(SETTINGS_KEYS.language)
  })

  describe("useThemePreference", () => {
    it("defaults to system and reactively reflects a set", async () => {
      const { result } = await renderHook(() => useThemePreference())
      expect(result.current.preference).toBe("system")

      await act(async () => result.current.setPreference("dark"))
      expect(result.current.preference).toBe("dark")
    })
  })

  describe("useLanguagePreference", () => {
    it("defaults to system and reactively reflects a set", async () => {
      const changeLanguage = jest
        .spyOn(i18n, "changeLanguage")
        .mockResolvedValue((() => "") as never)

      const { result } = await renderHook(() => useLanguagePreference())
      expect(result.current.preference).toBe("system")

      await act(async () => result.current.setPreference("fr"))
      expect(result.current.preference).toBe("fr")

      changeLanguage.mockRestore()
    })

    it("changes the live language to the resolved locale on set", async () => {
      const changeLanguage = jest
        .spyOn(i18n, "changeLanguage")
        .mockResolvedValue((() => "") as never)

      const { result } = await renderHook(() => useLanguagePreference())
      await act(async () => result.current.setPreference("fr"))
      expect(changeLanguage).toHaveBeenCalledWith("fr")

      // "system" resolves to device detection (en under jest-expo).
      await act(async () => result.current.setPreference("system"))
      expect(changeLanguage).toHaveBeenLastCalledWith("en")

      changeLanguage.mockRestore()
    })
  })
})
