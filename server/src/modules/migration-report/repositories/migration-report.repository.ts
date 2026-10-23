import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { CreateMigrationReportDto } from "modules/migration-report/models/create-migration-report.dto"
import { MigrationReport } from "modules/migration-report/models/migration-report.entity"
import { Repository } from "typeorm"

@Injectable()
export class MigrationReportRepository {
  constructor(
    @InjectRepository(MigrationReport)
    private repository: Repository<MigrationReport>,
  ) {}

  async create(report: CreateMigrationReportDto) {
    await this.repository
      .createQueryBuilder()
      .insert()
      .values(report)
      .orIgnore()
      .execute()
  }
}
