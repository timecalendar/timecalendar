import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common"
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger"
import {
  FindSchoolsRepDto,
  SchoolForList,
} from "modules/school/models/dto/find-schools-rep.dto"
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

  @ApiOperation({ summary: "Find a school" })
  @ApiParam({ name: "schoolId", description: "The school id", type: "string" })
  @Get(":schoolId")
  async findSchool(
    @Param("schoolId", new ParseUUIDPipe()) schoolId: string,
  ): Promise<SchoolForList> {
    return this.service.findSchool(schoolId)
  }
}
