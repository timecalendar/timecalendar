import {
  and,
  db,
  eq,
  gt,
  gte,
  lt,
  or,
  personalEvents,
  useLiveQuery,
} from "@/db"

import { type PersonalEvent, rowToEvent } from "./types"

// Reactive read over the seam's useLiveQuery (re-exported from @/db, never a
// direct drizzle-orm import — D5): re-renders consumers when the personal_events
// table changes. Maps the live rows → domain via the pure mapper.
export function usePersonalEvents(): PersonalEvent[] {
  const { data } = useLiveQuery(db.select().from(personalEvents))
  return data.map(rowToEvent)
}

export function usePersonalEventRowsInRange(range: { from: Date; to: Date }) {
  const fromIso = range.from.toISOString()
  const toIso = range.to.toISOString()
  const result = useLiveQuery(
    db
      .select()
      .from(personalEvents)
      .where(
        or(
          and(
            lt(personalEvents.startsAt, toIso),
            gt(personalEvents.endsAt, fromIso),
          ),
          and(
            eq(personalEvents.startsAt, personalEvents.endsAt),
            gte(personalEvents.startsAt, fromIso),
            lt(personalEvents.startsAt, toIso),
          ),
        ),
      ),
    [`personal:${fromIso}:${toIso}`],
  )
  return {
    rows: result.data,
    error: result.error,
    ready: result.updatedAt !== undefined,
    revision: `${result.updatedAt?.getTime() ?? "pending"}`,
  }
}
