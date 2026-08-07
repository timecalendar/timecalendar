import { EventForChangeDetection } from "modules/calendar-log/models/change-detection/find-event-changes"
import { NotificationLocale } from "modules/notification-subscription/models/notification-locale"

export interface FcmNotifierRecipient {
  type: "fcm"
  token: string
}

export type NotifierRecipient = FcmNotifierRecipient

// Wire contract v2: lowercase is canonical.
export type CalendarChangeType = "new" | "edit" | "cancel"

export interface CalendarChangeItem {
  type: CalendarChangeType
  event: EventForChangeDetection
}

// The merged, nbDaysAhead-filtered change set for one subscription — each
// channel implementation formats it its own way.
export interface OnCalendarChangedPayload {
  subscriptionId: string
  changes: CalendarChangeItem[]
  locale: NotificationLocale
  timezone: string
}

export interface OnCalendarChangedData {
  type: "calendar_changed"
  payload: OnCalendarChangedPayload
}

export type NotifiyUserOptionsData = OnCalendarChangedData

export interface NotifyUserOptions {
  recipient: NotifierRecipient
  data: NotifiyUserOptionsData
}
