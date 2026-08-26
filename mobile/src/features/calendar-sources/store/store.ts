import { getString, setString } from "@/storage"

import {
  type CalendarSourceHealthSnapshot,
  encodeSourceHealthSnapshot,
  parseSourceHealthSnapshot,
  SOURCE_HEALTH_KEY,
} from "./types"

export function getSourceHealthSnapshot(): CalendarSourceHealthSnapshot {
  return parseSourceHealthSnapshot(getString(SOURCE_HEALTH_KEY))
}

export function replaceSourceHealthSnapshot(
  snapshot: CalendarSourceHealthSnapshot,
): void {
  setString(SOURCE_HEALTH_KEY, encodeSourceHealthSnapshot(snapshot))
}

export function removeCalendarSourceHealth(calendarId: string): void {
  const snapshot = getSourceHealthSnapshot()
  if (!(calendarId in snapshot)) return
  delete snapshot[calendarId]
  replaceSourceHealthSnapshot(snapshot)
}
