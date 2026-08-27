import { Span, trace } from "@opentelemetry/api"

export const withCalendarSyncSpan = async <T>(
  name: string,
  work: (span: Span) => Promise<T>,
) =>
  trace
    .getTracer("timecalendar.calendar-sync")
    .startActiveSpan(name, async (span) => {
      try {
        return await work(span)
      } finally {
        span.end()
      }
    })
