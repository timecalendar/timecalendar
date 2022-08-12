import { BullModule } from "@nestjs/bull"
import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { dataSourceOptions } from "data-source"
import { CalendarSyncModule } from "modules/calendar-sync/calendar-sync.module"
import { FetchModule } from "modules/fetch/fetch.module"
import { FirebaseModule } from "modules/firebase/firebase.module"
import { JobRunModule } from "modules/job-run/job-run.module"
import { MailerModule } from "modules/mailer/mailer.module"
import { NotifierModule } from "modules/notifier/notifier.module"
import { QueueModule } from "modules/queue/queue.module"
import { RedisModule } from "modules/redis/redis.module"
import { RedisService } from "modules/redis/services/redis.service"
import { SchoolModule } from "modules/school/school.module"
import { UnivOrleansModule } from "modules/univ-orleans/univ-orleans.module"

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...dataSourceOptions, autoLoadEntities: true }),
    BullModule.forRootAsync({
      imports: [RedisModule],
      useFactory: async (RedisService: RedisService) => ({
        createClient: () =>
          RedisService.newRedisInstance({
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          }),
      }),
      inject: [RedisService],
    }),
    FirebaseModule,
    QueueModule,
    NotifierModule,
    MailerModule,
    FetchModule,
    UnivOrleansModule,
    SchoolModule,
    CalendarSyncModule,
    RedisModule,
    JobRunModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
