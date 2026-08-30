import { SharedDatabaseModule } from "@lyrolab/nest-shared/database"
import { NestExpressApplication } from "@nestjs/platform-express"
import request from "lib/supertest"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { CalendarLogModule } from "modules/calendar-log/calendar-log.module"
import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
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

  const readPersistedFixture = async () => {
    const calendar = await dataSource.getRepository(Calendar).findOneOrFail({
      where: { id: E2E_ACTIVITY_CALENDAR_ID },
      relations: { content: true },
    })
    const logs = await dataSource.getRepository(CalendarLog).find({
      where: { calendar: { id: E2E_ACTIVITY_CALENDAR_ID } },
      order: { id: "ASC" },
    })

    return {
      content: calendar.content.events,
      logs: logs.map(({ id, calendarChange, createdAt, updatedAt }) => ({
        id,
        calendarChange,
        createdAt,
        updatedAt,
      })),
    }
  }

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

    const persistedFixture = await readPersistedFixture()
    expect(
      persistedFixture.content.map(({ uid, title, location, exportedAt }) => ({
        uid,
        title,
        location,
        exportedAt,
      })),
    ).toEqual([
      {
        uid: "e2e-activity-new",
        title: "E2E Activity New Lecture",
        location: "Room Activity New",
        exportedAt: new Date("2020-01-01T00:00:00.000Z"),
      },
      {
        uid: "e2e-activity-changed-current",
        title: "E2E Activity Changed Current",
        location: "Room Activity Changed Current",
        exportedAt: new Date("2020-01-01T00:00:00.000Z"),
      },
    ])

    await dataSource.getRepository(Calendar).update(E2E_ACTIVITY_CALENDAR_ID, {
      name: "mutated by prior E2E run",
    })
    await dataSource
      .getRepository(CalendarContent)
      .update({ calendar: { id: E2E_ACTIVITY_CALENDAR_ID } }, { events: [] })
    await dataSource
      .getRepository(CalendarLog)
      .update(E2E_ACTIVITY_TIE_HIGHER_ID, {
        calendarChange: { oldItems: [], newItems: [], changedItems: [] },
        createdAt: new Date("2000-01-01T00:00:00.000Z"),
        updatedAt: new Date("2000-01-01T00:00:00.000Z"),
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
    const restoredFixture = await readPersistedFixture()
    expect(restoredCalendar.name).toBe("E2E Activity Timeline")
    expect(restoredLogs).toBe(52)
    expect(restoredFixture).toEqual(persistedFixture)
  })
})
