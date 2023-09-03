import { Calendar } from "modules/calendar/models/calendar.entity"
import { EventSubject } from "modules/subject/models/event-subject.model"
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from "typeorm"

@Entity()
export class CalendarSubject {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @OneToOne(() => Calendar)
  @JoinColumn()
  calendar: Calendar

  @RelationId((calendarSubject: CalendarSubject) => calendarSubject.calendar)
  calendarId: string

  @Column("json")
  subjects: EventSubject[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt?: Date
}
