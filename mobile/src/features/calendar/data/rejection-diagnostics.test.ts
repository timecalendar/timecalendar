import { recordError } from "@/firebase"

import { CALENDAR_EVENT_REJECTION_REASONS } from "./event-decoder"
import {
  createCalendarRejectionReporter,
  recordCalendarEventRejection,
} from "./rejection-diagnostics"

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

describe("Calendar rejection reporter", () => {
  const counts = {
    "invalid-identity": 1,
    "invalid-start": 0,
    "invalid-end": 2,
    "reversed-range": 0,
    "invalid-date-range": 0,
  }

  beforeEach(() => mockRecordError.mockClear())

  it("reports each non-zero reason once per revision", () => {
    const reporter = createCalendarRejectionReporter()
    reporter.report("r1", counts)
    reporter.report("r1", counts)
    expect(mockRecordError.mock.calls.map(([error]) => error.message)).toEqual([
      "calendar-row-rejected:invalid-identity:1",
      "calendar-row-rejected:invalid-end:2",
    ])
    reporter.report("r2", counts)
    expect(mockRecordError).toHaveBeenCalledTimes(4)
  })

  it("stays bounded across 500 revisions", () => {
    const reporter = createCalendarRejectionReporter()
    for (let revision = 0; revision < 500; revision += 1) {
      reporter.report(`r${revision}`, counts)
      expect(reporter.size).toBeLessThanOrEqual(
        CALENDAR_EVENT_REJECTION_REASONS.length,
      )
    }
    expect(reporter.size).toBe(2)
    expect(mockRecordError).toHaveBeenCalledTimes(1_000)
  })
})
