import { Module } from "@nestjs/common"
import { COMMON_IMPORTS } from "common-imports"
import { CalendarLogModule } from "modules/calendar-log/calendar-log.module"
import { CalendarSyncModule } from "modules/calendar-sync/calendar-sync.module"
import { ContactModule } from "modules/contact/contact.module"
import { FetchModule } from "modules/fetch/fetch.module"
import { FirebaseModule } from "modules/firebase/firebase.module"
import { JobRunModule } from "modules/job-run/job-run.module"
import { MailerModule } from "modules/mailer/mailer.module"
import { NotifierModule } from "modules/notifier/notifier.module"
import { QueueModule } from "modules/queue/queue.module"
import { RedisModule } from "modules/redis/redis.module"
import { SchoolGroupModule } from "modules/school-group/school-group.module"
import { SchoolModule } from "modules/school/school.module"
import { UnivOrleansModule } from "modules/univ-orleans/univ-orleans.module"
import { HealthModule } from "modules/health/health.module"

@Module({
  imports: [
    ...COMMON_IMPORTS,
    QueueModule,
    FirebaseModule,
    NotifierModule,
    MailerModule,
    FetchModule,
    UnivOrleansModule,
    SchoolModule,
    CalendarLogModule,
    CalendarSyncModule,
    RedisModule,
    JobRunModule,
    SchoolGroupModule,
    ContactModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
