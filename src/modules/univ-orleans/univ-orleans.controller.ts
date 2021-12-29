import { Body, Controller, Post } from "@nestjs/common"
import { OrleansGetIcalUrlFromStudentNumberDto } from "./dto/orleans-get-ical-url-from-student-number.dto"
import { UnivOrleansService } from "./univ-orleans.service"

@Controller("/schools/univ-orleans")
export class UnivOrleansController {
  constructor(private readonly univOrleansService: UnivOrleansService) {}

  @Post("students")
  getIcalUrlFromStudentNumber(
    @Body() payload: OrleansGetIcalUrlFromStudentNumberDto,
  ) {
    return {
      url: this.univOrleansService.getStudentIcal(payload.studentNumber),
    }
  }
}
