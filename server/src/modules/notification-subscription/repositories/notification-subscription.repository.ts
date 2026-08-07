import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { NotificationSubscription } from "modules/notification-subscription/models/entities/notification-subscription.entity"
import { NotificationFrequency } from "modules/notification-subscription/models/notification-frequency.enum"
import { NotificationLocale } from "modules/notification-subscription/models/notification-locale"
import { DataSource, Repository } from "typeorm"

@Injectable()
export class NotificationSubscriptionRepository {
  constructor(
    @InjectRepository(NotificationSubscription)
    private readonly repository: Repository<NotificationSubscription>,
    private readonly dataSource: DataSource,
  ) {}

  async deactivate(subscriptionId: string): Promise<void> {
    await this.repository.update(subscriptionId, { isActive: false })
  }

  async createOrUpdateSubscription(
    subscriptionData: {
      frequency: NotificationFrequency
      nbDaysAhead: number
      isActive: boolean
      locale: NotificationLocale
      timezone: string
    },
    calendars: Calendar[],
    fcmToken: string,
  ): Promise<NotificationSubscription> {
    return this.dataSource.transaction(async (manager) => {
      // Find existing subscription by FCM token
      const existing = await manager.findOne(NotificationSubscription, {
        where: {
          fcmNotificationChannel: {
            token: fcmToken,
          },
        },
        relations: ["fcmNotificationChannel", "calendars"],
      })

      if (existing) {
        // Update existing subscription
        existing.frequency = subscriptionData.frequency
        existing.nbDaysAhead = subscriptionData.nbDaysAhead
        existing.isActive = subscriptionData.isActive
        existing.locale = subscriptionData.locale
        existing.timezone = subscriptionData.timezone
        existing.calendars = calendars

        return manager.save(NotificationSubscription, existing)
      } else {
        // Create new subscription
        const newSubscription = manager.create(NotificationSubscription, {
          frequency: subscriptionData.frequency,
          nbDaysAhead: subscriptionData.nbDaysAhead,
          isActive: subscriptionData.isActive,
          locale: subscriptionData.locale,
          timezone: subscriptionData.timezone,
          calendars,
        })

        const savedSubscription = await manager.save(
          NotificationSubscription,
          newSubscription,
        )

        // Create FCM channel
        const fcmChannel = manager.create("FcmNotificationChannel", {
          token: fcmToken,
          notificationSubscription: savedSubscription,
        })

        await manager.save("FcmNotificationChannel", fcmChannel)

        return savedSubscription
      }
    })
  }
}
