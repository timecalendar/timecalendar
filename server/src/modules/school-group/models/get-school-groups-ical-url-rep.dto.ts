import { IsString } from "class-validator"

export class GetSchoolGroupsIcalUrlRepDto {
  @IsString()
  url: string
}
