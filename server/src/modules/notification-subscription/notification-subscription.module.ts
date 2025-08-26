import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CalendarModule } from "modules/calendar/calendar.module"
import { NotificationSubscriptionController } from "./controllers/notification-subscription.controller"
import { FcmNotificationChannel } from "./models/entities/fcm-notification-channel.entity"
import { NotificationSubscription } from "./models/entities/notification-subscription.entity"

import { NotificationSubscriptionRepository } from "./repositories/notification-subscription.repository"
import { NotificationSubscriptionService } from "./services/notification-subscription.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationSubscription,
      FcmNotificationChannel,
    ]),
    CalendarModule,
  ],
  controllers: [NotificationSubscriptionController],
  providers: [
    NotificationSubscriptionService,
    NotificationSubscriptionRepository,
  ],
  exports: [
    NotificationSubscriptionService,
    NotificationSubscriptionRepository,
  ],
})
export class NotificationSubscriptionModule {}
