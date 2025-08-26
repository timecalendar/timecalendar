import { NestExpressApplication } from "@nestjs/platform-express"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { NotificationSubscriptionModule } from "modules/notification-subscription/notification-subscription.module"
import { NotificationFrequency } from "modules/notification-subscription/models/notification-frequency.enum"
import { NotificationSubscriptionService } from "modules/notification-subscription/services/notification-subscription.service"
import { NotificationSubscriptionRepository } from "modules/notification-subscription/repositories/notification-subscription.repository"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import { nanoid } from "nanoid"
import createTestApp from "test-utils/create-test-app"

describe("NotificationSubscriptionService", () => {
  let app: NestExpressApplication
  let service: NotificationSubscriptionService
  let notificationSubscriptionRepository: NotificationSubscriptionRepository
  let calendarRepository: CalendarRepository

  beforeAll(async () => {
    app = await createTestApp({ imports: [NotificationSubscriptionModule] })
    service = app.get(NotificationSubscriptionService)
    notificationSubscriptionRepository = app.get(
      NotificationSubscriptionRepository,
    )
    calendarRepository = app.get(CalendarRepository)
  })

  describe("createOrUpdateSubscription", () => {
    it("creates subscription with valid calendars", async () => {
      const calendars = await calendarFactory().createList(2)
      const fcmToken = `fcm_${nanoid()}`

      const repositorySpy = jest.spyOn(
        notificationSubscriptionRepository,
        "createOrUpdateSubscription",
      )

      await service.createOrUpdateSubscription({
        frequency: NotificationFrequency.DAILY,
        nbDaysAhead: 14,
        isActive: true,
        calendarIds: calendars.map((c) => c.id),
        fcmToken,
      })

      expect(repositorySpy).toHaveBeenCalledWith(
        {
          frequency: NotificationFrequency.DAILY,
          nbDaysAhead: 14,
          isActive: true,
        },
        expect.arrayContaining([
          expect.objectContaining({ id: calendars[0].id }),
          expect.objectContaining({ id: calendars[1].id }),
        ]),
        fcmToken,
      )
    })

    it("filters out non-existent calendar IDs", async () => {
      const existingCalendar = await calendarFactory().create()
      const nonExistentId = "00000000-0000-0000-0000-000000000000" // Valid UUID format
      const fcmToken = `fcm_${nanoid()}`

      const repositorySpy = jest.spyOn(
        notificationSubscriptionRepository,
        "createOrUpdateSubscription",
      )

      await service.createOrUpdateSubscription({
        frequency: NotificationFrequency.HOURLY,
        nbDaysAhead: 7,
        isActive: false,
        calendarIds: [existingCalendar.id, nonExistentId],
        fcmToken,
      })

      expect(repositorySpy).toHaveBeenCalledWith(
        {
          frequency: NotificationFrequency.HOURLY,
          nbDaysAhead: 7,
          isActive: false,
        },
        [expect.objectContaining({ id: existingCalendar.id })], // Only existing calendar should be passed
        fcmToken,
      )
    })

    it("handles empty calendar IDs list", async () => {
      const fcmToken = `fcm_${nanoid()}`

      const repositorySpy = jest.spyOn(
        notificationSubscriptionRepository,
        "createOrUpdateSubscription",
      )

      await service.createOrUpdateSubscription({
        frequency: NotificationFrequency.IMMEDIATELY,
        nbDaysAhead: 3,
        isActive: true,
        calendarIds: [],
        fcmToken,
      })

      expect(repositorySpy).toHaveBeenCalledWith(
        {
          frequency: NotificationFrequency.IMMEDIATELY,
          nbDaysAhead: 3,
          isActive: true,
        },
        [], // Empty array should be passed
        fcmToken,
      )
    })

    it("handles all non-existent calendar IDs", async () => {
      const nonExistentIds = [
        "00000000-0000-0000-0000-000000000001",
        "00000000-0000-0000-0000-000000000002",
        "00000000-0000-0000-0000-000000000003",
      ]
      const fcmToken = `fcm_${nanoid()}`

      const repositorySpy = jest.spyOn(
        notificationSubscriptionRepository,
        "createOrUpdateSubscription",
      )

      await service.createOrUpdateSubscription({
        frequency: NotificationFrequency.DAILY,
        nbDaysAhead: 10,
        isActive: true,
        calendarIds: nonExistentIds,
        fcmToken,
      })

      expect(repositorySpy).toHaveBeenCalledWith(
        {
          frequency: NotificationFrequency.DAILY,
          nbDaysAhead: 10,
          isActive: true,
        },
        [], // Should result in empty array
        fcmToken,
      )
    })

    it("fetches calendars efficiently with findByIds", async () => {
      const calendars = await calendarFactory().createList(3)
      const fcmToken = `fcm_${nanoid()}`

      const calendarRepositorySpy = jest.spyOn(calendarRepository, "findByIds")

      await service.createOrUpdateSubscription({
        frequency: NotificationFrequency.HOURLY,
        nbDaysAhead: 5,
        isActive: true,
        calendarIds: calendars.map((c) => c.id),
        fcmToken,
      })

      // Verify findByIds was called once with all calendar IDs
      expect(calendarRepositorySpy).toHaveBeenCalledTimes(1)
      expect(calendarRepositorySpy).toHaveBeenCalledWith(
        calendars.map((c) => c.id),
      )
    })

    it("passes through all DTO properties correctly", async () => {
      const calendar = await calendarFactory().create()
      const fcmToken = `fcm_${nanoid()}`

      const repositorySpy = jest.spyOn(
        notificationSubscriptionRepository,
        "createOrUpdateSubscription",
      )

      await service.createOrUpdateSubscription({
        frequency: NotificationFrequency.DAILY,
        nbDaysAhead: 21,
        isActive: false,
        calendarIds: [calendar.id],
        fcmToken,
      })

      expect(repositorySpy).toHaveBeenCalledWith(
        {
          frequency: NotificationFrequency.DAILY,
          nbDaysAhead: 21,
          isActive: false,
        },
        [expect.objectContaining({ id: calendar.id })],
        fcmToken,
      )
    })
  })
})
