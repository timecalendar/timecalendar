import { Calendar } from "modules/calendar/models/calendar.entity"
import { NotificationSubscription } from "modules/notification-subscription/models/entities/notification-subscription.entity"
import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm"

// Typed view over the ManyToMany join table owned by
// NotificationSubscription.calendars — the fan-out INSERT…SELECT joins through
// it. The @JoinTable metadata remains the schema owner; this entity must stay
// column-identical to it (zero DDL).
@Entity("calendar_notification_subscription")
export class CalendarNotificationSubscription {
  @PrimaryColumn("uuid")
  @Index("IDX_419a3c5c1f37deb972e7d741f5")
  notificationSubscriptionId: string

  @PrimaryColumn("uuid")
  @Index("IDX_fda7ad034028a8f91afe0e8c36")
  calendarId: string

  @ManyToOne(() => NotificationSubscription, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "notificationSubscriptionId" })
  notificationSubscription: NotificationSubscription

  @ManyToOne(() => Calendar, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinColumn({ name: "calendarId" })
  calendar: Calendar
}
