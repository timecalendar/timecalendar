export const calendarFetchOutcomeKinds = [
  "authentication_required",
  "html_response",
  "empty_body",
  "empty_calendar",
  "invalid_content",
  "timeout",
  "dns",
  "tls",
  "http_5xx",
  "unknown",
] as const

export type CalendarFetchOutcomeKind =
  (typeof calendarFetchOutcomeKinds)[number]

/**
 * The only fetch failure that may cross the fetch boundary. It deliberately
 * carries no URL, response body, status code, or original exception.
 */
export class CalendarFetchError extends Error {
  constructor(readonly kind: CalendarFetchOutcomeKind) {
    super(`calendar_fetch_failed:${kind}`)
    this.name = "CalendarFetchError"
  }
}
