import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import {
  EXPORT_GUIDE_LOCALES,
  EXPORT_GUIDE_MIME_TYPES,
} from "modules/export-guide/models/export-guide.model"

export class ExportGuideCompatibilityV1Dto {
  @ApiProperty({ type: Number, minimum: 1, example: 1 })
  minClientSchema: number

  @ApiProperty({ type: Number, minimum: 1, example: 1 })
  maxClientSchema: number
}

export class ExportGuideImageV1Dto {
  @ApiProperty({ type: String, format: "uri", maxLength: 2048 })
  url: string

  @ApiProperty({ enum: EXPORT_GUIDE_MIME_TYPES })
  mimeType: "image/png" | "image/jpeg" | "image/webp"

  @ApiProperty({ type: Number, minimum: 1, maximum: 1048576 })
  byteSize: number

  @ApiProperty({ type: Number, minimum: 1, maximum: 4096 })
  width: number

  @ApiProperty({ type: Number, minimum: 1, maximum: 4096 })
  height: number

  @ApiProperty({ type: String, minLength: 1, maxLength: 500 })
  altText: string

  @ApiPropertyOptional({ type: String, minLength: 1, maxLength: 500 })
  caption?: string
}

export class ExportGuidePageV1Dto {
  @ApiProperty({ type: String, minLength: 1, maxLength: 120 })
  title: string

  @ApiProperty({ type: String, minLength: 1, maxLength: 2000 })
  description: string

  @ApiPropertyOptional({ type: ExportGuideImageV1Dto })
  image?: ExportGuideImageV1Dto
}

export class ExportGuideProviderV1Dto {
  @ApiProperty({ type: String, pattern: "^[a-z0-9][a-z0-9-]{0,63}$" })
  slug: string

  @ApiProperty({ type: String, minLength: 1, maxLength: 80 })
  label: string

  @ApiProperty({ enum: ["pages"], example: "pages" })
  kind: "pages"

  @ApiProperty({ type: Boolean })
  selectable: boolean

  @ApiProperty({ type: ExportGuideCompatibilityV1Dto })
  compatibility: ExportGuideCompatibilityV1Dto

  @ApiPropertyOptional({ type: ExportGuideImageV1Dto })
  thumbnail?: ExportGuideImageV1Dto

  @ApiProperty({ type: [ExportGuidePageV1Dto], minItems: 1, maxItems: 20 })
  pages: ExportGuidePageV1Dto[]
}

export class ExportGuideCatalogueV1Dto {
  @ApiProperty({ enum: [1], example: 1 })
  schemaVersion: 1

  @ApiProperty({ type: String, minLength: 1, maxLength: 128 })
  catalogueVersion: string

  @ApiProperty({ enum: EXPORT_GUIDE_LOCALES })
  locale: "fr" | "en"

  @ApiProperty({ type: [ExportGuideProviderV1Dto], minItems: 1, maxItems: 50 })
  providers: ExportGuideProviderV1Dto[]
}

export class ExportGuideErrorDto {
  @ApiProperty({ type: Number, example: 503 })
  statusCode: number

  @ApiProperty({ type: String, example: "Export guide catalogue unavailable" })
  message: string

  @ApiProperty({ type: String, example: "Service Unavailable" })
  error: string
}
