import { SharedDatabaseModule } from "@lyrolab/nest-shared/database"
import { SharedHealthModule } from "@lyrolab/nest-shared/health"
import { Module } from "@nestjs/common"
import { COMMON_IMPORTS } from "common-imports"
import { dataSourceOptions } from "data-source"
import { CalendarLogModule } from "modules/calendar-log/calendar-log.module"
import { CalendarSyncModule } from "modules/calendar-sync/calendar-sync.module"
import { ContactModule } from "modules/contact/contact.module"
import { FetchModule } from "modules/fetch/fetch.module"
import { FirebaseModule } from "modules/firebase/firebase.module"
import { JobRunModule } from "modules/job-run/job-run.module"
import { MailerModule } from "modules/mailer/mailer.module"
import { NotifierModule } from "modules/notifier/notifier.module"
import { QueueModule } from "modules/queue/queue.module"
import { SchoolGroupModule } from "modules/school-group/school-group.module"
import { SchoolModule } from "modules/school/school.module"
import { UnivOrleansModule } from "modules/univ-orleans/univ-orleans.module"
import { NotificationSubscriptionModule } from "modules/notification-subscription/notification-subscription.module"
import { FeatureFlagModule } from "modules/feature-flag/feature-flag.module"

@Module({
  imports: [
    ...COMMON_IMPORTS,
    // Runtime database connection over DATABASE_URL. Entities/migrations globs
    // mirror data-source.ts (the TypeORM CLI's source), so the runtime app and
    // the migration CLI stay aligned. synchronize:false — schema changes flow
    // through migrations (RUN_MIGRATIONS on boot in main.ts), never auto-sync.
    SharedDatabaseModule.forRoot({
      entities: dataSourceOptions.entities as string[],
      migrations: dataSourceOptions.migrations as string[],
    }),
    QueueModule,
    FirebaseModule,
    NotifierModule,
    MailerModule,
    FetchModule,
    UnivOrleansModule,
    SchoolModule,
    CalendarLogModule,
    CalendarSyncModule,
    JobRunModule,
    SchoolGroupModule,
    ContactModule,
    SharedHealthModule,
    NotificationSubscriptionModule,
    FeatureFlagModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
