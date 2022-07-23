import { Type } from "class-transformer"
import { IsOptional, IsString, ValidateNested } from "class-validator"

export class BasicCredentials {
  @IsString()
  username: string

  @IsString()
  password: string
}

export class CalendarCustomData {
  @IsOptional()
  @Type(() => BasicCredentials)
  @ValidateNested()
  auth?: BasicCredentials
}

export class CalendarSource {
  @IsString()
  url: string

  @IsOptional()
  @Type(() => CalendarCustomData)
  @ValidateNested()
  customData?: CalendarCustomData
}
