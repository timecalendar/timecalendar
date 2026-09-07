import { ApiProperty } from "@nestjs/swagger"

export class SchoolExportGuideRefV1 {
  @ApiProperty({
    type: String,
    pattern: "^[a-z0-9][a-z0-9-]{0,63}$",
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
