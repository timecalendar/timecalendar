import { NestExpressApplication } from "@nestjs/platform-express"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { calendarSubjectFactory } from "modules/subject/factories/calendar-subject.factory"
import { CalendarSubjectRepository } from "modules/subject/repositories/calendar-subject.repository"
import { SubjectModule } from "modules/subject/subject.module"
import createTestApp from "test-utils/create-test-app"

describe("CalendarSubjectRepository", () => {
  let app: NestExpressApplication
  let repository: CalendarSubjectRepository
  beforeAll(async () => {
    app = await createTestApp({ imports: [SubjectModule] })
    repository = app.get(CalendarSubjectRepository)
  })

  describe("findSubjectsByCalendarIds", () => {
    it("finds the event subjects by calendar ids", async () => {
      const calendarSubject = await calendarSubjectFactory().create({
        subjects: [{ name: "Maths", color: "#ff00ff" }],
      })
      const otherCalendarSubject = await calendarSubjectFactory().create({
        subjects: [{ name: "Physics", color: "#ff0000" }],
      })

      const result = await repository.findSubjectsByCalendarIds([
        calendarSubject.calendarId,
        otherCalendarSubject.calendarId,
      ])

      expect(result[calendarSubject.calendarId].length).toBe(1)
      expect(result[calendarSubject.calendarId][0]).toMatchObject({
        name: "Maths",
        color: "#ff00ff",
      })

      expect(result[otherCalendarSubject.calendarId].length).toBe(1)
      expect(result[otherCalendarSubject.calendarId][0]).toMatchObject({
        name: "Physics",
        color: "#ff0000",
      })
    })

    it("returns an empty array if the calendar has no subjects", async () => {
      const calendarSubject = await calendarSubjectFactory().create({
        subjects: [{ name: "Maths", color: "#ff00ff" }],
      })
      const calendarWithoutSubject = await calendarFactory().create()
      const result = await repository.findSubjectsByCalendarIds([
        calendarSubject.calendarId,
        calendarWithoutSubject.id,
      ])

      expect(result[calendarSubject.calendarId].length).toBe(1)
      expect(result[calendarSubject.calendarId][0]).toMatchObject({
        name: "Maths",
        color: "#ff00ff",
      })

      expect(result[calendarWithoutSubject.id].length).toBe(0)
    })
  })

  describe("findSubjects", () => {
    it("finds the event subjects by calendar id", async () => {
      const calendarSubject = await calendarSubjectFactory().create({
        subjects: [{ name: "Maths", color: "#ff00ff" }],
      })

      const result = await repository.findSubjects(calendarSubject.calendar.id)
      expect(result.length).toBe(1)
      expect(result[0].name).toBe("Maths")
      expect(result[0].color).toBe("#ff00ff")
    })

    it("returns an empty array if the calendar has no subjects", async () => {
      const calendar = await calendarFactory().create()
      const result = await repository.findSubjects(calendar.id)
      expect(result).toEqual([])
    })
  })

  describe("updateSubjects", () => {
    it("updates the subjects of the calendar", async () => {
      const calendarSubject = await calendarSubjectFactory().create({
        subjects: [{ name: "Maths", color: "#ff00ff" }],
      })

      await repository.updateSubjects(calendarSubject.calendar.id, [
        { name: "Maths", color: "#ff00ff" },
        { name: "Physics", color: "#ff0000" },
      ])

      const result = await repository.findSubjects(calendarSubject.calendar.id)
      expect(result.length).toBe(2)
      expect(result[0]).toMatchObject({ name: "Maths", color: "#ff00ff" })
      expect(result[1]).toMatchObject({ name: "Physics", color: "#ff0000" })
    })

    it("creates the calendar subject if it doesn't exist", async () => {
      const calendar = await calendarFactory().create()
      await repository.updateSubjects(calendar.id, [
        { name: "Maths", color: "#ff00ff" },
      ])

      const result = await repository.findSubjects(calendar.id)
      expect(result.length).toBe(1)
      expect(result[0]).toMatchObject({ name: "Maths", color: "#ff00ff" })
    })
  })
})
