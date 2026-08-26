import { ApiError } from "@/api/mutator"

import {
  CalendarImportRecoveryError,
  isCalendarImportErrorBody,
  mapCalendarImportError,
} from "./recovery"

describe("calendar import recovery mapping", () => {
  it.each([
    ["unsupported_link", "tours_export", false],
    ["upstream_unavailable", "bordeaux_inp_outage", true],
    ["invalid_calendar", "generic_invalid_calendar", false],
    ["unknown", "generic_unknown", false],
  ] as const)(
    "maps the closed %s response",
    (classification, helpKey, retryable) => {
      expect(
        mapCalendarImportError(
          new ApiError(422, {
            code: "calendar_import_failed",
            classification,
            helpKey,
            retryable,
          }),
        ),
      ).toEqual({ classification, helpKey, retryable })
    },
  )

  it.each([
    null,
    "legacy body",
    {},
    { code: "calendar_import_failed" },
    {
      code: "calendar_import_failed",
      classification: "unsupported_link",
      helpKey: "tours_export",
      retryable: false,
      rawUrl: "https://sentinel.example/resource-123",
    },
  ])(
    "maps malformed API body %# to a non-retryable generic recovery",
    (body) => {
      expect(mapCalendarImportError(new ApiError(422, body))).toEqual({
        classification: "unknown",
        helpKey: "generic_unknown",
        retryable: false,
      })
    },
  )

  it("maps network/resolve/persistence failures to retryable generic recovery", () => {
    expect(mapCalendarImportError(new Error("raw sentinel"))).toEqual({
      classification: "unknown",
      helpKey: "generic_unknown",
      retryable: true,
    })
  })

  it("constructs an error containing only bounded keys", () => {
    const error = new CalendarImportRecoveryError({
      classification: "unsupported_link",
      helpKey: "tours_export",
      retryable: false,
    })
    expect(error.message).toBe(
      "calendar_import_failed:unsupported_link:tours_export",
    )
    expect(isCalendarImportErrorBody(error)).toBe(false)
  })
})
