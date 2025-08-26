import { NestExpressApplication } from "@nestjs/platform-express"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { fcmNotificationChannelFactory } from "modules/notification-subscription/factories/fcm-notification-channel.factory"
import { FcmNotificationChannel } from "modules/notification-subscription/models/entities/fcm-notification-channel.entity"
import { NotificationSubscription } from "modules/notification-subscription/models/entities/notification-subscription.entity"
import { NotificationFrequency } from "modules/notification-subscription/models/notification-frequency.enum"
import { NotificationSubscriptionModule } from "modules/notification-subscription/notification-subscription.module"
import { NotificationSubscriptionRepository } from "modules/notification-subscription/repositories/notification-subscription.repository"
import { nanoid } from "nanoid"
import createTestApp from "test-utils/create-test-app"
import { DataSource } from "typeorm"

describe("NotificationSubscriptionRepository", () => {
  let app: NestExpressApplication
  let repository: NotificationSubscriptionRepository
  let dataSource: DataSource

  beforeAll(async () => {
    app = await createTestApp({ imports: [NotificationSubscriptionModule] })
    repository = app.get(NotificationSubscriptionRepository)
    dataSource = app.get(DataSource)
  })

  describe("createOrUpdateSubscription", () => {
    describe("when creating a new subscription", () => {
      it("creates a notification subscription with FCM channel and calendars", async () => {
        const calendars = await calendarFactory().createList(2)
        const fcmToken = `fcm_${nanoid()}`

        const subscription = await repository.createOrUpdateSubscription(
          {
            frequency: NotificationFrequency.DAILY,
            nbDaysAhead: 14,
            isActive: true,
          },
          calendars,
          fcmToken,
        )

        expect(subscription.id).toBeDefined()
        expect(subscription.frequency).toBe(NotificationFrequency.DAILY)
        expect(subscription.nbDaysAhead).toBe(14)
        expect(subscription.isActive).toBe(true)
        expect(subscription.calendars).toHaveLength(2)
        expect(subscription.calendars[0].id).toBe(calendars[0].id)
        expect(subscription.calendars[1].id).toBe(calendars[1].id)

        // Verify FCM channel was created
        const fcmChannel = await dataSource
          .getRepository(FcmNotificationChannel)
          .findOne({
            where: { token: fcmToken },
            relations: ["notificationSubscription"],
          })

        expect(fcmChannel).toBeDefined()
        expect(fcmChannel!.token).toBe(fcmToken)
        expect(fcmChannel!.notificationSubscription.id).toBe(subscription.id)
      })

      it("creates subscription with default values", async () => {
        const calendar = await calendarFactory().create()
        const fcmToken = `fcm_${nanoid()}`

        const subscription = await repository.createOrUpdateSubscription(
          {
            frequency: NotificationFrequency.IMMEDIATELY,
            nbDaysAhead: 7,
            isActive: false,
          },
          [calendar],
          fcmToken,
        )

        expect(subscription.frequency).toBe(NotificationFrequency.IMMEDIATELY)
        expect(subscription.nbDaysAhead).toBe(7)
        expect(subscription.isActive).toBe(false)
        expect(subscription.calendars).toHaveLength(1)
      })

      it("creates subscription with empty calendars list", async () => {
        const fcmToken = `fcm_${nanoid()}`

        await repository.createOrUpdateSubscription(
          {
            frequency: NotificationFrequency.HOURLY,
            nbDaysAhead: 3,
            isActive: true,
          },
          [],
          fcmToken,
        )

        const fetchedSubscription = await dataSource
          .getRepository(NotificationSubscription)
          .findOneOrFail({
            where: { fcmNotificationChannel: { token: fcmToken } },
            relations: ["calendars"],
          })
        expect(fetchedSubscription.calendars).toHaveLength(0)
      })
    })

    describe("when updating an existing subscription", () => {
      it("updates existing subscription found by FCM token", async () => {
        // Create existing subscription
        const existingCalendars = await calendarFactory().createList(2)
        const fcmToken = `fcm_${nanoid()}`

        const existing = await repository.createOrUpdateSubscription(
          {
            frequency: NotificationFrequency.IMMEDIATELY,
            nbDaysAhead: 7,
            isActive: true,
          },
          existingCalendars,
          fcmToken,
        )

        // Update the subscription
        const newCalendars = await calendarFactory().createList(3)
        const updated = await repository.createOrUpdateSubscription(
          {
            frequency: NotificationFrequency.DAILY,
            nbDaysAhead: 21,
            isActive: false,
          },
          newCalendars,
          fcmToken,
        )

        // Should be the same entity (same ID)
        expect(updated.id).toBe(existing.id)
        expect(updated.frequency).toBe(NotificationFrequency.DAILY)
        expect(updated.nbDaysAhead).toBe(21)
        expect(updated.isActive).toBe(false)
        expect(updated.calendars).toHaveLength(3)
        expect(updated.calendars.map((c) => c.id)).toEqual(
          expect.arrayContaining(newCalendars.map((c) => c.id)),
        )

        // Verify only one subscription exists in database
        const allSubscriptions = await dataSource
          .getRepository(NotificationSubscription)
          .find()
        expect(allSubscriptions).toHaveLength(1)

        // Verify FCM channel still exists and is linked
        const fcmChannel = await dataSource
          .getRepository(FcmNotificationChannel)
          .findOne({
            where: { token: fcmToken },
            relations: ["notificationSubscription"],
          })

        expect(fcmChannel).toBeDefined()
        expect(fcmChannel!.notificationSubscription.id).toBe(updated.id)
      })

      it("updates subscription to remove all calendars", async () => {
        const existingCalendars = await calendarFactory().createList(2)
        const fcmToken = `fcm_${nanoid()}`

        const existing = await repository.createOrUpdateSubscription(
          {
            frequency: NotificationFrequency.IMMEDIATELY,
            nbDaysAhead: 7,
            isActive: true,
          },
          existingCalendars,
          fcmToken,
        )

        // Update to remove all calendars
        const updated = await repository.createOrUpdateSubscription(
          {
            frequency: NotificationFrequency.HOURLY,
            nbDaysAhead: 5,
            isActive: true,
          },
          [],
          fcmToken,
        )

        expect(updated.id).toBe(existing.id)
        expect(updated.calendars).toHaveLength(0)
      })

      it("does not create duplicate FCM channels when updating", async () => {
        const calendar = await calendarFactory().create()
        const fcmToken = `fcm_${nanoid()}`

        // Create initial subscription
        await repository.createOrUpdateSubscription(
          {
            frequency: NotificationFrequency.IMMEDIATELY,
            nbDaysAhead: 7,
            isActive: true,
          },
          [calendar],
          fcmToken,
        )

        // Update multiple times
        await repository.createOrUpdateSubscription(
          {
            frequency: NotificationFrequency.DAILY,
            nbDaysAhead: 14,
            isActive: false,
          },
          [calendar],
          fcmToken,
        )

        await repository.createOrUpdateSubscription(
          {
            frequency: NotificationFrequency.HOURLY,
            nbDaysAhead: 3,
            isActive: true,
          },
          [calendar],
          fcmToken,
        )

        // Verify only one FCM channel exists
        const fcmChannels = await dataSource
          .getRepository(FcmNotificationChannel)
          .find({ where: { token: fcmToken } })

        expect(fcmChannels).toHaveLength(1)

        // Verify only one subscription exists
        const subscriptions = await dataSource
          .getRepository(NotificationSubscription)
          .find()

        expect(subscriptions).toHaveLength(1)
      })
    })

    describe("transaction behavior", () => {
      it("rolls back on error during FCM channel creation", async () => {
        const calendar = await calendarFactory().create()
        const fcmToken = `fcm_${nanoid()}`

        // Create a subscription with the same FCM token first
        await fcmNotificationChannelFactory()
          .transient({ token: fcmToken })
          .create()

        // Attempt to create another subscription with the same FCM token should fail
        await expect(
          repository.createOrUpdateSubscription(
            {
              frequency: NotificationFrequency.DAILY,
              nbDaysAhead: 7,
              isActive: true,
            },
            [calendar],
            fcmToken,
          ),
        ).rejects.toThrow()

        // Verify no subscription was created
        const subscriptions = await dataSource
          .getRepository(NotificationSubscription)
          .find()

        expect(subscriptions).toHaveLength(0)
      })
    })

    describe("edge cases", () => {
      it("handles calendars with different properties", async () => {
        const calendar1 = await calendarFactory().create({
          name: "Calendar 1",
          schoolName: "School 1",
        })
        const calendar2 = await calendarFactory().create({
          name: "Calendar 2",
          schoolName: null,
        })

        const fcmToken = `fcm_${nanoid()}`

        const subscription = await repository.createOrUpdateSubscription(
          {
            frequency: NotificationFrequency.DAILY,
            nbDaysAhead: 10,
            isActive: true,
          },
          [calendar1, calendar2],
          fcmToken,
        )

        expect(subscription.calendars).toHaveLength(2)
        const calendarNames = subscription.calendars.map((c) => c.name)
        expect(calendarNames).toContain("Calendar 1")
        expect(calendarNames).toContain("Calendar 2")
      })

      it("handles all frequency enum values", async () => {
        const calendar = await calendarFactory().create()

        for (const frequency of Object.values(NotificationFrequency)) {
          const fcmToken = `fcm_${nanoid()}`

          const subscription = await repository.createOrUpdateSubscription(
            {
              frequency,
              nbDaysAhead: 7,
              isActive: true,
            },
            [calendar],
            fcmToken,
          )

          expect(subscription.frequency).toBe(frequency)
        }
      })
    })
  })
})
