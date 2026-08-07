import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator"
import { NotificationFrequency } from "modules/notification-subscription/models/notification-frequency.enum"
import { NotificationLocale } from "modules/notification-subscription/models/notification-locale"
import { IsIanaTimezone } from "modules/shared/validators/is-iana-timezone"

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

  /** Language used for notification texts. Defaults to `fr`. */
  @IsOptional()
  @IsIn(["fr", "en"])
  locale?: NotificationLocale

  /** IANA timezone used to render event times. Defaults to `Europe/Paris`. */
  @IsOptional()
  @IsIanaTimezone()
  timezone?: string
}
