import { Calendar } from "modules/calendar/models/calendar.entity"
import { FcmNotificationChannel } from "modules/notification-subscription/models/entities/fcm-notification-channel.entity"
import { NotificationFrequency } from "modules/notification-subscription/models/notification-frequency.enum"
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"

@Entity()
export class NotificationSubscription {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({
    type: "enum",
    enum: NotificationFrequency,
    default: NotificationFrequency.IMMEDIATELY,
  })
  frequency: NotificationFrequency

  @Column({ type: "int", default: 7 })
  nbDaysAhead: number

  @Column({ type: "boolean", default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToMany(() => Calendar)
  @JoinTable({
    name: "calendar_notification_subscription",
    joinColumn: {
      name: "notificationSubscriptionId",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "calendarId",
      referencedColumnName: "id",
    },
  })
  calendars: Calendar[]

  @OneToOne(
    () => FcmNotificationChannel,
    (fcmChannel) => fcmChannel.notificationSubscription,
  )
  fcmNotificationChannel: FcmNotificationChannel
}
