import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common"
import { MigrationReportRepository } from "./repositories/migration-report.repository"
import { MigrationReportRateLimiter } from "./migration-report-rate-limiter"
import { parseMigrationReport } from "./migration-report.schema"

@Injectable()
export class MigrationReportService {
  constructor(
    private readonly repository: MigrationReportRepository,
    private readonly limiter: MigrationReportRateLimiter,
  ) {}

  async accept(body: unknown): Promise<number> {
    const report = parseMigrationReport(body)
    if (!report) throw new BadRequestException("Invalid migration report")
    try {
      const retryAfter = await this.limiter.consume(
        "report",
        report.reportId.toLowerCase(),
      )
      if (retryAfter > 0) return retryAfter
      await this.repository.accept(report)
      return 0
    } catch {
      throw new ServiceUnavailableException("Reporting unavailable")
    }
  }
}
