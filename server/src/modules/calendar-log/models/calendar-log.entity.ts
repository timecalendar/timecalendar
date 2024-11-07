import { plainToInstance } from "class-transformer"
import { CalendarChange } from "modules/calendar-log/models/calendar-change.model"
import { Calendar } from "modules/calendar/models/calendar.entity"
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"

@Entity()
export class CalendarLog {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @OneToOne(() => Calendar)
  @JoinColumn()
  calendar: Calendar

  @Column("json", {
    transformer: {
      from: (value) => plainToInstance(CalendarChange, value),
      to: (val) => val,
    },
  })
  calendarChange: CalendarChange

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt?: Date
}
