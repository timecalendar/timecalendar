import { Injectable } from "@nestjs/common"
import { SchoolMapper } from "modules/school/mappers/school.mapper"
import {
  FindSchoolsRepDto,
  SchoolForList,
} from "modules/school/models/dto/find-schools-rep.dto"
import { SchoolForSeo } from "modules/school/models/dto/school-for-seo.dto"
import { SearchSchoolsDto } from "modules/school/models/dto/search-schools.dto"
import { SchoolRepository } from "modules/school/repositories/school.repository"
import { ExportGuideCatalogueStore } from "modules/export-guide/stores/export-guide-catalogue.store"

@Injectable()
export class SchoolService {
  constructor(
    private readonly repository: SchoolRepository,
    private readonly mapper: SchoolMapper,
    private readonly exportGuides: ExportGuideCatalogueStore,
  ) {}

  private catalogueVersion(): string {
    const snapshot = this.exportGuides.capture()
    if (!snapshot.activeVersion)
      throw new Error("Export-guide snapshot unavailable")
    return snapshot.activeVersion
  }

  async findSchools(): Promise<FindSchoolsRepDto> {
    const schools = await this.repository.findAll()
    const catalogueVersion = this.catalogueVersion()

    return {
      schools: schools.map((school) =>
        this.mapper.toSchoolForList(school, catalogueVersion),
      ),
    }
  }

  async findSchool(schoolId: string): Promise<SchoolForList> {
    const school = await this.repository.findOneOrFail(schoolId)
    return this.mapper.toSchoolForList(school, this.catalogueVersion())
  }

  async searchSchools(payload: SearchSchoolsDto): Promise<SchoolForSeo[]> {
    const schools = await this.repository.search(payload)
    const catalogueVersion = this.catalogueVersion()
    return schools.map((school) =>
      this.mapper.toSchoolForSeo(school, catalogueVersion, school.profile),
    )
  }
}
