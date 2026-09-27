import { IsString } from "class-validator"

export class CalendarSource {
  @IsString()
  url: string
}
