import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { factoryToEntity } from "modules/shared/utils/typeorm/id-to-entity"
import { subscriberFactory } from "modules/subscription/factories/subscriber.factory"
import { SubscriberCalendar } from "modules/subscription/models/subscriber-calendar.entity"
import { AppFactory } from "test-utils/factories/app-factory"
import { factoryBuilder } from "test-utils/factories/factory-builder"

export class SubscriberCalendarFactory extends AppFactory<SubscriberCalendar> {}

export const subscriberCalendarFactory = factoryBuilder(() => [
  SubscriberCalendar,
  SubscriberCalendarFactory.define(
    ({ associations }) =>
      ({
        subscriber:
          associations.subscriber || factoryToEntity(subscriberFactory()),
        calendar: associations.calendar || factoryToEntity(calendarFactory()),
      }) as Partial<SubscriberCalendar> as SubscriberCalendar,
  ),
])
