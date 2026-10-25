import { useCalendars } from "expo-localization"

/** The device's 12/24-hour setting; `null` when the platform does not report one. */
export function useUses24HourClock(): boolean | null {
  return useCalendars()[0]?.uses24hourClock ?? null
}
