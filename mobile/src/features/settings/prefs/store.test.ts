import * as Localization from "expo-localization"

import { remove, setNumber, setString } from "@/storage"

import {
  getCalendarView,
  getCalendarZoomPixelsPerHour,
  getInitialLocale,
  getLanguagePreference,
  getShowWeekends,
  getThemePreference,
  getTimezonePreference,
  resolveTimezone,
  setCalendarView,
  setCalendarZoomPixelsPerHour,
  setLanguagePreference,
  setShowWeekends,
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
    remove(SETTINGS_KEYS.showWeekends)
    remove(SETTINGS_KEYS.calendarView)
    remove(SETTINGS_KEYS.calendarZoomPixelsPerHour)
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

  describe("show weekends preference", () => {
    it("defaults missing and malformed values to true", () => {
      expect(getShowWeekends()).toBe(true)
      setString(SETTINGS_KEYS.showWeekends, "false")
      expect(getShowWeekends()).toBe(true)
    })

    it("round-trips explicit false and true across fresh reads", () => {
      setShowWeekends(false)
      expect(getShowWeekends()).toBe(false)
      setShowWeekends(true)
      expect(getShowWeekends()).toBe(true)
    })
  })

  describe("calendar view preference", () => {
    it.each(["day", "week", "agenda"] as const)(
      "round-trips %s across fresh reads",
      (view) => {
        setCalendarView(view)
        expect(getCalendarView()).toBe(view)
      },
    )

    it("defaults missing and corrupt values to week", () => {
      expect(getCalendarView()).toBe("week")
      setString(SETTINGS_KEYS.calendarView, "month")
      expect(getCalendarView()).toBe("week")
    })
  })

  describe("calendar zoom preference", () => {
    it.each([40, 60, 75.5, 120])(
      "round-trips %s pixels per hour across fresh reads",
      (pixelsPerHour) => {
        setCalendarZoomPixelsPerHour(pixelsPerHour)
        expect(getCalendarZoomPixelsPerHour()).toBe(pixelsPerHour)
      },
    )

    it.each([undefined, Number.NaN, Infinity, -Infinity, 39, 121])(
      "recovers %s to the default",
      (stored) => {
        if (stored !== undefined) {
          setNumber(SETTINGS_KEYS.calendarZoomPixelsPerHour, stored)
        }
        expect(getCalendarZoomPixelsPerHour()).toBe(60)
      },
    )

    it("stores the safe default instead of an invalid write", () => {
      setCalendarZoomPixelsPerHour(Number.NaN)
      expect(getCalendarZoomPixelsPerHour()).toBe(60)
    })

    it("recovers a corrupt non-numeric value", () => {
      setString(SETTINGS_KEYS.calendarZoomPixelsPerHour, "large")
      expect(getCalendarZoomPixelsPerHour()).toBe(60)
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
