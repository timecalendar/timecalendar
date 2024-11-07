import { FirebaseService } from "modules/firebase/services/firebase.service"
import { NotifyOptions } from "modules/firebase/models/notify-options.model"
import {
  FcmNotifierRecipient,
  OnCalendarChangedPayload,
} from "modules/notifier/models/notifier"
import { Notifier } from "modules/notifier/models/notifier.interface"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"
import {
  DifferenceType,
  mapDifferenceTitle,
  getNotificationBody,
} from "modules/notifier/notifiers/fcm-notifier-calendar-changed"

export const FCM_CALENDAR_CHANGED_ACTION = "calendar_changed"

export class FcmNotifier implements Notifier {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly recipient: FcmNotifierRecipient,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async onNewSubscription(): Promise<void> {}

  async onCalendarChanged(payload: OnCalendarChangedPayload): Promise<void> {
    const { difference } = payload
    const { token } = this.recipient

    const events: { type: DifferenceType; event: CalendarEvent }[] = []

    // New events
    difference.newItems.forEach((event) => {
      events.push({
        type: DifferenceType.NEW,
        event,
      })
    })

    // Canceled events
    difference.oldItems.forEach((event) => {
      events.push({
        type: DifferenceType.CANCEL,
        event,
      })
    })

    // Modified events
    difference.changedItems.forEach(({ newEvent }) => {
      events.push({
        type: DifferenceType.EDIT,
        event: newEvent,
      })
    })

    const notifications: NotifyOptions[] = events.map((event) => ({
      notification: {
        title: mapDifferenceTitle[event.type],
        body: getNotificationBody(event.event),
      },
      data: {
        action: FCM_CALENDAR_CHANGED_ACTION,
        payload: JSON.stringify(event),
      },
    }))

    notifications.forEach((notification) =>
      this.firebaseService.notify(token, notification),
    )
  }
}
