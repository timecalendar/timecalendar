import { NestExpressApplication } from "@nestjs/platform-express"
import { CalendarModule } from "modules/calendar/calendar.module"
import { calendarEventFactory } from "modules/calendar/factories/calendar-event.factory"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import { nanoid } from "nanoid"
import createTestApp from "test-utils/create-test-app"
import { DataSource } from "typeorm"

describe("CalendarRepository", () => {
  let app: NestExpressApplication
  let repository: CalendarRepository
  let dataSource: DataSource
  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarModule] })
    repository = app.get(CalendarRepository)
    dataSource = app.get(DataSource)
  })

  describe("save", () => {
    it("saves a calendar", async () => {
      const calendar = await repository.save({
        token: nanoid(),
        name: "Calendar",
        schoolName: "My school",
        url: "https://calendar.com",
        lastUpdatedAt: new Date(),
      })
      expect(calendar.id).toBeDefined()
    })
  })

  describe("findLastUpdatedBeforeWithContent", () => {
    it("finds calendars updated before a date", async () => {
      await calendarFactory().create()
      const expected = await calendarFactory().create({
        lastUpdatedAt: new Date("2022-01-05T11:00:00Z"),
      })

      const calendars = await repository.findLastUpdatedBeforeWithContent({
        lastUpdatedBefore: new Date("2022-01-05T11:30:00Z"),
      })

      expect(calendars.length).toBe(1)
      expect(calendars[0].id).toBe(expected.id)
      expect(calendars[0].content.events.length).toBe(0)
    })

    it("does not find calendars updated after the date", async () => {
      await calendarFactory().create({
        lastUpdatedAt: new Date("2022-01-05T11:30:00Z"),
      })

      const calendars = await repository.findLastUpdatedBeforeWithContent({
        lastUpdatedBefore: new Date("2022-01-05T11:00:00Z"),
      })

      expect(calendars.length).toBe(0)
    })

    describe("lastAccessedAtAfter", () => {
      it("finds calendars updated after the last accessed date", async () => {
        const expected = await calendarFactory().create({
          lastUpdatedAt: new Date("2022-01-05T11:00:00Z"),
          lastAccessedAt: new Date("2022-01-05T11:00:00Z"),
        })

        const calendars = await repository.findLastUpdatedBeforeWithContent({
          lastUpdatedBefore: new Date("2022-01-05T11:30:00Z"),
          lastAccessedAtAfter: new Date("2022-01-01T00:00:00Z"),
        })

        expect(calendars.length).toBe(1)
        expect(calendars[0].id).toBe(expected.id)
      })

      it("does not find calendars before the last accessed date", async () => {
        await calendarFactory().create({
          lastUpdatedAt: new Date("2022-01-05T11:00:00Z"),
          lastAccessedAt: new Date("2022-01-01T00:00:00Z"),
        })

        const calendars = await repository.findLastUpdatedBeforeWithContent({
          lastUpdatedBefore: new Date("2022-01-05T11:30:00Z"),
          lastAccessedAtAfter: new Date("2022-01-05T11:00:00Z"),
        })

        expect(calendars.length).toBe(0)
      })

      it("does not find calendars without last accessed date", async () => {
        await calendarFactory().create({
          lastUpdatedAt: new Date("2022-01-05T11:00:00Z"),
          lastAccessedAt: null,
        })

        const calendars = await repository.findLastUpdatedBeforeWithContent({
          lastUpdatedBefore: new Date("2022-01-05T11:30:00Z"),
          lastAccessedAtAfter: new Date("2022-01-05T11:00:00Z"),
        })

        expect(calendars.length).toBe(0)
      })
    })

    it("finds calendars by token", async () => {
      await calendarFactory().create()
      await calendarFactory().create({
        lastUpdatedAt: new Date("2022-01-05T11:00:00Z"),
      })
      const expected = await calendarFactory().create({
        lastUpdatedAt: new Date("2022-01-05T11:00:00Z"),
      })

      const calendars = await repository.findLastUpdatedBeforeWithContent({
        lastUpdatedBefore: new Date("2022-01-05T11:30:00Z"),
        filterByTokens: [expected.token],
      })

      expect(calendars.length).toBe(1)
      expect(calendars[0].id).toBe(expected.id)
    })
  })

  describe("findByTokensWithContent", () => {
    it("returns calendars with content", async () => {
      const event = calendarEventFactory.build()
      const expected = [
        await calendarFactory().create(),
        await calendarFactory()
          .transient({ events: [event] })
          .create(),
      ]

      const calendars = await repository.findByTokensWithContent(
        expected.map((calendar) => calendar.token),
      )

      expect(calendars.length).toBe(2)
      const [calendar] = calendars
      expect(calendar.id).toBe(expected[1].id)
      expect(calendar.name).toBe(expected[1].name)
      expect(calendar.content.events.length).toBe(1)
      expect(calendar.content.events[0].uid).toBe(event.uid)
      expect(calendar.content.events[0].startsAt).toEqual(event.startsAt)
    })

    it("does not return other calendars", async () => {
      await calendarFactory().create()
      const expected = [await calendarFactory().create()]

      const calendars = await repository.findByTokensWithContent(
        expected.map((calendar) => calendar.token),
      )

      expect(calendars.length).toBe(1)
      const [calendar] = calendars
      expect(calendar.id).toBe(expected[0].id)
    })
  })

  describe("setCalendarsLastAccessedAt", () => {
    it("sets the last accessed at of the calendars", async () => {
      const calendars = await calendarFactory().createList(2)
      await repository.setCalendarsLastAccessedAt(
        calendars.map(({ token }) => token),
        new Date("2022-01-05T11:00:00Z"),
      )

      const updated = await dataSource.getRepository(Calendar).find()
      expect(updated.length).toBe(2)
      expect(updated[0].lastAccessedAt).toEqual(
        new Date("2022-01-05T11:00:00Z"),
      )
      expect(updated[1].lastAccessedAt).toEqual(
        new Date("2022-01-05T11:00:00Z"),
      )
    })

    it("does not update other calendars", async () => {
      const [calendar, other] = await calendarFactory().createList(2)

      await repository.setCalendarsLastAccessedAt(
        [calendar.token],
        new Date("2022-01-05T11:00:00Z"),
      )

      const updated = await dataSource
        .getRepository(Calendar)
        .findOneByOrFail({ id: calendar.id })
      expect(updated.lastAccessedAt).toEqual(new Date("2022-01-05T11:00:00Z"))

      const otherUpdated = await dataSource
        .getRepository(Calendar)
        .findOneByOrFail({ id: other.id })
      expect(otherUpdated.lastAccessedAt).toBeNull()
    })
  })
})
