import { Difference } from "modules/difference/models/difference"
import { EmailFrequency } from "./email-frequency"

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
  difference: Difference
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
