import { CalendarChange } from "modules/calendar-log/models/difference"
import { EmailFrequency } from "modules/notifier/models/email-frequency"

export interface EmailNotifierRecipient {
  type: "email"
  email: string
}

export interface FcmNotifierRecipient {
  type: "fcm"
  token: string
}

export type NotifierRecipient = EmailNotifierRecipient | FcmNotifierRecipient

export interface OnNewSubscriptionPayload {
  groups: string[]
  emailpref: EmailFrequency
}

export interface OnCalendarChangedPayload {
  difference: CalendarChange
}

export interface OnNewSubscriptionData {
  type: "new_subscription"
  payload: OnNewSubscriptionPayload
}

export interface OnCalendarChangedData {
  type: "calendar_changed"
  payload: OnCalendarChangedPayload
}

export type NotifiyUserOptionsData =
  | OnNewSubscriptionData
  | OnCalendarChangedData

export interface NotifyUserOptions {
  recipient: NotifierRecipient
  data: NotifiyUserOptionsData
}
