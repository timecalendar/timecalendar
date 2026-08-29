/**
 * Activity capacity measurement harness (TIM-394).
 *
 *   npm run activity:capacity:seed     -- [--calendars N] [--logs N] [--url URL]
 *   npm run activity:capacity:measure  -- [--samples N] [--url URL]
 *   npm run activity:capacity:compare  -- [--samples N] [--url URL]
 *
 * Subcommands: `seed`, `explain`, `measure`, `compare`, `all`. Output is JSON on
 * stdout, progress on stderr, so a run can be piped straight into the gate
 * document. `compare` runs the whole measurement twice — once on the shipped
 * indexes and once with the candidate composite index — and is what produces the
 * index verdict's evidence.
 *
 * THIS HARNESS NEVER CONNECTS TO PRODUCTION. It refuses to start without an
 * explicit `--url` or `DATABASE_URL`, and it refuses any URL that is not a
 * local/loopback host. `EXPLAIN` output embeds index-condition literals — real
 * calendar UUIDs and tokens — so capturing a production plan would defeat the
 * entire privacy posture of this ticket while looking like a harmless read
 * (design decision D5). The production side of this ticket is
 * `production-aggregates.sql`, which is aggregate-only and is run by the
 * Founding Engineer.
 */

import { monitorEventLoopDelay, performance } from "node:perf_hooks"
import { Client } from "pg"
import {
  ALL_COHORTS,
  COHORTS,
  CohortSpec,
  DEFAULT_SCALE,
  MANY_CHANGES_COHORT,
  SeedScale,
  cohortCalendarIds,
  cohortTokens,
  seedFixtures,
} from "./fixtures"
import {
  PageShape,
  calendarLogPageParams,
  pageSqlForShape,
  resolveCalendarsByTokenSql,
  unreadCountParams,
  unreadCountSql,
} from "./queries"
import { redactPlan } from "./redact"

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100
const DEFAULT_SAMPLES = 40
const CONCURRENCY = 8
const PAGE_SHAPES: readonly PageShape[] = ["specification", "lateral"]

// ---------------------------------------------------------------------------
// Connection safety
// ---------------------------------------------------------------------------

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "postgres", "db"])

/**
 * Rejects anything that is not obviously a local fixture database. Deliberately
 * an allow-list: a deny-list of production hostnames is one rename away from
 * being wrong, and the failure mode is not recoverable — once a plan has been
 * printed the literals are already out.
 */
export const assertLocalDatabaseUrl = (url: string): void => {
  let host: string
  try {
    host = new URL(url).hostname
  } catch {
    throw new Error("activity-capacity: --url is not a valid connection URL")
  }
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(
      `activity-capacity: refusing to connect to host "${host}". This harness ` +
        `runs against local fixtures only — EXPLAIN output embeds calendar ids ` +
        `and tokens verbatim. The production read is production-aggregates.sql, ` +
        `run by the Founding Engineer.`,
    )
  }
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

type Options = {
  command: "seed" | "explain" | "measure" | "compare" | "all"
  url: string
  scale: SeedScale
  samples: number
}

const readFlag = (argv: string[], name: string) => {
  const index = argv.indexOf(`--${name}`)
  return index === -1 ? undefined : argv[index + 1]
}

export const parseOptions = (
  argv: string[],
  env: NodeJS.ProcessEnv,
): Options => {
  const command = (argv[0] ?? "all") as Options["command"]
  if (!["seed", "explain", "measure", "compare", "all"].includes(command)) {
    throw new Error(`activity-capacity: unknown subcommand "${command}"`)
  }

  const url = readFlag(argv, "url") ?? env.DATABASE_URL
  if (!url) {
    throw new Error(
      "activity-capacity: no database URL. Pass --url or set DATABASE_URL — " +
        "this harness never guesses a connection.",
    )
  }
  assertLocalDatabaseUrl(url)

  return {
    command,
    url,
    scale: {
      backgroundCalendars: Number(
        readFlag(argv, "calendars") ?? DEFAULT_SCALE.backgroundCalendars,
      ),
      backgroundLogs: Number(
        readFlag(argv, "logs") ?? DEFAULT_SCALE.backgroundLogs,
      ),
    },
    samples: Number(readFlag(argv, "samples") ?? DEFAULT_SAMPLES),
  }
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

const percentile = (values: number[], fraction: number) => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[
    Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)
  ]
}

const round = (value: number, digits = 1) => Number(value.toFixed(digits))

type Distribution = {
  samples: number
  p50: number
  p95: number
  p99: number
  max: number
}

