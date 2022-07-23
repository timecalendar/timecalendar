import { Injectable } from "@nestjs/common"
import { S3_PUBLIC_BUCKET_CLIENT_URL } from "config/constants"
import { FindSchoolsRepDto } from "modules/school/models/dto/find-schools-rep.dto"
import { getSchoolAssistant } from "modules/school/models/school-assistants"
import { SchoolRepository } from "modules/school/repositories/school.repository"

@Injectable()
export class SchoolService {
  constructor(private readonly repository: SchoolRepository) {}

  async findSchools(): Promise<FindSchoolsRepDto> {
    const schools = await this.repository.findAll()

    return {
      schools: schools.map(({ assistant, fallbackAssistant, ...school }) => ({
        ...school,
        imageUrl: S3_PUBLIC_BUCKET_CLIENT_URL + school.imageUrl,
        assistant: getSchoolAssistant(assistant),
        fallbackAssistant: getSchoolAssistant(fallbackAssistant),
      })),
    }
  }
}
