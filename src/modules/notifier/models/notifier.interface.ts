import { OnNewSubscriptionPayload, OnCalendarChangedPayload } from "./notifier"

export interface Notifier {
  onNewSubscription(payload: OnNewSubscriptionPayload): Promise<void>
  onCalendarChanged(payload: OnCalendarChangedPayload): Promise<void>
}
