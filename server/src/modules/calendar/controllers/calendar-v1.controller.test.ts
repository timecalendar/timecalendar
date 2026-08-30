import { NestExpressApplication } from "@nestjs/platform-express"
import request from "lib/supertest"
import { CalendarModule } from "modules/calendar/calendar.module"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { Calendar } from "modules/calendar/models/calendar.entity"
import createTestApp from "test-utils/create-test-app"
import { DataSource } from "typeorm"

describe("CalendarV1Controller", () => {
  let app: NestExpressApplication
  let dataSource: DataSource
  let calendar: Calendar

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarModule] })
    dataSource = app.get(DataSource)
  })

  beforeEach(async () => {
    calendar = await calendarFactory().create()
  })

  const rename = (token: string, body: object) =>
    request(app).patch(`/v1/calendars/${token}`).send(body)

  const findCalendar = (id: string) =>
    dataSource.getRepository(Calendar).findOneByOrFail({ id })

  describe("PATCH /v1/calendars/:token", () => {
    it("renames a calendar and returns its public representation", async () => {
      const { body } = await rename(calendar.token, {
        name: "Renamed",
      }).expect(200)

      expect(body).toMatchObject({
        id: calendar.id,
        token: calendar.token,
        name: "Renamed",
        schoolName: "My School",
      })
      expect((await findCalendar(calendar.id)).name).toBe("Renamed")
    })

    it.each([
      ["trims the submitted name", "   Renamed   ", "Renamed"],
      ["clears the name with an empty string", "", ""],
      ["clears the name with whitespace only", "   ", ""],
      [
        "accepts 100 characters surrounded by whitespace",
        `  ${"a".repeat(100)}  `,
        "a".repeat(100),
      ],
    ])("%s", async (_case, sent, stored) => {
      const { body } = await rename(calendar.token, { name: sent }).expect(200)

      expect(body.name).toBe(stored)
      expect((await findCalendar(calendar.id)).name).toBe(stored)
    })

    it.each([
      ["a missing name", {}],
      ["a non-string name", { name: 42 }],
      [
        "a name longer than 100 characters once trimmed",
        { name: `  ${"a".repeat(101)}  ` },
      ],
    ])(
      "rejects %s and leaves the stored name untouched",
      async (_case, sent) => {
        await rename(calendar.token, sent).expect(400)

        expect((await findCalendar(calendar.id)).name).toBe("My Calendar")
      },
    )

    it("accepts duplicate names across calendars, last write wins", async () => {
      const second = await calendarFactory().create()

      await rename(calendar.token, { name: "Same name" }).expect(200)
      await rename(second.token, { name: "Same name" }).expect(200)

      expect((await findCalendar(calendar.id)).name).toBe("Same name")
      expect((await findCalendar(second.id)).name).toBe("Same name")
    })

    it("returns 404 for an unknown token without disclosing calendar data", async () => {
      const { body } = await rename("unknown-token", {
        name: "Renamed",
      }).expect(404)

      const serialized = JSON.stringify(body)
      expect(serialized).not.toContain(calendar.id)
      expect(serialized).not.toContain(calendar.token)
      expect(serialized).not.toContain("My Calendar")
      expect(serialized).not.toContain("My School")
      expect(body).not.toHaveProperty("id")
      expect(body).not.toHaveProperty("token")
      expect(body).not.toHaveProperty("name")
      expect(body).not.toHaveProperty("schoolName")
      expect(body).not.toHaveProperty("createdAt")

      // The lookup precedes the update, so an unknown token writes nothing.
      expect((await findCalendar(calendar.id)).name).toBe("My Calendar")
    })

    it("preserves lastUpdatedAt while advancing updatedAt", async () => {
      const before = await findCalendar(calendar.id)

      const { body } = await rename(calendar.token, {
        name: "Renamed",
      }).expect(200)

      const after = await findCalendar(calendar.id)
      expect(after.lastUpdatedAt).toEqual(before.lastUpdatedAt)
      expect(after.updatedAt.getTime()).toBeGreaterThan(
        before.updatedAt.getTime(),
      )
      expect(body.lastUpdatedAt).toBe(before.lastUpdatedAt.toISOString())
    })
  })

  it("leaves the unversioned read route untouched", async () => {
    await rename(calendar.token, { name: "Renamed" }).expect(200)

    const { body } = await request(app)
      .get(`/calendars/by-token/${calendar.token}`)
      .expect(200)

    expect(body.name).toBe("Renamed")
  })
})
