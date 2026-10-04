import { Module } from "@nestjs/common"
import { MigrationReportController } from "./migration-report.controller"
import { MigrationReportRateLimiter } from "./migration-report-rate-limiter"
import { MigrationReportRepository } from "./repositories/migration-report.repository"
import { PruneMigrationReportsJob } from "./prune-migration-reports.job"
import { MigrationReportService } from "./migration-report.service"

@Module({
  controllers: [MigrationReportController],
  providers: [
    MigrationReportRateLimiter,
    MigrationReportRepository,
    MigrationReportService,
    PruneMigrationReportsJob,
  ],
})
export class MigrationReportModule {}
