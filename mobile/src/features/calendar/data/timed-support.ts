import { getTimezoneOffset } from "date-fns-tz"

import { dayKey } from "./day-key"
import type { CalendarEvent, TimedCalendarEventV1 } from "./types"

export type TimedEventSupport =
  | {
      supported: true
      event: TimedCalendarEventV1
      shape: "point" | "interval"
    }
  | {
      supported: false
      reason: "date-only" | "spanning" | "offset-transition"
    }

export function classifyTimedEventSupport(
  event: CalendarEvent,
  displayZone: string,
): TimedEventSupport {
  if (event.kind === "date-only")
    return { supported: false, reason: "date-only" }
  const shape =
    event.endsAt.getTime() === event.startsAt.getTime() ? "point" : "interval"

  let startKey: string
  let exclusiveEndKey: string
  let startOffset: number
  let endOffset: number
  try {
    const exclusiveEnd =
      shape === "point" ? event.endsAt : new Date(event.endsAt.getTime() - 1)
    startKey = dayKey(event.startsAt, displayZone)
    exclusiveEndKey = dayKey(exclusiveEnd, displayZone)
    startOffset = getTimezoneOffset(displayZone, event.startsAt)
    endOffset = getTimezoneOffset(displayZone, exclusiveEnd)
  } catch {
    return { supported: false, reason: "spanning" }
  }

  if (startKey !== exclusiveEndKey)
    return { supported: false, reason: "spanning" }
  if (startOffset !== endOffset)
    return { supported: false, reason: "offset-transition" }
  return { supported: true, event, shape }
}
