import { ApiProperty } from "@nestjs/swagger"
import {
  CalendarSourceHealthReason,
  CalendarSourceHealthStatus,
  CalendarSourceRecoveryAction,
  CalendarSourceRecoveryGuide,
} from "modules/calendar/models/source-health.model"

export class CalendarSourceHealthDto {
  @ApiProperty({ enum: CalendarSourceHealthStatus })
  status: CalendarSourceHealthStatus

  @ApiProperty({ enum: CalendarSourceHealthReason, nullable: true })
  reason: CalendarSourceHealthReason | null

  @ApiProperty({ enum: CalendarSourceRecoveryAction, nullable: true })
  recoveryAction: CalendarSourceRecoveryAction | null

  @ApiProperty({ enum: CalendarSourceRecoveryGuide, nullable: true })
  guide: CalendarSourceRecoveryGuide | null
}
