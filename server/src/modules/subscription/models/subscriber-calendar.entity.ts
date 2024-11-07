import { Calendar } from "modules/calendar/models/calendar.entity"
import { Subscriber } from "modules/subscription/models/subscriber.entity"
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm"

@Entity()
@Unique(["subscriberId", "calendarId"])
export class SubscriberCalendar {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  subscriberId: string

  @Column()
  calendarId: string

  @ManyToOne(() => Subscriber, (subscriber) => subscriber.subscriberCalendars)
  public subscriber: Subscriber

  @ManyToOne(() => Calendar, (calendar) => calendar.subscriberCalendars)
  public calendar: Calendar

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
