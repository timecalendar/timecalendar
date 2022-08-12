import { BullModule } from "@nestjs/bull"
import { Module } from "@nestjs/common"
import { ENABLE_QUEUE } from "config/constants"
import { JobRunModule } from "modules/job-run/job-run.module"
import { APP_QUEUES } from "modules/queue/queue.constants"
import {
  DefaultQueueProcessorService,
  DefaultCronQueueProcessorService,
} from "modules/queue/services/queue-processors.service"
import { QueueService } from "modules/queue/services/queue.service"
import { RedisModule } from "modules/redis/redis.module"
import { isTestEnv } from "modules/shared/helpers/check-environment"

@Module({
  imports: [
    ...APP_QUEUES.map((name) =>
      BullModule.registerQueue({
        name,
        defaultJobOptions: isTestEnv()
          ? {}
          : { removeOnComplete: true, removeOnFail: true },
      }),
    ),
    RedisModule,
    JobRunModule,
  ],
  providers: [
    QueueService,
    ...(ENABLE_QUEUE
      ? [DefaultQueueProcessorService, DefaultCronQueueProcessorService]
      : []),
  ],
  exports: [QueueService],
})
export class QueueModule {}
