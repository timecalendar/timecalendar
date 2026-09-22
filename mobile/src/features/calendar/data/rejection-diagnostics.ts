import { recordError } from "@/firebase"

import type { CalendarEventRejectionReason } from "./event-decoder"

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