const distribution = (values: number[], digits = 1): Distribution => ({
  samples: values.length,
  p50: round(percentile(values, 0.5), digits),
  p95: round(percentile(values, 0.95), digits),
  p99: round(percentile(values, 0.99), digits),
  max: round(Math.max(0, ...values), digits),
})

// ---------------------------------------------------------------------------
// The v1 response shape
// ---------------------------------------------------------------------------

type CalendarLogRow = {
  id: string
  calendarId: string
  calendarChange: {
    oldItems: unknown[]
    newItems: unknown[]
    changedItems: unknown[][]
  }
  createdAt: Date
  updatedAt: Date
}

type EventProjection = Record<string, unknown>

/**
 * The five fields `CalendarLogEventGet` keeps. Everything else the database
 * stores — `description`, `teachers`, `tags`, `type`, `fields`, `allDay`,
 * `exportedAt` — is dropped by the mapper and never reaches the wire.
 *
 * This projection is the single most important thing this harness measures. The
 * production aggregate read sized `calendarChange` as it is *stored*; the client
 * receives this, which is a different and much smaller number. Reporting the
 * stored size as the page size would condemn a page size that is in fact fine.
 */
const projectEvent = (event: EventProjection) => ({
  uid: event.uid,
  title: event.title,
  startsAt: event.startsAt,
  endsAt: event.endsAt,
  location: event.location,
})

/** One row in the shape `CalendarLogV1` defines. Note: no `calendarToken`. */
const toCalendarLogV1 = (row: CalendarLogRow, calendarName: string) => ({
  id: row.id,
  calendarId: row.calendarId,
  calendarName,
  calendarChange: {
    oldItems: row.calendarChange.oldItems.map((e) =>
      projectEvent(e as EventProjection),
    ),
    newItems: row.calendarChange.newItems.map((e) =>
      projectEvent(e as EventProjection),
    ),
    changedItems: row.calendarChange.changedItems.map((pair) => ({
      previousItem: projectEvent(pair[0] as EventProjection),
      newItem: projectEvent(pair[1] as EventProjection),
    })),
  },
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
})

const countChangeItems = (row: CalendarLogRow) =>
  row.calendarChange.oldItems.length +
  row.calendarChange.newItems.length +
  row.calendarChange.changedItems.length

// ---------------------------------------------------------------------------
// One page read, exactly as the endpoint will run it
// ---------------------------------------------------------------------------

type ResolvedCalendar = { id: string; name: string }

const resolveCalendars = async (client: Client, tokens: string[]) => {
  const { rows } = await client.query<ResolvedCalendar>(
    resolveCalendarsByTokenSql,
    [tokens],
  )
  return new Map(rows.map((row) => [row.id, row.name]))
}

type PageResult = {
  rows: CalendarLogRow[]
  nextCursor?: { createdAt: Date; id: string }
  durationMs: number
}

const readPage = async (
  client: Client,
  shape: PageShape,
  input: {
    calendarIds: string[]
    asOf: Date
    limit: number
    cursor?: { createdAt: Date; id: string }
  },
): Promise<PageResult> => {
  const startedAt = performance.now()
  const { rows } = await client.query<CalendarLogRow>(
    pageSqlForShape(shape, Boolean(input.cursor)),
    calendarLogPageParams(input),
  )
  const durationMs = performance.now() - startedAt

  // The extra row is the `nextCursor` probe, never part of the page.
  const page = rows.slice(0, input.limit)
  const last = page[page.length - 1]
  return {
    rows: page,
    nextCursor:
      rows.length > input.limit && last
        ? { createdAt: last.createdAt, id: last.id }
        : undefined,
    durationMs,
  }
}

// ---------------------------------------------------------------------------
// measure
// ---------------------------------------------------------------------------

type CohortMeasurement = {
  cohort: string
  shape: PageShape
  calendars: number
  history: string
  pageSize: number
  resolvedCalendars: number
  firstPageMs: Distribution
  followingPageMs: Distribution | null
  unreadCountRecentMs: Distribution
  unreadCountYearMs: Distribution
  v1PageBytes: Distribution
  storedChangeBytes: Distribution
  changeItemsPerPage: Distribution
  rowsInFirstPage: number
  hasFollowingPage: boolean
}

