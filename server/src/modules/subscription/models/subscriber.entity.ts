import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  ValidateIf,
  validateOrReject,
} from "class-validator"
import { validateOrRejectWithError } from "lib/class-validator-reject-error"
import { SubscriberCalendar } from "modules/subscription/models/subscriber-calendar.entity"
import { SubscriberType } from "modules/subscription/models/subscriber-type.enum"
import { SubscriptionFrequency } from "modules/subscription/models/subscription-frequency.enum"
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"

@Entity()
export class Subscriber {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "varchar" })
  type: SubscriberType

  @ValidateIf(
    (subscriber: Subscriber) => subscriber.type === SubscriberType.EMAIL,
  )
  @IsEmail()
  @Column({ type: "text", nullable: true })
  @Index({ unique: true, where: '"email" IS NOT NULL' })
  email: string | null

  @ValidateIf(
    (subscriber: Subscriber) => subscriber.type === SubscriberType.FIREBASE,
  )
  @IsNotEmpty()
  @Column({ type: "text", nullable: true })
  @Index({ unique: true, where: '"firebaseToken" IS NOT NULL' })
  firebaseToken: string | null

  @Column()
  @IsEnum(SubscriptionFrequency)
  frequency: SubscriptionFrequency

  @Column()
  isEnabled: boolean

  @Column()
  @IsIn([0, 1, 7, 14, 30])
  notificationDays: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt?: Date

  @OneToMany(
    () => SubscriberCalendar,
    (subscriberCalendar) => subscriberCalendar.subscriber,
  )
  subscriberCalendars: SubscriberCalendar[]

  @BeforeInsert()
  @BeforeUpdate()
  async validate() {
    await validateOrRejectWithError(this)
  }
}
