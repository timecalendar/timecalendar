import { act, renderHook } from "@testing-library/react-native"
import * as Localization from "expo-localization"

import i18n from "@/i18n"
import { remove } from "@/storage"

import {
  useCalendarViewPreference,
  useDisplayZone,
  useLanguagePreference,
  useShowWeekendsPreference,
  useThemePreference,
  useTimezonePreference,
} from "./hooks"
import { SETTINGS_KEYS } from "./types"

// Renders the reactive hooks through RNTL renderHook over the real @/storage
// seam (MMKV in-memory mock): asserts the hook reflects the current value, that
// setPreference persists AND re-renders (the reactive read updates), and that
// the language setter drives i18n.changeLanguage with the resolved locale.

describe("settings prefs hooks", () => {
  beforeEach(() => {
    remove(SETTINGS_KEYS.theme)
    remove(SETTINGS_KEYS.language)
    remove(SETTINGS_KEYS.timezone)
    remove(SETTINGS_KEYS.showWeekends)
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

describe("useCalendarViewPreference", () => {
  beforeEach(() => remove(SETTINGS_KEYS.calendarView))

  it("defaults to week, reactively writes every view, and keeps a stable setter", async () => {
    const first = await renderHook(() => useCalendarViewPreference())
    expect(first.result.current.view).toBe("week")
    const setter = first.result.current.setView

    for (const view of ["day", "week", "agenda"] as const) {
      await act(async () => first.result.current.setView(view))
      expect(first.result.current.view).toBe(view)
      expect(first.result.current.setView).toBe(setter)
    }

    await act(async () => first.unmount())
    const restarted = await renderHook(() => useCalendarViewPreference())
    expect(restarted.result.current.view).toBe("agenda")
  })
})

describe("useShowWeekendsPreference", () => {
  beforeEach(() => remove(SETTINGS_KEYS.showWeekends))

  it("defaults on and reactively persists false then true", async () => {
    const first = await renderHook(() => useShowWeekendsPreference())
    expect(first.result.current.showWeekends).toBe(true)

    await act(async () => first.result.current.setShowWeekends(false))
    expect(first.result.current.showWeekends).toBe(false)
    await act(async () => first.unmount())

    const restarted = await renderHook(() => useShowWeekendsPreference())
    expect(restarted.result.current.showWeekends).toBe(false)
    await act(async () => restarted.result.current.setShowWeekends(true))
    expect(restarted.result.current.showWeekends).toBe(true)
  })
})

describe("useTimezonePreference / useDisplayZone", () => {
  const useCalendarsSpy = jest.spyOn(Localization, "useCalendars")

  const deviceCalendars = (timeZone: string | null) =>
    [{ timeZone }] as unknown as ReturnType<typeof Localization.useCalendars>

  beforeEach(() => {
    remove(SETTINGS_KEYS.timezone)
    useCalendarsSpy.mockReturnValue(deviceCalendars("America/Montreal"))
  })

  afterEach(() => useCalendarsSpy.mockReset())

  it("defaults to system and reactively reflects a set", async () => {
    const { result } = await renderHook(() => useTimezonePreference())
    expect(result.current.preference).toBe("system")

    await act(async () => result.current.setPreference("Pacific/Noumea"))
    expect(result.current.preference).toBe("Pacific/Noumea")
  })

  it("resolves the display zone from the preference, reactively", async () => {
    const { result } = await renderHook(() => ({
      zone: useDisplayZone(),
      timezone: useTimezonePreference(),
    }))
    expect(result.current.zone).toBe("America/Montreal")

    await act(async () =>
      result.current.timezone.setPreference("Indian/Reunion"),
    )
    expect(result.current.zone).toBe("Indian/Reunion")

    await act(async () => result.current.timezone.setPreference("system"))
    expect(result.current.zone).toBe("America/Montreal")
  })

  it("under system, follows a device-zone change", async () => {
    const { result, rerender } = await renderHook(() => useDisplayZone())
    expect(result.current).toBe("America/Montreal")

    useCalendarsSpy.mockReturnValue(deviceCalendars("Pacific/Tahiti"))
    await act(async () => rerender(undefined))
    expect(result.current).toBe("Pacific/Tahiti")
  })

  it("falls back to Europe/Paris when the device yields no zone", async () => {
    useCalendarsSpy.mockReturnValue(deviceCalendars(null))
    const { result } = await renderHook(() => useDisplayZone())
    expect(result.current).toBe("Europe/Paris")
  })
})
