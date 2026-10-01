import { recordError } from "@/firebase"

import {
  CALENDAR_EVENT_REJECTION_REASONS,
  type CalendarEventRejectionCounts,
  type CalendarEventRejectionReason,
} from "./event-decoder"

const CALENDAR_REJECTION_CODE = "calendar-row-rejected"
const CALENDAR_REJECTION_TAG = "calendar-local-read"

export function recordCalendarEventRejection(
  reason: CalendarEventRejectionReason,
  count: number,
): void {
  if (!Number.isSafeInteger(count) || count < 1) return
  recordError(
    new Error(`${CALENDAR_REJECTION_CODE}:${reason}:${count}`),
    CALENDAR_REJECTION_TAG,
  )
}

export interface CalendarRejectionReporter {
  report(revision: string, counts: CalendarEventRejectionCounts): void
  /** Number of remembered reports; never more than the reason count. */
  readonly size: number
}

/**
 * Reports each rejection reason once per read revision. Only the latest
 * revision is remembered: revisions only move forward, so older ones never
 * recur and keeping them would grow without bound while paging.
 */
export function createCalendarRejectionReporter(): CalendarRejectionReporter {
  let revision: string | undefined
  let reported = new Set<CalendarEventRejectionReason>()
  return {
    report(nextRevision, counts) {
      if (nextRevision !== revision) {
        revision = nextRevision
        reported = new Set()
      }
      for (const reason of CALENDAR_EVENT_REJECTION_REASONS) {
        const count = counts[reason]
        if (count === 0 || reported.has(reason)) continue
        reported.add(reason)
        recordCalendarEventRejection(reason, count)
      }
    },
    get size() {
      return reported.size
    },
  }
}
