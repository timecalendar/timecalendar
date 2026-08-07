import { NestExpressApplication } from "@nestjs/platform-express"
import { Job } from "bullmq"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { FirebaseService } from "modules/firebase/services/firebase.service"
import { notificationSubscriptionFactory } from "modules/notification-subscription/factories/notification-subscription.factory"
import { NotificationSubscription } from "modules/notification-subscription/models/entities/notification-subscription.entity"
import {
  SendPushJobData,
  sendPushJobOptions,
} from "modules/notifier/jobs/send-push.constants"
import { SendPushJob } from "modules/notifier/jobs/send-push.job"
import { NotifierModule } from "modules/notifier/notifier.module"
import createTestApp from "test-utils/create-test-app"
import { DataSource } from "typeorm"

describe("SendPushJob", () => {
  let app: NestExpressApplication
  let job: SendPushJob
  let dataSource: DataSource
  const notify = jest.fn()

  beforeAll(async () => {
    app = await createTestApp(
      { imports: [NotifierModule] },
      { overrides: [{ provide: FirebaseService, useValue: { notify } }] },
    )
    job = app.get(SendPushJob)
    dataSource = app.get(DataSource)
  })

  beforeEach(() => {
    notify.mockReset()
  })

  const createSubscription = async () => {
    const calendar = await calendarFactory().create()
    return notificationSubscriptionFactory().withCalendars([calendar]).create()
  }

  const buildJob = (subscriptionId: string): Job<SendPushJobData> =>
    ({
      data: {
        subscriptionId,
        token: "token-123",
        push: {
          notification: { title: "t", body: "b" },
          data: { action: "calendar_changed" },
        },
      },
    }) as unknown as Job<SendPushJobData>

  it("makes one awaited FCM call and keeps the subscription active on success", async () => {
    notify.mockResolvedValue("message-id")
    const subscription = await createSubscription()

    await job.process(buildJob(subscription.id))

    expect(notify).toHaveBeenCalledTimes(1)
    expect(notify).toHaveBeenCalledWith("token-123", {
      notification: { title: "t", body: "b" },
      data: { action: "calendar_changed" },
    })
    const reloaded = await dataSource
      .getRepository(NotificationSubscription)
      .findOneByOrFail({ id: subscription.id })
    expect(reloaded.isActive).toBe(true)
  })

  it("deactivates the subscription on an invalid token without throwing", async () => {
    notify.mockResolvedValue(null)
    const subscription = await createSubscription()

    await expect(
      job.process(buildJob(subscription.id)),
    ).resolves.toBeUndefined()

    const reloaded = await dataSource
      .getRepository(NotificationSubscription)
      .findOneByOrFail({ id: subscription.id })
    expect(reloaded.isActive).toBe(false)
  })

  it("rethrows transient FCM failures so BullMQ retries", async () => {
    notify.mockRejectedValue(new Error("FCM unavailable"))
    const subscription = await createSubscription()

    await expect(job.process(buildJob(subscription.id))).rejects.toThrow(
      "FCM unavailable",
    )

    const reloaded = await dataSource
      .getRepository(NotificationSubscription)
      .findOneByOrFail({ id: subscription.id })
    expect(reloaded.isActive).toBe(true)
  })

  it("is enqueued with retry options (3 attempts, exponential backoff)", () => {
    expect(sendPushJobOptions).toMatchObject({
      attempts: 3,
      backoff: { type: "exponential", delay: 60_000 },
    })
  })
})
