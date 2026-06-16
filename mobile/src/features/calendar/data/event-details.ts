import { useMemo } from "react"

import type {
  CalendarEventCustomFields,
  EventTag,
  EventTypeEnum,
} from "@/api/generated/timeCalendar.schemas"
import { EventTypeEnum as EventTypeEnumValues } from "@/api/generated/timeCalendar.schemas"
import { calendarEvents, db, eq, personalEvents, useLiveQuery } from "@/db"

import { decodeFields, decodeJsonArray } from "./sync/types"

// The RICH event-details read — the FIRST consumer of the verbatim calendar_events
// row (ADR 021 / D1: the verbatim fidelity lives in the ROW, never the lossy
// rendering domain). `rowToEventDetails` is the rich counterpart to the lossy
// `rowToCalendarEvent` (data/sync/types.ts): it keeps the fields the rendering
// projection deliberately drops — `groupColor`, the real `type` enum, `exportedAt`,
// and the FULL `tags: {name,color,icon}[]` (not name-only). The grid/agenda do not
// need those, so widening the rendering CalendarEvent would bloat every tile's data
// for this one consumer (D3 — rejected). This is a SEPARATE rich read.
//
// UNIFIED for BOTH event kinds (ADR 024 / decision 4 — Flutter parity, both
// EventInterface open the same EventDetailsScreen): the read resolves EITHER a
// synced calendar_events row OR a personal personal_events row for the uid and
// returns a discriminated EventDetails (`kind`). The personal branch fills the
// sync-only fields with safe defaults (groupColor = color, the `class` type,
// empty tags/teachers, empty userCalendarId) so the screen renders the shared
// title/date/lines/footer for both. The uid is unique across the two tables, so
// at most one query resolves a row.

type CalendarEventRow = typeof calendarEvents.$inferSelect
type PersonalEventRow = typeof personalEvents.$inferSelect

// The full tag shape (mirrors the generated EventTag) — the lossy domain projects
// tags to names only; the details surface needs color + icon too.
export type EventDetailsTag = EventTag

// The rich domain type the details screen consumes — Date timestamps, the full
// tags, and the rich fields the lossy CalendarEvent drops. `kind` discriminates a
// synced vs. a personal event so the screen keys the origin-specific header action
// (hide/un-hide for synced, Edit for personal).
export interface EventDetails {
  kind: "synced" | "personal"
  id: string
  title: string
  /** #RRGGBB. */
  color: string
  /** #RRGGBB — the source-calendar group color (lossy domain drops it). */
  groupColor: string
  type: EventTypeEnum
  startsAt: Date
  endsAt: Date
  /** Server-stamped last-update time (the footer; lossy domain drops it). */
  exportedAt: Date
  location: string | undefined
  description: string | undefined
  teachers: string[]
  tags: EventDetailsTag[]
  canceled: boolean
  userCalendarId: string
}

const EVENT_TYPES = new Set<string>(Object.values(EventTypeEnumValues))

// Narrow the verbatim TEXT `type` to the EventTypeEnum union, falling back safely
// for an unknown/legacy value (importer fidelity — ADR 021: an unrecognized value
// must not throw the read; `class` is the generic catch-all the wire format uses).
function narrowType(raw: string): EventTypeEnum {
  return EVENT_TYPES.has(raw)
    ? (raw as EventTypeEnum)
    : EventTypeEnumValues.class
}

// Parse a stored row into the RICH EventDetails — TEXT ISO → Date (incl.
// exportedAt), null location/description → undefined, the JSON columns decoded
// DEFENSIVELY (corrupt/legacy → [] / null, never throw — the ADR-021/D2 total-read
// posture, reusing the same decoders the sync mapper uses). Pure: no db, no React,
// no t().
export function rowToEventDetails(row: CalendarEventRow): EventDetails {
  const fields: CalendarEventCustomFields | null = decodeFields(row.fields)
  return {
    kind: "synced",
    id: row.uid,
    title: row.title,
    color: row.color,
    groupColor: row.groupColor,
    type: narrowType(row.type),
    startsAt: new Date(row.startsAt),
    endsAt: new Date(row.endsAt),
    exportedAt: new Date(row.exportedAt),
    location: row.location ?? undefined,
    description: row.description ?? undefined,
    teachers: decodeJsonArray<string>(row.teachers),
    tags: decodeJsonArray<EventDetailsTag>(row.tags),
    // `=== true` (not `?? false`) so a corrupt/legacy non-boolean `canceled`
    // degrades to false (the D2 defensive posture applied at the field level),
    // mirroring rowToCalendarEvent.
    canceled: fields?.canceled === true,
    userCalendarId: row.userCalendarId,
  }
}

