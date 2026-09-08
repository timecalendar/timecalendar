import { readFileSync } from "node:fs"
import { SharedDatabaseModule } from "@lyrolab/nest-shared/database"
import { DataSource } from "typeorm"
import { NestExpressApplication } from "@nestjs/platform-express"
import { calendarLogPageLateralSql } from "modules/calendar-log/repositories/activity-search.queries"
import {
  CohortSpec,
  MANY_CHANGES_COHORT,
  SqlRunner,
  cohortTokens,
  seedFixtures,
} from "./fixtures"
import {
  activityCapacityPageSql,
  assertCandidateSha,
  assertLocalBaseUrl,
  createActivityCapacityHttpApp,
  measureActivityRoute,
} from "./http"
import { assertLocalDatabaseUrl } from "./cli"

const CANDIDATE = "a".repeat(40)
// Five year-history calendars yield 168 deterministic logs: enough to cross
// both the 50- and 100-row boundaries without making a CI tripwire pay the
// full-scale harness's cost.
const cohort: CohortSpec = {
  key: "ci-http-year",
  calendars: 5,
  variant: "year",
}

describe("Activity route capacity measurement", () => {
  let app: NestExpressApplication
  let baseUrl: string
  let runner: SqlRunner

  beforeAll(async () => {
    const workerDatabaseOptions =
      SharedDatabaseModule.getTestDataSource().options
    if (
      !("url" in workerDatabaseOptions) ||
      typeof workerDatabaseOptions.url !== "string"
    ) {
      throw new Error("Activity HTTP test database URL is unavailable")
    }

    app = await createActivityCapacityHttpApp(workerDatabaseOptions.url)
    baseUrl = await app.getUrl()
    const dataSource = app.get(DataSource)
    runner = {
      query: async (text: string, values?: unknown[]) => ({
        rows: await dataSource.query(text, values),
      }),
    }
  })

  afterAll(async () => {
    await app?.close()
  })

  it("exercises the real route with bounded aggregate-only output", async () => {
    await seedFixtures(runner, {
      scale: { backgroundCalendars: 0, backgroundLogs: 0 },
      cohorts: [cohort, MANY_CHANGES_COHORT],
      vacuum: false,
    })

    const routeResponse = await fetch(
      new URL("/v1/calendar-logs/search", baseUrl),
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tokens: cohortTokens(cohort), limit: 50 }),
      },
    )
    expect(routeResponse.status).toBe(200)
    const routeBody = (await routeResponse.json()) as Record<string, unknown>
    expect(Array.isArray(routeBody.items)).toBe(true)
    expect(typeof routeBody.nextCursor).toBe("string")
    expect(typeof routeBody.asOf).toBe("string")

    const result = await measureActivityRoute(baseUrl, {
      candidate: CANDIDATE,
      samples: 1,
      warmups: 0,
      concurrency: 2,
      concurrentRounds: 1,
      cohorts: [cohort, MANY_CHANGES_COHORT],
      pageSizes: [50, 100],
    })

    expect(result.candidate).toBe(CANDIDATE)
    expect(result.policy).toMatchObject({ samples: 1, warmups: 0 })
    expect(result.cohorts.map(({ pageSize }) => pageSize)).toEqual([
      50, 50, 100, 100,
    ])
    expect(result.cohorts.every((entry) => entry.followingPageAvailable)).toBe(
      true,
    )
    expect(result.cohorts.every((entry) => entry.rowsInFirstPage > 0)).toBe(
      true,
    )
    expect(
      result.cohorts.every((entry) => entry.unreadRecentMs.samples === 1),
    ).toBe(true)
    expect(
      result.cohorts.every((entry) => entry.unreadYearMs.samples === 1),
    ).toBe(true)
    expect(result.concurrency).toMatchObject({
      requests: 2,
      completed: 2,
      errors: 0,
    })

    const manyChanges = result.cohorts.filter(
      (entry) => entry.cohort === MANY_CHANGES_COHORT.key,
    )
    expect(manyChanges).toHaveLength(2)
    expect(
      manyChanges.every(
        (entry) =>
          entry.pagesMeasured > 1 &&
          entry.serializedResponseBytes.max < 1_000_000,
      ),
    ).toBe(true)
    expect(manyChanges.map((entry) => entry.changeCounts)).toEqual([
      { newItems: 45, changedItems: 3656, oldItems: 214 },
      { newItems: 45, changedItems: 3656, oldItems: 214 },
    ])

    const output = JSON.stringify(result)
    for (const token of [
      ...cohortTokens(cohort),
      ...cohortTokens(MANY_CHANGES_COHORT),
    ])
      expect(output).not.toContain(token)
    expect(output).not.toMatch(/nextCursor|"items"|calendarId|calendarName/)
  })

  it("resolves the production-owned lateral query without a private copy", () => {
    expect(activityCapacityPageSql).toBe(calendarLogPageLateralSql)
    const source = readFileSync(
      __filename.replace(/\.test\.ts$/, ".ts"),
      "utf8",
    )
    expect(source).not.toMatch(/SELECT\s|FROM\s+"calendar_log"/i)
  })

  it.each([
    () => assertLocalBaseUrl("https://example.com"),
    () => assertLocalDatabaseUrl("postgres://user@db.example.com/calendar"),
  ])("refuses non-local targets before connecting", (attempt) => {
    expect(attempt).toThrow(/refusing/)
  })

  it("requires a full candidate SHA", () => {
    expect(assertCandidateSha(CANDIDATE)).toBe(CANDIDATE)
    expect(() => assertCandidateSha("main")).toThrow(/full commit SHA/)
  })
})
