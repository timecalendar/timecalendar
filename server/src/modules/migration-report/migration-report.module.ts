import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { MigrationReportController } from "modules/migration-report/controllers/migration-report.controller"
import { MigrationReport } from "modules/migration-report/models/migration-report.entity"
import { MigrationReportRepository } from "modules/migration-report/repositories/migration-report.repository"
import { MigrationReportService } from "modules/migration-report/services/migration-report.service"

@Module({
  imports: [TypeOrmModule.forFeature([MigrationReport])],
  providers: [MigrationReportRepository, MigrationReportService],
  controllers: [MigrationReportController],
})
export class MigrationReportModule {}
