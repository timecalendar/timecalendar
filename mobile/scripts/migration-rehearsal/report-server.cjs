const { createRequire } = require("node:module")
const { resolve } = require("node:path")
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
        `SELECT "reportId", outcome, reason, platform, "receivedAt" FROM migration_report ORDER BY "receivedAt"`,
      )
      process.stdout.write(
        JSON.stringify(
          {
            fixtureDatabase: DATABASE,
            reportCount: rows.length,
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
  const { MigrationReportModule } = fromServer(
    "./dist/modules/migration-report/migration-report.module",
  )
  const { MigrationReport } = fromServer(
    "./dist/modules/migration-report/models/migration-report.entity",
  )
  const configure = fromServer("./dist/config/configure-main-app").default
  class ReportRehearsalModule {}
  Module({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
      TypeOrmModule.forRoot({
        type: "postgres",
        url: DATABASE_URL,
        entities: [MigrationReport],
        synchronize: true,
      }),
      MigrationReportModule,
    ],
  })(ReportRehearsalModule)
  const app = await NestFactory.create(ReportRehearsalModule, { logger: false })
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
    "Local synthetic report receiver failed; check isolated PostgreSQL and built server prerequisites\n",
  )
  process.exitCode = 1
})
