import { Injectable } from "@nestjs/common"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"
import { slugify } from "modules/shared/utils/slugify"
import { CalendarSubjectRepository } from "modules/subject/repositories/calendar-subject.repository"
import { randomColor } from "modules/subject/utils/random-color"

@Injectable()
export class SubjectService {
  constructor(private readonly repository: CalendarSubjectRepository) {}

  async syncEventSubjects(calendarId: string, events: CalendarEvent[]) {
    const subjects = await this.repository.findSubjects(calendarId)
    const subjectsLength = subjects.length

    events.forEach((event) => {
      const subject = subjects.find((subject) =>
        this.subjectNameMatchesEvent(subject.name, event),
      )

      if (!subject) {
        subjects.push({
          name: slugify(event.title),
          color: `#${randomColor()}`,
        })
      }
    })

    if (subjectsLength !== subjects.length) {
      await this.repository.updateSubjects(calendarId, subjects)
    }
  }

  private subjectNameMatchesEvent(subjectName: string, event: CalendarEvent) {
    return slugify(subjectName) === slugify(event.title)
  }
}
