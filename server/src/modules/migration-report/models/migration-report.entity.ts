import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator"
import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm"

@Entity()
export class MigrationReport {
  @PrimaryColumn("uuid")
  @IsUUID()
  reportId: string

  @Column("int")
  @IsInt()
  schemaVersion: number

  @Column("varchar")
  @IsIn(["ios", "android"])
  platform: "ios" | "android"

  @Column("varchar")
  @IsString()
  @MaxLength(20)
  targetAppVersion: string

  @Column("varchar")
  @IsString()
  @MaxLength(10)
  targetBuild: string

  @Column("varchar", { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  sourceAppVersion?: string

  @Column("int", { nullable: true })
  @IsOptional()
  @IsInt()
  sourceDatabaseVersion?: number

  @Column("int")
  @IsInt()
  osMajorVersion: number

  @Column("timestamptz")
  @IsISO8601()
  startedAt: string

  @Column("timestamptz")
  @IsISO8601()
  completedAt: string

  @Column("int")
  @IsInt()
  @Min(0)
  durationMs: number

  @Column("int")
  @IsInt()
  @Min(0)
  attemptCount: number

  @Column("varchar")
  @IsIn(["success", "partial", "failed"])
  outcome: "success" | "partial" | "failed"

  @Column("varchar")
  @IsString()
  @MaxLength(50)
  reason: string

  @Column("jsonb")
  @IsObject()
  datasets: object

  @Column("jsonb")
  @IsArray()
  @ArrayMaxSize(100)
  @IsObject({ each: true })
  errors: object[]

  @Column("boolean")
  @IsBoolean()
  examplesTruncated: boolean

  @Column("jsonb")
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID("all", { each: true })
  calendarIds: string[]

  @Column("boolean")
  @IsBoolean()
  calendarIdsTruncated: boolean

  @CreateDateColumn()
  receivedAt: Date
}
