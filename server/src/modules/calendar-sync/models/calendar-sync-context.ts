export type CalendarSyncCancellationKind = "deadline" | "client_cancelled"

export class CalendarSyncAbortError extends Error {
  readonly name = "AbortError"

  constructor(readonly kind: CalendarSyncCancellationKind) {
    super(`Calendar sync cancelled: ${kind}`)
  }
}

export type CalendarSyncContext = {
  signal?: AbortSignal
  onAttempt?: () => void
}

export const throwIfCalendarSyncAborted = (signal?: AbortSignal) => {
  if (!signal?.aborted) return
  throw signal.reason instanceof Error
    ? signal.reason
    : new CalendarSyncAbortError("client_cancelled")
}

export const isCalendarSyncAbort = (error: unknown, signal?: AbortSignal) =>
  signal?.aborted === true ||
  error instanceof CalendarSyncAbortError ||
  (error instanceof Error && error.name === "AbortError")
