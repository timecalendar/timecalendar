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
  type CalendarWindowReader,
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

function createStore(
  reader: CalendarWindowReader,
  environment: { displayZone: string; firstWeekday: FirstWeekday },
): CalendarWindowStore {
  const reporter = createCalendarRejectionReporter()
  return createCalendarWindowStore({
    reader,
    subscribeToChanges: subscribeToCalendarChanges,
    displayZone: environment.displayZone,
    firstWeekday: environment.firstWeekday,
    onRejectedRows: (revision, counts) => reporter.report(revision, counts),
  })
}

/**
 * The Calendar screen's window store, connected to database changes while
 * mounted. A different reader starts a new store.
 */
export function useCalendarWindow(environment: {
  displayZone: string
  firstWeekday: FirstWeekday
  reader?: CalendarWindowReader | undefined
}): { store: CalendarWindowStore; snapshot: CalendarWindowSnapshot } {
  const reader = environment.reader ?? readCalendarWindow
  const [owned, setOwned] = useState(() => ({
    reader,
    store: createStore(reader, environment),
  }))
  let store = owned.store
  if (owned.reader !== reader) {
    store = createStore(reader, environment)
    setOwned({ reader, store })
  }
  useEffect(() => store.connect(), [store])
  const { displayZone, firstWeekday } = environment
  useEffect(() => {
    store.configure({ displayZone, firstWeekday })
  }, [store, displayZone, firstWeekday])
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot)
  return { store, snapshot }
}