const measureCohort = async (
  client: Client,
  cohort: CohortSpec,
  shape: PageShape,
  pageSize: number,
  samples: number,
): Promise<CohortMeasurement> => {
  const tokens = cohortTokens(cohort)
  const names = await resolveCalendars(client, tokens)
  const calendarIds = cohortCalendarIds(cohort)
  const asOf = new Date()

  const firstPageMs: number[] = []
  const followingPageMs: number[] = []
  const v1PageBytes: number[] = []
  const storedChangeBytes: number[] = []
  const changeItems: number[] = []

  const first = await readPage(client, shape, {
    calendarIds,
    asOf,
    limit: pageSize,
  })

  for (let sample = 0; sample < samples; sample++) {
    const page = await readPage(client, shape, {
      calendarIds,
      asOf,
      limit: pageSize,
    })
    firstPageMs.push(page.durationMs)

    const v1 = page.rows.map((row) =>
      toCalendarLogV1(row, names.get(row.calendarId) ?? ""),
    )
    v1PageBytes.push(
      Buffer.byteLength(
        JSON.stringify({
          items: v1,
          nextCursor: null,
          asOf: asOf.toISOString(),
        }),
      ),
    )
    storedChangeBytes.push(
      page.rows.reduce(
        (sum, row) =>
          sum + Buffer.byteLength(JSON.stringify(row.calendarChange)),
        0,
      ),
    )
    changeItems.push(
      page.rows.reduce((sum, row) => sum + countChangeItems(row), 0),
    )

    if (first.nextCursor) {
      const following = await readPage(client, shape, {
        calendarIds,
        asOf,
        limit: pageSize,
        cursor: first.nextCursor,
      })
      followingPageMs.push(following.durationMs)
    }
  }

  const recentWatermark = new Date(asOf.getTime() - 30 * 86_400_000)
  const yearWatermark = new Date(asOf.getTime() - 365 * 86_400_000)
  const unreadRecentMs: number[] = []
  const unreadYearMs: number[] = []

  for (let sample = 0; sample < samples; sample++) {
    for (const [watermark, target] of [
      [recentWatermark, unreadRecentMs],
      [yearWatermark, unreadYearMs],
    ] as const) {
      const startedAt = performance.now()
      await client.query(
        unreadCountSql,
        unreadCountParams({ calendarIds, unreadSince: watermark, asOf }),
      )
      target.push(performance.now() - startedAt)
    }
  }

  return {
    cohort: cohort.key,
    shape,
    calendars: cohort.calendars,
    history: cohort.variant,
    pageSize,
    resolvedCalendars: names.size,
    firstPageMs: distribution(firstPageMs, 2),
    followingPageMs:
      followingPageMs.length > 0 ? distribution(followingPageMs, 2) : null,
    unreadCountRecentMs: distribution(unreadRecentMs, 2),
    unreadCountYearMs: distribution(unreadYearMs, 2),
    v1PageBytes: distribution(v1PageBytes, 0),
    storedChangeBytes: distribution(storedChangeBytes, 0),
    changeItemsPerPage: distribution(changeItems, 0),
    rowsInFirstPage: first.rows.length,
    hasFollowingPage: Boolean(first.nextCursor),
  }
}

/**
 * Event-loop and heap health under concurrent page reads.
 *
 * The database is not the only way this endpoint can hurt: every page is
 * `JSON.parse`d off the wire and re-serialized, and a 6 MB page parsed on a
 * shared event loop stalls every other request on the pod. That is the failure
 * mode TIM-275 originally recorded, so it gets a number rather than a promise.
 */
const measureConcurrency = async (
  url: string,
  cohort: CohortSpec,
  shape: PageShape,
  pageSize: number,
  rounds: number,
) => {
  const clients = await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      const client = new Client({ connectionString: url })
      await client.connect()
      return client
    }),
  )

  const calendarIds = cohortCalendarIds(cohort)
  const asOf = new Date()
  const names = await resolveCalendars(clients[0], cohortTokens(cohort))

  global.gc?.()
  const heapBefore = process.memoryUsage().heapUsed
  const loopDelay = monitorEventLoopDelay({ resolution: 1 })
  loopDelay.enable()
  const startedAt = performance.now()

  for (let round = 0; round < rounds; round++) {
    await Promise.all(
      clients.map(async (client) => {
        const page = await readPage(client, shape, {
          calendarIds,
          asOf,
          limit: pageSize,
        })
        // Serialize on the shared loop, exactly as the controller would.
        JSON.stringify(
          page.rows.map((row) =>
            toCalendarLogV1(row, names.get(row.calendarId) ?? ""),
          ),
        )
      }),
    )
  }

  const wallMs = performance.now() - startedAt
  loopDelay.disable()
  const heapAfter = process.memoryUsage().heapUsed
  await Promise.all(clients.map((client) => client.end()))

  return {
    concurrency: CONCURRENCY,
    shape,
    rounds,
    totalReads: CONCURRENCY * rounds,
    wallMs: round(wallMs),
    maxEventLoopDelayMs: round(loopDelay.max / 1_000_000, 2),
    p99EventLoopDelayMs: round(loopDelay.percentile(99) / 1_000_000, 2),
    heapGrowthMb: round((heapAfter - heapBefore) / (1024 * 1024), 2),
  }
}

