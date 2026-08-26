import { NestExpressApplication } from "@nestjs/platform-express"
import { ScrubCalendarFailureDiagnostics1787700000000 } from "migrations/1787700000000-ScrubCalendarFailureDiagnostics"
import { CalendarSyncModule } from "modules/calendar-sync/calendar-sync.module"
import createTestApp from "test-utils/create-test-app"
import { DataSource, QueryRunner } from "typeorm"

describe("ScrubCalendarFailureDiagnostics1787700000000", () => {
  let app: NestExpressApplication
  let dataSource: DataSource
  let runner: QueryRunner
  const migration = new ScrubCalendarFailureDiagnostics1787700000000()
  const forbidden = ["synthetic-login", "synthetic-password", "resource-123"]

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarSyncModule] })
    dataSource = app.get(DataSource)
  })

  afterAll(async () => app.close())

  const safeSchemaExists = async () => {
    const [{ exists }] = await dataSource.query<{ exists: boolean }[]>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = 'calendar_failure' AND column_name = 'helpKey'
       ) AS "exists"`,
    )
    return exists
  }

  const tableText = async () =>
    JSON.stringify(
      await runner.query(`SELECT * FROM "calendar_failure" ORDER BY "id"`),
    )

  it("scrubs legacy rows across up, down, and the supported forward path", async () => {
    runner = dataSource.createQueryRunner()
    await runner.connect()

    try {
      await migration.down(runner)
      await runner.query(
        `ALTER TABLE "calendar_failure" DROP CONSTRAINT "CHK_calendar_failure_error_redacted"`,
      )
      await runner.query(
        `ALTER TABLE "calendar_failure" DROP CONSTRAINT "CHK_calendar_failure_url_redacted"`,
      )
      await runner.query(
        `INSERT INTO "calendar_failure" ("url", "error") VALUES ($1, $2)`,
        [
          "https://synthetic-login:synthetic-password@example.test/export?resources=resource-123",
          "request failed for resource-123",
        ],
      )

      await migration.up(runner)
      const upText = await tableText()
      forbidden.forEach((value) => expect(upText).not.toContain(value))

      await migration.down(runner)
      const downText = await tableText()
      forbidden.forEach((value) => expect(downText).not.toContain(value))
      await expect(
        runner.query(
          `INSERT INTO "calendar_failure" ("url", "error") VALUES ('raw', 'raw')`,
        ),
      ).rejects.toThrow()

      await migration.up(runner)
      const forwardText = await tableText()
      forbidden.forEach((value) => expect(forwardText).not.toContain(value))
    } finally {
      if (!(await safeSchemaExists())) await migration.up(runner)
      await runner.release()
    }
  })
})
