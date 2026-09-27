const mockInstruments: Record<string, { add: jest.Mock; record: jest.Mock }> =
  {}

jest.mock("config/observability/meter", () => {
  const instrument = (name: string) =>
    (mockInstruments[name] ??= { add: jest.fn(), record: jest.fn() })
  return {
    __esModule: true,
    default: {
      createCounter: jest.fn((name: string) => instrument(name)),
      createHistogram: jest.fn((name: string) => instrument(name)),
      createUpDownCounter: jest.fn((name: string) => instrument(name)),
    },
  }
})

import { CalendarSyncMetricsService } from "./calendar-sync-metrics.service"

describe("CalendarSyncMetricsService", () => {
  it.each([
    ["success", "success"],
    ["service_unavailable", "transient_exhausted"],
    ["invalid_ical", "terminal"],
    ["cancelled", "cancelled"],
  ] as const)(
    "records one final %s fetch outcome",
    (classification, disposition) => {
      const service = new CalendarSyncMetricsService()
      const add = mockInstruments.calendar_sync_fetch_outcome_total.add
      add.mockClear()
      service.recordFetchOutcome(classification, disposition)
      expect(add).toHaveBeenCalledTimes(1)
      expect(add).toHaveBeenCalledWith(1, { classification, disposition })
    },
  )

  it("keeps fetch metric labels to the closed vocabulary", () => {
    const service = new CalendarSyncMetricsService()
    const attempt = mockInstruments.calendar_sync_upstream_attempt_total.add
    const outcome = mockInstruments.calendar_sync_fetch_outcome_total.add
    attempt.mockClear()
    outcome.mockClear()
    service.recordAttempt()
    service.recordFetchOutcome("rate_limited", "transient_exhausted")
    expect(attempt).toHaveBeenCalledWith(1)
    expect(outcome).toHaveBeenCalledWith(1, {
      classification: "rate_limited",
      disposition: "transient_exhausted",
    })
    expect(JSON.stringify([...attempt.mock.calls, ...outcome.mock.calls])).toBe(
      '[[1],[1,{"classification":"rate_limited","disposition":"transient_exhausted"}]]',
    )
  })
  it.each([
    "success",
    "partial_deadline",
    "client_cancelled",
    "error",
  ] as const)("records the bounded %s outcome", (outcome) => {
    const service = new CalendarSyncMetricsService()
    service.recordBatch(1_500, outcome, {
      selected: 7,
      started: 3,
      completed: 3,
    })

    expect(
      mockInstruments.calendar_sync_batch_outcome_total.add,
    ).toHaveBeenCalledWith(1, { outcome })
    expect(
      mockInstruments.calendar_sync_batch_duration_seconds.record,
    ).toHaveBeenCalledWith(1.5, { outcome })
  })

  it("uses only fixed phase, state, and outcome label values", async () => {
    const service = new CalendarSyncMetricsService()
    await service.measurePhase("candidate_selection", async () => undefined)
    service.recordBatch(10, "success", {
      selected: 2,
      started: 2,
      completed: 2,
    })

    const attributes = Object.values(mockInstruments).flatMap((instrument) => [
      ...instrument.add.mock.calls.map((call) => call[1]),
      ...instrument.record.mock.calls.map((call) => call[1]),
    ])
    expect(attributes).not.toContainEqual(
      expect.objectContaining({ token: expect.anything() }),
    )
    expect(attributes).not.toContainEqual(
      expect.objectContaining({ url: expect.anything() }),
    )
    expect(attributes).toEqual(
      expect.arrayContaining([
        { phase: "candidate_selection" },
        { outcome: "success" },
        { state: "selected" },
        { state: "started" },
        { state: "completed" },
      ]),
    )
  })
})
