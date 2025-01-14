import { BullModule } from "@nestjs/bullmq"
import { Module } from "@nestjs/common"
import { ENABLE_QUEUE } from "config/constants"
import { JobRunModule } from "modules/job-run/job-run.module"
import { DefaultQueueProcessorService } from "modules/queue/services/queue-processors.service"
import { QueueService } from "modules/queue/services/queue.service"
import { RedisModule } from "modules/redis/redis.module"
import { isTestEnv } from "modules/shared/helpers/check-environment"
import { DEFAULT_QUEUE_NAME } from "./queue.constants"

@Module({
  imports: [
    BullModule.registerQueue({
      name: DEFAULT_QUEUE_NAME,
      defaultJobOptions: isTestEnv()
        ? {}
        : {
            removeOnComplete: { age: 3600, count: 1000 },
            removeOnFail: { age: 24 * 3600 },
          },
    }),
    RedisModule,
    JobRunModule,
  ],
  providers: [
    QueueService,
    ...(ENABLE_QUEUE ? [DefaultQueueProcessorService] : []),
  ],
  exports: [QueueService],
})
export class QueueModule {}
