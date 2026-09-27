export type FetchContext = {
  signal?: AbortSignal
  onAttempt?: () => void
  onFinal?: (
    classification: import("./calendar-fetch-failure").CalendarFetchOutcome,
    disposition: import("./calendar-fetch-failure").CalendarFetchFinalDisposition,
  ) => void
}
