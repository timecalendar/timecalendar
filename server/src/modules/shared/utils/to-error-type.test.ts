import {
  BadRequestException,
  UnprocessableEntityException,
} from "@nestjs/common"
import { AxiosError } from "axios"
import { CustomError } from "modules/shared/errors/custom-error"
import { toErrorType } from "modules/shared/utils/to-error-type"

describe("toErrorType", () => {
  it("returns the name of the errors fetchEvents surfaces", () => {
    // "No events found" -> wrapped by calendar-sync's fetchEvents
    expect(
      toErrorType(new UnprocessableEntityException("No events found")),
    ).toBe("UnprocessableEntityException")
    // "Failed to request the API" -> the ical fetcher's terminal throw
    expect(
      toErrorType(new BadRequestException("Failed to request the API")),
    ).toBe("BadRequestException")
    // Basic-auth path
    expect(toErrorType(new CustomError("Basic Authorization required"))).toBe(
      "CustomError",
    )
    // Raw axios failures (when surfaced before wrapping)
    expect(toErrorType(new AxiosError("timeout"))).toBe("AxiosError")
  })

  it("falls back to the constructor name when name is absent", () => {
    const nameless = { message: "boom" }
    expect(toErrorType(nameless)).toBe("Object")
  })

  it("returns 'unknown' for non-object errors", () => {
    expect(toErrorType("boom")).toBe("unknown")
    expect(toErrorType(null)).toBe("unknown")
    expect(toErrorType(undefined)).toBe("unknown")
    expect(toErrorType(42)).toBe("unknown")
  })
})
