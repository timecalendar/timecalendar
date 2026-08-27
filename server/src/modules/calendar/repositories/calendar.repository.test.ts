import { NestExpressApplication } from "@nestjs/platform-express"
import { CalendarModule } from "modules/calendar/calendar.module"
import { calendarEventFactory } from "modules/calendar/factories/calendar-event.factory"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import { nanoid } from "nanoid"
import createTestApp from "test-utils/create-test-app"
import { DataSource } from "typeorm"
import { v4 } from "uuid"

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

    it("does not override existing calendar content when content is undefined", async () => {
      // Create a calendar with content
      const initialCalendar = await calendarFactory()
        .transient({
          events: [calendarEventFactory.build({ uid: "existing-event" })],
        })
        .create()

      // Verify initial content exists
      const calendarWithContent = await repository.findOne(initialCalendar.id)
      expect(calendarWithContent.content.events).toHaveLength(1)
      expect(calendarWithContent.content.events[0].uid).toBe("existing-event")

      // Update the calendar with content: undefined (simulating the sync service behavior)
      const updatedCalendar = await repository.save({
        id: initialCalendar.id,
        name: "Updated Calendar Name",
        content: undefined, // This should not clear existing content
        lastUpdatedAt: new Date(),
      })

      // Verify the content still exists after the update
      const calendarAfterUpdate = await repository.findOne(updatedCalendar.id)
      expect(calendarAfterUpdate.content.events).toHaveLength(1)
      expect(calendarAfterUpdate.content.events[0].uid).toBe("existing-event")
      expect(calendarAfterUpdate.name).toBe("Updated Calendar Name")
    })
  })

  describe("findDueForSync", () => {
    it("finds calendars planned before a date", async () => {
      await calendarFactory().create()
      const expected = await calendarFactory()
        .transient({ events: calendarEventFactory.buildList(1_000) })
        .create({ syncPlannedAt: new Date("2022-01-05T11:00:00Z") })

      const calendars = await repository.findDueForSync({
        syncPlannedBefore: new Date("2022-01-05T11:30:00Z"),
      })

      expect(calendars.length).toBe(1)
      expect(calendars[0].id).toBe(expected.id)
      expect(calendars[0].content).toBeUndefined()
    })

    it("does not find calendars planned after the date", async () => {
      await calendarFactory().create({
        syncPlannedAt: new Date("2022-01-05T11:30:00Z"),
      })

      const calendars = await repository.findDueForSync({
        syncPlannedBefore: new Date("2022-01-05T11:00:00Z"),
      })

      expect(calendars.length).toBe(0)
    })

    it("returns the calendars planned first", async () => {
      const second = await calendarFactory().create({
        syncPlannedAt: new Date("2022-01-05T11:20:00Z"),
      })
      const first = await calendarFactory().create({
        syncPlannedAt: new Date("2022-01-05T11:00:00Z"),
      })

      const calendars = await repository.findDueForSync({
        syncPlannedBefore: new Date("2022-01-05T11:30:00Z"),
      })

      expect(calendars.map(({ id }) => id)).toEqual([first.id, second.id])
    })

    it("finds calendars by token", async () => {
      await calendarFactory().create()
      await calendarFactory().create({
        syncPlannedAt: new Date("2022-01-05T11:00:00Z"),
      })
      const expected = await calendarFactory().create({
        syncPlannedAt: new Date("2022-01-05T11:00:00Z"),
      })

      const calendars = await repository.findDueForSync({
        syncPlannedBefore: new Date("2022-01-05T11:30:00Z"),
        filterByTokens: [expected.token],
      })

      expect(calendars.length).toBe(1)
      expect(calendars[0].id).toBe(expected.id)
    })
  })

  describe("findDueCalendarIds", () => {
    it("returns ids of calendars planned before the due date and accessed recently", async () => {
      const expected = await calendarFactory().create({
        syncPlannedAt: new Date("2022-01-05T11:00:00Z"),
        lastAccessedAt: new Date("2022-01-05T11:00:00Z"),
      })

      const calendarIds = await repository.findDueCalendarIds({
        syncPlannedBefore: new Date("2022-01-05T11:30:00Z"),
        lastAccessedAtAfter: new Date("2022-01-01T00:00:00Z"),
      })

      expect(calendarIds).toEqual([expected.id])
    })

    it("skips calendars planned after the due date", async () => {
      await calendarFactory().create({
        syncPlannedAt: new Date("2022-01-05T11:30:00Z"),
        lastAccessedAt: new Date("2022-01-05T11:00:00Z"),
      })

      const calendarIds = await repository.findDueCalendarIds({
        syncPlannedBefore: new Date("2022-01-05T11:00:00Z"),
        lastAccessedAtAfter: new Date("2022-01-01T00:00:00Z"),
      })

      expect(calendarIds).toEqual([])
    })

    it("skips calendars last accessed before the inactivity threshold", async () => {
      await calendarFactory().create({
        syncPlannedAt: new Date("2022-01-05T11:00:00Z"),
        lastAccessedAt: new Date("2022-01-01T00:00:00Z"),
      })

      const calendarIds = await repository.findDueCalendarIds({
        syncPlannedBefore: new Date("2022-01-05T11:30:00Z"),
        lastAccessedAtAfter: new Date("2022-01-05T11:00:00Z"),
      })

      expect(calendarIds).toEqual([])
    })

    it("skips calendars without a last accessed date", async () => {
      await calendarFactory().create({
        syncPlannedAt: new Date("2022-01-05T11:00:00Z"),
        lastAccessedAt: null,
      })

      const calendarIds = await repository.findDueCalendarIds({
        syncPlannedBefore: new Date("2022-01-05T11:30:00Z"),
        lastAccessedAtAfter: new Date("2022-01-05T11:00:00Z"),
      })

      expect(calendarIds).toEqual([])
    })

    it("returns the calendars planned first", async () => {
      const second = await calendarFactory().create({
        syncPlannedAt: new Date("2022-01-05T11:20:00Z"),
      })
      const first = await calendarFactory().create({
        syncPlannedAt: new Date("2022-01-05T11:00:00Z"),
      })

      const calendarIds = await repository.findDueCalendarIds({
        syncPlannedBefore: new Date("2022-01-05T11:30:00Z"),
        lastAccessedAtAfter: new Date("2022-01-01T00:00:00Z"),
      })

      expect(calendarIds).toEqual([first.id, second.id])
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

  describe("claimSyncIfDue", () => {
    it("claims a due calendar and advances its plan", async () => {
      const calendar = await calendarFactory().create({
        syncPlannedAt: new Date("2000-01-01T00:00:00Z"),
      })

      await expect(repository.claimSyncIfDue(calendar.id, 60)).resolves.toBe(
        true,
      )

      const claimed = await dataSource
        .getRepository(Calendar)
        .findOneByOrFail({ id: calendar.id })
      expect(claimed.syncPlannedAt.getTime()).toBeGreaterThan(Date.now())
    })

    it("does not claim a future calendar", async () => {
      const calendar = await calendarFactory().create({
        syncPlannedAt: new Date("2099-01-01T00:00:00Z"),
      })

      await expect(repository.claimSyncIfDue(calendar.id, 30)).resolves.toBe(
        false,
      )
    })

    it("does not claim a missing calendar", async () => {
      await expect(repository.claimSyncIfDue(v4(), 30)).resolves.toBe(false)
    })

    it("allows only one of two concurrent claims", async () => {
      const calendar = await calendarFactory().create({
        syncPlannedAt: new Date("2000-01-01T00:00:00Z"),
      })

      const claims = await Promise.all([
        repository.claimSyncIfDue(calendar.id, 60),
        repository.claimSyncIfDue(calendar.id, 60),
      ])

      expect(claims.sort()).toEqual([false, true])
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
      const [calendar, other] = await calendarFactory().createList(2, {
        lastAccessedAt: null,
      })

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
