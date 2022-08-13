import { IsString } from "class-validator"

export class SyncCalendarsDto {
  @IsString({ each: true })
  tokens: string[]
}
