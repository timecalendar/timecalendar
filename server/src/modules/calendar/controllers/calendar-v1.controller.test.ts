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

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarModule] })
    dataSource = app.get(DataSource)
  })

  const findCalendar = (id: string) =>
    dataSource.getRepository(Calendar).findOneByOrFail({ id })

  describe("PATCH /v1/calendars/:token", () => {
    it("renames a calendar and returns its public representation", async () => {
      const calendar = await calendarFactory().create()

      const { body } = await request(app)
        .patch(`/v1/calendars/${calendar.token}`)
        .send({ name: "Renamed" })
        .expect(200)

      expect(body).toMatchObject({
        id: calendar.id,
        token: calendar.token,
        name: "Renamed",
        schoolName: "My School",
      })
      expect(await findCalendar(calendar.id)).toMatchObject({
        name: "Renamed",
      })
    })

    it("trims the submitted name before storing it", async () => {
      const calendar = await calendarFactory().create()

      const { body } = await request(app)
        .patch(`/v1/calendars/${calendar.token}`)
        .send({ name: "   Renamed   " })
        .expect(200)

      expect(body.name).toBe("Renamed")
      expect((await findCalendar(calendar.id)).name).toBe("Renamed")
    })

    it("clears the name when renamed to an empty string", async () => {
      const calendar = await calendarFactory().create()

      const { body } = await request(app)
        .patch(`/v1/calendars/${calendar.token}`)
        .send({ name: "" })
        .expect(200)

      expect(body.name).toBe("")
      expect((await findCalendar(calendar.id)).name).toBe("")
    })

    it("clears the name when renamed to whitespace only", async () => {
      const calendar = await calendarFactory().create()

      await request(app)
        .patch(`/v1/calendars/${calendar.token}`)
        .send({ name: "   " })
        .expect(200)

      expect((await findCalendar(calendar.id)).name).toBe("")
    })

    it("accepts a name of exactly 100 characters surrounded by whitespace", async () => {
      const calendar = await calendarFactory().create()
      const name = "a".repeat(100)

      const { body } = await request(app)
        .patch(`/v1/calendars/${calendar.token}`)
        .send({ name: `  ${name}  ` })
        .expect(200)

      expect(body.name).toBe(name)
      expect((await findCalendar(calendar.id)).name).toBe(name)
    })

    it("rejects a missing name", async () => {
      const calendar = await calendarFactory().create()

      await request(app)
        .patch(`/v1/calendars/${calendar.token}`)
        .send({})
        .expect(400)

      expect((await findCalendar(calendar.id)).name).toBe("My Calendar")
    })

    it("rejects a non-string name", async () => {
      const calendar = await calendarFactory().create()

      await request(app)
        .patch(`/v1/calendars/${calendar.token}`)
        .send({ name: 42 })
        .expect(400)

      expect((await findCalendar(calendar.id)).name).toBe("My Calendar")
    })

    it("rejects a name longer than 100 characters once trimmed", async () => {
      const calendar = await calendarFactory().create()

      await request(app)
        .patch(`/v1/calendars/${calendar.token}`)
        .send({ name: `  ${"a".repeat(101)}  ` })
        .expect(400)

      expect((await findCalendar(calendar.id)).name).toBe("My Calendar")
    })

    it("accepts duplicate names across calendars, last write wins", async () => {
      const first = await calendarFactory().create()
      const second = await calendarFactory().create()

      await request(app)
        .patch(`/v1/calendars/${first.token}`)
        .send({ name: "Same name" })
        .expect(200)
      await request(app)
        .patch(`/v1/calendars/${second.token}`)
        .send({ name: "Same name" })
        .expect(200)

      expect((await findCalendar(first.id)).name).toBe("Same name")
      expect((await findCalendar(second.id)).name).toBe("Same name")
    })

    it("returns 404 for an unknown token without disclosing calendar data", async () => {
      const calendar = await calendarFactory().create()

      const { body } = await request(app)
        .patch(`/v1/calendars/unknown-token`)
        .send({ name: "Renamed" })
        .expect(404)

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
      const calendar = await calendarFactory().create()
      const before = await findCalendar(calendar.id)

      const { body } = await request(app)
        .patch(`/v1/calendars/${calendar.token}`)
        .send({ name: "Renamed" })
        .expect(200)

      const after = await findCalendar(calendar.id)
      expect(after.lastUpdatedAt).toEqual(before.lastUpdatedAt)
      expect(after.updatedAt.getTime()).toBeGreaterThan(
        before.updatedAt.getTime(),
      )
      expect(body.lastUpdatedAt).toBe(before.lastUpdatedAt.toISOString())
    })
  })

  it("leaves the unversioned read route untouched", async () => {
    const calendar = await calendarFactory().create()

    await request(app)
      .patch(`/v1/calendars/${calendar.token}`)
      .send({ name: "Renamed" })
      .expect(200)

    const { body } = await request(app)
      .get(`/calendars/by-token/${calendar.token}`)
      .expect(200)

    expect(body.name).toBe("Renamed")
  })
})
