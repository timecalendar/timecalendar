import { Module } from "@nestjs/common"
import { FirebaseModule } from "src/modules/firebase/firebase.module"
import { MailerModule } from "src/modules/mailer/mailer.module"
import { NotifierService } from "./notifier.service"

@Module({
  imports: [MailerModule, FirebaseModule],
  providers: [NotifierService],
  controllers: [],
  exports: [NotifierService],
})
export class NotifierModule {}
