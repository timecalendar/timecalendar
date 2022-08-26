import { IsString } from "class-validator"

export class EventSubject {
  @IsString()
  name: string

  @IsString()
  color: string
}
