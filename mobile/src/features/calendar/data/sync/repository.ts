import { and, calendarEvents, db, gte, lte } from "@/db"
import type { CalendarEvent } from "@/features/calendar/data/types"

import { calendarEventToRow, rowToCalendarEvent } from "./types"

// Async CRUD over the @/db seam — a module of functions, no class (R-2,
// mirroring user-calendars/repository.ts). Imports {db}, the table, and the
// query operators from @/db only; never drizzle-orm/expo-sqlite directly
// (lint-enforced). The pure mappers convert at the row↔domain boundary.
//
// CI proves the query shape + the transactional drop+replace against the mocked
// seam; real table materialization + on-disk atomicity are on-device (the inbox
// manual pass — there is no list-after-restart Maestro target this ship).

// SQLite caps the number of bound variables per statement (~999); chunk the bulk
// insert well under that. 15 columns × ~60 rows ≈ 900 binds, so 50 rows/chunk is
// a safe, simple bound that never trips the limit.
const INSERT_CHUNK_SIZE = 50

// Events overlapping the closed window [from, to]: the start at/before `to` and
// the end at/after `from`. The TEXT ISO-8601 columns sort lexicographically as
// chronological for canonical UTC strings (the property the mappers guarantee),
// so the bounds are the canonical ISO strings.
export async function findInRange(
  from: Date,
  to: Date,
): Promise<CalendarEvent[]> {
  const rows = await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        lte(calendarEvents.startsAt, to.toISOString()),
        gte(calendarEvents.endsAt, from.toISOString()),
      ),
    )
  return rows.map(rowToCalendarEvent)
}

// Replace the ENTIRE calendar_events table with the synced set — the Flutter
// drop+replace strategy (`_store.drop()` then `addAll`). It MUST be atomic: a
// crash mid-replace must never leave a half-empty table (a partial
// calendar_events would silently lose the user's timetable until the next
// successful sync). So the delete-all + the chunked bulk insert run inside ONE
// db.transaction — either the whole replace commits or none of it does. The
// chunking stays under SQLite's bound-variable limit; all chunks share the one
// transaction. A thrown transaction is a crash-worthy LOCAL write failure (the
// orchestrator records it through @/firebase — distinct from a recoverable fetch
// failure, ADR 021 / D6).
export async function replaceAll(events: CalendarEvent[]): Promise<void> {
  const rows = events.map(calendarEventToRow)
  await db.transaction(async (tx) => {
    await tx.delete(calendarEvents)
    for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
      await tx
        .insert(calendarEvents)
        .values(rows.slice(i, i + INSERT_CHUNK_SIZE))
    }
  })
}
