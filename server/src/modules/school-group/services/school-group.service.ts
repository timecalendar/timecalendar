import { Injectable } from "@nestjs/common"
import { FindSchoolGroupsRepDto } from "modules/school-group/models/find-school-groups-rep.dto"
import { GetSchoolGroupsIcalUrlRepDto } from "modules/school-group/models/get-school-groups-ical-url-rep.dto"
import { GetSchoolGroupsIcalUrlDto } from "modules/school-group/models/get-school-groups-ical-url.dto"
import { SetSchoolGroupDto } from "modules/school-group/models/set-school-group.dto"
import { SchoolGroupRepository } from "modules/school-group/repositories/school-group.repository"

@Injectable()
export class SchoolGroupService {
  constructor(private readonly schoolGroupRepository: SchoolGroupRepository) {}

  async findSchoolGroups(schoolId: string): Promise<FindSchoolGroupsRepDto> {
    const schoolGroup = await this.schoolGroupRepository.findOne(schoolId)
    return { groups: schoolGroup.groups }
  }

  async setSchoolGroups(schoolId: string, payload: SetSchoolGroupDto) {
    await this.schoolGroupRepository.save(schoolId, payload)
  }

  async getSchoolGroupsIcalUrl(
    schoolId: string,
    payload: GetSchoolGroupsIcalUrlDto,
  ): Promise<GetSchoolGroupsIcalUrlRepDto> {
    const schoolGroup = await this.schoolGroupRepository.findOne(schoolId)
    const url = `${schoolGroup.icalUrl}&resources=${payload.groups.join(
      ",",
    )}&calType=ical&firstDate=2000-01-01&lastDate=2038-01-01`

    return { url }
  }
}