// ---------------------------------------------------------------------------
// explain
// ---------------------------------------------------------------------------

const explainQuery = async (client: Client, sql: string, params: unknown[]) => {
  const { rows } = await client.query<{ "QUERY PLAN": string }>(
    `EXPLAIN (ANALYZE, BUFFERS) ${sql}`,
    params,
  )
  return redactPlan(rows.map((row) => row["QUERY PLAN"]).join("\n"))
}

type CohortPlans = {
  cohort: string
  shape: PageShape
  calendars: number
  pageSize: number
  plans: Record<string, string>
}

const explainCohort = async (
  client: Client,
  cohort: CohortSpec,
  shape: PageShape,
  pageSize: number,
): Promise<CohortPlans> => {
  const calendarIds = cohortCalendarIds(cohort)
  const asOf = new Date()
  const first = await readPage(client, shape, {
    calendarIds,
    asOf,
    limit: pageSize,
  })

  const plans: Record<string, string> = {
    tokenResolution: await explainQuery(client, resolveCalendarsByTokenSql, [
      cohortTokens(cohort),
    ]),
    firstPage: await explainQuery(
      client,
      pageSqlForShape(shape, false),
      calendarLogPageParams({ calendarIds, asOf, limit: pageSize }),
    ),
    unreadCountRecent: await explainQuery(
      client,
      unreadCountSql,
      unreadCountParams({
        calendarIds,
        unreadSince: new Date(asOf.getTime() - 30 * 86_400_000),
        asOf,
      }),
    ),
    unreadCountYear: await explainQuery(
      client,
      unreadCountSql,
      unreadCountParams({
        calendarIds,
        unreadSince: new Date(asOf.getTime() - 365 * 86_400_000),
        asOf,
      }),
    ),
  }

  if (first.nextCursor) {
    plans.followingPage = await explainQuery(
      client,
      pageSqlForShape(shape, true),
      calendarLogPageParams({
        calendarIds,
        asOf,
        limit: pageSize,
        cursor: first.nextCursor,
      }),
    )
  }

  return {
    cohort: cohort.key,
    shape,
    calendars: cohort.calendars,
    pageSize,
    plans,
  }
}

const corpusSize = async (client: Client) => {
  const { rows } = await client.query<{
    calendar_log_rows: string
    calendar_rows: string
    calendar_log_total_bytes: string
  }>(
    `SELECT
       (SELECT count(*) FROM "calendar_log")                  AS calendar_log_rows,
       (SELECT count(*) FROM "calendar")                      AS calendar_rows,
       pg_total_relation_size('calendar_log')                 AS calendar_log_total_bytes`,
  )
  return {
    calendarLogRows: Number(rows[0].calendar_log_rows),
    calendarRows: Number(rows[0].calendar_rows),
    calendarLogTotalMb: round(
      Number(rows[0].calendar_log_total_bytes) / (1024 * 1024),
    ),
  }
}

// ---------------------------------------------------------------------------
// The candidate index
// ---------------------------------------------------------------------------

/**
 * The index the measurement points at.
 *
 * `IDX_calendar_log_calendar_createdAt` is `("calendarId", "createdAt")` with no
 * `id`, so it can satisfy the filter but not the `createdAt DESC, id DESC`
 * ordering. Faced with a query that wants that ordering, the planner walks
 * `IDX_calendar_log_createdAt` — the *global* newest-first index — backwards and
 * discards every row belonging to somebody else's calendar. That plan reads
 * beautifully at small scale and degrades with the size of the whole table
 * rather than with the size of the requested slice, which is exactly the shape
 * of failure a capacity gate exists to catch.
 *
 * `compare` measures with and without this definition so the verdict in the gate
 * document rests on two plans rather than on an argument. **This change creates
 * no migration** — the index, if adopted, is TIM-395's to add.
 */
export const CANDIDATE_INDEX_NAME = "IDX_calendar_log_calendar_createdAt_id"
export const CANDIDATE_INDEX_SQL =
  `CREATE INDEX IF NOT EXISTS "${CANDIDATE_INDEX_NAME}" ` +
  `ON "calendar_log" ("calendarId", "createdAt" DESC, "id" DESC)`

const createCandidateIndex = async (client: Client) => {
  await client.query(CANDIDATE_INDEX_SQL)
  await client.query(`ANALYZE "calendar_log"`)
}

