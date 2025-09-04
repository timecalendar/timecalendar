import { IsNotEmpty, IsString } from "class-validator"

export class SearchSchoolsDto {
  @IsString()
  @IsNotEmpty()
  seoUrl: string
}
