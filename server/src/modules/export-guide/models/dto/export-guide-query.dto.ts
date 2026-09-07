import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { Transform } from "class-transformer"
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator"
import {
  EXPORT_GUIDE_LOCALES,
  EXPORT_GUIDE_SCHEMA_VERSION,
  ExportGuideLocale,
} from "modules/export-guide/models/export-guide.model"

export class ExportGuideQueryDto {
  @ApiProperty({ enum: EXPORT_GUIDE_LOCALES })
  @IsIn(EXPORT_GUIDE_LOCALES)
  locale: ExportGuideLocale

  @ApiProperty({
    enum: [EXPORT_GUIDE_SCHEMA_VERSION],
    example: EXPORT_GUIDE_SCHEMA_VERSION,
  })
  @Transform(({ value }) =>
    typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value,
  )
  @IsInt()
  @IsIn([EXPORT_GUIDE_SCHEMA_VERSION])
  clientSchema: typeof EXPORT_GUIDE_SCHEMA_VERSION

  @ApiPropertyOptional({ type: String, minLength: 1, maxLength: 128 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  catalogueVersion?: string
}
