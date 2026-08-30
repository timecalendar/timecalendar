import { SharedDatabaseModule } from "@lyrolab/nest-shared/database"
import { NestExpressApplication } from "@nestjs/platform-express"
import request from "lib/supertest"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { CalendarLogModule } from "modules/calendar-log/calendar-log.module"
import { Calendar } from "modules/calendar/models/calendar.entity"
import createTestApp from "test-utils/create-test-app"
import { DataSource } from "typeorm"
import {
  E2E_ACTIVITY_BASELINE_LOG_ID,
  E2E_ACTIVITY_BASELINE_TOKEN,
  E2E_ACTIVITY_CALENDAR_ID,
  E2E_ACTIVITY_CALENDAR_TOKEN,
  E2E_ACTIVITY_OLDER_ANCHOR_ID,
  E2E_ACTIVITY_TIE_HIGHER_ID,
  E2E_ACTIVITY_TIE_LOWER_ID,
  seedE2eActivity,
} from "./seed-e2e-activity"

const SEARCH = "/v1/calendar-logs/search"

describe("E2E Activity seed", () => {
  let app: NestExpressApplication
  let dataSource: DataSource

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarLogModule] })
    dataSource = SharedDatabaseModule.getTestDataSource()
  })

  afterAll(async () => {
    await app.close()
  })

  const search = (body: object) => request(app).post(SEARCH).send(body)

  it("restores the staged fixture and proves its real HTTP page boundary", async () => {
    await seedE2eActivity(dataSource)

    const baseline = await search({
      tokens: [E2E_ACTIVITY_BASELINE_TOKEN],
      limit: 50,
    }).expect(200)
    expect(baseline.body.items.map((item: { id: string }) => item.id)).toEqual([
      E2E_ACTIVITY_BASELINE_LOG_ID,
    ])
    expect(baseline.body.nextCursor).toBeNull()

    const unreadSince = baseline.body.items[0].createdAt as string
    const first = await search({
      tokens: [E2E_ACTIVITY_BASELINE_TOKEN, E2E_ACTIVITY_CALENDAR_TOKEN],
      unreadSince,
      limit: 50,
    }).expect(200)
    expect(first.body.items).toHaveLength(50)
    expect(first.body.unreadCount).toBe(52)
    expect(first.body.nextCursor).toEqual(expect.any(String))
    expect(first.body.items[49].id).toBe(E2E_ACTIVITY_TIE_HIGHER_ID)

    const second = await search({
      tokens: [E2E_ACTIVITY_BASELINE_TOKEN, E2E_ACTIVITY_CALENDAR_TOKEN],
      cursor: first.body.nextCursor,
      limit: 50,
    }).expect(200)
    expect(second.body.items.map((item: { id: string }) => item.id)).toEqual([
      E2E_ACTIVITY_TIE_LOWER_ID,
      E2E_ACTIVITY_OLDER_ANCHOR_ID,
      E2E_ACTIVITY_BASELINE_LOG_ID,
    ])
    expect(second.body.nextCursor).toBeNull()
    expect(second.body.asOf).toBe(first.body.asOf)

    const allItems = [...first.body.items, ...second.body.items]
    expect(new Set(allItems.map((item: { id: string }) => item.id)).size).toBe(
      53,
    )
    expect(
      allItems.every(
        (item: Record<string, unknown>) => !("calendarToken" in item),
      ),
    ).toBe(true)

    await dataSource.getRepository(Calendar).update(E2E_ACTIVITY_CALENDAR_ID, {
      name: "mutated by prior E2E run",
    })
    await dataSource
      .getRepository(CalendarLog)
      .delete({ id: E2E_ACTIVITY_TIE_LOWER_ID })

    await seedE2eActivity(dataSource)

    const restoredCalendar = await dataSource
      .getRepository(Calendar)
      .findOneByOrFail({ id: E2E_ACTIVITY_CALENDAR_ID })
    const restoredLogs = await dataSource.getRepository(CalendarLog).count({
      where: { calendar: { id: E2E_ACTIVITY_CALENDAR_ID } },
    })
    expect(restoredCalendar.name).toBe("E2E Activity Timeline")
    expect(restoredLogs).toBe(52)
  })
})
