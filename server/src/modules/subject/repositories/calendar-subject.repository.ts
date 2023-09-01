import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { CalendarSubject } from "modules/subject/models/calendar-subject.entity"
import { EventSubject } from "modules/subject/models/event-subject.model"
import { Repository } from "typeorm"

@Injectable()
export class CalendarSubjectRepository {
  constructor(
    @InjectRepository(CalendarSubject)
    private readonly repository: Repository<CalendarSubject>,
  ) {}

  async findSubjects(calendarId: string) {
    const calendarSubject = await this.repository.findOne({
      where: { calendar: { id: calendarId } },
    })
    if (!calendarSubject) return []

    return calendarSubject.subjects
  }

  async updateSubjects(calendarId: string, subjects: EventSubject[]) {
    const calendarSubject = await this.repository.findOne({
      where: { calendar: { id: calendarId } },
    })

    await this.repository.save({
      id: calendarSubject?.id,
      subjects: subjects,
      calendar: { id: calendarId },
    })
  }
}
