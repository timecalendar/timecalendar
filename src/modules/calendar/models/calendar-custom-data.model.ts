import { Optional } from "@nestjs/common"
import { Type } from "class-transformer"
import { IsString, ValidateNested } from "class-validator"

export class BasicCredentials {
  @IsString()
  username: string

  @IsString()
  password: string
}

export class CalendarCustomData {
  @Type(() => BasicCredentials)
  @Optional()
  @ValidateNested()
  auth?: BasicCredentials
}
