import { Body, Controller, HttpCode, Post } from "@nestjs/common"
import { ApiOperation, ApiTags } from "@nestjs/swagger"
import { CreateMigrationReportRepDto } from "modules/migration-report/models/create-migration-report-rep.dto"
import { CreateMigrationReportDto } from "modules/migration-report/models/create-migration-report.dto"
import { MigrationReportService } from "modules/migration-report/services/migration-report.service"

@Controller("v1/migration-reports")
@ApiTags("Migration reports")
export class MigrationReportController {
  constructor(private readonly service: MigrationReportService) {}

  @ApiOperation({ summary: "Submit a data migration report" })
  @Post()
  @HttpCode(200)
  async accept(
    @Body() payload: CreateMigrationReportDto,
  ): Promise<CreateMigrationReportRepDto> {
    await this.service.create(payload)
    return { accepted: true }
  }
}
