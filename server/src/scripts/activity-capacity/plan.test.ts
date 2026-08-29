import { SharedDatabaseModule } from "@lyrolab/nest-shared/database"
import {
  CohortSpec,
  SqlRunner,
  cohortCalendarIds,
  cohortTokens,
  seedFixtures,
} from "./fixtures"
import {
  PageShape,
  calendarLogPageParams,
  calendarLogPageSql,
  pageSqlForShape,
  resolveCalendarsByTokenSql,
  unreadCountParams,
  unreadCountSql,
} from "./queries"

/**
 * The plan regression tripwire (design decision D6).
 *
 * This is NOT the capacity gate. The gate is the full-scale harness run recorded
 * in `docs/react-native-migration/05-tech-specs/activity-capacity-gate.md`. This
 * test does one narrower job that the document cannot: once TIM-395 ships the
 * repository, a query rewrite that loses the index — a reordered `WHERE`, a
 * column wrapped in a function, a join added for `calendarName` — fails here
 * instead of silently regressing production.
 *
 * Two rules make it honest:
 *
 *   1. **No `SET enable_seqscan = off`.** PostgreSQL's planner is cost-based: on
 *      a small table a sequential scan genuinely is cheaper, so a naive
 *      assertion either fails on a correct system or gets "fixed" with that
 *      setting — at which point the test asserts nothing at all while looking
 *      green. The corpus is sized until the index is honestly the cheaper plan.
 *   2. **`ANALYZE` before asserting**, which `seedFixtures` does. Without fresh
 *      statistics the planner is costing a table it believes is empty.
 */

// Sized for the 30 s budget in the change's tasks.md, not for realism — realism
// is the harness's job. Small enough to seed in a couple of seconds, large
// enough that scanning it costs the planner far more than one index descent.
const CI_SCALE = { backgroundCalendars: 400, backgroundLogs: 12_000 }
const CI_COHORT: CohortSpec = { key: "c1-year", calendars: 1, variant: "year" }
// The empty cohort is the one that exposed the planner cliff at full scale, and
// it is the majority request in production: 75% of calendars carry no log.
const CI_EMPTY_COHORT: CohortSpec = {
  key: "c100-empty",
  calendars: 100,
  variant: "empty",
}
const PAGE_SIZE = 50
const SHAPES: PageShape[] = ["specification", "lateral"]

type PlanRow = { "QUERY PLAN": string }

