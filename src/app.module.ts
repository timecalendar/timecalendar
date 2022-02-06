import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CalendarSyncModule } from "modules/calendar-sync/calendar-sync.module"
import { FetchModule } from "./modules/fetch/fetch.module"
import { FirebaseModule } from "./modules/firebase/firebase.module"
import { MailerModule } from "./modules/mailer/mailer.module"
import { NotifierModule } from "./modules/notifier/notifier.module"
import { QueueModule } from "./modules/queue/queue.module"
import { QueueService } from "./modules/queue/queue.service"
import { SchoolModule } from "./modules/school/school.module"
import { UnivOrleansModule } from "./modules/univ-orleans/univ-orleans.module"
import ormconfig from "./ormconfig"

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...ormconfig, autoLoadEntities: true }),
    FirebaseModule,
    QueueModule,
    NotifierModule,
    MailerModule,
    FetchModule,
    UnivOrleansModule,
    SchoolModule,
    CalendarSyncModule,
  ],
  controllers: [],
  providers: [QueueService],
  exports: [QueueService],
})
export class AppModule {}
