import { Injectable } from "@nestjs/common"
import { now } from "modules/shared/dates/now"
import {
  filterByDaysAhead,
  mergeCalendarChanges,
} from "modules/notification-pipeline/models/merge-calendar-changes"
import {
  DrainedOutboxRow,
  NotificationOutboxRepository,
} from "modules/notification-pipeline/repositories/notification-outbox.repository"
import { NotificationFrequency } from "modules/notification-subscription/models/notification-frequency.enum"
import { NotifierService } from "modules/notifier/services/notifier.service"

export const DRAIN_BATCH_SIZE = 500

@Injectable()
export class NotificationDrainService {
  constructor(
    private readonly outboxRepository: NotificationOutboxRepository,
    private readonly notifierService: NotifierService,
  ) {}

  async drain(frequency: NotificationFrequency): Promise<void> {
    let drained: number
    do {
      drained = await this.outboxRepository.drainBatch(
        frequency,
        DRAIN_BATCH_SIZE,
        (rows) => this.notifySubscriptions(rows),
      )
    } while (drained === DRAIN_BATCH_SIZE)
  }

  private async notifySubscriptions(rows: DrainedOutboxRow[]): Promise<void> {
    const bySubscription = new Map<string, DrainedOutboxRow[]>()
    for (const row of rows) {
      const group = bySubscription.get(row.subscriptionId) ?? []
      group.push(row)
      bySubscription.set(row.subscriptionId, group)
    }

    for (const [subscriptionId, group] of bySubscription) {
      // Deactivated or token-less subscriptions get no push; their rows are
      // still deleted by the caller so they never clog the outbox.
      const { isActive, token, locale, timezone, nbDaysAhead } = group[0]
      if (!isActive || !token) continue

      const merged = mergeCalendarChanges(
        group.map((row) => row.calendarChange),
      )
      const changes = filterByDaysAhead(merged, nbDaysAhead, now())

      await this.notifierService.notifyUser({
        recipient: { type: "fcm", token },
        data: {
          type: "calendar_changed",
          payload: { subscriptionId, changes, locale, timezone },
        },
      })
    }
  }
}
