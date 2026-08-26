import { NestExpressApplication } from "@nestjs/platform-express"
import { AddCalendarSyncPlannedAt1787641039755 } from "migrations/1787641039755-AddCalendarSyncPlannedAt"
import { CalendarModule } from "modules/calendar/calendar.module"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import createTestApp from "test-utils/create-test-app"
import { DataSource, QueryRunner } from "typeorm"

describe("AddCalendarSyncPlannedAt1787641039755", () => {
  let app: NestExpressApplication
  let dataSource: DataSource
  let runner: QueryRunner
  const migration = new AddCalendarSyncPlannedAt1787641039755()

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarModule] })
    dataSource = app.get(DataSource)
  })

  afterAll(async () => {
    await app.close()
  })

  const columnExists = async () => {
    const [{ exists }] = await dataSource.query<{ exists: boolean }[]>(
      `SELECT EXISTS (
         SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'calendar'
           AND column_name = 'syncPlannedAt'
       ) AS "exists"`,
    )
    return exists
  }

  it("round-trips representative rows and restores the worker schema", async () => {
    const now = new Date("2026-08-25T12:00:00.000Z")
    const rows = await Promise.all([
      calendarFactory().create({
        url: "https://calendar.example.test/generic.ics",
        lastUpdatedAt: new Date("2026-08-25T11:30:00.000Z"),
        lastAccessedAt: now,
      }),
      calendarFactory().create({
        url: "https://adelb.univ-lyon1.fr/calendar.ics",
        lastUpdatedAt: new Date("2026-08-25T10:00:00.000Z"),
        lastAccessedAt: now,
      }),
      calendarFactory().create({
        url: "https://calendar.example.test/old.ics",
        lastUpdatedAt: new Date("2026-07-01T00:00:00.000Z"),
        lastAccessedAt: new Date("2026-07-01T00:00:00.000Z"),
      }),
      calendarFactory().create({
        url: "https://adelb.univ-lyon1.fr/inactive.ics",
        lastUpdatedAt: new Date("2026-08-25T11:45:00.000Z"),
        lastAccessedAt: null,
      }),
    ])

    runner = dataSource.createQueryRunner()
    await runner.connect()
    const [{ walStart }] = await runner.manager.query<{ walStart: string }[]>(
      `SELECT pg_current_wal_lsn()::text AS "walStart"`,
    )
    let upMs = 0
    let downMs = 0
    let restoreUpMs = 0
    let relationBytes = "0"
    let sampledLockModes: string[] = []

    try {
      await runner.query(
        `DROP INDEX IF EXISTS "public"."IDX_calendar_syncPlannedAt"`,
      )
      await runner.query(`ALTER TABLE "calendar" DROP COLUMN "syncPlannedAt"`)

      const upStartedAt = performance.now()
      await migration.up(runner)
      upMs = performance.now() - upStartedAt
      ;[{ relationBytes }] = await runner.manager.query<
        { relationBytes: string }[]
      >(
        `SELECT pg_total_relation_size('public.calendar')::text AS "relationBytes"`,
      )
      const lockRows = await runner.manager.query<{ mode: string }[]>(
        `SELECT DISTINCT mode
         FROM pg_locks
         WHERE pid = pg_backend_pid()
           AND relation = 'public.calendar'::regclass
         ORDER BY mode`,
      )
      sampledLockModes = lockRows.map(({ mode }) => mode)

      const plans = await runner.manager.query<
        { id: string; floorMinutes: number; syncPlannedAt: Date }[]
      >(
        `SELECT "id",
                EXTRACT(EPOCH FROM ("syncPlannedAt" - "lastUpdatedAt")) / 60 AS "floorMinutes",
                "syncPlannedAt"
         FROM "calendar"
         ORDER BY "id"`,
      )
      expect(plans).toHaveLength(rows.length)
      expect(plans.every(({ floorMinutes }) => +floorMinutes === 60)).toBe(true)
      expect(plans.every(({ syncPlannedAt }) => syncPlannedAt != null)).toBe(
        true,
      )

      const [{ indexExists }] = await runner.manager.query<
        { indexExists: boolean }[]
      >(
        `SELECT to_regclass('public."IDX_calendar_syncPlannedAt"') IS NOT NULL AS "indexExists"`,
      )
      expect(indexExists).toBe(true)

      const [{ dueBeforeHour, dueAfterHour }] = await runner.manager.query<
        { dueBeforeHour: string; dueAfterHour: string }[]
      >(
        `SELECT count(*) FILTER (WHERE "syncPlannedAt" <= $1)::text AS "dueBeforeHour",
                count(*) FILTER (WHERE "syncPlannedAt" <= $2)::text AS "dueAfterHour"
         FROM "calendar"`,
        [
          new Date("2026-08-25T12:29:59.999Z"),
          new Date("2026-08-25T12:30:00.000Z"),
        ],
      )
      expect(+dueBeforeHour).toBe(2)
      expect(+dueAfterHour).toBe(3)

      const downStartedAt = performance.now()
      await migration.down(runner)
      downMs = performance.now() - downStartedAt

      expect(await columnExists()).toBe(false)
      const [{ count: baseRowCount }] = await runner.manager.query<
        { count: string }[]
      >(`SELECT count(*)::text AS "count" FROM "calendar"`)
      expect(+baseRowCount).toBe(rows.length)
      const [{ indexStillExists }] = await runner.manager.query<
        { indexStillExists: boolean }[]
      >(
        `SELECT to_regclass('public."IDX_calendar_syncPlannedAt"') IS NOT NULL AS "indexStillExists"`,
      )
      expect(indexStillExists).toBe(false)
    } finally {
      if (!(await columnExists())) {
        const restoreStartedAt = performance.now()
        await migration.up(runner)
        restoreUpMs = performance.now() - restoreStartedAt
      }
      const [{ walBytes, blockedSessions }] = await runner.manager.query<
        { walBytes: string; blockedSessions: string }[]
      >(
        `SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), $1)::text AS "walBytes",
                (SELECT count(*)::text
                 FROM pg_stat_activity
                 WHERE cardinality(pg_blocking_pids(pid)) > 0) AS "blockedSessions"`,
        [walStart],
      )
      console.info(
        "sanitized migration evidence",
        JSON.stringify({
          rowCount: rows.length,
          relationBytes: +relationBytes,
          upMs: +upMs.toFixed(3),
          downMs: +downMs.toFixed(3),
          restoreUpMs: +restoreUpMs.toFixed(3),
          sampledLockModes,
          blockedSessions: +blockedSessions,
          walBytes: +walBytes,
        }),
      )
      await runner.release()
    }
  })
})
