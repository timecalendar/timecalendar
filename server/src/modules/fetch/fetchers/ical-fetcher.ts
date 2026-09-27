import axios, { AxiosError, AxiosRequestConfig } from "axios"
import { Fetcher } from "modules/fetch/fetchers/fetcher"
import { CalendarCustomData } from "modules/fetch/models/calendar-source"
import { FetcherCalendarEvent } from "modules/fetch/models/event.model"
import { parseIcal } from "modules/fetch/parsers/parse-ical"
import { CustomError } from "modules/shared/errors/custom-error"
import { HttpsProxyAgent } from "https-proxy-agent"
import { PROXY_URL } from "config/constants"
import {
  ICAL_ATTEMPT_TIMEOUT_MS,
  ICAL_FETCH_BUDGET_MS,
  ICAL_RETRY_ATTEMPTS,
} from "modules/calendar-sync/calendar-sync.constants"
import { FetchContext } from "modules/fetch/models/fetch-context"
import {
  CalendarFetchClassification,
  CalendarFetchFailure,
  CalendarFetchOutcome,
  CalendarFetchFinalDisposition,
  classifyCalendarFailure,
  dispositionOf,
  NoCalendarEventsError,
  retryAfterDelayMs,
} from "modules/fetch/models/calendar-fetch-failure"

const waitForRetry = (delayMs: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason)
    const onAbort = () => {
      clearTimeout(timer)
      reject(signal.reason)
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort)
      resolve()
    }, delayMs)
    signal.addEventListener("abort", onAbort, { once: true })
  })

type IcalFetcherOptions = {
  withRetries?: boolean
  useProxy?: boolean
}

const defaultOptions: IcalFetcherOptions = {
  withRetries: false,
  useProxy: false,
}

export class IcalFetcher implements Fetcher {
  constructor(private readonly options: IcalFetcherOptions = defaultOptions) {}

  async fetch(
    url: string,
    data?: CalendarCustomData,
    context: FetchContext = {},
  ): Promise<FetcherCalendarEvent[]> {
    // Some badly configured ADE instances do not return the ICal file
    // every time. Therefore, the request must be repeated several times
    // until the ICal file is obtained.
    const attempts = this.options.withRetries ? ICAL_RETRY_ATTEMPTS : 1
    const budgetEndsAt = Date.now() + ICAL_FETCH_BUDGET_MS
    const budgetController = new AbortController()
    const abortFromParent = () => budgetController.abort(context.signal?.reason)
    context.signal?.addEventListener("abort", abortFromParent, { once: true })
    const budgetTimer = setTimeout(
      () =>
        budgetController.abort(
          Object.assign(new Error("iCalendar fetch budget exceeded"), {
            code: "ETIMEDOUT",
          }),
        ),
      ICAL_FETCH_BUDGET_MS,
    )

    const axiosConfig: AxiosRequestConfig = {
      method: "get",
      url,
      maxRedirects: 99,
      signal: budgetController.signal,
    }

    if (this.options.useProxy && PROXY_URL.length > 0) {
      const httpsAgent = new HttpsProxyAgent(PROXY_URL)
      axiosConfig.httpsAgent = httpsAgent
    }

    if (data?.auth) {
      axiosConfig.auth = data.auth
    }

    let outcome: CalendarFetchOutcome = "cancelled"
    let finalDisposition: CalendarFetchFinalDisposition = "cancelled"
    let lastFailure: CalendarFetchFailure | undefined

    try {
      const initialClassification = classifyCalendarFailure({ url })
      if (initialClassification === "invalid_url") {
        throw new CalendarFetchFailure(
          initialClassification,
          new Error(initialClassification),
        )
      }

      for (let attempt = 0; attempt < attempts; attempt++) {
        if (context.signal?.aborted) {
          throw context.signal.reason
        }
        const remainingBudget = budgetEndsAt - Date.now()
        if (remainingBudget <= 0 || budgetController.signal.aborted) break
        context.onAttempt?.()

        try {
          const rep = await axios.request({
            ...axiosConfig,
            timeout: Math.min(ICAL_ATTEMPT_TIMEOUT_MS, remainingBudget),
          })

          let events: FetcherCalendarEvent[]
          try {
            events = parseIcal(rep.data)
          } catch (error) {
            throw new CalendarFetchFailure(
              classifyCalendarFailure({
                error,
                parserResult:
                  error instanceof NoCalendarEventsError
                    ? "no_events"
                    : "invalid_ical",
                url,
              }),
              error,
            )
          }
          if (events.length === 0)
            throw new CalendarFetchFailure(
              "no_events",
              new Error("No events found"),
            )
          outcome = "success"
          finalDisposition = "success"
          return events
        } catch (error: unknown) {
          if (context.signal?.aborted) {
            throw context.signal.reason
          }

          if (
            error instanceof AxiosError &&
            error.response?.status === 401 &&
            error.response.headers["www-authenticate"]
          ) {
            throw new CustomError(
              "Basic Authorization required",
              data?.auth ? { basicAuth: "failed" } : { auth: "basic" },
            )
          }

          const classification: CalendarFetchClassification =
            error instanceof CalendarFetchFailure
              ? error.classification
              : budgetController.signal.aborted
              ? "timeout"
              : classifyCalendarFailure({ error, url })
          lastFailure =
            error instanceof CalendarFetchFailure
              ? error
              : new CalendarFetchFailure(classification, error)
          if (
            dispositionOf(classification) === "terminal" ||
            budgetController.signal.aborted ||
            attempt + 1 >= attempts
          )
            break

          if (classification === "rate_limited") {
            const headers =
              error instanceof AxiosError ? error.response?.headers : undefined
            const delayMs = retryAfterDelayMs(
              headers?.["retry-after"],
              Date.now(),
            )
            if (delayMs >= budgetEndsAt - Date.now()) break
            if (delayMs > 0)
              await waitForRetry(delayMs, budgetController.signal)
          }
        }
      }
      throw (
        lastFailure ??
        new CalendarFetchFailure(
          "timeout",
          new Error("iCalendar fetch budget exceeded"),
        )
      )
    } catch (error) {
      if (context.signal?.aborted) {
        outcome = "cancelled"
        finalDisposition = "cancelled"
        throw context.signal.reason
      }
      const classification =
        error instanceof CalendarFetchFailure
          ? error.classification
          : budgetController.signal.aborted
          ? "timeout"
          : classifyCalendarFailure({ error, url })
      outcome = classification
      finalDisposition =
        dispositionOf(classification) === "transient"
          ? "transient_exhausted"
          : "terminal"
      throw error
    } finally {
      clearTimeout(budgetTimer)
      context.signal?.removeEventListener("abort", abortFromParent)
      context.onFinal?.(outcome, finalDisposition)
    }
  }
}
