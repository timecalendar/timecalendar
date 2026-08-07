import { NestExpressApplication } from "@nestjs/platform-express"
import { calendarLogFactory } from "modules/calendar-log/factories/calendar-log.factory"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { notificationSubscriptionFactory } from "modules/notification-subscription/factories/notification-subscription.factory"
import { NotificationFrequency } from "modules/notification-subscription/models/notification-frequency.enum"
import { NOTIFY_FANOUT_CURSOR_ID } from "modules/notification-pipeline/models/entities/notify-fanout-cursor.entity"
import { SubscriberCalendarLog } from "modules/notification-pipeline/models/entities/subscriber-calendar-log.entity"
import { NotificationPipelineModule } from "modules/notification-pipeline/notification-pipeline.module"
import { NotificationOutboxRepository } from "modules/notification-pipeline/repositories/notification-outbox.repository"
import createTestApp from "test-utils/create-test-app"
import { DataSource } from "typeorm"

describe("NotificationOutboxRepository", () => {
  let app: NestExpressApplication
  let repository: NotificationOutboxRepository
  let dataSource: DataSource

  beforeAll(async () => {
    app = await createTestApp({ imports: [NotificationPipelineModule] })
    repository = app.get(NotificationOutboxRepository)
    dataSource = app.get(DataSource)
  })

  const setCursor = (cursor: Date) =>
    dataSource.query(
      `INSERT INTO "notify_fanout_cursor" ("id", "cursor") VALUES ($1, $2)
       ON CONFLICT ("id") DO UPDATE SET "cursor" = $2`,
      [NOTIFY_FANOUT_CURSOR_ID, cursor],
    )

  const getCursor = async (): Promise<Date> => {
    const [row] = await dataSource.query(
      `SELECT "cursor" FROM "notify_fanout_cursor" WHERE "id" = $1`,
      [NOTIFY_FANOUT_CURSOR_ID],
    )
    return row.cursor
  }

  const outboxRows = () =>
    dataSource.getRepository(SubscriberCalendarLog).find()

  describe("fanOut", () => {
    it("inserts one outbox row per (subscription, log) pair", async () => {
      const calendar = await calendarFactory().create()
      const subscriptions = await notificationSubscriptionFactory()
        .withCalendars([calendar])
        .createList(2)
      const logs = await calendarLogFactory()
        .calendar(calendar.id)
        .createList(2)
      await setCursor(new Date(0))

      const inserted = await repository.fanOut(0)

      expect(inserted).toBe(4)
      const rows = await outboxRows()
      expect(rows).toHaveLength(4)
      const pairs = rows.map((r) => `${r.subscriptionId}:${r.calendarLogId}`)
      for (const subscription of subscriptions) {
        for (const log of logs) {
          expect(pairs).toContain(`${subscription.id}:${log.id}`)
        }
      }
      expect(
        rows.every((r) => r.frequency === subscriptions[0].frequency),
      ).toBe(true)
    })

    it("skips inactive subscriptions", async () => {
      const calendar = await calendarFactory().create()
      const active = await notificationSubscriptionFactory()
        .withCalendars([calendar])
        .create()
      await notificationSubscriptionFactory()
        .withCalendars([calendar])
        .create({ isActive: false })
      await calendarLogFactory().calendar(calendar.id).create()
      await setCursor(new Date(0))

      await repository.fanOut(0)

      const rows = await outboxRows()
      expect(rows).toHaveLength(1)
      expect(rows[0].subscriptionId).toBe(active.id)
    })

    it("is idempotent on cursor replay", async () => {
      const calendar = await calendarFactory().create()
      await notificationSubscriptionFactory().withCalendars([calendar]).create()
      await calendarLogFactory().calendar(calendar.id).create()
      await setCursor(new Date(0))

      const first = await repository.fanOut(0)
      // Simulate a crash-before-commit rerun: rewind the cursor and replay.
      await setCursor(new Date(0))
      const second = await repository.fanOut(0)

      expect(first).toBe(1)
      expect(second).toBe(0)
      expect(await outboxRows()).toHaveLength(1)
    })

    it("does nothing when no logs are newer than the cursor", async () => {
      const calendar = await calendarFactory().create()
      await notificationSubscriptionFactory().withCalendars([calendar]).create()
      await calendarLogFactory().calendar(calendar.id).create()

      await repository.fanOut(0)
      await setCursor(new Date())

      const inserted = await repository.fanOut(0)

      expect(inserted).toBe(0)
    })

    it("initializes a missing cursor to now, ignoring pre-existing history", async () => {
      const calendar = await calendarFactory().create()
      await notificationSubscriptionFactory().withCalendars([calendar]).create()
      await calendarLogFactory().calendar(calendar.id).create()

      const inserted = await repository.fanOut(0)

      expect(inserted).toBe(0)
      expect(await outboxRows()).toHaveLength(0)
    })

    it("advances the cursor so later logs are picked up next tick", async () => {
      const calendar = await calendarFactory().create()
      await notificationSubscriptionFactory().withCalendars([calendar]).create()
      await calendarLogFactory().calendar(calendar.id).create()
      await setCursor(new Date(0))

      await repository.fanOut(0)
      const cursorAfterFirst = await getCursor()
      expect(cursorAfterFirst.getTime()).toBeGreaterThan(0)

      await calendarLogFactory().calendar(calendar.id).create()
      const inserted = await repository.fanOut(0)

      expect(inserted).toBe(1)
      expect(await outboxRows()).toHaveLength(2)
    })

    it("leaves logs inside the safety lag window for the next tick", async () => {
      const calendar = await calendarFactory().create()
      await notificationSubscriptionFactory().withCalendars([calendar]).create()
      await calendarLogFactory().calendar(calendar.id).create()
      await setCursor(new Date(0))

      const inserted = await repository.fanOut(3600)
      expect(inserted).toBe(0)

      const insertedAfterLag = await repository.fanOut(0)
      expect(insertedAfterLag).toBe(1)
    })
  })

  describe("drainBatch", () => {
    const seedOutboxRows = async (count: number) => {
      const calendar = await calendarFactory().create()
      const subscription = await notificationSubscriptionFactory()
        .withCalendars([calendar])
        .create()
      const logs = await calendarLogFactory()
        .calendar(calendar.id)
        .createList(count)
      await dataSource.getRepository(SubscriberCalendarLog).save(
        logs.map((log) => ({
          subscriptionId: subscription.id,
          calendarLogId: log.id,
          frequency: NotificationFrequency.IMMEDIATELY,
        })),
      )
    }

    it("drains in batches until the tier is empty", async () => {
      await seedOutboxRows(5)
      const seen: number[] = []

      let drained: number
      do {
        drained = await repository.drainBatch(
          NotificationFrequency.IMMEDIATELY,
          2,
          async (rows) => {
            seen.push(rows.length)
          },
        )
      } while (drained > 0)

      expect(seen).toEqual([2, 2, 1])
      expect(await outboxRows()).toHaveLength(0)
    })

    it("keeps rows when the handler throws (delete-on-enqueue)", async () => {
      await seedOutboxRows(2)

      await expect(
        repository.drainBatch(NotificationFrequency.IMMEDIATELY, 500, () => {
          throw new Error("enqueue failed")
        }),
      ).rejects.toThrow("enqueue failed")

      expect(await outboxRows()).toHaveLength(2)
    })

    it("skips rows locked by a concurrent drain (SKIP LOCKED)", async () => {
      await seedOutboxRows(3)

      let releaseFirst!: () => void
      const firstHolds = new Promise<void>((resolve) => {
        releaseFirst = resolve
      })
      let firstSawRows = 0

      const first = repository.drainBatch(
        NotificationFrequency.IMMEDIATELY,
        500,
        async (rows) => {
          firstSawRows = rows.length
          await firstHolds
        },
      )
      // Give the first transaction time to take its locks.
      await new Promise((resolve) => setTimeout(resolve, 200))

      const second = await repository.drainBatch(
        NotificationFrequency.IMMEDIATELY,
        500,
        async () => {
          throw new Error("second drain must not receive locked rows")
        },
      )

      expect(second).toBe(0)
      releaseFirst()
      expect(await first).toBe(3)
      expect(firstSawRows).toBe(3)
      expect(await outboxRows()).toHaveLength(0)
    })
  })
})
