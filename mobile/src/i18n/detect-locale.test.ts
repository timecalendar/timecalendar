import * as Localization from "expo-localization"

import { detectLocale } from "./detect-locale"

// detect-locale calls Localization.getLocales() at call time, so spying on the
// shared module the global jest/setup-i18n already loaded takes effect for our
// cases (a plain jest.mock factory wouldn't — setup preloads the real module
// before the factory applies). Only languageCode is read; the rest of the
// Locale shape is irrelevant to resolution.
const spy = jest.spyOn(Localization, "getLocales")

const locales = (...codes: (string | null)[]) =>
  codes.map((languageCode) => ({ languageCode })) as ReturnType<
    typeof Localization.getLocales
  >

afterEach(() => {
  spy.mockReset()
})

describe("detectLocale", () => {
  it("returns fr for a French device", () => {
    spy.mockReturnValue(locales("fr"))
    expect(detectLocale()).toBe("fr")
  })

  it("returns en for an English device", () => {
    spy.mockReturnValue(locales("en"))
    expect(detectLocale()).toBe("en")
  })

  it("falls back to en for an unsupported device locale", () => {
    spy.mockReturnValue(locales("de"))
    expect(detectLocale()).toBe("en")
  })

  it("honors device preference order, picking the first supported locale", () => {
    spy.mockReturnValue(locales("de", "fr", "en"))
    expect(detectLocale()).toBe("fr")
  })

  it("falls back to en when no locales are reported", () => {
    spy.mockReturnValue(locales())
    expect(detectLocale()).toBe("en")
  })
})
