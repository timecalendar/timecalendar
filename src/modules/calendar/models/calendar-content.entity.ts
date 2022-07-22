import { CalendarEvent } from "modules/calendar/models/calendar-event.model"
import { Calendar } from "modules/calendar/models/calendar.entity"
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm"

@Entity()
export class CalendarContent {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("json")
  events: CalendarEvent[]

  @OneToOne(() => Calendar)
  @JoinColumn()
  calendar: Calendar

  @RelationId((calendarContent: CalendarContent) => calendarContent.calendar)
  calendarId: string
}
