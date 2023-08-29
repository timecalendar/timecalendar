import { IsOptional, IsString } from "class-validator"

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
  schoolId?: string

  @IsString()
  @IsOptional()
  schoolName?: string

  @IsString()
  @IsOptional()
  gradeName?: string

  @IsString()
  @IsOptional()
  deviceInfo?: string
}
