import {
  OnCalendarChangedPayload,
  OnNewSubscriptionPayload,
} from "../../notifier/models/notifier"

export type SubscribeMailerTemplate = {
  template: "subscribe"
  data: OnNewSubscriptionPayload
}

export type NotificationMailerTemplate = {
  template: "notification"
  data: OnCalendarChangedPayload
}

export type AppMailerTemplate =
  | SubscribeMailerTemplate
  | NotificationMailerTemplate
