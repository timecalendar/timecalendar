/** @jest-environment node */
import { execFileSync } from "node:child_process"
import { resolve } from "node:path"

import type { MigrationRun } from "@/db/legacy-migration"
import { FIXTURE_ID, FIXTURE_TIME } from "@/test-support/legacy-fixtures"

import { buildReport } from "./report"
import { diagnose, ERROR_CODES, newCounters, newDiagnostics } from "./types"

it("bounds every terminal result and filters UUID edges independently of import", () => {
  const payloads: unknown[] = []
  for (const outcome of ["success", "partial", "failed"] as const) {
    const run: MigrationRun = {
      state:
        outcome === "success"
          ? "SETTLED_SUCCESS"
          : outcome === "partial"
            ? "SETTLED_PARTIAL"
            : "SETTLED_FAILED",
      outcome,
      reportId: "10000000-0000-4000-8000-000000000001",
      attemptCount: 3000,
      startedAt: FIXTURE_TIME,
      completedAt: "2026-10-04T00:00:00.000Z",
      sourceVersion: 3,
      sourceSizeBytes: 100,
      sourceFingerprint: "LOCAL_ONLY",
      sqliteCommitted: true,
      progress: { version: 1, participants: {} },
      counters: newCounters(),
      diagnostics: newDiagnostics(),
    }
    diagnose(run.diagnostics, "verify", "TARGET_VERIFY_FAILED")
    const report = buildReport(
      run,
      {
        platform: "android",
        targetAppVersion: "not-a-release",
        targetBuild: "invalid",
        osMajorVersion: 999,
      },
      "completed",
      [
        FIXTURE_ID,
        "bad",
        "11111111-1111-1111-1111-111111111111",
        "AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA",
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        "00000000-0000-0000-0000-000000000000",
        "ffffffff-ffff-ffff-ffff-ffffffffffff",
      ],
    )
    expect(report.calendarIds).toHaveLength(4)
    expect(report.calendarIdsTruncated).toBe(true)
    expect(report.attemptCount).toBe(1000)
    expect(report.durationMs).toBe(604800000)
    expect(JSON.stringify(report)).not.toContain("LOCAL_ONLY")
    payloads.push(report)
    for (const [stage, codes] of Object.entries(ERROR_CODES))
      for (const code of codes)
        diagnose(run.diagnostics, stage as keyof typeof ERROR_CODES, code)
    for (const counters of Object.values(run.counters))
      for (const key of Object.keys(counters) as (keyof typeof counters)[])
        counters[key] = 2_000_000
    const maximum = buildReport(
      run,
      {
        platform: "ios",
        targetAppVersion: "4.0.0",
        targetBuild: "200",
        osMajorVersion: 26,
      },
      "completed",
      Array.from(
        { length: 101 },
        (_, index) =>
          `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      ),
    )
    expect(maximum.calendarIds).toHaveLength(100)
    expect(maximum.calendarIdsTruncated).toBe(true)
    expect(maximum.errors).toHaveLength(23)
    expect(maximum.datasets.preferences.candidate).toBe(1_000_000)
    expect(
      new TextEncoder().encode(JSON.stringify(maximum)).length,
    ).toBeLessThan(16_384)
    payloads.push(maximum)
  }
  if (process.env.MIGRATION_SERVER_CONTRACT !== "1") return
  // The cross-package acceptance command installs both applications explicitly.
  // Normal mobile CI has no backend dependency; it still executes all shaping assertions.
  const modulePath = resolve(
    __dirname,
    "../../../../../server/src/modules/migration-report/migration-report.schema.ts",
  )
  const script = `import { readFileSync } from 'node:fs'; import { parseMigrationReport } from ${JSON.stringify(modulePath)}; const payloads = JSON.parse(readFileSync(0,'utf8')); process.stdout.write(JSON.stringify(payloads.map(value => parseMigrationReport(value) !== null)));`
  const result = execFileSync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "-e", script],
    {
      input: JSON.stringify(payloads),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    },
  )
  expect(JSON.parse(result)).toEqual(payloads.map(() => true))
})
