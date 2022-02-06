import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm"
import { CalendarEvent } from "./calendar-event.model"
import { Calendar } from "./calendar.entity"

@Entity()
export class CalendarContent {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("json")
  events: CalendarEvent[]

  @OneToOne(() => Calendar)
  @JoinColumn()
  calendar: Calendar
}
