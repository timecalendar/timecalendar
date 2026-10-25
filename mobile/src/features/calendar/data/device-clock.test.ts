import { renderHook } from "@testing-library/react-native"
import * as Localization from "expo-localization"

import { useUses24HourClock } from "./device-clock"

afterEach(() => {
  jest.restoreAllMocks()
})

function deviceCalendars(calendars: unknown[]) {
  jest
    .spyOn(Localization, "useCalendars")
    .mockReturnValue(calendars as ReturnType<typeof Localization.useCalendars>)
}

const calendar = (uses24hourClock: boolean | null) => ({
  calendar: "gregory",
  uses24hourClock,
  firstWeekday: 1,
  timeZone: null,
})

describe("useUses24HourClock", () => {
  it.each([true, false, null])(
    "reads the device clock (%s)",
    async (uses24hourClock) => {
      deviceCalendars([calendar(uses24hourClock)])
      const { result } = await renderHook(() => useUses24HourClock())
      expect(result.current).toBe(uses24hourClock)
    },
  )

  it("is null when the device reports no calendar", async () => {
    deviceCalendars([])
    const { result } = await renderHook(() => useUses24HourClock())
    expect(result.current).toBeNull()
  })
})
