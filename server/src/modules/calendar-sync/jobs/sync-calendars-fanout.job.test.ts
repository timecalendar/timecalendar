import { QueueService } from "@lyrolab/nest-shared/queue"
import { NestExpressApplication } from "@nestjs/platform-express"
import { CalendarSyncModule } from "modules/calendar-sync/calendar-sync.module"
import { SyncCalendarsFanoutJob } from "modules/calendar-sync/jobs/sync-calendars-fanout.job"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import createTestApp from "test-utils/create-test-app"

describe("SyncCalendarsFanoutJob", () => {
  let app: NestExpressApplication
  let job: SyncCalendarsFanoutJob
  const mockQueueService = {
    addBulk: jest.fn(async () => []),
  }

  beforeAll(async () => {
    app = await createTestApp(
      { imports: [CalendarSyncModule] },
      { overrides: [{ provide: QueueService, useValue: mockQueueService }] },
    )
    job = app.get(SyncCalendarsFanoutJob)
  })

  beforeEach(() => {
    jest.clearAllMocks()
    const mockDate = new Date("2022-01-05T12:00:00Z")
    jest.useFakeTimers({
      doNotFake: ["nextTick", "setImmediate"],
      now: mockDate,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  afterAll(async () => {
    await app.close()
  })

  it("enqueues one sync_calendar job per due calendar with dedup + retry options", async () => {
    const due = await calendarFactory().create({
      lastUpdatedAt: new Date("2022-01-05T11:00:00Z"),
      lastAccessedAt: new Date("2022-01-05T10:00:00Z"),
    })

    await job.process()

    expect(mockQueueService.addBulk).toHaveBeenCalledTimes(1)
    expect(mockQueueService.addBulk).toHaveBeenCalledWith([
      {
        name: "sync_calendar",
        data: { calendarId: due.id },
        opts: {
          jobId: due.id,
          attempts: 3,
          backoff: { type: "exponential", delay: 60_000 },
          removeOnComplete: true,
          removeOnFail: { age: 15 * 60 },
        },
      },
    ])
  })

  it("skips calendars updated within the due window", async () => {
    await calendarFactory().create({
      lastUpdatedAt: new Date("2022-01-05T11:50:00Z"),
      lastAccessedAt: new Date("2022-01-05T10:00:00Z"),
    })

    await job.process()

    expect(mockQueueService.addBulk).toHaveBeenCalledWith([])
  })

  it("skips calendars inactive for more than the inactivity window", async () => {
    await calendarFactory().create({
      lastUpdatedAt: new Date("2022-01-05T11:00:00Z"),
      lastAccessedAt: new Date("2021-12-21T11:00:00Z"),
    })

    await job.process()

    expect(mockQueueService.addBulk).toHaveBeenCalledWith([])
  })
})
