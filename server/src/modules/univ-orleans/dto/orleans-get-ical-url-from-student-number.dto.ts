import { IsString } from "class-validator"

export class OrleansGetIcalUrlFromStudentNumberDto {
  @IsString()
  studentNumber: string
}
