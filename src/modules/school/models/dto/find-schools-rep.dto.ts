import { OmitType } from "@nestjs/swagger"
import { SchoolAssistant } from "modules/school/models/school-assistant.model"
import { School } from "modules/school/models/school.entity"

export class SchoolForList extends OmitType(School, [
  "assistant",
  "fallbackAssistant",
] as const) {
  assistant: SchoolAssistant
  fallbackAssistant?: SchoolAssistant
}

export class FindSchoolsRepDto {
  schools: SchoolForList[]
}
