import { formatInTimeZone } from "date-fns-tz"
import { EventForChangeDetection } from "modules/calendar-log/models/change-detection/find-event-changes"
import { NotifyOptions } from "modules/firebase/models/notify-options.model"
import { NotificationLocale } from "modules/notification-subscription/models/notification-locale"
import { notificationStrings } from "modules/notifier/models/notification-strings"
import {
  CalendarChangeItem,
  OnCalendarChangedPayload,
} from "modules/notifier/models/notifier"

export const FCM_CALENDAR_CHANGED_ACTION = "calendar_changed"
export const FCM_CALENDAR_DIGEST_ACTION = "calendar_digest"
export const SCHEDULE_DIGEST_COLLAPSE_ID = "schedule-digest"
export const SCHEDULE_THREAD_ID = "schedule"

export const buildEventBody = (
  event: EventForChangeDetection,
  locale: NotificationLocale,
  timezone: string,
): string => {
  const strings = notificationStrings[locale]
  const day = formatInTimeZone(event.startsAt, timezone, strings.dayFormat, {
    locale: strings.dateFnsLocale,
  })
  const start = formatInTimeZone(event.startsAt, timezone, "p", {
    locale: strings.dateFnsLocale,
  })
  const end = formatInTimeZone(event.endsAt, timezone, "p", {
    locale: strings.dateFnsLocale,
  })

  const parts: string[] = []
  if (event.title) parts.push(event.title)
  parts.push(strings.timeRange(day, start, end))

  return `${parts.join(", ")}${event.location ? ` (${event.location})` : ""}`
}

export const buildDetailPush = (
  change: CalendarChangeItem,
  locale: NotificationLocale,
  timezone: string,
): NotifyOptions => ({
  notification: {
    title: notificationStrings[locale].detailTitle[change.type],
    body: buildEventBody(change.event, locale, timezone),
  },
  data: {
    action: FCM_CALENDAR_CHANGED_ACTION,
    payload: JSON.stringify({ type: change.type, event: change.event }),
  },
  collapseId: change.event.uid,
  threadId: SCHEDULE_THREAD_ID,
})

export const buildDigestPush = (
  count: number,
  locale: NotificationLocale,
): NotifyOptions => ({
  notification: {
    title: notificationStrings[locale].digestTitle,
    body: notificationStrings[locale].digestBody(count),
  },
  data: {
    action: FCM_CALENDAR_DIGEST_ACTION,
    count: String(count),
  },
  collapseId: SCHEDULE_DIGEST_COLLAPSE_ID,
  collapseKey: SCHEDULE_DIGEST_COLLAPSE_ID,
  threadId: SCHEDULE_THREAD_ID,
})

// Tiering: 0 changes ⇒ no push, 1 ⇒ detail, 2+ ⇒ one replaceable digest.
export const buildCalendarChangedPush = (
  payload: OnCalendarChangedPayload,
): NotifyOptions | null => {
  const { changes, locale, timezone } = payload
  if (changes.length === 0) return null
  if (changes.length === 1) return buildDetailPush(changes[0], locale, timezone)
  return buildDigestPush(changes.length, locale)
}
