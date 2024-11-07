import { NestExpressApplication } from "@nestjs/platform-express"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { SubscriberCalendar } from "modules/subscription/models/subscriber-calendar.entity"
import { Subscriber } from "modules/subscription/models/subscriber.entity"
import { SubscriptionFrequency } from "modules/subscription/models/subscription-frequency.enum"
import { SubscriberRepository } from "modules/subscription/repositories/subscriber.repository"
import { SubscriptionModule } from "modules/subscription/subscription.module"
import createTestApp from "test-utils/create-test-app"
import { assertChanges } from "test-utils/typeorm/assert-changes"
import { DataSource } from "typeorm"

describe("SubscriberRepository", () => {
  let app: NestExpressApplication
  let repository: SubscriberRepository
  let dataSource: DataSource

  beforeAll(async () => {
    app = await createTestApp({
      imports: [SubscriptionModule],
    })
    repository = app.get(SubscriberRepository)
    dataSource = app.get(DataSource)
  })

  describe("save", () => {
    it("creates a firebase subscriber", async () => {
      const calendar = await calendarFactory().create()

      await assertChanges(
        dataSource,
        [
          [Subscriber, 1],
          [SubscriberCalendar, 1],
        ],
        () =>
          repository.save({
            firebaseToken: "fcm_fake_token",
            email: null,
            frequency: SubscriptionFrequency.HOURLY,
            isEnabled: true,
            notificationDays: 14,
            calendarIds: [calendar.id],
          }),
      )

      const subscriber = await dataSource
        .getRepository(Subscriber)
        .findOneByOrFail({ firebaseToken: "fcm_fake_token" })

      expect(subscriber).toMatchObject({
        firebaseToken: "fcm_fake_token",
        email: null,
        frequency: SubscriptionFrequency.HOURLY,
        isEnabled: true,
        notificationDays: 14,
      })
    })

    it("creates an email subscriber", async () => {
      const calendar = await calendarFactory().create()

      await assertChanges(
        dataSource,
        [
          [Subscriber, 1],
          [SubscriberCalendar, 1],
        ],
        () =>
          repository.save({
            firebaseToken: null,
            email: "email@example.com",
            frequency: SubscriptionFrequency.HOURLY,
            isEnabled: true,
            notificationDays: 14,
            calendarIds: [calendar.id],
          }),
      )

      const subscriber = await dataSource
        .getRepository(Subscriber)
        .findOneByOrFail({ email: "email@example.com" })

      expect(subscriber).toMatchObject({
        firebaseToken: null,
        email: "email@example.com",
        frequency: SubscriptionFrequency.HOURLY,
        isEnabled: true,
        notificationDays: 14,
      })
    })
  })
})
