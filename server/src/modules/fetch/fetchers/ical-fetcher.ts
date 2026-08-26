import axios, { AxiosError, AxiosRequestConfig } from "axios"
import { Fetcher } from "modules/fetch/fetchers/fetcher"
import {
  CalendarFetchError,
  CalendarFetchOutcomeKind,
} from "modules/fetch/models/calendar-fetch-outcome"
import { CalendarCustomData } from "modules/fetch/models/calendar-source"
import { FetcherCalendarEvent } from "modules/fetch/models/event.model"
import { parseIcal } from "modules/fetch/parsers/parse-ical"
import { HttpsProxyAgent } from "https-proxy-agent"
import { PROXY_URL } from "config/constants"

type IcalFetcherOptions = {
  withRetries?: boolean
  useProxy?: boolean
}

const defaultOptions: IcalFetcherOptions = {
  withRetries: false,
  useProxy: false,
}

const classifyAxiosError = (error: AxiosError): CalendarFetchOutcomeKind => {
  const status = error.response?.status
  if (status === 401 || status === 403) return "authentication_required"
  if (status !== undefined && status >= 500) return "http_5xx"

  const code = error.code?.toUpperCase()
  if (code === "ECONNABORTED" || code === "ETIMEDOUT") return "timeout"
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") return "dns"
  if (
    code?.includes("CERT") ||
    code?.includes("TLS") ||
    code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
  ) {
    return "tls"
  }
  return "unknown"
}

const parseResponse = (
  data: unknown,
  contentType: unknown,
): FetcherCalendarEvent[] => {
  if (typeof data !== "string") throw new CalendarFetchError("invalid_content")
  if (data.length === 0) throw new CalendarFetchError("empty_body")

  const looksLikeHtml =
    (typeof contentType === "string" && contentType.includes("text/html")) ||
    /^\s*(?:<!doctype\s+html|<html\b)/i.test(data)
  if (looksLikeHtml) throw new CalendarFetchError("html_response")

  try {
    return parseIcal(data)
  } catch {
    throw new CalendarFetchError(
      /BEGIN:VCALENDAR/i.test(data) ? "empty_calendar" : "invalid_content",
    )
  }
}

export class IcalFetcher implements Fetcher {
  constructor(private readonly options: IcalFetcherOptions = defaultOptions) {}

  async fetch(
    url: string,
    data?: CalendarCustomData,
  ): Promise<FetcherCalendarEvent[]> {
    // Some badly configured ADE instances do not return the ICal file
    // every time. Therefore, the request must be repeated several times
    // until the ICal file is obtained.
    const nbRetries = this.options.withRetries ? 15 : 1

    const axiosConfig: AxiosRequestConfig = {
      method: "get",
      url,
      maxRedirects: 99,
      timeout: 10000,
    }

    if (this.options.useProxy && PROXY_URL.length > 0) {
      const httpsAgent = new HttpsProxyAgent(PROXY_URL)
      axiosConfig.httpsAgent = httpsAgent
    }

    if (data?.auth) {
      axiosConfig.auth = data.auth
    }

    let lastOutcome: CalendarFetchOutcomeKind = "unknown"

    for (let i = 0; i < nbRetries; i++) {
      try {
        const rep = await axios.request<unknown>(axiosConfig)
        return parseResponse(rep.data, rep.headers["content-type"])
      } catch (error: unknown) {
        lastOutcome =
          error instanceof CalendarFetchError
            ? error.kind
            : error instanceof AxiosError
            ? classifyAxiosError(error)
            : "unknown"

        // Authentication and returned page/content failures cannot recover by
        // repeating the same request. Preserve the existing transient retry
        // count for network and provider failures only.
        if (
          lastOutcome === "authentication_required" ||
          lastOutcome === "html_response" ||
          lastOutcome === "empty_body" ||
          lastOutcome === "empty_calendar" ||
          lastOutcome === "invalid_content"
        ) {
          break
        }
      }
    }

    throw new CalendarFetchError(lastOutcome)
  }
}