const dropCandidateIndex = async (client: Client) => {
  await client.query(`DROP INDEX IF EXISTS "${CANDIDATE_INDEX_NAME}"`)
  await client.query(`ANALYZE "calendar_log"`)
}

const indexSizeMb = async (client: Client, name: string) => {
  const { rows } = await client.query<{ bytes: string | null }>(
    `SELECT pg_relation_size(c.oid) AS bytes
     FROM pg_class c WHERE c.relname = $1`,
    [name],
  )
  return rows[0] ? round(Number(rows[0].bytes) / (1024 * 1024)) : null
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

const log = (message: string) => process.stderr.write(`${message}\n`)
const emit = (value: unknown) =>
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)

const withClient = async <T>(
  url: string,
  fn: (client: Client) => Promise<T>,
) => {
  const client = new Client({ connectionString: url })
  await client.connect()
  try {
    return await fn(client)
  } finally {
    await client.end()
  }
}

/**
 * One full pass: every cohort, both page shapes, both page sizes, then the
 * plans. Both shapes every time — the whole point of the comparison is that the
 * specification's shape and the lateral rewrite are measured under identical
 * corpus, cache, and statistics conditions.
 */
const runPass = async (client: Client, samples: number) => {
  const cohorts: CohortMeasurement[] = []
  for (const shape of PAGE_SHAPES) {
    for (const pageSize of [DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE]) {
      for (const cohort of ALL_COHORTS) {
        log(`measuring ${cohort.key} (${shape}) @ page size ${pageSize}`)
        cohorts.push(
          await measureCohort(client, cohort, shape, pageSize, samples),
        )
      }
    }
  }

  const plans: CohortPlans[] = []
  for (const shape of PAGE_SHAPES) {
    for (const cohort of ALL_COHORTS) {
      log(`explaining ${cohort.key} (${shape})`)
      plans.push(await explainCohort(client, cohort, shape, DEFAULT_PAGE_SIZE))
    }
  }

  return { cohorts, plans }
}

const main = async () => {
  const options = parseOptions(process.argv.slice(2), process.env)
  const measuredAt = new Date().toISOString()

  if (options.command === "compare") {
    const comparison = await withClient(options.url, async (client) => {
      await dropCandidateIndex(client)
      log("pass 1 — existing indexes only")
      const existingIndexes = await runPass(client, options.samples)
      const corpus = await corpusSize(client)

      log(`pass 2 — with ${CANDIDATE_INDEX_NAME}`)
      await createCandidateIndex(client)
      const candidateIndex = await runPass(client, options.samples)
      const candidateIndexMb = await indexSizeMb(client, CANDIDATE_INDEX_NAME)

      // Leave the fixture database as it was found, so a later `measure` run
      // reports the shipped schema rather than an experiment somebody forgot.
      await dropCandidateIndex(client)

      return {
        corpus,
        candidateIndex: {
          name: CANDIDATE_INDEX_NAME,
          definition: CANDIDATE_INDEX_SQL,
          sizeMb: candidateIndexMb,
        },
        existingIndexes,
        withCandidateIndex: candidateIndex,
      }
    })
    emit({ measuredAt, ...comparison })
    return
  }

  if (options.command === "seed" || options.command === "all") {
    const report = await withClient(options.url, (client) =>
      seedFixtures(client, { scale: options.scale, onProgress: log }),
    )
    if (options.command === "seed") {
      emit({ measuredAt, seed: report })
      return
    }
    log(`seeded in ${round(report.seedMs / 1000)}s`)
  }

  const output = await withClient(options.url, async (client) => {
    const corpus = await corpusSize(client)

    if (options.command === "explain") {
      const plans: CohortPlans[] = []
      for (const shape of PAGE_SHAPES) {
        for (const cohort of ALL_COHORTS) {
          log(`explaining ${cohort.key} (${shape})`)
          plans.push(
            await explainCohort(client, cohort, shape, DEFAULT_PAGE_SIZE),
          )
        }
      }
      return { corpus, plans }
    }

    return { corpus, ...(await runPass(client, options.samples)) }
  })

  log("measuring event-loop health under concurrent reads")
  const concurrency = await measureConcurrency(
    options.url,
    COHORTS.find((c) => c.key === "c100-year") ?? MANY_CHANGES_COHORT,
    "lateral",
    DEFAULT_PAGE_SIZE,
    10,
  )

  emit({ measuredAt, ...output, concurrency })
}

// `require.main === module` keeps the file importable by the tests without
// running the CLI, matching the rest of `src/scripts/`.
if (require.main === module) {
  void main().catch((error: Error) => {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  })
}
