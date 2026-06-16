import { useMemo } from "react"

import type {
  CalendarEventCustomFields,
  EventTag,
  EventTypeEnum,
} from "@/api/generated/timeCalendar.schemas"
import { EventTypeEnum as EventTypeEnumValues } from "@/api/generated/timeCalendar.schemas"
import { calendarEvents, db, eq, useLiveQuery } from "@/db"

import { decodeFields, decodeJsonArray } from "./sync/types"

// The RICH event-details read — the FIRST consumer of the verbatim calendar_events
// row (ADR 021 / D1: the verbatim fidelity lives in the ROW, never the lossy
// rendering domain). `rowToEventDetails` is the rich counterpart to the lossy
// `rowToCalendarEvent` (data/sync/types.ts): it keeps the fields the rendering
// projection deliberately drops — `groupColor`, the real `type` enum, `exportedAt`,
// and the FULL `tags: {name,color,icon}[]` (not name-only). The grid/agenda do not
// need those, so widening the rendering CalendarEvent would bloat every tile's data
// for this one consumer (D3 — rejected). This is a SEPARATE rich read.

type CalendarEventRow = typeof calendarEvents.$inferSelect

// The full tag shape (mirrors the generated EventTag) — the lossy domain projects
// tags to names only; the details surface needs color + icon too.
export type EventDetailsTag = EventTag

// The rich domain type the details screen consumes — Date timestamps, the full
// tags, and the rich fields the lossy CalendarEvent drops.
export interface EventDetails {
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
    canceled: fields?.canceled ?? false,
    userCalendarId: row.userCalendarId,
  }
}

// The non-reactive read for the single event behind a uid — the only @/db import
// site for this read (B-1), reusing the already-re-exported `eq` (no new operator,
// R-2). Returns the mapped rich event, or null when no row matches.
export async function getByUid(uid: string): Promise<EventDetails | null> {
  const rows = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.uid, uid))
  const row = rows[0]
  return row === undefined ? null : rowToEventDetails(row)
}

export interface UseEventDetails {
  event: EventDetails | null
  loading: boolean
}

// Reactive read over the seam's useLiveQuery (mirroring useSyncedEvents): the
// screen re-renders if a sync's replaceAll drops/replaces the row while open, and
// resolves a not-found result (`event === null` after `loading` clears) distinctly
// from the loading state. A missing uid yields { event: null, loading: false }.
export function useEventDetails(uid: string | undefined): UseEventDetails {
  const { data, updatedAt } = useLiveQuery(
    db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.uid, uid ?? "")),
    [uid],
  )
  return useMemo(() => {
    // useLiveQuery leaves updatedAt undefined until the first query resolves —
    // that is the loading window. Once it resolves, an empty `data` is a genuine
    // not-found. A missing uid is resolved (not-found), never loading.
    const loading = uid !== undefined && updatedAt === undefined
    const row = data[0]
    return {
      event: row === undefined ? null : rowToEventDetails(row),
      loading,
    }
  }, [data, updatedAt, uid])
}
