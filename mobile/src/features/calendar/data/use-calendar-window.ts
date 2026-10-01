import { useEffect, useState, useSyncExternalStore } from "react"

import {
  calendarEvents,
  checklistItems,
  personalEvents,
  subscribeToTableChanges,
  userCalendars,
} from "@/db"

import { readCalendarWindow } from "./calendar-window-reader"
import {
  type CalendarWindowSnapshot,
  type CalendarWindowStore,
  createCalendarWindowStore,
} from "./calendar-window-store"
import { createCalendarRejectionReporter } from "./rejection-diagnostics"
import type { FirstWeekday } from "./week"

const OBSERVED_TABLES = [
  calendarEvents,
  personalEvents,
  checklistItems,
  userCalendars,
]

function subscribeToCalendarChanges(listener: () => void): () => void {
  return subscribeToTableChanges(OBSERVED_TABLES, listener)
}

/** The Calendar screen's window store, connected to database changes while mounted. */
export function useCalendarWindow(environment: {
  displayZone: string
  firstWeekday: FirstWeekday
}): { store: CalendarWindowStore; snapshot: CalendarWindowSnapshot } {
  const [store] = useState(() => {
    const reporter = createCalendarRejectionReporter()
    return createCalendarWindowStore({
      reader: readCalendarWindow,
      subscribeToChanges: subscribeToCalendarChanges,
      displayZone: environment.displayZone,
      firstWeekday: environment.firstWeekday,
      onRejectedRows: (revision, counts) => reporter.report(revision, counts),
    })
  })
  useEffect(() => store.connect(), [store])
  const { displayZone, firstWeekday } = environment
  useEffect(() => {
    store.configure({ displayZone, firstWeekday })
  }, [store, displayZone, firstWeekday])
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot)
  return { store, snapshot }
}
