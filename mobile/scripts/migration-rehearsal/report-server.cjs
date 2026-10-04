const { createRequire } = require("node:module")
const { resolve } = require("node:path")
const { randomBytes } = require("node:crypto")
const serverRoot = resolve(__dirname, "../../..", "server")
const fromServer = createRequire(resolve(serverRoot, "package.json"))
const { Client } = fromServer("pg")
const DATABASE = "timecalendar_migration_rehearsal"
const DATABASE_URL = `postgres://postgres@127.0.0.1:37291/${DATABASE}`

async function main() {
  if (process.argv.includes("--status")) {
    const db = new Client({ connectionString: DATABASE_URL })
    await db.connect()
    try {
      const { rows } = await db.query(
        `SELECT report_id AS "reportId", payload->>'outcome' AS outcome, payload->>'reason' AS reason, payload->>'platform' AS platform, delivery_count AS "deliveryCount", received_at AS "receivedAt", last_received_at AS "lastReceivedAt" FROM migration_reporting.report ORDER BY received_at`,
      )
      const { rows: receipts } = await db.query(
        "SELECT count(*)::integer AS count FROM migration_reporting.receipt",
      )
      process.stdout.write(
        JSON.stringify(
          {
            fixtureDatabase: DATABASE,
            reportCount: rows.length,
            receiptCount: receipts[0].count,
            reports: rows,
          },
          null,
          2,
        ) + "\n",
      )
    } finally {
      await db.end()
    }
    return
  }
  process.env.NODE_ENV = "test"
  process.env.OTEL_ENABLED = "false"
  process.env.DATABASE_URL = DATABASE_URL
  process.env.REDIS_URL = "redis://127.0.0.1:37292"
  process.env.MIGRATION_REPORT_RATE_LIMIT_SECRET =
    randomBytes(32).toString("hex")
  const admin = new Client({
    connectionString: "postgres://postgres@127.0.0.1:37291/postgres",
  })
  await admin.connect()
  try {
    const { rowCount } = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [DATABASE],
    )
    if (!rowCount) await admin.query(`CREATE DATABASE ${DATABASE}`)
  } finally {
    await admin.end()
  }
  const { Module } = fromServer("@nestjs/common")
  const { NestFactory } = fromServer("@nestjs/core")
  const { TypeOrmModule } = fromServer("@nestjs/typeorm")
  const { ConfigModule } = fromServer("@nestjs/config")
  const { SharedRedisModule } = fromServer("@lyrolab/nest-shared/redis")
  const { DataSource } = fromServer("typeorm")
  const { MigrationReportModule } = fromServer(
    "./dist/modules/migration-report/migration-report.module",
  )
  const configure = fromServer("./dist/config/configure-main-app").default
  const { CreateMigrationReporting1791129600000 } = fromServer(
    "./dist/migrations/1791129600000-CreateMigrationReporting",
  )
  class ReportRehearsalModule {}
  Module({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
      SharedRedisModule.forRoot(),
      TypeOrmModule.forRoot({
        type: "postgres",
        url: DATABASE_URL,
        entities: [],
        synchronize: false,
      }),
      MigrationReportModule,
    ],
  })(ReportRehearsalModule)
  const app = await NestFactory.create(ReportRehearsalModule, { logger: false })
  const db = app.get(DataSource)
  const [{ exists }] = await db.query(
    "SELECT to_regnamespace('migration_reporting') IS NOT NULL AS exists",
  )
  if (!exists) {
    const runner = db.createQueryRunner()
    await runner.connect()
    try {
      await new CreateMigrationReporting1791129600000().up(runner)
    } finally {
      await runner.release()
    }
  }
  configure(app, app)
  await app.listen(8090, "127.0.0.1")
  process.stdout.write(
    JSON.stringify({
      ready: true,
      host: "127.0.0.1",
      port: 8090,
      fixtureDatabase: DATABASE,
    }) + "\n",
  )
  const stop = async () => {
    await app.close()
    process.exit(0)
  }
  process.once("SIGINT", stop)
  process.once("SIGTERM", stop)
}

main().catch(() => {
  process.stderr.write(
    "Local synthetic report receiver failed; check isolated PostgreSQL/Redis and built server prerequisites\n",
  )
  process.exitCode = 1
})
