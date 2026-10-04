import "setup-tests"
import { createHmac, randomUUID } from "node:crypto"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { NestExpressApplication } from "@nestjs/platform-express"
import request from "supertest"
import { DataSource, QueryRunner } from "typeorm"
import { CreateMigrationReporting1791129600000 } from "migrations/1791129600000-CreateMigrationReporting"
import { MigrationReportModule } from "modules/migration-report/migration-report.module"
import { MigrationReportRateLimiter } from "modules/migration-report/migration-report-rate-limiter"
import { MigrationReportRepository } from "modules/migration-report/repositories/migration-report.repository"
import { PruneMigrationReportsJob } from "modules/migration-report/prune-migration-reports.job"
import { syntheticMigrationReport } from "modules/migration-report/migration-report.fixture"
import {
  MIGRATION_REPORT_PATH,
  migrationReportOpenApiSchema,
} from "modules/migration-report/migration-report.schema"
import createTestApp from "test-utils/create-test-app"
import { isMigrationReportRequest } from "config/observability/instrumentations"
import { RedisConfig } from "@lyrolab/nest-shared/redis"
import Redis from "ioredis"

describe("private migration reporting HTTP, PostgreSQL and Redis", () => {
  let app: NestExpressApplication
  let db: DataSource
  let runner: QueryRunner
  let ipSequence = 0
  let ip: string
  const migration = new CreateMigrationReporting1791129600000()
  const role = `migration_report_ingest_test_${process.pid}`
  const readerRole = `migration_report_reader_test_${process.pid}`
  const originalSecret = process.env.MIGRATION_REPORT_RATE_LIMIT_SECRET
  const post = (body: object | string) =>
    request(app.getHttpServer())
      .post(MIGRATION_REPORT_PATH)
      .set("X-Forwarded-For", ip)
      .send(body)
  const rows = () => db.query("SELECT * FROM migration_reporting.report")

  beforeAll(async () => {
    process.env.MIGRATION_REPORT_RATE_LIMIT_SECRET = `synthetic-reporting-${randomUUID()}`
    app = await createTestApp({ imports: [MigrationReportModule] })
    await app.listen(0, "127.0.0.1")
    db = app.get(DataSource)
    runner = db.createQueryRunner()
    await runner.connect()
    await migration.up(runner)
    await runner.query(
      `CREATE ROLE "${role}" NOLOGIN; CREATE ROLE "${readerRole}" NOLOGIN`,
    )
    await promisify(execFile)("psql", [
      String((db.options as { url: string }).url),
      "--set",
      `runtime_role=${role}`,
      "--set",
      `support_role=${readerRole}`,
      "--file",
      "bin/provision-migration-report-access.sql",
    ])
  })

  beforeEach(async () => {
    ip = `203.0.113.${++ipSequence}`
    await db.query(
      "TRUNCATE migration_reporting.report, migration_reporting.receipt, migration_reporting.read_audit",
    )
  })

  afterEach(() => jest.restoreAllMocks())

  afterAll(async () => {
    if (originalSecret === undefined)
      delete process.env.MIGRATION_REPORT_RATE_LIMIT_SECRET
    else process.env.MIGRATION_REPORT_RATE_LIMIT_SECRET = originalSecret
    if (runner) {
      await runner.query("RESET ROLE")
      await migration.down(runner)
      await runner.query(`DROP ROLE "${role}"; DROP ROLE "${readerRole}"`)
      await runner.release()
    }
  })

  it.each(["success", "partial", "failed"])(
    "persists a complete %s terminal outcome and server receipt metadata",
    async (outcome) => {
      const report = { ...syntheticMigrationReport(), outcome }
      await post(report).expect(200, { accepted: true })
      const [stored] = await rows()
      expect(stored.payload).toEqual(report)
      expect(stored.delivery_count).toBe(1)
      expect(stored.received_at).toBeInstanceOf(Date)
      expect(stored.last_received_at).toBeInstanceOf(Date)
    },
  )

  it("keeps the first payload immutable across concurrent retries and a new application instance", async () => {
    const report = syntheticMigrationReport()
    await post(report).expect(200)
    await Promise.all(
      Array.from({ length: 8 }, () =>
        post({ ...report, outcome: "failed" }).expect(200, { accepted: true }),
      ),
    )
    const restarted = await createTestApp({ imports: [MigrationReportModule] })
    await request(restarted.getHttpServer())
      .post(MIGRATION_REPORT_PATH)
      .set("X-Forwarded-For", "198.51.100.77")
      .send(report)
      .expect(200)
    const stored = await rows()
    expect(stored).toHaveLength(1)
    expect(stored[0].payload).toEqual(report)
    expect(stored[0].delivery_count).toBe(10)
  })

  it("atomically deduplicates concurrent first arrivals", async () => {
    const report = syntheticMigrationReport()
    await Promise.all(Array.from({ length: 8 }, () => post(report).expect(200)))
    const stored = await rows()
    expect(stored).toHaveLength(1)
    expect(stored[0].delivery_count).toBe(8)
  })

  it.each([
    "token",
    "title",
    "description",
    "location",
    "content",
    "hiddenEventIds",
    "preferenceValues",
    "rawFile",
    "sourceFingerprint",
    "deviceName",
    "firebaseId",
    "tokenHash",
  ])(
    "rejects forbidden %s without storage or log reflection",
    async (field) => {
      const marker = `SYNTHETIC_PRIVATE_${field}`
      const log = jest.spyOn(console, "log").mockImplementation(() => undefined)
      const warn = jest
        .spyOn(console, "warn")
        .mockImplementation(() => undefined)
      const error = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined)
      const query = jest.spyOn(db.logger, "logQuery")
      const response = await post({
        ...syntheticMigrationReport(),
        [field]: marker,
      }).expect(400)
      expect(JSON.stringify(response.body)).not.toContain(marker)
      expect(JSON.stringify(response.body)).not.toContain(field)
      expect(
        JSON.stringify([
          log.mock.calls,
          warn.mock.calls,
          error.mock.calls,
          query.mock.calls,
        ]),
      ).not.toContain(marker)
      expect(await rows()).toEqual([])
    },
  )

  it("rejects unknown names, nested content and malformed duplicate bodies without reflecting them", async () => {
    const report = syntheticMigrationReport()
    await post(report).expect(200)
    await post({ ...report, SYNTHETIC_PRIVATE_KEY: "value" }).expect(400, {
      statusCode: 400,
      message: "Invalid migration report",
      error: "Bad Request",
    })
    await post({
      ...report,
      errors: [
        {
          stage: "parse",
          code: "MALFORMED_JSON",
          count: 1,
          value: "SYNTHETIC_PRIVATE_VALUE",
        },
      ],
    }).expect(400)
    const malformed = await request(app.getHttpServer())
      .post(MIGRATION_REPORT_PATH)
      .set("X-Forwarded-For", ip)
      .set("Content-Type", "application/json")
      .send('{"SYNTHETIC_PRIVATE_KEY": invalid')
      .expect(400)
    expect(JSON.stringify(malformed.body)).not.toContain("SYNTHETIC_PRIVATE")
    expect((await rows())[0].delivery_count).toBe(1)
  })

  it("rejects oversize fixed-length and chunked bodies and compressed/non-JSON requests", async () => {
    const body = JSON.stringify({ private: "SYNTHETIC_PRIVATE".repeat(2000) })
    const response = await request(app.getHttpServer())
      .post(MIGRATION_REPORT_PATH)
      .set("X-Forwarded-For", ip)
      .set("Content-Type", "application/json")
      .send(body)
      .expect(413)
    expect(JSON.stringify(response.body)).not.toContain("SYNTHETIC_PRIVATE")
    const chunked = request(app.getHttpServer())
      .post(MIGRATION_REPORT_PATH)
      .set("X-Forwarded-For", ip)
      .set("Content-Type", "application/json")
    chunked.write(body)
    await chunked.expect(413)
    await post(syntheticMigrationReport())
      .set("Content-Encoding", "gzip")
      .expect(415)
    await post("SYNTHETIC_PRIVATE_TEXT")
      .set("Content-Type", "text/plain")
      .expect(415)
    expect(await rows()).toEqual([])
  })

  it("bounds per-report retries with Retry-After and leaves the first report intact", async () => {
    const report = syntheticMigrationReport()
    for (let attempt = 0; attempt < 10; attempt++)
      await post(report).expect(200)
    const response = await post(report).expect(429)
    expect(Number(response.headers["retry-after"])).toBeGreaterThan(0)
    expect(Number(response.headers["retry-after"])).toBeLessThanOrEqual(3600)
    expect((await rows())[0].delivery_count).toBe(10)
  })

  it("rate-limits invalid requests per IP before validation and shares the quota across instances", async () => {
    for (let attempt = 0; attempt < 60; attempt++) await post({}).expect(400)
    const response = await post({}).expect(429)
    expect(Number(response.headers["retry-after"])).toBeGreaterThan(0)
    expect(Number(response.headers["retry-after"])).toBeLessThanOrEqual(60)
    const other = await createTestApp({ imports: [MigrationReportModule] })
    await request(other.getHttpServer())
      .post(MIGRATION_REPORT_PATH)
      .set("X-Forwarded-For", ip)
      .send({})
      .expect(429)
    expect(await rows()).toEqual([])
  })

  it("fails closed on Redis and database failure with no underlying exception content", async () => {
    const limiter = app.get(MigrationReportRateLimiter)
    const consume = jest
      .spyOn(limiter, "consume")
      .mockRejectedValueOnce(new Error("SYNTHETIC_PRIVATE_REDIS"))
    const redisResponse = await post(syntheticMigrationReport()).expect(503)
    expect(JSON.stringify(redisResponse.body)).not.toContain(
      "SYNTHETIC_PRIVATE",
    )
    consume.mockRestore()
    jest
      .spyOn(app.get(MigrationReportRepository), "accept")
      .mockRejectedValueOnce(new Error("SYNTHETIC_PRIVATE_DATABASE"))
    const response = await post(syntheticMigrationReport()).expect(503)
    expect(JSON.stringify(response.body)).not.toContain("SYNTHETIC_PRIVATE")
    expect(await rows()).toEqual([])
  })

  it("keeps an exhausted quota blocked during its final fraction of a second", async () => {
    const report = syntheticMigrationReport()
    const limiter = app.get(MigrationReportRateLimiter)
    await limiter.consume("report", report.reportId)
    const redis = new Redis(app.get(RedisConfig).url)
    try {
      const digest = createHmac(
        "sha256",
        process.env.MIGRATION_REPORT_RATE_LIMIT_SECRET!,
      )
        .update(report.reportId)
        .digest("hex")
      await redis.set(`migration-report:report:${digest}`, "10", "PX", 400)
      expect(await limiter.consume("report", report.reportId)).toBe(1)
    } finally {
      await redis.quit()
    }
  })

  it("does not pass accepted calendar IDs or SQL parameters to TypeORM logging", async () => {
    const query = jest.spyOn(db.logger, "logQuery")
    const report = syntheticMigrationReport()
    await post(report).expect(200)
    expect(query).not.toHaveBeenCalled()
  })

  it("offers no read, update or delete route", async () => {
    for (const method of ["get", "patch", "delete"] as const) {
      await request(app.getHttpServer())
        [method](MIGRATION_REPORT_PATH)
        .set("X-Forwarded-For", ip)
        .send({})
        .expect(404)
    }
  })

  it("enforces write-only database privileges and audits support reads", async () => {
    const report = syntheticMigrationReport()
    try {
      await runner.query(`SET ROLE "${role}"`)
      await runner.query("SELECT migration_reporting.accept_report($1)", [
        report,
      ])
      await expect(
        runner.query("SELECT * FROM migration_reporting.report"),
      ).rejects.toThrow(/permission denied/)
      await expect(
        runner.query("SELECT migration_reporting.read_report($1)", [
          report.reportId,
        ]),
      ).rejects.toThrow(/permission denied/)
      expect(
        await runner.query(
          "SELECT migration_reporting.prune_reports(180, 1000)",
        ),
      ).toEqual([{ prune_reports: 0 }])
      await runner.query("RESET ROLE")
      await runner.query(`SET ROLE "${readerRole}"`)
      await expect(
        runner.query("SELECT * FROM migration_reporting.report"),
      ).rejects.toThrow(/permission denied/)
      const [{ read_report: result }] = await runner.query(
        "SELECT migration_reporting.read_report($1)",
        [report.reportId],
      )
      expect(result.payload).toEqual(report)
      await expect(
        runner.query("SELECT migration_reporting.accept_report($1)", [report]),
      ).rejects.toThrow(/permission denied/)
      await expect(
        runner.query("SELECT migration_reporting.prune_reports(180, 1000)"),
      ).rejects.toThrow(/permission denied/)
    } finally {
      await runner.query("RESET ROLE")
    }
    const [audit] = await db.query(
      "SELECT * FROM migration_reporting.read_audit",
    )
    expect(audit.reader).toBe(readerRole)
    expect(audit.report_id).toBe(report.reportId)
  })

  it("deletes retained payloads at 180 days without resurrecting old retries", async () => {
    const old = syntheticMigrationReport()
    const recent = syntheticMigrationReport()
    await post(old).expect(200)
    await post(recent).expect(200)
    await db.query(
      "UPDATE migration_reporting.report SET received_at = now() - interval '181 days' WHERE report_id = $1",
      [old.reportId],
    )
    await app.get(PruneMigrationReportsJob).process()
    expect((await rows()).map((row) => row.report_id)).toEqual([
      recent.reportId,
    ])
    await post(old).expect(200)
    expect(await rows()).toHaveLength(1)
    expect(
      await db.query("SELECT * FROM migration_reporting.receipt"),
    ).toHaveLength(2)
  })

  it("bounds retention configuration and SQL batch size", async () => {
    const repository = app.get(MigrationReportRepository)
    await expect(repository.prune(181, 1000)).rejects.toThrow(
      "Invalid retention configuration",
    )
    await expect(repository.prune(180, 1001)).rejects.toThrow(
      "Invalid retention configuration",
    )
    expect(await repository.prune(180, 1)).toBe(0)
  })

  it("restores the private schema with a migration down/up round trip", async () => {
    await migration.down(runner)
    expect(
      await db.query(
        "SELECT 1 FROM information_schema.schemata WHERE schema_name='migration_reporting'",
      ),
    ).toEqual([])
    await migration.up(runner)
    await post(syntheticMigrationReport()).expect(200)
    expect(await rows()).toHaveLength(1)
  })

  it("matches the committed OpenAPI schema and excludes incoming report URLs from tracing", () => {
    const document = JSON.parse(
      readFileSync(resolve(process.cwd(), "../openapi/openapi.json"), "utf8"),
    )
    expect(document.components.schemas.MigrationReport).toEqual(
      migrationReportOpenApiSchema,
    )
    expect(Object.keys(document.paths[MIGRATION_REPORT_PATH])).toEqual(["post"])
    expect(
      document.paths[MIGRATION_REPORT_PATH].post.requestBody.content[
        "application/json"
      ].schema.$ref,
    ).toBe("#/components/schemas/MigrationReport")
    expect(
      isMigrationReportRequest({
        url: `${MIGRATION_REPORT_PATH}?token=SYNTHETIC_PRIVATE`,
      }),
    ).toBe(true)
    expect(isMigrationReportRequest({ url: "/V1/MIGRATION-REPORTS/" })).toBe(
      true,
    )
    expect(isMigrationReportRequest({ url: "/calendars" })).toBe(false)
  })

  it("captures real HTTP/Redis/PostgreSQL instrumentation without private values", async () => {
    const { stdout } = await promisify(execFile)(
      process.execPath,
      ["test/migration-report-telemetry.cjs"],
      {
        env: {
          ...process.env,
          NODE_ENV: "test",
          OTEL_TRACES_SAMPLER: "always_on",
          DATABASE_URL: String((db.options as { url: string }).url),
        },
        timeout: 30000,
      },
    )
    expect(JSON.parse(stdout)).toEqual({
      verified: true,
      calibratedServerSpan: true,
      checkedRequests: 5,
      forbiddenValuesObserved: 0,
    })
  })
})
