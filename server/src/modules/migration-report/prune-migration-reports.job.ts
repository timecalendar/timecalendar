import { JobProcessor, JobProcessorInterface } from "@lyrolab/nest-shared/queue"
import { Injectable } from "@nestjs/common"
import { MigrationReportRepository } from "./repositories/migration-report.repository"
import { MIGRATION_REPORT_RETENTION_DAYS } from "./migration-report.schema"

@Injectable()
@JobProcessor({ name: "prune_migration_reports", cron: "17 * * * *" })
export class PruneMigrationReportsJob implements JobProcessorInterface {
  constructor(private readonly repository: MigrationReportRepository) {}

  async process() {
    const days = Number(
      process.env.MIGRATION_REPORT_RETENTION_DAYS ??
        MIGRATION_REPORT_RETENTION_DAYS,
    )
    if (
      !Number.isInteger(days) ||
      days < 1 ||
      days > MIGRATION_REPORT_RETENTION_DAYS
    ) {
      throw new Error("Invalid migration report retention configuration")
    }
    try {
      for (let batch = 0; batch < 20; batch++) {
        if ((await this.repository.prune(days, 1000)) < 1000) break
      }
    } catch {
      throw new Error("Migration report retention unavailable")
    }
  }
}
