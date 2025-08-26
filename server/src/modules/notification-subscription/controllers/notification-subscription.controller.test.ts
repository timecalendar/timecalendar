import { NestExpressApplication } from "@nestjs/platform-express"
import request from "lib/supertest"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { NotificationSubscriptionModule } from "modules/notification-subscription/notification-subscription.module"
import { NotificationFrequency } from "modules/notification-subscription/models/notification-frequency.enum"
import { nanoid } from "nanoid"
import createTestApp from "test-utils/create-test-app"

describe("NotificationSubscriptionController", () => {
  let app: NestExpressApplication

  beforeAll(async () => {
    app = await createTestApp({ imports: [NotificationSubscriptionModule] })
  })

  describe("PUT /notification-subscription", () => {
    it("creates a notification subscription successfully", async () => {
      const calendars = await calendarFactory().createList(2)
      const fcmToken = `fcm_${nanoid()}`

      await request(app)
        .put("/notification-subscription")
        .send({
          frequency: NotificationFrequency.DAILY,
          nbDaysAhead: 14,
          isActive: true,
          calendarIds: calendars.map((c) => c.id),
          fcmToken,
        })
        .expect(204)
    })

    it("updates an existing notification subscription", async () => {
      const calendars = await calendarFactory().createList(2)
      const fcmToken = `fcm_${nanoid()}`

      // Create initial subscription
      await request(app)
        .put("/notification-subscription")
        .send({
          frequency: NotificationFrequency.IMMEDIATELY,
          nbDaysAhead: 7,
          isActive: true,
          calendarIds: [calendars[0].id],
          fcmToken,
        })
        .expect(204)

      // Update the subscription
      await request(app)
        .put("/notification-subscription")
        .send({
          frequency: NotificationFrequency.HOURLY,
          nbDaysAhead: 21,
          isActive: false,
          calendarIds: calendars.map((c) => c.id),
          fcmToken,
        })
        .expect(204)
    })

    it("handles empty calendar IDs", async () => {
      const fcmToken = `fcm_${nanoid()}`

      await request(app)
        .put("/notification-subscription")
        .send({
          frequency: NotificationFrequency.DAILY,
          nbDaysAhead: 5,
          isActive: true,
          calendarIds: [],
          fcmToken,
        })
        .expect(204)
    })

    it("validates required fields", async () => {
      await request(app).put("/notification-subscription").send({}).expect(400)
    })
  })
})
