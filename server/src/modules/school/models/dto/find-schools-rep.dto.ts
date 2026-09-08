import { OmitType } from "@nestjs/swagger"
import { SchoolAssistant } from "modules/school/models/school-assistant.model"
import { School } from "modules/school/models/school.entity"
import { SchoolExportGuideRefV1 } from "modules/export-guide/models/dto/school-export-guide-ref.dto"

export class SchoolForList extends OmitType(School, [
  "profile",
  "assistant",
  "fallbackAssistant",
] as const) {
  assistant: SchoolAssistant
  fallbackAssistant?: SchoolAssistant
  exportGuide: SchoolExportGuideRefV1
}

export class FindSchoolsRepDto {
  schools: SchoolForList[]
}
