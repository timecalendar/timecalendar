import { JobProcessor, JobProcessorInterface } from "@lyrolab/nest-shared/queue"
import { Injectable } from "@nestjs/common"
import { NOTIFICATIONS_QUEUE } from "config/queues"
import { formatInTimeZone } from "date-fns-tz"
import { NotificationDrainService } from "modules/notification-pipeline/services/notification-drain.service"
import { NotificationFrequency } from "modules/notification-subscription/models/notification-frequency.enum"
import { now } from "modules/shared/dates/now"

export const DRAIN_IMMEDIATELY_JOB = "drain_notifications_immediately"
export const DRAIN_HOURLY_JOB = "drain_notifications_hourly"
export const DRAIN_DAILY_JOB = "drain_notifications_daily"

export const DAILY_DIGEST_TIMEZONE = "Europe/Paris"
export const DAILY_DIGEST_LOCAL_HOUR = "19"

@Injectable()
@JobProcessor({
  name: DRAIN_IMMEDIATELY_JOB,
  cron: "*/5 * * * *",
  queue: NOTIFICATIONS_QUEUE,
})
export class DrainNotificationsImmediatelyJob implements JobProcessorInterface {
  constructor(private readonly drainService: NotificationDrainService) {}

  async process() {
    await this.drainService.drain(NotificationFrequency.IMMEDIATELY)
  }
}

@Injectable()
@JobProcessor({
  name: DRAIN_HOURLY_JOB,
  cron: "0 * * * *",
  queue: NOTIFICATIONS_QUEUE,
})
export class DrainNotificationsHourlyJob implements JobProcessorInterface {
  constructor(private readonly drainService: NotificationDrainService) {}

  async process() {
    await this.drainService.drain(NotificationFrequency.HOURLY)
  }
}

// The scheduler has no timezone support (cron patterns run in server time,
// UTC in Docker), so 19:00 Europe/Paris is expressed as both candidate UTC
// hours (17 = summer, 18 = winter) plus a Paris-local-hour guard — DST-proof
// without touching the queue lib.
@Injectable()
@JobProcessor({
  name: DRAIN_DAILY_JOB,
  cron: "0 17,18 * * *",
  queue: NOTIFICATIONS_QUEUE,
})
export class DrainNotificationsDailyJob implements JobProcessorInterface {
  constructor(private readonly drainService: NotificationDrainService) {}

  async process() {
    const parisHour = formatInTimeZone(now(), DAILY_DIGEST_TIMEZONE, "HH")
    if (parisHour !== DAILY_DIGEST_LOCAL_HOUR) return

    await this.drainService.drain(NotificationFrequency.DAILY)
  }
}
