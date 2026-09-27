import { BadRequestException } from "@nestjs/common"
import { AxiosError } from "axios"
import { CustomError } from "modules/shared/errors/custom-error"

export type CalendarFetchClassification =
  | "timeout"
  | "connection_reset"
  | "rate_limited"
  | "bad_gateway"
  | "service_unavailable"
  | "gateway_timeout"
  | "ui_link"
  | "invalid_url"
  | "no_events"
  | "invalid_ical"
  | "authentication"
  | "tls"
  | "dns_permanent"
  | "http_client"
  | "unknown"

export type CalendarFetchDisposition = "transient" | "terminal"
export type CalendarFetchOutcome =
  | CalendarFetchClassification
  | "success"
  | "cancelled"
export type CalendarFetchFinalDisposition =
  | "success"
  | "transient_exhausted"
  | "terminal"
  | "cancelled"

const transient = new Set<CalendarFetchClassification>([
  "timeout",
  "connection_reset",
  "rate_limited",
  "bad_gateway",
  "service_unavailable",
  "gateway_timeout",
])

export const dispositionOf = (
  classification: CalendarFetchClassification,
): CalendarFetchDisposition =>
  transient.has(classification) ? "transient" : "terminal"

export const finalDispositionOf = (
  classification: CalendarFetchClassification,
): CalendarFetchFinalDisposition =>
  dispositionOf(classification) === "transient"
    ? "transient_exhausted"
    : "terminal"

export class NoCalendarEventsError extends BadRequestException {
  constructor() {
    super("No events found")
  }
}

export class CalendarFetchFailure extends BadRequestException {
  readonly disposition: CalendarFetchDisposition

  constructor(
    readonly classification: CalendarFetchClassification,
    readonly originalCause: unknown,
  ) {
    super(
      `Failed to request the API: ${
        originalCause instanceof Error ? originalCause.message : originalCause
      }`,
    )
    this.disposition = dispositionOf(classification)
  }
}

const tlsCodes = new Set([
  "CERT_HAS_EXPIRED",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "ERR_TLS_CERT_ALTNAME_INVALID",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
])
const dnsCodes = new Set(["ENOTFOUND", "EAI_NONAME"])

export type CalendarFailureInput = {
  error?: unknown
  url?: string
  parserResult?: "no_events" | "invalid_ical"
}

export const classifyCalendarFailure = ({
  error,
  url,
  parserResult,
}: CalendarFailureInput): CalendarFetchClassification => {
  if (url !== undefined) {
    try {
      const parsed = new URL(url)
      if (!(["http:", "https:"].includes(parsed.protocol) && parsed.hostname))
        return "invalid_url"
      if (
        /\/jsp\/custom\/modules\/plannings\/(?!anonymous_cal\.jsp$|direct_cal\.jsp$)[^/]+\.jsp$/i.test(
          parsed.pathname,
        ) ||
        /\/standard\/direct_planning\.jsp$/i.test(parsed.pathname)
      )
        return "ui_link"
    } catch {
      return "invalid_url"
    }
  }
  if (parserResult) return parserResult
  if (error instanceof NoCalendarEventsError) return "no_events"
  if (
    error instanceof CustomError &&
    (error.payload?.auth || error.payload?.basicAuth)
  )
    return "authentication"

  const response = error instanceof AxiosError ? error.response : undefined
  switch (response?.status) {
    case 401:
    case 403:
      return "authentication"
    case 429:
      return "rate_limited"
    case 502:
      return "bad_gateway"
    case 503:
      return "service_unavailable"
    case 504:
      return "gateway_timeout"
  }
  if (response?.status && response.status >= 400 && response.status < 500)
    return "http_client"
  if (response) return "unknown"

  const code =
    error instanceof AxiosError
      ? error.code
      : (error as NodeJS.ErrnoException)?.code
  if (code === "ECONNABORTED" || code === "ETIMEDOUT") return "timeout"
  if (code === "ECONNRESET") return "connection_reset"
  if (code && tlsCodes.has(code)) return "tls"
  if (code && dnsCodes.has(code)) return "dns_permanent"
  if (code === "ERR_INVALID_URL") return "invalid_url"
  return "unknown"
}

export const retryAfterDelayMs = (header: unknown, now: number): number => {
  if (typeof header !== "string") return 0
  const value = header.trim()
  if (/^\d+(?:\.\d+)?$/.test(value)) {
    const delay = Number(value) * 1000
    return Number.isFinite(delay) ? delay : 0
  }
  const date = Date.parse(value)
  return Number.isFinite(date) ? Math.max(0, date - now) : 0
}
