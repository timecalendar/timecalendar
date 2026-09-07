import { ApiProperty } from "@nestjs/swagger"
import { EXPORT_GUIDE_PROVIDER_SLUG_PATTERN_SOURCE } from "modules/export-guide/models/export-guide.model"

export class SchoolExportGuideRefV1 {
  @ApiProperty({
    type: String,
    pattern: EXPORT_GUIDE_PROVIDER_SLUG_PATTERN_SOURCE,
    description: "Raw server-configured export-guide provider slug",
  })
  providerSlug: string

  @ApiProperty({ type: Boolean })
  requireProgramme: boolean

  @ApiProperty({ type: Boolean })
  requireConnect: boolean

  @ApiProperty({ type: String, minLength: 1, maxLength: 128 })
  catalogueVersion: string
}
