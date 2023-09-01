import { NestExpressApplication } from "@nestjs/platform-express"
import { calendarEventFactory } from "modules/calendar/factories/calendar-event.factory"
import { calendarSubjectFactory } from "modules/subject/factories/calendar-subject.factory"
import { CalendarSubject } from "modules/subject/models/calendar-subject.entity"
import { SubjectService } from "modules/subject/services/subject.service"
import { SubjectModule } from "modules/subject/subject.module"
import createTestApp from "test-utils/create-test-app"
import { DataSource } from "typeorm"

describe("SubjectService", () => {
  let app: NestExpressApplication
  let service: SubjectService
  let dataSource: DataSource

  beforeAll(async () => {
    app = await createTestApp({ imports: [SubjectModule] })
    service = app.get(SubjectService)
    dataSource = app.get(DataSource)
  })

  describe("syncEventSubjects", () => {
    it("adds new subjects", async () => {
      const calendarSubject = await calendarSubjectFactory().create({
        subjects: [{ name: "maths", color: "#ff00ff" }],
      })

      const events = [
        calendarEventFactory.build({ title: "Advanced Physics" }),
        calendarEventFactory.build({ title: "Maths" }),
        calendarEventFactory.build({ title: "French" }),
      ]

      await service.syncEventSubjects(calendarSubject.calendar.id, events)

      const result = await dataSource
        .getRepository(CalendarSubject)
        .findOneByOrFail({
          id: calendarSubject.id,
        })

      expect(result.subjects).toMatchObject([
        { name: "maths", color: "#ff00ff" },
        {
          name: "advanced-physics",
          color: expect.stringMatching(/^#[0-9a-f]{6}$/),
        },
        { name: "french", color: expect.stringMatching(/^#[0-9a-f]{6}$/) },
      ])
    })

    it("does not add any subjects", async () => {
      const calendarSubject = await calendarSubjectFactory().create({
        subjects: [{ name: "maths", color: "#ff00ff" }],
      })

      const events = [
        calendarEventFactory.build({ title: "Maths" }),
        calendarEventFactory.build({ title: "Maths" }),
      ]

      await service.syncEventSubjects(calendarSubject.calendar.id, events)

      const result = await dataSource
        .getRepository(CalendarSubject)
        .findOneByOrFail({
          id: calendarSubject.id,
        })

      expect(result.subjects).toMatchObject([
        { name: "maths", color: "#ff00ff" },
      ])
    })
  })
})
