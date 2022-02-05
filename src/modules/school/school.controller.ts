import { Controller, Get } from "@nestjs/common"
import { S3_PUBLIC_BUCKET_CLIENT_URL } from "config/constants"
import { FindSchoolsRepDto } from "modules/school/models/dto/find-schools-rep.dto"
import { getSchoolAssistant } from "modules/school/models/school-assistants"
import { SchoolService } from "modules/school/services/school.service"

@Controller("schools")
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Get()
  async findSchools(): Promise<FindSchoolsRepDto> {
    const schools = await this.schoolService.findAll()

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
