/**
 * Candidate-bound Activity measurement through the shipped Nest HTTP route.
 *
 * The SQL harness owns query and planner evidence. This companion boots the
 * real CalendarLog module against the same deterministic local fixtures and
 * measures the controller, validation, service, repository, mapper and JSON
 * serializer together. Output is aggregate-only: bodies, tokens, ids and
 * cursors are used in memory and are never printed.
 */

import { monitorEventLoopDelay, performance } from "node:perf_hooks"
import { Module } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { NestExpressApplication } from "@nestjs/platform-express"
import { TypeOrmModule } from "@nestjs/typeorm"
import configureMainApp from "config/configure-main-app"
import { CalendarLogModule } from "modules/calendar-log/calendar-log.module"
import { calendarLogPageLateralSql } from "modules/calendar-log/repositories/activity-search.queries"
import {
  ALL_COHORTS,
  CohortSpec,
  FIXTURE_REFERENCE_DATE,
  cohortTokens,
} from "./fixtures"
import { assertLocalDatabaseUrl } from "./cli"

const DEFAULT_SAMPLES = 25
const DEFAULT_WARMUPS = 3
const DEFAULT_CONCURRENCY = 8
const DEFAULT_CONCURRENT_ROUNDS = 10
const PAGE_SIZES = [50, 100] as const
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"])
const DAY_MS = 86_400_000
const RECENT_UNREAD_SINCE = new Date(
  FIXTURE_REFERENCE_DATE.getTime() - 30 * DAY_MS,
).toISOString()
const YEAR_UNREAD_SINCE = new Date(
  FIXTURE_REFERENCE_DATE.getTime() - 365 * DAY_MS,
).toISOString()

/** Identity proof: the route harness and repository resolve this same export. */
export const activityCapacityPageSql = calendarLogPageLateralSql

type Distribution = {
  samples: number
  p50: number
  p95: number
  p99: number
  max: number
}

type PageResponse = {
  items: Array<{
    calendarChange?: {
      newItems?: unknown[]
      changedItems?: unknown[]
      oldItems?: unknown[]
    }
  }>
  nextCursor: string | null
  asOf: string
  unreadCount?: number
}

type RequestResult = {
  durationMs: number
  bytes: number
  payload: PageResponse
}

export type ActivityRouteMeasurementOptions = {
  candidate: string
  samples: number
  warmups: number
  concurrency: number
  concurrentRounds: number
  cohorts: readonly CohortSpec[]
  pageSizes: readonly (50 | 100)[]
}

export type ActivityRouteMeasurement = {
  candidate: string
  method: "nest-http-local-synthetic"
  policy: {
    warmups: number
    samples: number
    concurrency: number
    concurrentRounds: number
  }
  cohorts: Array<{
    cohort: string
    calendars: number
    pageSize: 50 | 100
    firstPageMs: Distribution
    followingPageMs: Distribution | null
    unreadRecentMs: Distribution
    unreadYearMs: Distribution
    serializedResponseBytes: Distribution
    rowsInFirstPage: number
    followingPageAvailable: boolean
    pagesMeasured: number
    changeCounts: {
      newItems: number
      changedItems: number
      oldItems: number
    }
  }>
  concurrency: {
    concurrency: number
    rounds: number
    requests: number
    completed: number
    errors: number
    wallMs: number
    requestMs: Distribution
    eventLoopDelayMs: { max: number; p99: number }
    heapGrowthBytes: number
  }
}

const round = (value: number, digits = 2) => Number(value.toFixed(digits))

const percentile = (values: number[], fraction: number) => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return (
    sorted[
      Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)
    ] ?? 0
  )
}

const distribution = (values: number[], digits = 2): Distribution => ({
  samples: values.length,
  p50: round(percentile(values, 0.5), digits),
  p95: round(percentile(values, 0.95), digits),
  p99: round(percentile(values, 0.99), digits),
  max: round(Math.max(0, ...values), digits),
})

export const assertCandidateSha = (value: string): string => {
  if (!/^[0-9a-f]{40}$/.test(value)) {
    throw new Error(
      "activity-capacity-http: --candidate must be a full commit SHA",
    )
  }
  return value
}

export const assertLocalBaseUrl = (value: string): URL => {
  const url = new URL(value)
  if (!LOCAL_HOSTS.has(url.hostname)) {
    throw new Error(
      `activity-capacity-http: refusing host "${url.hostname}"; route fixtures run locally`,
    )
  }
  return url
}

const assertPageResponse = (value: unknown): PageResponse => {
  if (
    typeof value !== "object" ||
    value === null ||
    !Array.isArray((value as PageResponse).items) ||
    !(
      typeof (value as PageResponse).nextCursor === "string" ||
      (value as PageResponse).nextCursor === null
    ) ||
    typeof (value as PageResponse).asOf !== "string"
  ) {
    throw new Error(
      "activity-capacity-http: route returned an invalid response shape",
    )
  }
  return value as PageResponse
}

