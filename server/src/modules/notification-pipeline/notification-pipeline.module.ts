import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import {
  DrainNotificationsDailyJob,
  DrainNotificationsHourlyJob,
  DrainNotificationsImmediatelyJob,
} from "modules/notification-pipeline/jobs/drain-notifications.jobs"
import { NotifyFanoutJob } from "modules/notification-pipeline/jobs/notify-fanout.job"
import { NotifyFanoutCursor } from "modules/notification-pipeline/models/entities/notify-fanout-cursor.entity"
import { SubscriberCalendarLog } from "modules/notification-pipeline/models/entities/subscriber-calendar-log.entity"
import { NotificationOutboxRepository } from "modules/notification-pipeline/repositories/notification-outbox.repository"
import { NotificationDrainService } from "modules/notification-pipeline/services/notification-drain.service"
import { NotifierModule } from "modules/notifier/notifier.module"

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriberCalendarLog, NotifyFanoutCursor]),
    NotifierModule,
  ],
  providers: [
    NotifyFanoutJob,
    DrainNotificationsImmediatelyJob,
    DrainNotificationsHourlyJob,
    DrainNotificationsDailyJob,
    NotificationDrainService,
    NotificationOutboxRepository,
  ],
})
export class NotificationPipelineModule {}
