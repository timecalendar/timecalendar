import * as Localization from "expo-localization"

import { remove, setString } from "@/storage"

import {
  getInitialLocale,
  getLanguagePreference,
  getThemePreference,
  getTimezonePreference,
  resolveTimezone,
  setLanguagePreference,
  setThemePreference,
  setTimezonePreference,
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
    remove(SETTINGS_KEYS.timezone)
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

  describe("timezone preference", () => {
    it("round-trips a curated zone", () => {
      setTimezonePreference("Indian/Reunion")
      expect(getTimezonePreference()).toBe("Indian/Reunion")
      setTimezonePreference("system")
      expect(getTimezonePreference()).toBe("system")
    })

    it("reads an unset / out-of-union value as the system default", () => {
      expect(getTimezonePreference()).toBe("system")
      // An arbitrary IANA zone outside the curated union must not leak through.
      setString(SETTINGS_KEYS.timezone, "America/New_York")
      expect(getTimezonePreference()).toBe("system")
      setString(SETTINGS_KEYS.timezone, "garbage")
      expect(getTimezonePreference()).toBe("system")
    })
  })

  describe("resolveTimezone", () => {
    const calendarsSpy = jest.spyOn(Localization, "getCalendars")

    afterEach(() => calendarsSpy.mockReset())

    const deviceCalendars = (timeZone: string | null) =>
      [{ timeZone }] as unknown as ReturnType<typeof Localization.getCalendars>

    it("lets an explicit curated preference win over the device zone", () => {
      calendarsSpy.mockReturnValue(deviceCalendars("America/Montreal"))
      expect(resolveTimezone("Indian/Reunion")).toBe("Indian/Reunion")
    })

    it("resolves 'system' to the device zone", () => {
      calendarsSpy.mockReturnValue(deviceCalendars("America/Montreal"))
      expect(resolveTimezone("system")).toBe("America/Montreal")
    })

    it("falls back to Europe/Paris when the device yields no zone", () => {
      calendarsSpy.mockReturnValue(deviceCalendars(null))
      expect(resolveTimezone("system")).toBe("Europe/Paris")
      calendarsSpy.mockReturnValue(
        [] as unknown as ReturnType<typeof Localization.getCalendars>,
      )
      expect(resolveTimezone("system")).toBe("Europe/Paris")
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
