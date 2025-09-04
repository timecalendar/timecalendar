import { Injectable } from "@nestjs/common"
import { SchoolMapper } from "modules/school/mappers/school.mapper"
import {
  FindSchoolsRepDto,
  SchoolForList,
} from "modules/school/models/dto/find-schools-rep.dto"
import { SchoolForSeo } from "modules/school/models/dto/school-for-seo.dto"
import { SearchSchoolsDto } from "modules/school/models/dto/search-schools.dto"
import { SchoolRepository } from "modules/school/repositories/school.repository"

@Injectable()
export class SchoolService {
  constructor(
    private readonly repository: SchoolRepository,
    private readonly mapper: SchoolMapper,
  ) {}

  async findSchools(): Promise<FindSchoolsRepDto> {
    const schools = await this.repository.findAll()

    return {
      schools: schools.map((school) => this.mapper.toSchoolForList(school)),
    }
  }

  async findSchool(schoolId: string): Promise<SchoolForList> {
    const school = await this.repository.findOneOrFail(schoolId)
    return this.mapper.toSchoolForList(school)
  }

  async searchSchools(payload: SearchSchoolsDto): Promise<SchoolForSeo[]> {
    const schools = await this.repository.search(payload)
    return schools.map((school) =>
      this.mapper.toSchoolForSeo(school, school.profile),
    )
  }
}
