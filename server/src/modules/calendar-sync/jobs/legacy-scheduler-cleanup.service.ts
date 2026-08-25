import { getQueueToken } from "@nestjs/bullmq"
import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common"
import { ModuleRef } from "@nestjs/core"
import { Queue } from "bullmq"
import { DEFAULT_QUEUE } from "config/queues"
import { isTestEnv } from "modules/shared/helpers/check-environment"

// One-shot cutover cleanup: the `sync_calendars` cron used to live on the
// `default` queue; its scheduler re-arms itself from Redis and nothing removes
// it now that the job moved to the `sync` queue as `sync_calendars_fanout`
// (the lib's stale-scheduler sync only covers names it still knows about).
// Safe to run on every boot — removing an absent scheduler is a no-op — and
// deletable once it has run against every environment. Other abandoned
// default-queue keys expire via their removal policies; if any linger, a
// manual `Queue("default").obliterate()` against the old Redis is the
// documented cleanup.
@Injectable()
export class LegacySchedulerCleanupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LegacySchedulerCleanupService.name)

  constructor(private readonly moduleRef: ModuleRef) {}

  async onApplicationBootstrap() {
    // Jest modules mount no SharedQueueModule, so the queue token only
    // resolves at runtime
    if (isTestEnv()) return

    const queue = this.moduleRef.get<Queue>(getQueueToken(DEFAULT_QUEUE), {
      strict: false,
    })
    const removed = await queue.removeJobScheduler("sync_calendars")
    if (removed) {
      this.logger.log(
        "Removed legacy sync_calendars scheduler from the default queue",
      )
    }
  }
}
