import { NestExpressApplication } from "@nestjs/platform-express"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { subscriberCalendarFactory } from "modules/subscription/factories/subscriber-calendar.factory"
import { subscriberFactory } from "modules/subscription/factories/subscriber.factory"
import { SubscriberCalendar } from "modules/subscription/models/subscriber-calendar.entity"
import { SubscriptionModule } from "modules/subscription/subscription.module"
import createTestApp from "test-utils/create-test-app"
import { assertChanges } from "test-utils/typeorm/assert-changes"
import { DataSource, QueryFailedError, Repository } from "typeorm"

describe("SubscriberCalendarEntity", () => {
  let app: NestExpressApplication
  let dataSource: DataSource
  let repository: Repository<SubscriberCalendar>

  beforeAll(async () => {
    app = await createTestApp({ imports: [SubscriptionModule] })
    dataSource = app.get(DataSource)
    repository = dataSource.getRepository(SubscriberCalendar)
  })

  describe("create", () => {
    it("creates a subscriber calendar", async () => {
      await assertChanges(dataSource, [[SubscriberCalendar, 1]], () =>
        subscriberCalendarFactory().create(),
      )

      const subscriberCalendars = await repository.find()
      expect(subscriberCalendars.length).toBe(1)
    })

    it("cannot create two same rows", async () => {
      const calendar = await calendarFactory().create()
      const subscriber = await subscriberFactory().create()

      await subscriberCalendarFactory()
        .associations({ calendar, subscriber })
        .create()

      const promise = subscriberCalendarFactory()
        .associations({ calendar, subscriber })
        .create()
      await expect(promise).rejects.toThrow(QueryFailedError)
    })
  })
})
