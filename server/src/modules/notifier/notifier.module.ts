import { Module } from "@nestjs/common"
import { FirebaseModule } from "modules/firebase/firebase.module"
import { NotificationSubscriptionModule } from "modules/notification-subscription/notification-subscription.module"
import { SendPushJob } from "modules/notifier/jobs/send-push.job"
import { NotifierService } from "modules/notifier/services/notifier.service"

@Module({
  imports: [FirebaseModule, NotificationSubscriptionModule],
  providers: [NotifierService, SendPushJob],
  controllers: [],
  exports: [NotifierService],
})
export class NotifierModule {}
