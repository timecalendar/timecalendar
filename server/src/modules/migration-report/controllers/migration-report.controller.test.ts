import { NestExpressApplication } from "@nestjs/platform-express"
import request from "lib/supertest"
import { MigrationReportModule } from "modules/migration-report/migration-report.module"
import { MigrationReport } from "modules/migration-report/models/migration-report.entity"
import createTestApp from "test-utils/create-test-app"
import { assertChanges } from "test-utils/typeorm/assert-changes"
import { DataSource } from "typeorm"
import { v4 } from "uuid"

const dataset = {
  candidate: 1,
  imported: 1,
  already_present: 0,
  skipped_invalid: 0,
  skipped_conflict: 0,
}

const buildReport = (overrides: Record<string, unknown> = {}) => ({
  schemaVersion: 1,
  reportId: v4(),
  platform: "ios",
  targetAppVersion: "4.0.0",
  targetBuild: "200",
  sourceAppVersion: "3.9.1",
  sourceDatabaseVersion: 3,
  osMajorVersion: 26,
  startedAt: "2026-10-04T00:00:00.000Z",
  completedAt: "2026-10-04T00:00:01.000Z",
  durationMs: 1000,
  attemptCount: 1,
  outcome: "partial",
  reason: "completed",
  datasets: {
    calendars: dataset,
    personal_events: dataset,
    checklist_items: dataset,
    hidden_events: dataset,
    preferences: dataset,
  },
  errors: [{ stage: "verify", code: "TARGET_VERIFY_FAILED", count: 1 }],
  examplesTruncated: false,
  calendarIds: [v4()],
  calendarIdsTruncated: false,
  ...overrides,
})

describe("MigrationReportController", () => {
  let app: NestExpressApplication
  let dataSource: DataSource

  beforeAll(async () => {
    app = await createTestApp({ imports: [MigrationReportModule] })
    dataSource = app.get(DataSource)
  })

  describe("POST /v1/migration-reports", () => {
    it("stores the report", async () => {
      const report = buildReport()

      await assertChanges(dataSource, [[MigrationReport, 1]], async () => {
        const { body } = await request(app)
          .post("/v1/migration-reports")
          .send(report)
          .expect(200)
        expect(body).toEqual({ accepted: true })
      })

      const stored = await dataSource
        .getRepository(MigrationReport)
        .findOneByOrFail({ reportId: report.reportId })
      expect(stored.outcome).toBe("partial")
      expect(stored.datasets).toEqual(report.datasets)
      expect(stored.errors).toEqual(report.errors)
    })

    it("accepts a report without optional source versions", async () => {
      const report = buildReport({
        sourceAppVersion: undefined,
        sourceDatabaseVersion: undefined,
      })

      await request(app).post("/v1/migration-reports").send(report).expect(200)
    })

    it("ignores a resubmitted report", async () => {
      const report = buildReport()
      await request(app).post("/v1/migration-reports").send(report).expect(200)

      await assertChanges(dataSource, [[MigrationReport, 0]], () =>
        request(app)
          .post("/v1/migration-reports")
          .send({ ...report, outcome: "failed" })
          .expect(200),
      )
    })

    it("rejects an invalid report", async () => {
      await assertChanges(dataSource, [[MigrationReport, 0]], () =>
        request(app)
          .post("/v1/migration-reports")
          .send(buildReport({ platform: "web" }))
          .expect(400),
      )
    })

    it("rejects unknown fields", async () => {
      await request(app)
        .post("/v1/migration-reports")
        .send(buildReport({ deviceName: "iPhone" }))
        .expect(400)
    })

    it("rejects an oversized body", async () => {
      await request(app)
        .post("/v1/migration-reports")
        .send(buildReport({ reason: "x".repeat(20_000) }))
        .expect(413)
    })
  })
})
