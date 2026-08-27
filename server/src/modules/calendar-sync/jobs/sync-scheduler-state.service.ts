import { getQueueToken } from "@nestjs/bullmq"
import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common"
import { ModuleRef } from "@nestjs/core"
import { Queue } from "bullmq"
import { SYNC_CALENDARS_CRON } from "config/constants"
import { SYNC_QUEUE } from "config/queues"
import { SYNC_CALENDARS_FANOUT_JOB } from "modules/calendar-sync/jobs/sync-calendars-fanout.job"
import { isTestEnv } from "modules/shared/helpers/check-environment"

// Makes SYNC_CALENDARS_CRON a two-way switch.
//
// nest-shared only ever *adds* schedulers: it walks the jobs whose `cron` is
// set and upserts those, so clearing a cron merely stops it re-arming the
// scheduler — the one an earlier boot wrote is still in Redis and still fires.
// Without this, turning the fan-out off in config would look like it worked and
// change nothing, which is the failure mode that let background sync reach
// production unannounced in the first place.
@Injectable()
export class SyncSchedulerStateService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SyncSchedulerStateService.name)

  constructor(private readonly moduleRef: ModuleRef) {}

  async onApplicationBootstrap() {
    if (SYNC_CALENDARS_CRON) return

    // Jest modules mount no SharedQueueModule, so the queue token only
    // resolves at runtime
    if (isTestEnv()) return

    const queue = this.moduleRef.get<Queue>(getQueueToken(SYNC_QUEUE), {
      strict: false,
    })
    const removed = await queue.removeJobScheduler(SYNC_CALENDARS_FANOUT_JOB)
    if (removed) {
      this.logger.log(
        `Background calendar sync is disabled (SYNC_CALENDARS_CRON is empty); removed the ${SYNC_CALENDARS_FANOUT_JOB} scheduler`,
      )
    }
  }
}
