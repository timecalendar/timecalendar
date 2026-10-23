import { Injectable } from "@nestjs/common"
import { CreateMigrationReportDto } from "modules/migration-report/models/create-migration-report.dto"
import { MigrationReportRepository } from "modules/migration-report/repositories/migration-report.repository"

@Injectable()
export class MigrationReportService {
  constructor(private readonly repository: MigrationReportRepository) {}

  async create(report: CreateMigrationReportDto) {
    await this.repository.create(report)
  }
}
