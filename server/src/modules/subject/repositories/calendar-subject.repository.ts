import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { CalendarSubject } from "modules/subject/models/calendar-subject.entity"
import { EventSubject } from "modules/subject/models/event-subject.model"
import { In, Repository } from "typeorm"

@Injectable()
export class CalendarSubjectRepository {
  constructor(
    @InjectRepository(CalendarSubject)
    private readonly repository: Repository<CalendarSubject>,
  ) {}

  async findSubjectsByCalendarIds(
    calendarIds: string[],
  ): Promise<Record<string, EventSubject[]>> {
    const calendarSubjects = await this.repository.find({
      where: { calendar: { id: In(calendarIds) } },
    })

    return calendarIds.reduce(
      (acc, calendarId) => {
        const calendarSubject = calendarSubjects.find(
          (calendarSubject) => calendarSubject.calendarId === calendarId,
        )

        return {
          ...acc,
          [calendarId]: calendarSubject ? calendarSubject.subjects : [],
        }
      },
      {} as Record<string, EventSubject[]>,
    )
  }

  async findSubjects(calendarId: string) {
    const subjectsByCalendarIds = await this.findSubjectsByCalendarIds([
      calendarId,
    ])

    return subjectsByCalendarIds[calendarId]
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
