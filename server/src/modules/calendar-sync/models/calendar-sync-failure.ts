import {
  CalendarFetchClassification,
  CalendarFetchDisposition,
  dispositionOf,
} from "modules/fetch/models/calendar-fetch-failure"

export class CalendarSyncFailure extends Error {
  readonly disposition: CalendarFetchDisposition

  constructor(
    readonly classification: CalendarFetchClassification,
    readonly originalCause: unknown,
  ) {
    super(
      originalCause instanceof Error
        ? originalCause.message
        : "Calendar sync failed",
    )
    this.name = "CalendarSyncFailure"
    this.disposition = dispositionOf(classification)
  }
}
