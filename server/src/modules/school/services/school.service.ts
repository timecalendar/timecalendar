import { Injectable } from "@nestjs/common"
import { S3_PUBLIC_BUCKET_CLIENT_URL } from "config/constants"
import {
  FindSchoolsRepDto,
  SchoolForList,
} from "modules/school/models/dto/find-schools-rep.dto"
import { getSchoolAssistant } from "modules/school/models/school-assistant.model"
import { School } from "modules/school/models/school.entity"
import { SchoolRepository } from "modules/school/repositories/school.repository"
import ensureNotNull from "modules/shared/utils/types/ensure-not-null"

@Injectable()
export class SchoolService {
  constructor(private readonly repository: SchoolRepository) {}

  async findSchools(): Promise<FindSchoolsRepDto> {
    const schools = await this.repository.findAll()

    return { schools: schools.map((school) => this.schoolForList(school)) }
  }

  async findSchool(schoolId: string): Promise<SchoolForList> {
    const school = await this.repository.findOneOrFail(schoolId)
    return this.schoolForList(school)
  }

  private schoolForList({ assistant, fallbackAssistant, ...school }: School) {
    return {
      ...school,
      imageUrl: S3_PUBLIC_BUCKET_CLIENT_URL + school.imageUrl,
      assistant: ensureNotNull(getSchoolAssistant(assistant)),
      fallbackAssistant: getSchoolAssistant(fallbackAssistant) ?? undefined,
    }
  }
}