const requestPage = async (
  baseUrl: URL,
  input: {
    tokens: string[]
    limit: 50 | 100
    cursor?: string
    unreadSince?: string
  },
): Promise<RequestResult> => {
  const startedAt = performance.now()
  const response = await fetch(new URL("/v1/calendar-logs/search", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  })
  const body = await response.text()
  const durationMs = performance.now() - startedAt
  if (!response.ok) {
    throw new Error(
      `activity-capacity-http: route returned HTTP ${response.status}`,
    )
  }
  return {
    durationMs,
    bytes: Buffer.byteLength(body),
    payload: assertPageResponse(JSON.parse(body) as unknown),
  }
}

const measureCohort = async (
  baseUrl: URL,
  cohort: CohortSpec,
  pageSize: 50 | 100,
  options: Pick<ActivityRouteMeasurementOptions, "samples" | "warmups">,
) => {
  const tokens = cohortTokens(cohort)
  const firstPageMs: number[] = []
  const followingPageMs: number[] = []
  const unreadRecentMs: number[] = []
  const unreadYearMs: number[] = []
  const serializedResponseBytes: number[] = []
  let rowsInFirstPage = 0
  let followingPageAvailable = false
  let pagesMeasured = 0
  let changeCounts = { newItems: 0, changedItems: 0, oldItems: 0 }

  for (let sample = -options.warmups; sample < options.samples; sample++) {
    const record = sample >= 0
    const first = await requestPage(baseUrl, { tokens, limit: pageSize })
    const chain = [first]
    let nextCursor = first.payload.nextCursor
    const completeChain = cohort.key === "many-changes"
    while (nextCursor && (completeChain || chain.length < 2)) {
      const following = await requestPage(baseUrl, {
        tokens,
        limit: pageSize,
        cursor: nextCursor,
      })
      chain.push(following)
      nextCursor = following.payload.nextCursor
      if (chain.length > 1_000) {
        throw new Error(
          "activity-capacity-http: cursor chain did not terminate",
        )
      }
    }
    const unreadRecent = await requestPage(baseUrl, {
      tokens,
      limit: pageSize,
      unreadSince: RECENT_UNREAD_SINCE,
    })
    const unreadYear = await requestPage(baseUrl, {
      tokens,
      limit: pageSize,
      unreadSince: YEAR_UNREAD_SINCE,
    })

    if (!record) continue
    rowsInFirstPage = first.payload.items.length
    followingPageAvailable = chain.length > 1
    pagesMeasured = chain.length
    changeCounts = chain
      .flatMap(({ payload }) => payload.items)
      .reduce(
        (counts, item) => ({
          newItems:
            counts.newItems + (item.calendarChange?.newItems?.length ?? 0),
          changedItems:
            counts.changedItems +
            (item.calendarChange?.changedItems?.length ?? 0),
          oldItems:
            counts.oldItems + (item.calendarChange?.oldItems?.length ?? 0),
        }),
        { newItems: 0, changedItems: 0, oldItems: 0 },
      )
    firstPageMs.push(first.durationMs)
    unreadRecentMs.push(unreadRecent.durationMs)
    unreadYearMs.push(unreadYear.durationMs)
    serializedResponseBytes.push(...chain.map(({ bytes }) => bytes))
    if (chain[1]) {
      followingPageMs.push(chain[1].durationMs)
    }
  }

  return {
    cohort: cohort.key,
    calendars: cohort.calendars,
    pageSize,
    firstPageMs: distribution(firstPageMs),
    followingPageMs:
      followingPageMs.length > 0 ? distribution(followingPageMs) : null,
    unreadRecentMs: distribution(unreadRecentMs),
    unreadYearMs: distribution(unreadYearMs),
    serializedResponseBytes: distribution(serializedResponseBytes, 0),
    rowsInFirstPage,
    followingPageAvailable,
    pagesMeasured,
    changeCounts,
  }
}

const measureConcurrency = async (
  baseUrl: URL,
  options: Pick<
    ActivityRouteMeasurementOptions,
    "concurrency" | "concurrentRounds"
  >,
  cohort: CohortSpec,
) => {
  const tokens = cohortTokens(cohort)
  const durations: number[] = []
  let errors = 0
  const heapBefore = process.memoryUsage().heapUsed
  const eventLoop = monitorEventLoopDelay({ resolution: 10 })
  eventLoop.enable()
  const startedAt = performance.now()

  for (
    let roundIndex = 0;
    roundIndex < options.concurrentRounds;
    roundIndex++
  ) {
    await Promise.all(
      Array.from({ length: options.concurrency }, async () => {
        try {
          const result = await requestPage(baseUrl, {
            tokens,
            limit: 50,
          })
          durations.push(result.durationMs)
        } catch {
          errors += 1
        }
      }),
    )
  }

  eventLoop.disable()
  const requests = options.concurrency * options.concurrentRounds
  return {
    concurrency: options.concurrency,
    rounds: options.concurrentRounds,
    requests,
    completed: durations.length,
    errors,
    wallMs: round(performance.now() - startedAt),
    requestMs: distribution(durations),
    eventLoopDelayMs: {
      max: round(eventLoop.max / 1_000_000),
      p99: round(eventLoop.percentile(99) / 1_000_000),
    },
    heapGrowthBytes: Math.max(0, process.memoryUsage().heapUsed - heapBefore),
  }
}

