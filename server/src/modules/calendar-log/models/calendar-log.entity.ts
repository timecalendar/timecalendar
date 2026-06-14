import { CalendarChange } from "modules/calendar-log/models/calendar-change"
import { Calendar } from "modules/calendar/models/calendar.entity"
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"

@Entity()
@Index("IDX_calendar_log_calendar_createdAt", ["calendar", "createdAt"])
export class CalendarLog {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(() => Calendar, (calendar) => calendar.id)
  calendar: Calendar

  @Column("json")
  calendarChange: CalendarChange

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
