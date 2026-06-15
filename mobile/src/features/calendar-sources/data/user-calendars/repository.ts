import { db, eq, userCalendars } from "@/db"

import { calendarToRow, rowToCalendar, type UserCalendar } from "./types"

// Async CRUD over the @/db seam — a module of functions, no class (R-2,
// mirroring personal-events/data/repository.ts). Imports {db}, the table, and
// `eq` from @/db only; never drizzle-orm/expo-sqlite directly (lint-enforced).
// The pure mappers convert at the row↔domain boundary.
//
// CI proves the query shape + the mapping against the mocked seam (D9); real
// table materialization is on-device (the Maestro launch runs the migration —
// the on-disk durability proof is inboxed for the manual restart pass).

export async function findAll(): Promise<UserCalendar[]> {
  const rows = await db.select().from(userCalendars)
  return rows.map(rowToCalendar)
}

export async function getById(id: string): Promise<UserCalendar | undefined> {
  const rows = await db
    .select()
    .from(userCalendars)
    .where(eq(userCalendars.id, id))
  const row = rows[0]
  return row ? rowToCalendar(row) : undefined
}

// Resolve a held calendar by its irreplaceable subscription token — the dedupe
// lookup before persisting an add (and the token→calendar read a later ship uses).
export async function getByToken(
  token: string,
): Promise<UserCalendar | undefined> {
  const rows = await db
    .select()
    .from(userCalendars)
    .where(eq(userCalendars.token, token))
  const row = rows[0]
  return row ? rowToCalendar(row) : undefined
}

// Upsert by id — mirrors the Flutter `record(id).put` (one write path; the id is
// the identity in both the sembast store and the importer wire format). Accepts a
// caller-supplied id so the Phase-09 importer can supply its own recovered id.
export async function upsert(calendar: UserCalendar): Promise<void> {
  const row = calendarToRow(calendar)
  await db
    .insert(userCalendars)
    .values(row)
    .onConflictDoUpdate({ target: userCalendars.id, set: row })
}

export async function remove(id: string): Promise<void> {
  await db.delete(userCalendars).where(eq(userCalendars.id, id))
}

// Wire-fidelity (the `visible` field exists in the Flutter format; a toggle UI is
// a later ship). An UPDATE of the one column.
export async function setVisible(id: string, visible: boolean): Promise<void> {
  await db
    .update(userCalendars)
    .set({ visible })
    .where(eq(userCalendars.id, id))
}
