import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { NotificationSubscription } from "modules/notification-subscription/models/entities/notification-subscription.entity"
import { NotificationFrequency } from "modules/notification-subscription/models/notification-frequency.enum"
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm"

// Outbox row: one pending (subscription × calendar change) delivery. Rows are
// deleted on drain after the push job is enqueued — no status column (design D2).
@Entity("subscriber_calendar_log")
@Unique("UQ_subscriber_calendar_log_subscription_log", [
  "subscriptionId",
  "calendarLogId",
])
@Index("IDX_subscriber_calendar_log_frequency_createdAt", [
  "frequency",
  "createdAt",
])
export class SubscriberCalendarLog {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("uuid")
  subscriptionId: string

  @Column("uuid")
  calendarLogId: string

  @Column({
    type: "enum",
    enum: NotificationFrequency,
    enumName: "notification_subscription_frequency_enum",
  })
  frequency: NotificationFrequency

  @CreateDateColumn()
  createdAt: Date

  @ManyToOne(() => NotificationSubscription, { onDelete: "CASCADE" })
  @JoinColumn({ name: "subscriptionId" })
  subscription: NotificationSubscription

  @ManyToOne(() => CalendarLog, { onDelete: "CASCADE" })
  @JoinColumn({ name: "calendarLogId" })
  calendarLog: CalendarLog
}
