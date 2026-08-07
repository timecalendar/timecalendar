import { NestExpressApplication } from "@nestjs/platform-express"
import { subDays, subYears } from "date-fns"
import { calendarLogFactory } from "modules/calendar-log/factories/calendar-log.factory"
import { CalendarLogModule } from "modules/calendar-log/calendar-log.module"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { CalendarLogRepository } from "modules/calendar-log/repositories/calendar-log.repository"
import createTestApp from "test-utils/create-test-app"
import { DataSource } from "typeorm"

describe("CalendarLogRepository.pruneOlderThan", () => {
  let app: NestExpressApplication
  let repository: CalendarLogRepository
  let dataSource: DataSource

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarLogModule] })
    repository = app.get(CalendarLogRepository)
    dataSource = app.get(DataSource)
  })

  const backdate = (id: string, createdAt: Date) =>
    dataSource.query(
      `UPDATE "calendar_log" SET "createdAt" = $2 WHERE "id" = $1`,
      [id, createdAt],
    )

  it("deletes rows older than the cutoff in bounded batches", async () => {
    const oldLogs = await calendarLogFactory().calendar().createList(5)
    for (const log of oldLogs) {
      await backdate(log.id, subYears(new Date(), 2))
    }
    const recentLog = await calendarLogFactory().calendar().create()

    const deleted = await repository.pruneOlderThan(subYears(new Date(), 1), 2)

    expect(deleted).toBe(5)
    const remaining = await dataSource.getRepository(CalendarLog).find()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe(recentLog.id)
  })

  it("keeps rows at or newer than the cutoff", async () => {
    const log = await calendarLogFactory().calendar().create()
    await backdate(log.id, subDays(new Date(), 300))

    const deleted = await repository.pruneOlderThan(
      subYears(new Date(), 1),
      100,
    )

    expect(deleted).toBe(0)
    expect(await dataSource.getRepository(CalendarLog).count()).toBe(1)
  })
})
