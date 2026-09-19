import { useMemo } from "react"

import { db, useLiveQuery, userCalendars } from "@/db"

import { rowToCalendar, type UserCalendar } from "./types"

export interface UserCalendarsSnapshot {
  calendars: UserCalendar[]
  ready: boolean
  revision: string
}

export function useUserCalendarsSnapshot(): UserCalendarsSnapshot {
  const { data, updatedAt } = useLiveQuery(db.select().from(userCalendars))
  const calendars = useMemo(() => data.map(rowToCalendar), [data])
  return {
    calendars,
    ready: updatedAt !== undefined,
    revision: `${updatedAt?.getTime() ?? "pending"}`,
  }
}

// Reactive read over the seam's useLiveQuery (re-exported from @/db, never a
// direct drizzle-orm import — D4): re-renders consumers when the user_calendars
// table changes. The seam a later "your calendars" / home ship renders; this
// ship ships no list screen (Non-Goal), but the hook is the durable reactive read
// that replaces the ephemeral scanned-source store. Maps live rows → domain,
// memoized so the array identity is stable across renders (the events-seam
// useMemo — ADR 031 — lists `calendars` as a dependency).
export function useUserCalendars(): UserCalendar[] {
  return useUserCalendarsSnapshot().calendars
}

// Whether the reactive read has resolved at least once: useLiveQuery's
// `updatedAt` is undefined until the first query settles. Consumers gate a
// load-sensitive empty state on this so it does not flash (and false-announce)
// before the read arrives.
export function useUserCalendarsLoaded(): boolean {
  return useUserCalendarsSnapshot().ready
}
