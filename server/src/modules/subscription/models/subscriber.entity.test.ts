import { NestExpressApplication } from "@nestjs/platform-express"
import { subscriberFactory } from "modules/subscription/factories/subscriber.factory"
import { SubscriberType } from "modules/subscription/models/subscriber-type.enum"
import { Subscriber } from "modules/subscription/models/subscriber.entity"
import { SubscriptionModule } from "modules/subscription/subscription.module"
import createTestApp from "test-utils/create-test-app"
import { assertChanges } from "test-utils/typeorm/assert-changes"
import { DataSource, Repository } from "typeorm"

describe("SubscriberEntity", () => {
  let app: NestExpressApplication
  let dataSource: DataSource
  let repository: Repository<Subscriber>

  beforeAll(async () => {
    app = await createTestApp({ imports: [SubscriptionModule] })
    dataSource = app.get(DataSource)
    repository = dataSource.getRepository(Subscriber)
  })

  describe("create", () => {
    it("creates an email subscriber", async () => {
      await assertChanges(dataSource, [[Subscriber, 1]], () =>
        subscriberFactory().email().create(),
      )

      const subscribers = await repository.find()

      expect(subscribers.length).toBe(1)
      expect(subscribers[0]).toMatchObject({
        type: SubscriberType.EMAIL,
        email: "email@example.com",
      })
    })

    it("creates a firebase subscriber", async () => {
      await assertChanges(dataSource, [[Subscriber, 1]], () =>
        subscriberFactory().create(),
      )

      const subscribers = await repository.find()

      expect(subscribers.length).toBe(1)
      expect(subscribers[0]).toMatchObject({
        type: SubscriberType.FIREBASE,
        firebaseToken: "fcm_fake_token",
      })
    })

    it("cannot create an email subscriber without a valid email", async () => {
      const promise = subscriberFactory()
        .email()
        .create({ email: "invalid-email" })

      await expect(promise).rejects.toThrow("Validation failed")
    })

    it("cannot create a firebase subscriber with an empty token", async () => {
      const promise = subscriberFactory().create({ firebaseToken: "" })

      await expect(promise).rejects.toThrow("Validation failed")
    })

    it("cannot create a subscriber with an invalid notificationDays", async () => {
      const promise = subscriberFactory().create({ notificationDays: 2 })

      await expect(promise).rejects.toThrow("Validation failed")
    })

    it("cannot create a subscriber with an invalid frequency", async () => {
      const promise = subscriberFactory().create({
        frequency: "invalid-frequency" as any,
      })

      await expect(promise).rejects.toThrow("Validation failed")
    })
  })
})
