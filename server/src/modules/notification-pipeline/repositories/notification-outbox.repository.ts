import { Injectable } from "@nestjs/common"
import { NotificationLocale } from "modules/notification-subscription/models/notification-locale"
import { NotificationFrequency } from "modules/notification-subscription/models/notification-frequency.enum"
import { NOTIFY_FANOUT_CURSOR_ID } from "modules/notification-pipeline/models/entities/notify-fanout-cursor.entity"
import { SerializedCalendarChange } from "modules/notification-pipeline/models/merge-calendar-changes"
import { DataSource } from "typeorm"

export interface DrainedOutboxRow {
  id: string
  subscriptionId: string
  calendarChange: SerializedCalendarChange
  locale: NotificationLocale
  timezone: string
  nbDaysAhead: number
  isActive: boolean
  token: string | null
}

// Upper bound of each fan-out tick is `now() - lag`, not `now()`: a calendar
// sync transaction stamps calendar_log.createdAt at INSERT time but the row
// only becomes visible at COMMIT. Scanning right up to now() could advance the
// cursor past a row whose commit is still in flight, losing it forever. The
// lag only assumes no writing transaction lives longer than it.
export const FANOUT_SAFETY_LAG_SECONDS = 60

@Injectable()
export class NotificationOutboxRepository {
  constructor(private readonly dataSource: DataSource) {}

  async fanOut(
    safetyLagSeconds: number = FANOUT_SAFETY_LAG_SECONDS,
  ): Promise<number> {
    // All time arithmetic happens DB-side: within one transaction now() is
    // constant (transaction_timestamp) and shares the clock that stamps
    // calendar_log.createdAt defaults — no app/DB clock skew.
    const lag = `${safetyLagSeconds} seconds`

    return this.dataSource.transaction(async (manager) => {
      // Missing row (fresh environment): initialize to now() so pre-existing
      // history never fans out as a storm. The migration seeds production.
      await manager.query(
        `INSERT INTO "notify_fanout_cursor" ("id", "cursor")
         VALUES ($1, now()::timestamp)
         ON CONFLICT ("id") DO NOTHING`,
        [NOTIFY_FANOUT_CURSOR_ID],
      )
      const [row]: [{ cursor: Date }] = await manager.query(
        `SELECT "cursor" FROM "notify_fanout_cursor" WHERE "id" = $1 FOR UPDATE`,
        [NOTIFY_FANOUT_CURSOR_ID],
      )

      const inserted: { id: string }[] = await manager.query(
        `INSERT INTO "subscriber_calendar_log" ("subscriptionId", "calendarLogId", "frequency")
         SELECT cns."notificationSubscriptionId", cl."id", ns."frequency"
         FROM "calendar_log" cl
         JOIN "calendar_notification_subscription" cns ON cns."calendarId" = cl."calendarId"
         JOIN "notification_subscription" ns ON ns."id" = cns."notificationSubscriptionId"
         WHERE cl."createdAt" > $1
           AND cl."createdAt" <= now()::timestamp - $2::interval
           AND ns."isActive" = true
         ON CONFLICT ("subscriptionId", "calendarLogId") DO NOTHING
         RETURNING "id"`,
        [row.cursor, lag],
      )

      await manager.query(
        `UPDATE "notify_fanout_cursor"
         SET "cursor" = GREATEST("cursor", now()::timestamp - $2::interval)
         WHERE "id" = $1`,
        [NOTIFY_FANOUT_CURSOR_ID, lag],
      )

      return inserted.length
    })
  }

  // One drain batch in one transaction: lock up to `batchSize` rows of the
  // tier (SKIP LOCKED makes overlapping runs safe), hand them to `handler`
  // (which enqueues pushes), then delete them. Handler failure rolls the
  // transaction back — rows survive until enqueue succeeded (design D2).
  async drainBatch(
    frequency: NotificationFrequency,
    batchSize: number,
    handler: (rows: DrainedOutboxRow[]) => Promise<void>,
  ): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const rows: DrainedOutboxRow[] = await manager.query(
        `SELECT scl."id", scl."subscriptionId", cl."calendarChange",
                ns."locale", ns."timezone", ns."nbDaysAhead", ns."isActive",
                fc."token"
         FROM "subscriber_calendar_log" scl
         JOIN "calendar_log" cl ON cl."id" = scl."calendarLogId"
         JOIN "notification_subscription" ns ON ns."id" = scl."subscriptionId"
         LEFT JOIN "fcm_notification_channel" fc ON fc."notificationSubscriptionId" = ns."id"
         WHERE scl."frequency" = $1
         ORDER BY scl."createdAt"
         LIMIT $2
         FOR UPDATE OF scl SKIP LOCKED`,
        [frequency, batchSize],
      )
      if (rows.length === 0) return 0

      await handler(rows)

      await manager.query(
        `DELETE FROM "subscriber_calendar_log" WHERE "id" = ANY($1)`,
        [rows.map((row) => row.id)],
      )

      return rows.length
    })
  }
}
