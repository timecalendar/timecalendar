import { BadRequestException } from "@nestjs/common"
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
        budgetController.abort(new Error("iCalendar fetch budget exceeded")),
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

    let lastError: unknown = new Error("iCalendar fetch budget exceeded")

    try {
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

          return parseIcal(rep.data)
        } catch (error: unknown) {
          lastError = error

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

          if (budgetController.signal.aborted) break
        }
      }
    } finally {
      clearTimeout(budgetTimer)
      context.signal?.removeEventListener("abort", abortFromParent)
    }

    throw new BadRequestException(
      `Failed to request the API: ${
        lastError instanceof Error ? lastError.message : lastError
      }`,
    )
  }
}
