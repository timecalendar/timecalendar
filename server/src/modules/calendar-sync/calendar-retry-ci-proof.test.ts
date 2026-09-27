import axios, { AxiosError } from "axios"
import { UnrecoverableError } from "bullmq"
import { FetchService } from "modules/fetch/services/fetch.service"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"
import { IcalFetcher } from "modules/fetch/fetchers/ical-fetcher"
import { SyncCalendarJob } from "./jobs/sync-calendar.job"
import { CalendarSyncService } from "./services/calendar-sync.service"
import { CalendarSyncFailure } from "./models/calendar-sync-failure"

const httpError = (status: number, retryAfter?: string) =>
  new AxiosError("provider detail", "ERR_BAD_RESPONSE", undefined, undefined, {
    status,
    statusText: "provider detail",
    headers: retryAfter ? { "retry-after": retryAfter } : {},
    config: { headers: {} as never },
    data: "provider content",
  })

const calendar = {
  id: "calendar-one",
  url: "https://example.test/feed.ics",
  customData: null,
  school: { id: "school-one" },
  syncPlannedAt: new Date("2000-01-01T00:00:00Z"),
}

const build = () => {
  const repository = {
    findOneOrNull: jest.fn(async () => calendar),
    claimSyncIfDue: jest.fn(async () => true),
    save: jest.fn(async () => calendar),
    recordSyncAttempt: jest.fn(async () => undefined),
    findOne: jest.fn(async () => calendar),
  }
  const metrics = {
    upstreamStarted: jest.fn(),
    upstreamCompleted: jest.fn(),
    recordAttempt: jest.fn(),
    recordFetchOutcome: jest.fn(),
    add: jest.fn(),
    measurePhase: jest.fn(
      async (_phase: string, work: () => Promise<unknown>) => work(),
    ),
  }
  const fetchService = new FetchService([
    new SchoolStrategy({
      school: "test",
      fetcher: new IcalFetcher({ withRetries: true }),
    }),
  ])
  const sync = new CalendarSyncService(
    fetchService,
    { findOneOrFail: jest.fn(async () => ({ code: "test" })) } as never,
    repository as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    metrics as never,
    {} as never,
  )
  const job = new SyncCalendarJob(repository as never, sync)
  return { job, metrics, repository }
}

describe("calendar retry CI proof", () => {
  afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  it("executes a terminal calendar job once with one upstream attempt", async () => {
    const request = jest
      .spyOn(axios, "request")
      .mockRejectedValue(httpError(404))
    const { job, metrics } = build()

    await expect(
      job.process({ data: { calendarId: calendar.id } } as never),
    ).rejects.toBeInstanceOf(UnrecoverableError)

    expect(request).toHaveBeenCalledTimes(1)
    expect(metrics.recordAttempt).toHaveBeenCalledTimes(1)
    expect(metrics.recordFetchOutcome).toHaveBeenCalledWith(
      "http_client",
      "terminal",
    )
  })

  it("bounds transient attempts and leaves job retryability intact", async () => {
    const request = jest
      .spyOn(axios, "request")
      .mockRejectedValue(httpError(503))
    const { job, metrics } = build()

    await expect(
      job.process({ data: { calendarId: calendar.id } } as never),
    ).rejects.toMatchObject({
      classification: "service_unavailable",
      disposition: "transient",
    } satisfies Partial<CalendarSyncFailure>)

    expect(request).toHaveBeenCalledTimes(2)
    expect(metrics.recordAttempt).toHaveBeenCalledTimes(2)
    expect(metrics.recordFetchOutcome).toHaveBeenCalledWith(
      "service_unavailable",
      "transient_exhausted",
    )
  })

  it("does not let Retry-After extend the nine-second budget", async () => {
    jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] })
    const request = jest
      .spyOn(axios, "request")
      .mockRejectedValue(httpError(429, "10"))
    const { job, metrics } = build()
    const started = Date.now()

    await expect(
      job.process({ data: { calendarId: calendar.id } } as never),
    ).rejects.toMatchObject({
      classification: "rate_limited",
      disposition: "transient",
    } satisfies Partial<CalendarSyncFailure>)

    expect(Date.now() - started).toBeLessThan(9_000)
    expect(request).toHaveBeenCalledTimes(1)
    expect(metrics.recordFetchOutcome).toHaveBeenCalledWith(
      "rate_limited",
      "transient_exhausted",
    )
  })

  it("stops timed-out transient work at the absolute nine-second deadline", async () => {
    jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] })
    const request = jest.spyOn(axios, "request").mockImplementation(
      (config) =>
        new Promise((_resolve, reject) => {
          const signal = config.signal as AbortSignal
          const timeout = setTimeout(
            () =>
              reject(
                Object.assign(new Error("timeout"), { code: "ETIMEDOUT" }),
              ),
            config.timeout,
          )
          signal.addEventListener(
            "abort",
            () => {
              clearTimeout(timeout)
              reject(signal.reason)
            },
            { once: true },
          )
        }),
    )
    const { job, metrics } = build()
    const started = Date.now()
    const result = job.process({ data: { calendarId: calendar.id } } as never)
    const rejection = expect(result).rejects.toMatchObject({
      classification: "timeout",
      disposition: "transient",
    } satisfies Partial<CalendarSyncFailure>)

    await jest.advanceTimersByTimeAsync(9_000)
    await rejection

    expect(Date.now() - started).toBe(9_000)
    expect(request).toHaveBeenCalledTimes(2)
    expect(metrics.recordAttempt).toHaveBeenCalledTimes(2)
    expect(metrics.recordFetchOutcome).toHaveBeenCalledWith(
      "timeout",
      "transient_exhausted",
    )
  })
})
