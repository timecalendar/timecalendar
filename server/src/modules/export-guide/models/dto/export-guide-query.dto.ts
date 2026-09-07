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
import { EXPORT_GUIDE_LOCALES } from "modules/export-guide/models/export-guide.model"

export class ExportGuideQueryDto {
  @ApiProperty({ enum: EXPORT_GUIDE_LOCALES })
  @IsIn(EXPORT_GUIDE_LOCALES)
  locale: "fr" | "en"

  @ApiProperty({ enum: [1], example: 1 })
  @Transform(({ value }) =>
    typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value,
  )
  @IsInt()
  @IsIn([1])
  clientSchema: 1

  @ApiPropertyOptional({ type: String, minLength: 1, maxLength: 128 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  catalogueVersion?: string
}
