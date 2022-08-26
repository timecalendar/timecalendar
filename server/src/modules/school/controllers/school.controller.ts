import { Controller, Get } from "@nestjs/common"
import { ApiOperation, ApiTags } from "@nestjs/swagger"
import { FindSchoolsRepDto } from "modules/school/models/dto/find-schools-rep.dto"
import { SchoolService } from "modules/school/services/school.service"

@Controller("schools")
@ApiTags("Schools")
export class SchoolController {
  constructor(private readonly service: SchoolService) {}

  @ApiOperation({ summary: "Find list of schools" })
  @Get()
  async findSchools(): Promise<FindSchoolsRepDto> {
    return this.service.findSchools()
  }
}
