import { db, personalEvents, useLiveQuery } from "@/db"

import { type PersonalEvent, rowToEvent } from "./types"

// Reactive read over the seam's useLiveQuery (re-exported from @/db, never a
// direct drizzle-orm import — D5): re-renders consumers when the personal_events
// table changes. Maps the live rows → domain via the pure mapper.
export function usePersonalEvents(): PersonalEvent[] {
  const { data } = useLiveQuery(db.select().from(personalEvents))
  return data.map(rowToEvent)
}
