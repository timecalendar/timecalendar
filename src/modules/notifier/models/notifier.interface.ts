import {
  OnCalendarChangedPayload,
  OnNewSubscriptionPayload,
} from "modules/notifier/models/notifier"

export interface Notifier {
  onNewSubscription(payload: OnNewSubscriptionPayload): Promise<void>
  onCalendarChanged(payload: OnCalendarChangedPayload): Promise<void>
}
