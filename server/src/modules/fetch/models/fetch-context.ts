import {
  CalendarFetchFinalDisposition,
  CalendarFetchOutcome,
} from "./calendar-fetch-failure"

export type FetchContext = {
  signal?: AbortSignal
  onAttempt?: () => void
  onFinal?: (
    classification: CalendarFetchOutcome,
    disposition: CalendarFetchFinalDisposition,
  ) => void
}
