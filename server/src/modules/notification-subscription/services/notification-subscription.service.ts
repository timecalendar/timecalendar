import { Injectable } from "@nestjs/common"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import { NotificationSubscriptionCreate } from "modules/notification-subscription/models/dto/notification-subscription-create.dto"
import {
  DEFAULT_NOTIFICATION_LOCALE,
  DEFAULT_NOTIFICATION_TIMEZONE,
} from "modules/notification-subscription/models/notification-locale"
import { NotificationSubscriptionRepository } from "modules/notification-subscription/repositories/notification-subscription.repository"

@Injectable()
export class NotificationSubscriptionService {
  constructor(
    private readonly notificationSubscriptionRepository: NotificationSubscriptionRepository,
    private readonly calendarRepository: CalendarRepository,
  ) {}

  async deactivateSubscription(subscriptionId: string): Promise<void> {
    await this.notificationSubscriptionRepository.deactivate(subscriptionId)
  }

  async createOrUpdateSubscription(
    dto: NotificationSubscriptionCreate,
  ): Promise<void> {
    // Fetch calendars by IDs
    const validCalendars = await this.calendarRepository.findByIds(
      dto.calendarIds,
    )

    // Create or update subscription
    await this.notificationSubscriptionRepository.createOrUpdateSubscription(
      {
        frequency: dto.frequency,
        nbDaysAhead: dto.nbDaysAhead,
        isActive: dto.isActive,
        locale: dto.locale ?? DEFAULT_NOTIFICATION_LOCALE,
        timezone: dto.timezone ?? DEFAULT_NOTIFICATION_TIMEZONE,
      },
      validCalendars,
      dto.fcmToken,
    )
  }
}
