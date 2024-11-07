import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { CalendarCustomData } from "modules/fetch/models/calendar-source"
import { School } from "modules/school/models/school.entity"
import { SubscriberCalendar } from "modules/subscription/models/subscriber-calendar.entity"
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from "typeorm"

@Entity()
export class Calendar {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  @Index()
  token: string

  @Column()
  name: string

  @Column({ type: "varchar", nullable: true })
  schoolName: string | null

  @Column()
  url: string

  @Column("json", { nullable: true })
  customData: CalendarCustomData | null

  @ManyToOne(() => School, { nullable: true })
  school?: School

  @RelationId((calendar: Calendar) => calendar.school)
  schoolId?: string

  @Column()
  lastUpdatedAt: Date

  @Column({ nullable: true })
  lastAccessedAt: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt?: Date

  @OneToOne(
    () => CalendarContent,
    (calendarContent) => calendarContent.calendar,
  )
  content: CalendarContent

  @OneToMany(
    () => SubscriberCalendar,
    (subscriberCalendar) => subscriberCalendar.calendar,
  )
  subscriberCalendars: SubscriberCalendar[]
}
