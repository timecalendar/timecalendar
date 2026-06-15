import { db, useLiveQuery, userCalendars } from "@/db"

import { rowToCalendar, type UserCalendar } from "./types"

// Reactive read over the seam's useLiveQuery (re-exported from @/db, never a
// direct drizzle-orm import — D4): re-renders consumers when the user_calendars
// table changes. The seam a later "your calendars" / home ship renders; this
// ship ships no list screen (Non-Goal), but the hook is the durable reactive read
// that replaces the ephemeral scanned-source store. Maps live rows → domain.
export function useUserCalendars(): UserCalendar[] {
  const { data } = useLiveQuery(db.select().from(userCalendars))
  return data.map(rowToCalendar)
}
