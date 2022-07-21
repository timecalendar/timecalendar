import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { dataSourceOptions } from "data-source"
import { RedisModule } from "modules/redis/redis.module"
import { FetchModule } from "modules/fetch/fetch.module"
import { FirebaseModule } from "modules/firebase/firebase.module"
import { MailerModule } from "modules/mailer/mailer.module"
import { NotifierModule } from "modules/notifier/notifier.module"
import { QueueModule } from "modules/queue/queue.module"
import { SchoolModule } from "modules/school/school.module"
import { UnivOrleansModule } from "modules/univ-orleans/univ-orleans.module"

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...dataSourceOptions, autoLoadEntities: true }),
    FirebaseModule,
    QueueModule,
    NotifierModule,
    MailerModule,
    FetchModule,
    UnivOrleansModule,
    SchoolModule,
    RedisModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
