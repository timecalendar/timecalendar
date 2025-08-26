import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"
import { NotificationSubscription } from "./notification-subscription.entity"

@Entity()
export class FcmNotificationChannel {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ unique: true })
  token: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToOne(
    () => NotificationSubscription,
    (subscription) => subscription.fcmNotificationChannel,
  )
  @JoinColumn()
  notificationSubscription: NotificationSubscription
}
