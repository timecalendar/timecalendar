import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator"
import { NotificationFrequency } from "modules/notification-subscription/models/notification-frequency.enum"

export class NotificationSubscriptionCreate {
  @IsEnum(NotificationFrequency)
  frequency: NotificationFrequency

  @IsNumber()
  @Min(1)
  @Max(30)
  nbDaysAhead: number

  @IsBoolean()
  isActive: boolean

  @IsArray()
  @IsUUID("4", { each: true })
  calendarIds: string[]

  @IsString()
  fcmToken: string
}
