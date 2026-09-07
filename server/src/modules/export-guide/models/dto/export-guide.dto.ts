import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import {
  EXPORT_GUIDE_IMAGE_MAX_BYTES,
  EXPORT_GUIDE_IMAGE_MAX_DIMENSION,
  EXPORT_GUIDE_LOCALES,
  EXPORT_GUIDE_MIME_TYPES,
  EXPORT_GUIDE_PROVIDER_KIND,
  EXPORT_GUIDE_PROVIDER_SLUG_PATTERN_SOURCE,
  EXPORT_GUIDE_SCHEMA_VERSION,
  ExportGuideLocale,
  ExportGuideMimeType,
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
  mimeType: ExportGuideMimeType

  @ApiProperty({
    type: Number,
    minimum: 1,
    maximum: EXPORT_GUIDE_IMAGE_MAX_BYTES.page,
  })
  byteSize: number

  @ApiProperty({
    type: Number,
    minimum: 1,
    maximum: EXPORT_GUIDE_IMAGE_MAX_DIMENSION,
  })
  width: number

  @ApiProperty({
    type: Number,
    minimum: 1,
    maximum: EXPORT_GUIDE_IMAGE_MAX_DIMENSION,
  })
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
  @ApiProperty({
    type: String,
    pattern: EXPORT_GUIDE_PROVIDER_SLUG_PATTERN_SOURCE,
  })
  slug: string

  @ApiProperty({ type: String, minLength: 1, maxLength: 80 })
  label: string

  @ApiProperty({
    enum: [EXPORT_GUIDE_PROVIDER_KIND],
    example: EXPORT_GUIDE_PROVIDER_KIND,
  })
  kind: typeof EXPORT_GUIDE_PROVIDER_KIND

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
  @ApiProperty({
    enum: [EXPORT_GUIDE_SCHEMA_VERSION],
    example: EXPORT_GUIDE_SCHEMA_VERSION,
  })
  schemaVersion: typeof EXPORT_GUIDE_SCHEMA_VERSION

  @ApiProperty({ type: String, minLength: 1, maxLength: 128 })
  catalogueVersion: string

  @ApiProperty({ enum: EXPORT_GUIDE_LOCALES })
  locale: ExportGuideLocale

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
