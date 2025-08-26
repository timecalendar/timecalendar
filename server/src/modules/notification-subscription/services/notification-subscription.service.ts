import { Injectable } from "@nestjs/common"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import { NotificationSubscriptionCreate } from "modules/notification-subscription/models/dto/notification-subscription-create.dto"
import { NotificationSubscriptionRepository } from "modules/notification-subscription/repositories/notification-subscription.repository"

@Injectable()
export class NotificationSubscriptionService {
  constructor(
    private readonly notificationSubscriptionRepository: NotificationSubscriptionRepository,
    private readonly calendarRepository: CalendarRepository,
  ) {}

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
      },
      validCalendars,
      dto.fcmToken,
    )
  }
}
