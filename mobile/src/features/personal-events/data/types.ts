import { personalEvents } from "@/db"

// The domain type the feature exposes, and the pure row↔domain mappers that
// isolate the TEXT-ISO storage format (D4) from ergonomic domain types (D7).
//
// The row type is Drizzle's inferred shape (TEXT ISO-8601 date strings); the
// domain type exposes `Date` for the three timestamps, so consumers never touch
// the string format. The mappers are pure (no `db`) so they unit-test
// exhaustively without any SQLite mock — and they carry the importer-fidelity
// guarantee: eventToRow always writes a canonical UTC ISO-8601 string
// (toISOString()), the property D4's TEXT range query relies on.

type PersonalEventRow = typeof personalEvents.$inferSelect
type PersonalEventInsert = typeof personalEvents.$inferInsert

export interface PersonalEvent {
  uid: string
  title: string
  color: string
  startsAt: Date
  endsAt: Date
  exportedAt: Date
  location: string | undefined
  description: string | undefined
}

// Parse a stored row into the domain type: TEXT ISO strings → Date, null
// location/description → undefined.
export function rowToEvent(row: PersonalEventRow): PersonalEvent {
  return {
    uid: row.uid,
    title: row.title,
    color: row.color,
    startsAt: new Date(row.startsAt),
    endsAt: new Date(row.endsAt),
    exportedAt: new Date(row.exportedAt),
    location: row.location ?? undefined,
    description: row.description ?? undefined,
  }
}

// Serialize a domain event into a row: Date → canonical UTC ISO-8601 string
// (toISOString() always emits the canonical `…Z` form, so the text columns sort
// chronologically), undefined location/description → null.
export function eventToRow(event: PersonalEvent): PersonalEventInsert {
  return {
    uid: event.uid,
    title: event.title,
    color: event.color,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    exportedAt: event.exportedAt.toISOString(),
    location: event.location ?? null,
    description: event.description ?? null,
  }
}
