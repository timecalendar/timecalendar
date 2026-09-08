import { NestExpressApplication } from "@nestjs/platform-express"
import { CalendarSyncModule } from "modules/calendar-sync/calendar-sync.module"
import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { parseIcal } from "modules/fetch/parsers/parse-ical"
import request from "lib/supertest"
import createTestApp from "test-utils/create-test-app"
import { DataSource } from "typeorm"
import { e2eFixtureControllers } from "app.module"
import {
  buildE2eIcalFixture,
  E2E_ICAL_EVENT_TITLE,
  E2E_ICAL_EVENT_UID,
  E2E_ICAL_FIXTURE_PATH,
  E2eIcalFixtureController,
} from "./e2e-ical-fixture.controller"

describe("E2eIcalFixtureController", () => {
  it("builds a parseable, date-neutral event on the next UTC day", () => {
    const now = new Date("2026-09-07T23:59:30.000Z")
    const [event] = parseIcal(buildE2eIcalFixture(now))

    expect(event).toMatchObject({
      uid: E2E_ICAL_EVENT_UID,
      title: E2E_ICAL_EVENT_TITLE,
      location: "Room E2E Import",
      description: "Server-backed import fixture.",
      start: new Date("2026-09-08T14:00:00.000Z"),
      end: new Date("2026-09-08T16:00:00.000Z"),
      allDay: false,
    })
    expect(E2E_ICAL_EVENT_TITLE).not.toMatch(/today|tomorrow|monday/i)
  })

  it("registers the fixture only in the test/E2E module graph", () => {
    expect(e2eFixtureControllers("test")).toEqual([E2eIcalFixtureController])
    expect(e2eFixtureControllers("development")).toEqual([])
    expect(e2eFixtureControllers("production")).toEqual([])
  })

  describe("real calendar import seam", () => {
    let app: NestExpressApplication
    let dataSource: DataSource

    beforeAll(async () => {
      app = await createTestApp({
        imports: [CalendarSyncModule],
        controllers: [E2eIcalFixtureController],
      })
      await app.listen(0, "127.0.0.1")
      dataSource = app.get(DataSource)
    })

    it("fetches, parses, and persists the fixture through POST /calendars", async () => {
      const address = app.getHttpServer().address()
      if (address === null || typeof address === "string") {
        throw new Error("Expected the test server to expose a TCP address")
      }
      const fixtureUrl = `http://127.0.0.1:${address.port}/${E2E_ICAL_FIXTURE_PATH}`

      const fixtureResponse = await request(app)
        .get(`/${E2E_ICAL_FIXTURE_PATH}`)
        .expect("Content-Type", /text\/calendar/)
        .expect(200)
      expect(parseIcal(fixtureResponse.text)).toHaveLength(1)

      const { body } = await request(app)
        .post("/calendars")
        .send({
          url: fixtureUrl,
          schoolName: "E2E Institution",
          name: "E2E Programme",
          customData: null,
        })
        .expect(201)

      const calendar = await dataSource
        .getRepository(Calendar)
        .findOneByOrFail({ token: body.token })
      const content = await dataSource
        .getRepository(CalendarContent)
        .findOneByOrFail({ calendar: { id: calendar.id } })

      expect(calendar).toMatchObject({
        url: fixtureUrl,
        schoolName: "E2E Institution",
        name: "E2E Programme",
      })
      expect(content.events).toEqual([
        expect.objectContaining({
          uid: E2E_ICAL_EVENT_UID,
          title: E2E_ICAL_EVENT_TITLE,
        }),
      ])
    })
  })
})
