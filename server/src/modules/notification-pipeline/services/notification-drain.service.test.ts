import { QueueService } from "@lyrolab/nest-shared/queue"
import { NestExpressApplication } from "@nestjs/platform-express"
import { calendarLogFactory } from "modules/calendar-log/factories/calendar-log.factory"
import { CalendarChange } from "modules/calendar-log/models/calendar-change"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { SubscriberCalendarLog } from "modules/notification-pipeline/models/entities/subscriber-calendar-log.entity"
import { NotificationPipelineModule } from "modules/notification-pipeline/notification-pipeline.module"
import { NotificationDrainService } from "modules/notification-pipeline/services/notification-drain.service"
import { notificationSubscriptionFactory } from "modules/notification-subscription/factories/notification-subscription.factory"
import { NotificationSubscription } from "modules/notification-subscription/models/entities/notification-subscription.entity"
import { NotificationFrequency } from "modules/notification-subscription/models/notification-frequency.enum"
import { SEND_PUSH_JOB } from "modules/notifier/jobs/send-push.constants"
import { addDays } from "date-fns"
import { nanoid } from "nanoid"
import createTestApp from "test-utils/create-test-app"
import { DataSource } from "typeorm"

describe("NotificationDrainService", () => {
  let app: NestExpressApplication
  let service: NotificationDrainService
  let dataSource: DataSource
  const add = jest.fn()

  beforeAll(async () => {
    app = await createTestApp(
      { imports: [NotificationPipelineModule] },
      {
        overrides: [
          {
            provide: QueueService,
            useValue: { add, addBulk: async () => [] },
          },
        ],
      },
    )
    service = app.get(NotificationDrainService)
    dataSource = app.get(DataSource)
  })

  beforeEach(() => {
    add.mockReset()
    add.mockResolvedValue(undefined)
  })

  const soon = () => addDays(new Date(), 1)

  const changeWithNewEvent = (
    uid: string,
    startsAt: Date = soon(),
  ): CalendarChange => ({
    oldItems: [],
    newItems: [
      {
        uid,
        title: `Event ${uid}`,
        location: null,
        startsAt,
        endsAt: startsAt,
      },
    ],
    changedItems: [],
  })

  const createSubscription = (
    calendar: Calendar,
    overrides: Partial<NotificationSubscription> = {},
  ) =>
    notificationSubscriptionFactory()
      .withCalendars([calendar])
      .withFcmToken(`token_${nanoid()}`)
      .create(overrides)

  const createOutboxRow = async (
    subscriptionId: string,
    calendarId: string,
    calendarChange: CalendarChange,
    frequency = NotificationFrequency.IMMEDIATELY,
  ) => {
    const log = await calendarLogFactory()
      .calendar(calendarId)
      .transient({ calendarChange })
      .create()
    return dataSource
      .getRepository(SubscriberCalendarLog)
      .save({ subscriptionId, calendarLogId: log.id, frequency })
  }

  const outboxCount = () =>
    dataSource.getRepository(SubscriberCalendarLog).count()

  it("enqueues one detail push for a single change and deletes the rows", async () => {
    const calendar = await calendarFactory().create()
    const subscription = await createSubscription(calendar)
    await createOutboxRow(subscription.id, calendar.id, changeWithNewEvent("a"))

    await service.drain(NotificationFrequency.IMMEDIATELY)

    expect(add).toHaveBeenCalledTimes(1)
    const [jobName, jobData] = add.mock.calls[0]
    expect(jobName).toBe(SEND_PUSH_JOB)
    expect(jobData.subscriptionId).toBe(subscription.id)
    expect(jobData.push.data.action).toBe("calendar_changed")
    expect(await outboxCount()).toBe(0)
  })

  it("merges several logs into one digest push per subscription", async () => {
    const calendar = await calendarFactory().create()
    const subscription = await createSubscription(calendar)
    await createOutboxRow(subscription.id, calendar.id, changeWithNewEvent("a"))
    await createOutboxRow(subscription.id, calendar.id, changeWithNewEvent("b"))
    await createOutboxRow(subscription.id, calendar.id, changeWithNewEvent("c"))

    await service.drain(NotificationFrequency.IMMEDIATELY)

    expect(add).toHaveBeenCalledTimes(1)
    const [, jobData] = add.mock.calls[0]
    expect(jobData.push.data.action).toBe("calendar_digest")
    expect(jobData.push.data.count).toBe("3")
    expect(await outboxCount()).toBe(0)
  })

  it("deletes rows without enqueuing when every change is filtered out", async () => {
    const calendar = await calendarFactory().create()
    const subscription = await createSubscription(calendar, { nbDaysAhead: 1 })
    await createOutboxRow(
      subscription.id,
      calendar.id,
      changeWithNewEvent("far", addDays(new Date(), 30)),
    )

    await service.drain(NotificationFrequency.IMMEDIATELY)

    expect(add).not.toHaveBeenCalled()
    expect(await outboxCount()).toBe(0)
  })

  it("deletes rows of inactive subscriptions without enqueuing", async () => {
    const calendar = await calendarFactory().create()
    const subscription = await createSubscription(calendar, { isActive: false })
    await createOutboxRow(subscription.id, calendar.id, changeWithNewEvent("a"))

    await service.drain(NotificationFrequency.IMMEDIATELY)

    expect(add).not.toHaveBeenCalled()
    expect(await outboxCount()).toBe(0)
  })

  it("drains only the requested frequency tier", async () => {
    const calendar = await calendarFactory().create()
    const subscription = await createSubscription(calendar)
    await createOutboxRow(
      subscription.id,
      calendar.id,
      changeWithNewEvent("a"),
      NotificationFrequency.DAILY,
    )

    await service.drain(NotificationFrequency.IMMEDIATELY)

    expect(add).not.toHaveBeenCalled()
    expect(await outboxCount()).toBe(1)
  })
})
