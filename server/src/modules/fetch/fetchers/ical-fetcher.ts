import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios"
import { Fetcher } from "modules/fetch/fetchers/fetcher"
import { FetcherCalendarEvent } from "modules/fetch/models/event.model"
import { parseIcal } from "modules/fetch/parsers/parse-ical"
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
  finalDispositionOf,
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

export type EgressRelay = {
  host: string
  path: string
  origin: string
  clientId: string
  clientSecret: string
}

type IcalFetcherOptions = {
  withRetries?: boolean
  relay?: EgressRelay
}

const parseUrl = (value: string) => {
  try {
    return new URL(value)
  } catch {
    return undefined
  }
}

// Checked on the raw value: URL parsing would accept user info, a query or a
// fragment and normalize paths like "/." to "/", and the relay must only get
// the token when its origin is exactly what was configured.
const RELAY_ORIGIN = /^https:\/\/[a-z0-9.-]+(:\d+)?\/?$/i

const relayOrigin = (relay?: EgressRelay) => {
  if (!relay?.clientId || !relay.clientSecret) return undefined
  return RELAY_ORIGIN.test(relay.origin) ? parseUrl(relay.origin) : undefined
}

// The relay sits behind Cloudflare Access, which answers a missing or wrong
// service token with a redirect to its login page; following it would turn an
// auth failure into an "invalid ical" HTML page, so redirects stay off.
const relayRequest = (
  url: string,
  relay: EgressRelay,
  origin: URL,
): Partial<AxiosRequestConfig> | undefined => {
  const target = parseUrl(url)
  if (target?.host !== relay.host || target.pathname !== relay.path)
    return undefined
  const relayed = new URL(origin)
  relayed.pathname = target.pathname
  relayed.search = target.search
  return {
    url: relayed.toString(),
    maxRedirects: 0,
    headers: {
      "CF-Access-Client-Id": relay.clientId,
      "CF-Access-Client-Secret": relay.clientSecret,
    },
  }
}

const isAccessLoginRedirect = (response?: AxiosResponse) =>
  !!response &&
  response.status >= 300 &&
  response.status < 400 &&
  /\/cdn-cgi\/access\/login/.test(String(response.headers?.location ?? ""))

const pickHeaders = (headers: AxiosResponse["headers"], names: string[]) =>
  Object.fromEntries(
    names.flatMap((name) =>
      headers?.[name] === undefined ? [] : [[name, headers[name]]],
    ),
  )

// Rebuilds a relayed request's failure without its request config and with
// only the response headers classification reads, so neither the service
// token nor an Access session cookie can reach logs or serialized errors.
const redactRelayFailure = (error: unknown): unknown => {
  if (!(error instanceof AxiosError)) return error
  const response = error.response && {
    status: error.response.status,
    statusText: error.response.statusText,
    headers: pickHeaders(error.response.headers, ["location", "retry-after"]),
    data: error.response.data,
    config: { headers: new AxiosHeaders() },
  }
  const redacted = new AxiosError(
    error.message,
    error.code,
    undefined,
    undefined,
    response as AxiosResponse | undefined,
  )
  if (isAccessLoginRedirect(redacted.response))
    return new CalendarFetchFailure("authentication", redacted)
  return redacted
}

const defaultOptions: IcalFetcherOptions = {
  withRetries: false,
}

export class IcalFetcher implements Fetcher {
  constructor(private readonly options: IcalFetcherOptions = defaultOptions) {}

  async fetch(
    url: string,
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

    const origin = relayOrigin(this.options.relay)
    const relayed =
      origin && this.options.relay
        ? relayRequest(url, this.options.relay, origin)
        : undefined
    if (relayed) Object.assign(axiosConfig, relayed)

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
        } catch (caught: unknown) {
          const error = relayed ? redactRelayFailure(caught) : caught
          if (context.signal?.aborted) {
            throw context.signal.reason
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
      finalDisposition = finalDispositionOf(classification)
      throw error
    } finally {
      clearTimeout(budgetTimer)
      context.signal?.removeEventListener("abort", abortFromParent)
      context.onFinal?.(outcome, finalDisposition)
    }
  }
}
