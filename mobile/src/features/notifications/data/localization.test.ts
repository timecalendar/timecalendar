import * as Localization from "expo-localization"

import { setLanguagePreference, SETTINGS_KEYS } from "@/features/settings/prefs"

import { getEffectiveLocale, getEffectiveTimezone } from "./localization"

// The accessors call expo-localization at call time, so spying on the shared
// module the global setup already loaded takes effect per case (the
// detect-locale.test pattern). The language preference is a real storage write
// (setup-storage's in-memory MMKV), removed after each case.
const calendarsSpy = jest.spyOn(Localization, "getCalendars")
const localesSpy = jest.spyOn(Localization, "getLocales")

const { remove } = jest.requireActual<typeof import("@/storage")>("@/storage")

const deviceLocales = (...codes: string[]) =>
  codes.map((languageCode) => ({ languageCode })) as ReturnType<
    typeof Localization.getLocales
  >

const deviceCalendars = (timeZone: string | null) =>
  [{ timeZone }] as unknown as ReturnType<typeof Localization.getCalendars>

afterEach(() => {
  calendarsSpy.mockReset()
  localesSpy.mockReset()
  remove(SETTINGS_KEYS.language)
})

describe("getEffectiveLocale", () => {
  it("resolves 'system' through device detection", () => {
    localesSpy.mockReturnValue(deviceLocales("fr"))
    expect(getEffectiveLocale()).toBe("fr")
  })

  it("lets an explicit settings language win over the device locale", () => {
    localesSpy.mockReturnValue(deviceLocales("fr"))
    setLanguagePreference("en")
    expect(getEffectiveLocale()).toBe("en")
  })
})

describe("getEffectiveTimezone", () => {
  it("returns the device IANA zone", () => {
    calendarsSpy.mockReturnValue(deviceCalendars("America/New_York"))
    expect(getEffectiveTimezone()).toBe("America/New_York")
  })

  it("falls back to Europe/Paris when the device zone is null", () => {
    calendarsSpy.mockReturnValue(deviceCalendars(null))
    expect(getEffectiveTimezone()).toBe("Europe/Paris")
  })

  it("falls back to Europe/Paris when no device calendar exists", () => {
    calendarsSpy.mockReturnValue(
      [] as unknown as ReturnType<typeof Localization.getCalendars>,
    )
    expect(getEffectiveTimezone()).toBe("Europe/Paris")
  })
})
