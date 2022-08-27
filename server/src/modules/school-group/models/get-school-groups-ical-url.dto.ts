import { IsString } from "class-validator"

export class GetSchoolGroupsIcalUrlDto {
  @IsString({ each: true })
  groups: string[]
}
