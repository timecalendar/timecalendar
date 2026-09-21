import { act, render, waitFor } from "@testing-library/react-native"
import type { Locale } from "expo-localization"

import { setLanguagePreference, SETTINGS_KEYS } from "@/features/settings/prefs"
import i18n from "@/i18n"
import { remove } from "@/storage"

import { LocaleSynchronizer } from "./locale-synchronizer"

let mockLocales: Locale[] = []
const mockUseLocales = jest.fn(() => mockLocales)

jest.mock("expo-localization", () => ({
  getLocales: () => mockLocales,
  useLocales: () => mockUseLocales(),
  useCalendars: () => [],
}))

beforeEach(async () => {
  remove(SETTINGS_KEYS.language)
  mockLocales = [{ languageCode: "en", languageTag: "en-US" } as Locale]
  mockUseLocales.mockClear()
  await i18n.changeLanguage("en")
})

it("follows supported system changes once and ignores duplicates", async () => {
  setLanguagePreference("system")
  const changeLanguage = jest.spyOn(i18n, "changeLanguage")
  const view = await render(<LocaleSynchronizer />)
  expect(changeLanguage).not.toHaveBeenCalled()

  mockLocales = [{ languageCode: "fr", languageTag: "fr-FR" } as Locale]
  await view.rerender(<LocaleSynchronizer />)
  await waitFor(() => expect(i18n.resolvedLanguage).toBe("fr"))
  expect(changeLanguage).toHaveBeenCalledTimes(1)

  mockLocales = [{ languageCode: "fr", languageTag: "fr-CA" } as Locale]
  await view.rerender(<LocaleSynchronizer />)
  expect(changeLanguage).toHaveBeenCalledTimes(1)
  changeLanguage.mockRestore()
})

it("falls back to English for unsupported locales", async () => {
  setLanguagePreference("system")
  await i18n.changeLanguage("fr")
  mockLocales = [{ languageCode: "de", languageTag: "de-DE" } as Locale]
  await render(<LocaleSynchronizer />)
  await waitFor(() => expect(i18n.resolvedLanguage).toBe("en"))
})

it.each(["fr", "en"] as const)(
  "keeps explicit %s authoritative over device events",
  async (preference) => {
    setLanguagePreference(preference)
    await i18n.changeLanguage(preference)
    const changeLanguage = jest.spyOn(i18n, "changeLanguage")
    mockLocales = [
      {
        languageCode: preference === "fr" ? "en" : "fr",
        languageTag: preference === "fr" ? "en-US" : "fr-FR",
      } as Locale,
    ]
    const view = await render(<LocaleSynchronizer />)
    await view.rerender(<LocaleSynchronizer />)
    expect(changeLanguage).not.toHaveBeenCalled()
    changeLanguage.mockRestore()
  },
)

it("owns one public hook lifetime and unmounts cleanly", async () => {
  const view = await render(<LocaleSynchronizer />)
  expect(mockUseLocales).toHaveBeenCalledTimes(1)
  await act(() => view.unmount())
})
