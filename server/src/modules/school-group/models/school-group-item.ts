import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsString, ValidateNested } from "class-validator"

export class SchoolGroupItem {
  @ApiProperty({ type: String })
  @IsString()
  text: string

  @ApiProperty({ type: String })
  @IsString()
  value: string

  @ApiProperty({ type: () => SchoolGroupItem, isArray: true })
  @Type(() => SchoolGroupItem)
  @ValidateNested()
  children: SchoolGroupItem[]
}