// Map a personal_events row → EventDetails (ADR 024 / decision 4). A personal
// event lacks the sync-only fields, so they take safe defaults: groupColor = the
// event color, the generic `class` type, no tags/teachers, never canceled, an
// EMPTY userCalendarId (the kind tag — not the empty string — is what the screen
// keys the header action on; the empty id keeps any incidental `userCalendarId`
// reader inert). Pure (no db/React/t()).
export function personalRowToEventDetails(row: PersonalEventRow): EventDetails {
  return {
    kind: "personal",
    id: row.uid,
    title: row.title,
    color: row.color,
    groupColor: row.color,
    type: EventTypeEnumValues.class,
    startsAt: new Date(row.startsAt),
    endsAt: new Date(row.endsAt),
    exportedAt: new Date(row.exportedAt),
    location: row.location ?? undefined,
    description: row.description ?? undefined,
    teachers: [],
    tags: [],
    canceled: false,
    userCalendarId: "",
  }
}

// The non-reactive read for the single event behind a uid — the only @/db import
// site for this read (B-1), reusing the already-re-exported `eq` (no new operator,
// R-2). Resolves EITHER kind: a synced calendar_events row, else a personal
// personal_events row. Returns the mapped rich event, or null when no row matches
// either table.
export async function getByUid(uid: string): Promise<EventDetails | null> {
  const syncedRows = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.uid, uid))
  const synced = syncedRows[0]
  if (synced !== undefined) return rowToEventDetails(synced)

  const personalRows = await db
    .select()
    .from(personalEvents)
    .where(eq(personalEvents.uid, uid))
  const personal = personalRows[0]
  return personal === undefined ? null : personalRowToEventDetails(personal)
}

export interface UseEventDetails {
  event: EventDetails | null
  loading: boolean
}

// Reactive read over the seam's useLiveQuery (mirroring useSyncedEvents): the
// screen re-renders if a sync's replaceAll drops/replaces the row while open, and
// resolves a not-found result (`event === null` after `loading` clears) distinctly
// from the loading state. A missing uid yields { event: null, loading: false }.
//
// UNIFIED — two live queries (synced + personal); the synced row wins when present
// (a uid is unique to one table). loading clears only once BOTH queries have
// resolved, so a personal event isn't briefly shown as not-found while the synced
// query is still pending.
export function useEventDetails(uid: string | undefined): UseEventDetails {
  const synced = useLiveQuery(
    db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.uid, uid ?? "")),
    [uid],
  )
  const personal = useLiveQuery(
    db
      .select()
      .from(personalEvents)
      .where(eq(personalEvents.uid, uid ?? "")),
    [uid],
  )
  return useMemo(() => {
    // useLiveQuery leaves updatedAt undefined until the first query resolves —
    // that is the loading window. A uid is loading until BOTH tables resolve. A
    // missing uid is resolved (not-found), never loading.
    const loading =
      uid !== undefined &&
      (synced.updatedAt === undefined || personal.updatedAt === undefined)
    const syncedRow = synced.data[0]
    if (syncedRow !== undefined) {
      return { event: rowToEventDetails(syncedRow), loading: false }
    }
    const personalRow = personal.data[0]
    return {
      event:
        personalRow === undefined
          ? null
          : personalRowToEventDetails(personalRow),
      loading,
    }
  }, [synced.data, synced.updatedAt, personal.data, personal.updatedAt, uid])
}
