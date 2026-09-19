import { getTimezoneOffset } from "date-fns-tz"

import { dayKey } from "./day-key"
import type { CalendarEvent, TimedCalendarEventV1 } from "./types"

export type TimedEventSupport =
  | { supported: true; event: TimedCalendarEventV1 }
  | {
      supported: false
      reason: "date-only" | "instant" | "spanning" | "offset-transition"
    }

export function classifyTimedEventSupport(
  event: CalendarEvent,
  displayZone: string,
): TimedEventSupport {
  if (event.kind === "date-only")
    return { supported: false, reason: "date-only" }
  if (event.endsAt.getTime() <= event.startsAt.getTime())
    return { supported: false, reason: "instant" }

  let startKey: string
  let exclusiveEndKey: string
  let startOffset: number
  let endOffset: number
  try {
    startKey = dayKey(event.startsAt, displayZone)
    exclusiveEndKey = dayKey(new Date(event.endsAt.getTime() - 1), displayZone)
    startOffset = getTimezoneOffset(displayZone, event.startsAt)
    endOffset = getTimezoneOffset(
      displayZone,
      new Date(event.endsAt.getTime() - 1),
    )
  } catch {
    return { supported: false, reason: "spanning" }
  }

  if (startKey !== exclusiveEndKey)
    return { supported: false, reason: "spanning" }
  if (startOffset !== endOffset)
    return { supported: false, reason: "offset-transition" }
  return { supported: true, event }
}
