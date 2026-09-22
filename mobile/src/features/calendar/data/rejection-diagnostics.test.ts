import { recordError } from "@/firebase"

import { recordCalendarEventRejection } from "./rejection-diagnostics"

jest.mock("@/firebase", () => ({ recordError: jest.fn() }))

const mockRecordError = recordError as jest.Mock

describe("Calendar rejection diagnostics", () => {
  beforeEach(() => mockRecordError.mockClear())

  it("serializes only the static code, allowlisted reason, count, and tag", () => {
    recordCalendarEventRejection("invalid-start", 2)

    expect(mockRecordError).toHaveBeenCalledTimes(1)
    expect(mockRecordError.mock.calls[0]?.[0]).toEqual(
      new Error("calendar-row-rejected:invalid-start:2"),
    )
    expect(mockRecordError.mock.calls[0]?.[1]).toBe("calendar-local-read")
  })

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "does not transport a non-positive integer count (%s)",
    (count) => {
      recordCalendarEventRejection("invalid-end", count)
      expect(mockRecordError).not.toHaveBeenCalled()
    },
  )
})
