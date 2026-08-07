import { RedisConfig } from "@lyrolab/nest-shared/redis"
import { ModuleRef } from "@nestjs/core"
import { Job, Queue } from "bullmq"
import { JobEventsListenerService } from "modules/job-run/services/job-events-listener.service"

type ServiceInternals = {
  queues: Map<string, Queue>
  logger: { log: jest.Mock; error: jest.Mock }
  completedCounter: { add: jest.Mock }
  failedCounter: { add: jest.Mock }
  durationHistogram: { record: jest.Mock }
}

const buildJob = (overrides: Partial<Job> = {}) =>
  ({
    name: "some_job",
    processedOn: 1_000,
    finishedOn: 3_500,
    repeatJobKey: undefined,
    ...overrides,
  }) as Job

describe("JobEventsListenerService", () => {
  let service: JobEventsListenerService
  let internals: ServiceInternals
  let fromIdSpy: jest.SpyInstance

  beforeEach(() => {
    // Constructed directly: onModuleInit (which opens Redis connections) is
    // intentionally never called.
    service = new JobEventsListenerService(new RedisConfig("redis://test"), {
      get: jest.fn(),
    } as unknown as ModuleRef)
    internals = service as unknown as ServiceInternals
    internals.queues.set("sync", {} as Queue)
    internals.logger = { log: jest.fn(), error: jest.fn() }
    internals.completedCounter = { add: jest.fn() }
    internals.failedCounter = { add: jest.fn() }
    internals.durationHistogram = { record: jest.fn() }
    fromIdSpy = jest.spyOn(Job, "fromId")
  })

  afterEach(() => {
    fromIdSpy.mockRestore()
  })

  describe("handleCompleted", () => {
    it("logs cron job completions and records metrics", async () => {
      fromIdSpy.mockResolvedValue(
        buildJob({ name: "sync_calendars_fanout", repeatJobKey: "repeat:key" }),
      )

      await service.handleCompleted("sync", "some-id")

      expect(internals.logger.log).toHaveBeenCalledWith(
        "Job sync_calendars_fanout (queue sync) completed in 2500ms",
      )
      expect(internals.completedCounter.add).toHaveBeenCalledWith(1, {
        queue: "sync",
        job: "sync_calendars_fanout",
      })
      expect(internals.durationHistogram.record).toHaveBeenCalledWith(2500, {
        queue: "sync",
        job: "sync_calendars_fanout",
      })
    })

    it("records metrics without logging for item job completions", async () => {
      fromIdSpy.mockResolvedValue(buildJob({ name: "sync_calendar" }))

      await service.handleCompleted("sync", "calendar-id")

      expect(internals.logger.log).not.toHaveBeenCalled()
      expect(internals.completedCounter.add).toHaveBeenCalledWith(1, {
        queue: "sync",
        job: "sync_calendar",
      })
      expect(internals.durationHistogram.record).toHaveBeenCalledWith(2500, {
        queue: "sync",
        job: "sync_calendar",
      })
    })

    it("still counts completions for jobs already removed from Redis", async () => {
      fromIdSpy.mockResolvedValue(undefined)

      await service.handleCompleted("sync", "calendar-id")

      expect(internals.logger.log).not.toHaveBeenCalled()
      expect(internals.completedCounter.add).toHaveBeenCalledWith(1, {
        queue: "sync",
        job: "unknown",
      })
      expect(internals.durationHistogram.record).not.toHaveBeenCalled()
    })
  })

  describe("handleFailed", () => {
    it("logs item job failures with queue, name and error", async () => {
      fromIdSpy.mockResolvedValue(buildJob({ name: "sync_calendar" }))

      await service.handleFailed("sync", "calendar-id", "iCal timeout")

      expect(internals.logger.error).toHaveBeenCalledWith(
        "Job sync_calendar (queue sync, id calendar-id) failed: iCal timeout",
      )
      expect(internals.failedCounter.add).toHaveBeenCalledWith(1, {
        queue: "sync",
        job: "sync_calendar",
      })
      expect(internals.durationHistogram.record).toHaveBeenCalledWith(2500, {
        queue: "sync",
        job: "sync_calendar",
      })
    })

    it("logs failures even when the job is no longer fetchable", async () => {
      fromIdSpy.mockResolvedValue(undefined)

      await service.handleFailed("sync", "calendar-id", "boom")

      expect(internals.logger.error).toHaveBeenCalledWith(
        "Job unknown (queue sync, id calendar-id) failed: boom",
      )
      expect(internals.failedCounter.add).toHaveBeenCalledWith(1, {
        queue: "sync",
        job: "unknown",
      })
      expect(internals.durationHistogram.record).not.toHaveBeenCalled()
    })
  })
})
