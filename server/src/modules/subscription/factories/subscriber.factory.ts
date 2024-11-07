import { SubscriberType } from "modules/subscription/models/subscriber-type.enum"
import { Subscriber } from "modules/subscription/models/subscriber.entity"
import { SubscriptionFrequency } from "modules/subscription/models/subscription-frequency.enum"
import { AppFactory } from "test-utils/factories/app-factory"
import { factoryBuilder } from "test-utils/factories/factory-builder"

export class SubscriberFactory extends AppFactory<Subscriber> {
  email() {
    return this.params({
      type: SubscriberType.EMAIL,
      email: "email@example.com",
      firebaseToken: null,
    })
  }
}

export const subscriberFactory = factoryBuilder(() => [
  Subscriber,
  SubscriberFactory.define(
    () =>
      ({
        firebaseToken: "fcm_fake_token",
        email: null,
        type: SubscriberType.FIREBASE,
        notificationDays: 30,
        isEnabled: true,
        frequency: SubscriptionFrequency.IMMEDIATELY,
      }) as Partial<Subscriber> as Subscriber,
  ),
])
