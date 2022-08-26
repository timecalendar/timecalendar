import { Injectable } from "@nestjs/common"
import { S3_PUBLIC_BUCKET_CLIENT_URL } from "config/constants"
import { FindSchoolsRepDto } from "modules/school/models/dto/find-schools-rep.dto"
import { getSchoolAssistant } from "modules/school/models/school-assistant.model"
import { SchoolRepository } from "modules/school/repositories/school.repository"
import ensureNotNull from "modules/shared/utils/types/ensure-not-null"

@Injectable()
export class SchoolService {
  constructor(private readonly repository: SchoolRepository) {}

  async findSchools(): Promise<FindSchoolsRepDto> {
    const schools = await this.repository.findAll()

    return {
      schools: schools.map(({ assistant, fallbackAssistant, ...school }) => ({
        ...school,
        imageUrl: S3_PUBLIC_BUCKET_CLIENT_URL + school.imageUrl,
        assistant: ensureNotNull(getSchoolAssistant(assistant)),
        fallbackAssistant: getSchoolAssistant(fallbackAssistant) ?? undefined,
      })),
    }
  }
}
