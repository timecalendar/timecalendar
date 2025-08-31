import { IsString } from "class-validator"

export class GetCalendarLogsDto {
  @IsString({ each: true })
  tokens: string[]
}