export const measureActivityRoute = async (
  baseUrlValue: string,
  supplied: Partial<ActivityRouteMeasurementOptions> & { candidate: string },
): Promise<ActivityRouteMeasurement> => {
  const options: ActivityRouteMeasurementOptions = {
    candidate: assertCandidateSha(supplied.candidate),
    samples: supplied.samples ?? DEFAULT_SAMPLES,
    warmups: supplied.warmups ?? DEFAULT_WARMUPS,
    concurrency: supplied.concurrency ?? DEFAULT_CONCURRENCY,
    concurrentRounds: supplied.concurrentRounds ?? DEFAULT_CONCURRENT_ROUNDS,
    cohorts: supplied.cohorts ?? ALL_COHORTS,
    pageSizes: supplied.pageSizes ?? PAGE_SIZES,
  }
  const baseUrl = assertLocalBaseUrl(baseUrlValue)
  const cohorts: ActivityRouteMeasurement["cohorts"] = []
  const concurrencyCohort =
    options.cohorts.find((cohort) => cohort.key === "c100-year") ??
    options.cohorts[0]
  if (!concurrencyCohort) {
    throw new Error("activity-capacity-http: at least one cohort is required")
  }

  for (const pageSize of options.pageSizes) {
    for (const cohort of options.cohorts) {
      process.stderr.write(`measuring HTTP ${cohort.key} @ ${pageSize}\n`)
      cohorts.push(await measureCohort(baseUrl, cohort, pageSize, options))
    }
  }

  return {
    candidate: options.candidate,
    method: "nest-http-local-synthetic",
    policy: {
      warmups: options.warmups,
      samples: options.samples,
      concurrency: options.concurrency,
      concurrentRounds: options.concurrentRounds,
    },
    cohorts,
    concurrency: await measureConcurrency(baseUrl, options, concurrencyCohort),
  }
}

@Module({})
class ActivityCapacityHttpRootModule {}

export const createActivityCapacityHttpApp = async (
  databaseUrl: string,
): Promise<NestExpressApplication> => {
  assertLocalDatabaseUrl(databaseUrl)
  const root = {
    module: ActivityCapacityHttpRootModule,
    imports: [
      TypeOrmModule.forRoot({
        type: "postgres" as const,
        url: databaseUrl,
        entities: [`${__dirname}/../../**/*.entity.{ts,js}`],
        synchronize: false,
        logging: false,
      }),
      CalendarLogModule,
    ],
  }
  const app = await NestFactory.create<NestExpressApplication>(root, {
    logger: false,
  })
  configureMainApp(app.select(root), app)
  await app.listen(0, "127.0.0.1")
  return app
}

const readFlag = (argv: string[], name: string) => {
  const index = argv.indexOf(`--${name}`)
  return index === -1 ? undefined : argv[index + 1]
}

const positiveInteger = (
  name: string,
  value: string | undefined,
  fallback: number,
) => {
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (
    !Number.isInteger(parsed) ||
    parsed < 0 ||
    (parsed === 0 && name !== "warmups")
  ) {
    throw new Error(`activity-capacity-http: --${name} must be a valid integer`)
  }
  return parsed
}

const main = async () => {
  const databaseUrl = readFlag(process.argv, "url")
  const candidate = readFlag(process.argv, "candidate")
  if (!databaseUrl) {
    throw new Error("activity-capacity-http: pass an explicit --url")
  }
  if (!candidate) {
    throw new Error(
      "activity-capacity-http: pass --candidate with the full commit SHA",
    )
  }

  const app = await createActivityCapacityHttpApp(databaseUrl)
  try {
    const result = await measureActivityRoute(await app.getUrl(), {
      candidate,
      samples: positiveInteger(
        "samples",
        readFlag(process.argv, "samples"),
        DEFAULT_SAMPLES,
      ),
      warmups: positiveInteger(
        "warmups",
        readFlag(process.argv, "warmups"),
        DEFAULT_WARMUPS,
      ),
    })
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  } finally {
    await app.close()
  }
}

if (require.main === module) {
  void main().catch((error: Error) => {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  })
}
