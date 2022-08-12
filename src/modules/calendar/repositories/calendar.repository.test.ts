import { NestExpressApplication } from "@nestjs/platform-express"
import MockDate from "lib/mock-date"
import { CalendarModule } from "modules/calendar/calendar.module"
import { calendarEventFactory } from "modules/calendar/factories/calendar-event.factory"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import createTestApp from "test-utils/create-test-app"

describe("CalendarRepository", () => {
  let app: NestExpressApplication
  let repository: CalendarRepository
  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarModule] })
    repository = app.get(CalendarRepository)
  })

  describe("save", () => {
    it("saves a calendar", async () => {
      const calendar = await repository.save({
        name: "Calendar",
        schoolName: "My school",
        url: "https://calendar.com",
        lastUpdatedAt: new Date(),
      })
      expect(calendar.id).toBeDefined()
    })
  })

  describe("findLastUpdatedBeforeWithContent", () => {
    beforeEach(() => {
      MockDate.set(new Date("2022-01-05T12:00:00Z"))
    })

    it("finds calendars updated before a date", async () => {
      await calendarFactory().create({})
      const expected = await calendarFactory().create({
        lastUpdatedAt: new Date("2022-01-05T11:00:00Z"),
      })

      const calendars = await repository.findLastUpdatedBeforeWithContent(
        new Date("2022-01-05T11:30:00Z"),
      )

      expect(calendars.length).toBe(1)
      expect(calendars[0].id).toBe(expected.id)
      expect(calendars[0].content.events.length).toBe(0)
    })
  })

  describe("findByIdsWithContent", () => {
    it("returns calendars with content", async () => {
      const event = calendarEventFactory.build()
      const expected = [
        await calendarFactory().create(),
        await calendarFactory()
          .transient({ events: [event] })
          .create(),
      ]

      const calendars = await repository.findByIdsWithContent(
        expected.map((calendar) => calendar.id),
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

      const calendars = await repository.findByIdsWithContent(
        expected.map((calendar) => calendar.id),
      )

      expect(calendars.length).toBe(1)
      const [calendar] = calendars
      expect(calendar.id).toBe(expected[0].id)
    })
  })
})
