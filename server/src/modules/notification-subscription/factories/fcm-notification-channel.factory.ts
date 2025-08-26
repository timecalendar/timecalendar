import { FcmNotificationChannel } from "modules/notification-subscription/models/entities/fcm-notification-channel.entity"
import { nanoid } from "nanoid"
import { AppFactory } from "test-utils/factories/app-factory"
import { factoryBuilder } from "test-utils/factories/factory-builder"

interface TransientParams {
  token?: string
}

export class FcmNotificationChannelFactory extends AppFactory<
  FcmNotificationChannel,
  TransientParams
> {}

export const fcmNotificationChannelFactory = factoryBuilder(() => [
  FcmNotificationChannel,
  FcmNotificationChannelFactory.define(
    ({ transientParams }) =>
      ({
        token: transientParams.token || `fcm_${nanoid()}`,
      }) as FcmNotificationChannel,
  ),
])
