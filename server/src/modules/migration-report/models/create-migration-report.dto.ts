import { OmitType } from "@nestjs/swagger"
import { MigrationReport } from "modules/migration-report/models/migration-report.entity"

export class CreateMigrationReportDto extends OmitType(MigrationReport, [
  "receivedAt",
] as const) {}
