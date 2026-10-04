import { Injectable } from "@nestjs/common"
import { context } from "@opentelemetry/api"
import { suppressTracing } from "@opentelemetry/core"
import { DataSource } from "typeorm"
import { PostgresDriver } from "typeorm/driver/postgres/PostgresDriver"
import { MigrationReport } from "modules/migration-report/migration-report.schema"

@Injectable()
export class MigrationReportRepository {
  constructor(private readonly dataSource: DataSource) {}

  private async query(sql: string, values: unknown[]) {
    // TypeORM logs SQL parameters even on failures. Use its pooled connection
    // directly and suppress driver tracing for this private reporting boundary.
    return context.with(suppressTracing(context.active()), async () => {
      const [connection, release] = await (
        this.dataSource.driver as PostgresDriver
      ).obtainMasterConnection()
      try {
        return await connection.query({
          text: sql,
          values,
          query_timeout: 5000,
        })
      } finally {
        release()
      }
    })
  }

  async accept(report: MigrationReport): Promise<void> {
    await this.query("SELECT migration_reporting.accept_report($1::jsonb)", [
      JSON.stringify(report),
    ])
  }

  async prune(retentionDays: number, batchSize: number): Promise<number> {
    const result = await this.query(
      "SELECT migration_reporting.prune_reports($1, $2) AS removed",
      [retentionDays, batchSize],
    )
    return result.rows[0].removed
  }
}
