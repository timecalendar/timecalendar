import { OmitType } from "@nestjs/swagger"
import { SchoolAssistant } from "../school-assistants"
import { School } from "../school.entity"

export class SchoolForList extends OmitType(School, [
  "assistant",
  "fallbackAssistant",
] as const) {
  assistant: SchoolAssistant
  fallbackAssistant: SchoolAssistant
}

export class FindSchoolsRepDto {
  schools: SchoolForList[]
}
