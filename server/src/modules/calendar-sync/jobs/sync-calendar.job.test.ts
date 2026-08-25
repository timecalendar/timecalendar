const icalFetcher = {
  fetch: jest.fn(async () => {
    throw new Error("ADE unavailable")
  }),
}

jest.mock("modules/fetch/fetchers/ical-fetcher", () => ({
  IcalFetcher: jest
    .fn()
    .mockImplementation(() => ({ fetch: icalFetcher.fetch })),
}))

import { NestExpressApplication } from "@nestjs/platform-express"
import { Job } from "bullmq"
import { CalendarSyncModule } from "modules/calendar-sync/calendar-sync.module"
import {
  SyncCalendarJob,
  SyncCalendarJobData,
} from "modules/calendar-sync/jobs/sync-calendar.job"
import { CalendarSyncService } from "modules/calendar-sync/services/calendar-sync.service"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import createTestApp from "test-utils/create-test-app"
import { v4 } from "uuid"

const buildJob = (calendarId: string) =>
  ({ data: { calendarId } }) as Job<SyncCalendarJobData>

describe("SyncCalendarJob", () => {
  let app: NestExpressApplication
  let job: SyncCalendarJob
  let syncSpy: jest.SpyInstance

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarSyncModule] })
    job = app.get(SyncCalendarJob)
  })

  beforeEach(() => {
    syncSpy = jest
      .spyOn(app.get(CalendarSyncService), "sync")
      .mockResolvedValue(undefined as never)
  })

  afterEach(() => {
    syncSpy.mockRestore()
  })

  afterAll(async () => {
    await app.close()
  })

  it("syncs the calendar it was enqueued for", async () => {
    const calendar = await calendarFactory().create()

    await job.process(buildJob(calendar.id))

    expect(syncSpy).toHaveBeenCalledTimes(1)
    expect(syncSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: calendar.id }),
    )
  })

  it("completes silently when the calendar was deleted since fan-out", async () => {
    await expect(job.process(buildJob(v4()))).resolves.toBeUndefined()

    expect(syncSpy).not.toHaveBeenCalled()
  })

  it("propagates sync errors so BullMQ can retry", async () => {
    const calendar = await calendarFactory().create()
    syncSpy.mockRejectedValue(new Error("iCal source timed out"))

    await expect(job.process(buildJob(calendar.id))).rejects.toThrow(
      "iCal source timed out",
    )
  })

  it("does not bypass the persisted claim when BullMQ retries", async () => {
    syncSpy.mockRestore()
    const calendar = await calendarFactory().create({
      url: "https://adelb.univ-lyon1.fr/calendar.ics",
      syncPlannedAt: new Date("2000-01-01T00:00:00Z"),
    })

    await expect(job.process(buildJob(calendar.id))).rejects.toThrow(
      "ADE unavailable",
    )
    await expect(job.process(buildJob(calendar.id))).resolves.toBeUndefined()

    expect(icalFetcher.fetch).toHaveBeenCalledTimes(1)
  })
})