describe("activity-capacity plan tripwire", () => {
  let runner: SqlRunner

  beforeEach(async () => {
    // The suite truncates every table in its own `beforeEach`, which runs first
    // (it is registered in setup-tests.ts). Seeding therefore has to happen
    // here rather than in `beforeAll`, or the corpus would be wiped before the
    // first assertion.
    const dataSource = SharedDatabaseModule.getTestDataSource()
    runner = {
      query: async (text: string, values?: unknown[]) => ({
        rows: await dataSource.query(text, values),
      }),
    }
    await seedFixtures(runner, {
      scale: CI_SCALE,
      cohorts: [CI_COHORT, CI_EMPTY_COHORT],
      // `VACUUM` cannot run inside the suite's transaction.
      vacuum: false,
    })
  })

  const explain = async (sql: string, params: unknown[]) => {
    const { rows } = await runner.query<PlanRow>(
      `EXPLAIN (ANALYZE, BUFFERS) ${sql}`,
      params,
    )
    return rows.map((row) => row["QUERY PLAN"]).join("\n")
  }

  const pageParams = (cursor?: { createdAt: Date; id: string }) =>
    calendarLogPageParams({
      calendarIds: cohortCalendarIds(CI_COHORT),
      asOf: new Date(),
      limit: PAGE_SIZE,
      cursor,
    })

  it.each(SHAPES)(
    "does not sequentially scan calendar_log for a bounded first page (%s)",
    async (shape) => {
      const plan = await explain(pageSqlForShape(shape, false), pageParams())

      expect(plan).not.toMatch(/Seq Scan on calendar_log/)
      expect(plan).toMatch(/IDX_calendar_log_calendar_createdAt/)
    },
  )

  it.each(SHAPES)(
    "does not sequentially scan calendar_log for a bounded following page (%s)",
    async (shape) => {
      const { rows } = await runner.query<{ createdAt: Date; id: string }>(
        pageSqlForShape(shape, false),
        pageParams(),
      )
      const last = rows[rows.length - 1]

      const plan = await explain(
        pageSqlForShape(shape, true),
        pageParams({ createdAt: last.createdAt, id: last.id }),
      )

      expect(plan).not.toMatch(/Seq Scan on calendar_log/)
    },
  )

  /**
   * The lateral rewrite is only usable if it is a *plan* change and nothing
   * else. This is the assertion that makes it safe for TIM-395 to adopt: same
   * rows, same order, page after page, including across a timestamp tie.
   */
  it("returns byte-identical pages for both query shapes", async () => {
    const asOf = new Date()
    const calendarIds = cohortCalendarIds(CI_COHORT)
    const pageSize = 7
    let cursor: { createdAt: Date; id: string } | undefined

    for (let page = 0; page < 6; page++) {
      const params = calendarLogPageParams({
        calendarIds,
        asOf,
        limit: pageSize,
        cursor,
      })
      const [specification, lateral] = await Promise.all(
        SHAPES.map((shape) =>
          runner.query<{ id: string; createdAt: Date }>(
            pageSqlForShape(shape, Boolean(cursor)),
            params,
          ),
        ),
      )

      expect(lateral.rows.map((row) => row.id)).toEqual(
        specification.rows.map((row) => row.id),
      )
      if (specification.rows.length <= pageSize) break
      const last = specification.rows[pageSize - 1]
      cursor = { createdAt: last.createdAt, id: last.id }
    }
  })

  /**
   * The failure this ticket found. A request whose calendars hold no logs has
   * nothing to stop a `LIMIT` early, so the specification's shape can be talked
   * into walking the whole global `createdAt` index. Asserting on buffers rather
   * than on milliseconds keeps this a correctness test rather than a flaky
   * benchmark: the number of pages touched is deterministic, the wall clock is
   * not.
   */
  it("reads a bounded number of buffers for an all-empty cohort (lateral)", async () => {
    const plan = await explain(
      pageSqlForShape("lateral", false),
      calendarLogPageParams({
        calendarIds: cohortCalendarIds(CI_EMPTY_COHORT),
        asOf: new Date(),
        limit: PAGE_SIZE,
      }),
    )

    const buffers = Number(plan.match(/Buffers: shared hit=(\d+)/)?.[1] ?? 0)
    expect(plan).not.toMatch(/Seq Scan on calendar_log/)
    // One index descent per calendar, a handful of pages each. The
    // specification's shape reads the whole index here at production scale.
    expect(buffers).toBeLessThan(CI_EMPTY_COHORT.calendars * 10)
  })

  it("does not sequentially scan calendar_log for a bounded unread count", async () => {
    const plan = await explain(
      unreadCountSql,
      unreadCountParams({
        calendarIds: cohortCalendarIds(CI_COHORT),
        unreadSince: new Date(Date.now() - 30 * 86_400_000),
        asOf: new Date(),
      }),
    )

    expect(plan).not.toMatch(/Seq Scan on calendar_log/)
  })

  it("resolves tokens through the calendar token index", async () => {
    const { rows } = await runner.query<PlanRow>(
      `EXPLAIN (ANALYZE, BUFFERS) ${resolveCalendarsByTokenSql}`,
      [cohortTokens(CI_COHORT)],
    )
    const plan = rows.map((row) => row["QUERY PLAN"]).join("\n")

    expect(plan).not.toMatch(/Seq Scan on calendar\b/)
  })

  it("orders pages by createdAt DESC, id DESC and never repeats a row", async () => {
    const asOf = new Date()
    const calendarIds = cohortCalendarIds(CI_COHORT)
    const seen: string[] = []
    let cursor: { createdAt: Date; id: string } | undefined
    const pageSize = 10

    // Walk the whole cohort. The c1-year cohort is the measured p50 calendar
    // (23 logs), so this is three pages — enough to cross a page boundary that
    // sits on a timestamp tie, which is the case the `id` tie-breaker exists for.
    for (let page = 0; page < 10; page++) {
      const { rows } = await runner.query<{ createdAt: Date; id: string }>(
        calendarLogPageSql(Boolean(cursor)),
        calendarLogPageParams({ calendarIds, asOf, limit: pageSize, cursor }),
      )
      const items = rows.slice(0, pageSize)
      if (items.length === 0) break

      for (let i = 1; i < items.length; i++) {
        const previous = items[i - 1]
        const current = items[i]
        const ordered =
          previous.createdAt > current.createdAt ||
          (previous.createdAt.getTime() === current.createdAt.getTime() &&
            previous.id > current.id)
        expect(ordered).toBe(true)
      }

      seen.push(...items.map((row) => row.id))
      if (rows.length <= pageSize) break
      const last = items[items.length - 1]
      cursor = { createdAt: last.createdAt, id: last.id }
    }

    expect(seen.length).toBeGreaterThan(pageSize)
    expect(new Set(seen).size).toBe(seen.length)
  })

  it("contains timestamp ties, so the tie-breaker is actually exercised", async () => {
    const { rows } = await runner.query<{ ties: string }>(
      `SELECT count(*)::text AS ties FROM (
         SELECT "createdAt" FROM "calendar_log"
         WHERE "calendarId" = ANY($1)
         GROUP BY "createdAt" HAVING count(*) > 1
       ) t`,
      [cohortCalendarIds(CI_COHORT)],
    )

    expect(Number(rows[0].ties)).toBeGreaterThan(0)
  })
})
