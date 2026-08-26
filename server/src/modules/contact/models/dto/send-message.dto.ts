import { IsIn, IsOptional, IsString } from "class-validator"
import {
  CalendarImportClassification,
  CalendarImportHelpKey,
  calendarImportClassifications,
  calendarImportHelpKeys,
} from "modules/calendar-sync/recovery/calendar-import-recovery"

export enum MessageSubject {
  APP_ISSUE = "app_issue",
  IMPORT_ISSUE = "import_issue",
  SUGGESTION = "suggestion",
  OTHER = "other",
}

export class SendMessageDto {
  @IsString()
  email: string

  @IsString()
  message: string

  @IsString({ each: true })
  @IsOptional()
  calendarIds?: string[]

  @IsString()
  @IsOptional()
  gradeName?: string

  @IsString()
  @IsOptional()
  deviceInfo?: string

  @IsIn(calendarImportClassifications)
  @IsOptional()
  recoveryClassification?: CalendarImportClassification

  @IsIn(calendarImportHelpKeys)
  @IsOptional()
  recoveryHelpKey?: CalendarImportHelpKey
}
