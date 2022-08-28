import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from "@nestjs/common"
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger"
import { FindSchoolGroupsRepDto } from "modules/school-group/models/find-school-groups-rep.dto"
import { GetSchoolGroupsIcalUrlRepDto } from "modules/school-group/models/get-school-groups-ical-url-rep.dto"
import { GetSchoolGroupsIcalUrlDto } from "modules/school-group/models/get-school-groups-ical-url.dto"
import { SetSchoolGroupDto } from "modules/school-group/models/set-school-group.dto"
import { SchoolGroupService } from "modules/school-group/services/school-group.service"

@Controller("schools/:schoolId/school-group")
@ApiTags("Schools")
export class SchoolGroupController {
  constructor(private readonly service: SchoolGroupService) {}

  @ApiOperation({ summary: "Find school groups" })
  @ApiParam({ name: "schoolId", description: "The school id", type: "string" })
  @Get()
  async findSchoolGroups(
    @Param("schoolId", new ParseUUIDPipe()) schoolId: string,
  ): Promise<FindSchoolGroupsRepDto> {
    return this.service.findSchoolGroups(schoolId)
  }

  @ApiOperation({ summary: "Set school groups" })
  @ApiParam({ name: "schoolId", description: "The school id", type: "string" })
  @Put()
  async setSchoolGroups(
    @Param("schoolId", new ParseUUIDPipe()) schoolId: string,
    @Body() payload: SetSchoolGroupDto,
  ) {
    return this.service.setSchoolGroups(schoolId, payload)
  }

  @ApiOperation({ summary: "Get school groups ICal URL" })
  @ApiParam({ name: "schoolId", description: "The school id", type: "string" })
  @Post("ical")
  async getSchoolGroupsIcalUrl(
    @Param("schoolId", new ParseUUIDPipe()) schoolId: string,
    @Body() payload: GetSchoolGroupsIcalUrlDto,
  ): Promise<GetSchoolGroupsIcalUrlRepDto> {
    return this.service.getSchoolGroupsIcalUrl(schoolId, payload)
  }
}
