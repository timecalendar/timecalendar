import { and, db, eq, gte, lte, personalEvents } from "@/db"

import { eventToRow, type PersonalEvent, rowToEvent } from "./types"

// Async CRUD over the @/db seam — a module of functions, no class (R-2,
// mirroring Settings' prefs store). Imports {db}, the table, and the query
// operators from @/db only; never drizzle-orm directly (lint-enforced). The
// mappers convert at the row↔domain boundary.
//
// CI proves the query shape + the mapping against the mocked seam (D8); real
// table materialization is on-device (the Maestro launch runs the migration).

export async function findAll(): Promise<PersonalEvent[]> {
  const rows = await db.select().from(personalEvents)
  return rows.map(rowToEvent)
}

export async function getById(uid: string): Promise<PersonalEvent | undefined> {
  const rows = await db
    .select()
    .from(personalEvents)
    .where(eq(personalEvents.uid, uid))
  const row = rows[0]
  return row ? rowToEvent(row) : undefined
}

// Upsert by uid — mirrors the Flutter `put` (one write path for create + edit).
export async function upsert(event: PersonalEvent): Promise<void> {
  const row = eventToRow(event)
  await db
    .insert(personalEvents)
    .values(row)
    .onConflictDoUpdate({ target: personalEvents.uid, set: row })
}

export async function remove(uid: string): Promise<void> {
  await db.delete(personalEvents).where(eq(personalEvents.uid, uid))
}

// Events overlapping [from, to): the start before `to` and the end at/after
// `from`, ordered chronologically by start. The TEXT ISO-8601 columns sort
// lexicographically as chronological for canonical UTC strings (D4 — the
// property the mappers guarantee), so the bounds are the canonical ISO strings.
export async function findInRange(
  from: Date,
  to: Date,
): Promise<PersonalEvent[]> {
  const rows = await db
    .select()
    .from(personalEvents)
    .where(
      and(
        lte(personalEvents.startsAt, to.toISOString()),
        gte(personalEvents.endsAt, from.toISOString()),
      ),
    )
    .orderBy(personalEvents.startsAt)
  return rows.map(rowToEvent)
}
