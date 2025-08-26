import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { NotificationSubscription } from "modules/notification-subscription/models/entities/notification-subscription.entity"
import { NotificationFrequency } from "modules/notification-subscription/models/notification-frequency.enum"
import { factoryToEntity } from "modules/shared/utils/typeorm/id-to-entity"
import { nanoid } from "nanoid"
import { AppFactory } from "test-utils/factories/app-factory"
import { factoryBuilder } from "test-utils/factories/factory-builder"
import { fcmNotificationChannelFactory } from "./fcm-notification-channel.factory"

interface TransientParams {
  calendars?: Calendar[]
  fcmToken?: string
}

export class NotificationSubscriptionFactory extends AppFactory<
  NotificationSubscription,
  TransientParams
> {
  withCalendars(calendars: Calendar[]) {
    return this.transient({ calendars })
  }

  withFcmToken(fcmToken: string) {
    return this.transient({ fcmToken })
  }
}

export const notificationSubscriptionFactory = factoryBuilder(() => [
  NotificationSubscription,
  NotificationSubscriptionFactory.define(
    ({ transientParams }) =>
      ({
        frequency: NotificationFrequency.IMMEDIATELY,
        nbDaysAhead: 7,
        isActive: true,
        calendars: transientParams.calendars || [
          factoryToEntity(calendarFactory()),
        ],
        fcmNotificationChannel: factoryToEntity(
          fcmNotificationChannelFactory().transient({
            token: transientParams.fcmToken || nanoid(),
          }),
        ),
      }) as NotificationSubscription,
  ),
])
