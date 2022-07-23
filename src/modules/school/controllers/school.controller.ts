import { Controller, Get } from "@nestjs/common"
import { FindSchoolsRepDto } from "modules/school/models/dto/find-schools-rep.dto"
import { SchoolService } from "modules/school/services/school.service"

@Controller("schools")
export class SchoolController {
  constructor(private readonly service: SchoolService) {}

  @Get()
  async findSchools(): Promise<FindSchoolsRepDto> {
    return this.service.findSchools()
  }
}
