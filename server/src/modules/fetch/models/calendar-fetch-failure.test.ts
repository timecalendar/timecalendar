import { AxiosError } from "axios"
import { CustomError } from "modules/shared/errors/custom-error"
import {
  classifyCalendarFailure,
  NoCalendarEventsError,
  retryAfterDelayMs,
} from "./calendar-fetch-failure"

const httpError = (status: number) =>
  new AxiosError("provider text", "ERR_BAD_RESPONSE", undefined, undefined, {
    status,
    statusText: "provider text",
    headers: {},
    config: { headers: {} as never },
    data: "provider content",
  })

describe("calendar fetch failure classifier", () => {
  it.each([
    ["timeout", { error: Object.assign(new Error(), { code: "ETIMEDOUT" }) }],
    [
      "connection_reset",
      { error: Object.assign(new Error(), { code: "ECONNRESET" }) },
    ],
    ["rate_limited", { error: httpError(429) }],
    ["bad_gateway", { error: httpError(502) }],
    ["service_unavailable", { error: httpError(503) }],
    ["gateway_timeout", { error: httpError(504) }],
    [
      "ui_link",
      {
        url: "https://example.test/jsp/custom/modules/plannings/index.jsp",
        error: httpError(500),
      },
    ],
    ["invalid_url", { url: "not a URL" }],
    ["no_events", { error: new NoCalendarEventsError() }],
    ["invalid_ical", { parserResult: "invalid_ical" }],
    ["authentication", { error: httpError(401) }],
    ["authentication", { error: httpError(403) }],
    [
      "authentication",
      { error: new CustomError("anything", { auth: "basic" }) },
    ],
    [
      "tls",
      { error: Object.assign(new Error(), { code: "CERT_HAS_EXPIRED" }) },
    ],
    [
      "dns_permanent",
      { error: Object.assign(new Error(), { code: "ENOTFOUND" }) },
    ],
    ["http_client", { error: httpError(404) }],
    ["unknown", { error: httpError(500) }],
    ["unknown", { error: new Error("arbitrary message") }],
  ] as const)("classifies %s from structured input", (expected, input) => {
    expect(classifyCalendarFailure(input)).toBe(expected)
  })

  it.each([
    ["2", 2_000],
    ["Sun, 27 Sep 2026 12:00:02 GMT", 2_000],
    ["Sun, 27 Sep 2026 11:59:58 GMT", 0],
    ["nonsense", 0],
    ["-2", 0],
    [undefined, 0],
  ])("parses Retry-After %s", (header, expected) => {
    expect(retryAfterDelayMs(header, Date.parse("2026-09-27T12:00:00Z"))).toBe(
      expected,
    )
  })
})
