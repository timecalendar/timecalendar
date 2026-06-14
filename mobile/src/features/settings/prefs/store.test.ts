import { remove, setString } from "@/storage"

import {
  getInitialLocale,
  getLanguagePreference,
  getThemePreference,
  setLanguagePreference,
  setThemePreference,
} from "./store"
import { SETTINGS_KEYS } from "./types"

// Round-trips both preferences through the real @/storage seam (MMKV v4's
// built-in in-memory Jest mock — the Nitro stub is wired in setup-storage), and
// proves the validators make a read total: unset / corrupt → "system" default.
// expo-localization resolves to en under jest-expo, so detectLocale() → "en".

describe("settings prefs store", () => {
  beforeEach(() => {
    remove(SETTINGS_KEYS.theme)
    remove(SETTINGS_KEYS.language)
  })

  describe("theme preference", () => {
    it("round-trips each value", () => {
      setThemePreference("light")
      expect(getThemePreference()).toBe("light")
      setThemePreference("dark")
      expect(getThemePreference()).toBe("dark")
      setThemePreference("system")
      expect(getThemePreference()).toBe("system")
    })

    it("reads an unset key as the system default", () => {
      expect(getThemePreference()).toBe("system")
    })

    it("reads a corrupt stored value as the system default", () => {
      setString(SETTINGS_KEYS.theme, "neon")
      expect(getThemePreference()).toBe("system")
    })
  })

  describe("language preference", () => {
    it("round-trips each value", () => {
      setLanguagePreference("fr")
      expect(getLanguagePreference()).toBe("fr")
      setLanguagePreference("en")
      expect(getLanguagePreference()).toBe("en")
      setLanguagePreference("system")
      expect(getLanguagePreference()).toBe("system")
    })

    it("reads an unset / corrupt value as the system default", () => {
      expect(getLanguagePreference()).toBe("system")
      setString(SETTINGS_KEYS.language, "de")
      expect(getLanguagePreference()).toBe("system")
    })
  })

  describe("getInitialLocale", () => {
    it("returns the stored preference when explicit", () => {
      setLanguagePreference("fr")
      expect(getInitialLocale()).toBe("fr")
      setLanguagePreference("en")
      expect(getInitialLocale()).toBe("en")
    })

    it("falls back to device detection when the preference is system", () => {
      setLanguagePreference("system")
      // jest-expo's device locale resolves to en.
      expect(getInitialLocale()).toBe("en")
    })
  })
})
