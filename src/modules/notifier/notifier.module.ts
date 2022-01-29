import { Module } from "@nestjs/common"
import { FirebaseModule } from "modules/firebase/firebase.module"
import { MailerModule } from "modules/mailer/mailer.module"
import { NotifierService } from "modules/notifier/services/notifier.service"

@Module({
  imports: [MailerModule, FirebaseModule],
  providers: [NotifierService],
  controllers: [],
  exports: [NotifierService],
})
export class NotifierModule {}
