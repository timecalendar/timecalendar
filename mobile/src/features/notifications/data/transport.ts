import { notificationSubscriptionControllerCreateOrUpdateSubscription } from "@/api/generated/notification-subscription/notification-subscription"
import type { NotificationSubscriptionCreate } from "@/api/generated/timeCalendar.schemas"

export type NotificationSubscriptionTransport = (
  snapshot: NotificationSubscriptionCreate,
  signal: AbortSignal,
) => Promise<void>

export const putNotificationSubscription: NotificationSubscriptionTransport = (
  snapshot,
  signal,
) =>
  notificationSubscriptionControllerCreateOrUpdateSubscription(snapshot, {
    signal,
  })
