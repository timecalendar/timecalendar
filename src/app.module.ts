import { Module } from "@nestjs/common"
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm"
import { DATABASE_CONTENT_NAME, DATABASE_MAIN_NAME } from "./config/constants"
import {
  databaseDefaultOptions,
  DATABASE_CONTENT_CONNECTION,
} from "./config/database"
import { FetchModule } from "./modules/fetch/fetch.module"
import { FirebaseModule } from "./modules/firebase/firebase.module"
import { MailerModule } from "./modules/mailer/mailer.module"
import { NotifierModule } from "./modules/notifier/notifier.module"
import { QueueModule } from "./modules/queue/queue.module"
import { QueueService } from "./modules/queue/queue.service"
import { School } from "./modules/school/models/school.entity"
import { SchoolModule } from "./modules/school/school.module"
import { UnivOrleansModule } from "./modules/univ-orleans/univ-orleans.module"

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...databaseDefaultOptions,
      database: DATABASE_MAIN_NAME,
      entities: [School],
    } as TypeOrmModuleOptions),
    TypeOrmModule.forRoot({
      ...databaseDefaultOptions,
      database: DATABASE_CONTENT_NAME,
      name: DATABASE_CONTENT_CONNECTION,
    } as TypeOrmModuleOptions),
    FirebaseModule,
    QueueModule,
    NotifierModule,
    MailerModule,
    FetchModule,
    UnivOrleansModule,
    SchoolModule,
  ],
  controllers: [],
  providers: [QueueService],
  exports: [QueueService],
})
export class AppModule {}
