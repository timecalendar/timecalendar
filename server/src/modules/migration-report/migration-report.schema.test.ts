import { syntheticMigrationReport } from "./migration-report.fixture"
import {
  MIGRATION_ERROR_CODES,
  parseMigrationReport,
} from "./migration-report.schema"

describe("private migration report allowlist", () => {
  it.each(
    Object.entries(MIGRATION_ERROR_CODES).flatMap(([stage, codes]) =>
      codes.map((code) => ({ stage, code })),
    ),
  )("accepts the approved $stage/$code pair", ({ stage, code }) => {
    const report = syntheticMigrationReport()
    report.outcome = "partial"
    report.errors = [{ stage, code, count: 1 }]
    expect(parseMigrationReport(report)).toEqual(report)
  })

  it.each([
    { schemaVersion: 2 },
    { reportId: "private-id" },
    { platform: "web" },
    { targetAppVersion: "private-version" },
    { targetBuild: "private-build" },
    { osMajorVersion: 0 },
    { osMajorVersion: 101 },
    { attemptCount: 0 },
    { attemptCount: 1001 },
    { durationMs: 604_800_001 },
    { durationMs: -1 },
    { durationMs: 1.5 },
    { sourceDatabaseVersion: null },
    { sourceDatabaseVersion: -1 },
    { startedAt: "2026-10-04T10:00:00Z" },
    { completedAt: "2026-10-03T00:00:00.000Z" },
    { outcome: "IN_PROGRESS" },
    { reason: "private-error-message" },
    { examplesTruncated: "false" },
    { calendarIds: ["private-calendar-id"] },
    { errors: [{ stage: "parse", code: "INVALID_RECORD", count: 1 }] },
    { errors: [{ stage: "parse", code: "MALFORMED_JSON", count: 0 }] },
    {
      errors: [
        {
          stage: "parse",
          code: "MALFORMED_JSON",
          count: 1,
          value: "private-content",
        },
      ],
    },
    {
      errors: Array(24).fill({
        stage: "parse",
        code: "MALFORMED_JSON",
        count: 1,
      }),
    },
    { token: "synthetic-private-token" },
  ])("rejects invalid fields without coercion: %j", (patch) => {
    expect(
      parseMigrationReport({ ...syntheticMigrationReport(), ...patch }),
    ).toBeNull()
  })

  it("rejects nested unknown fields and duplicate ids/errors", () => {
    const report = syntheticMigrationReport()
    expect(
      parseMigrationReport({
        ...report,
        datasets: { ...report.datasets, theme: "private-theme" },
      }),
    ).toBeNull()
    expect(
      parseMigrationReport({
        ...report,
        datasets: {
          ...report.datasets,
          calendars: { ...report.datasets.calendars, token: "private-token" },
        },
      }),
    ).toBeNull()
    expect(
      parseMigrationReport({
        ...report,
        calendarIds: [
          ...report.calendarIds,
          report.calendarIds[0].toUpperCase(),
        ],
      }),
    ).toBeNull()
    expect(
      parseMigrationReport({
        ...report,
        errors: Array(2).fill({
          stage: "parse",
          code: "MALFORMED_JSON",
          count: 1,
        }),
      }),
    ).toBeNull()
  })

  it("supports bounded crash retry metadata independent of wall time", () => {
    const report = syntheticMigrationReport()
    report.completedAt = "2027-10-04T10:00:00.000Z"
    report.durationMs = 604_800_000
    report.attemptCount = 1000
    delete report.sourceAppVersion
    delete report.sourceDatabaseVersion
    expect(parseMigrationReport(report)).toEqual(report)
  })
})
