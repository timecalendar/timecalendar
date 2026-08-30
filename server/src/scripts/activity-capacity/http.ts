/**
 * Route-level Activity capacity measurement.
 *
 * The SQL harness proves query behavior; this companion measures the shipped
 * controller, validation, mapping and JSON serialization against the same
 * deterministic fixture tokens. It emits aggregate timings and byte counts
 * only, never request bodies, tokens, cursors or response payloads.
 */

import { performance } from "node:perf_hooks"
import { ALL_COHORTS, COHORTS, CohortSpec, cohortTokens } from "./fixtures"

const DEFAULT_SAMPLES = 25
const CONCURRENCY = 8
const CONCURRENT_ROUNDS = 10
const ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1", "::1"])

type Distribution = {
  samples: number
  p50: number
  p95: number
  p99: number
  max: number
}

const percentile = (values: number[], fraction: number) => {
  const sorted = [...values].sort((a, b) => a - b)
  return (
    sorted[
      Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)
    ] ?? 0
  )
}

const distribution = (values: number[], digits = 2): Distribution => {
  const round = (value: number) => Number(value.toFixed(digits))
  return {
    samples: values.length,
    p50: round(percentile(values, 0.5)),
    p95: round(percentile(values, 0.95)),
    p99: round(percentile(values, 0.99)),
    max: round(Math.max(0, ...values)),
  }
}

export const assertLocalBaseUrl = (value: string): URL => {
  const url = new URL(value)
  if (!ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(
      `activity-capacity-http: refusing host "${url.hostname}"; route capacity fixtures run locally`,
    )
  }
  return url
}

type PageResponse = {
  items: unknown[]
  nextCursor: string | null
  asOf: string
  unreadCount?: number
}

const requestPage = async (
  baseUrl: URL,
  input: { tokens: string[]; limit: number; cursor?: string },
) => {
  const startedAt = performance.now()
  const response = await fetch(new URL("/v1/calendar-logs/search", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      tokens: input.tokens,
      limit: input.limit,
      ...(input.cursor ? { cursor: input.cursor } : {}),
    }),
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
    payload: JSON.parse(body) as PageResponse,
  }
}

const measureCohort = async (
  baseUrl: URL,
  cohort: CohortSpec,
  pageSize: number,
  samples: number,
) => {
  const tokens = cohortTokens(cohort)
  const firstPageMs: number[] = []
  const followingPageMs: number[] = []
  const pageBytes: number[] = []
  let rows = 0
  let hasFollowingPage = false

  for (let sample = 0; sample < samples; sample++) {
    const first = await requestPage(baseUrl, { tokens, limit: pageSize })
    firstPageMs.push(first.durationMs)
    pageBytes.push(first.bytes)
    rows = first.payload.items.length
    hasFollowingPage = first.payload.nextCursor !== null
    if (first.payload.nextCursor) {
      const following = await requestPage(baseUrl, {
        tokens,
        limit: pageSize,
        cursor: first.payload.nextCursor,
      })
      followingPageMs.push(following.durationMs)
      pageBytes.push(following.bytes)
    }
  }

  return {
    cohort: cohort.key,
    calendars: cohort.calendars,
    pageSize,
    requests: samples + followingPageMs.length,
    errors: 0,
    rowsInFirstPage: rows,
    hasFollowingPage,
    firstPageMs: distribution(firstPageMs),
    followingPageMs:
      followingPageMs.length > 0 ? distribution(followingPageMs) : null,
    serializedResponseBytes: distribution(pageBytes, 0),
  }
}

const measureConcurrency = async (baseUrl: URL) => {
  const cohort = COHORTS.find((entry) => entry.key === "c100-year")
  if (!cohort)
    throw new Error("activity-capacity-http: c100-year fixture missing")
  const tokens = cohortTokens(cohort)
  const durations: number[] = []
  let errors = 0
  const startedAt = performance.now()

  for (let round = 0; round < CONCURRENT_ROUNDS; round++) {
    await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        try {
          const result = await requestPage(baseUrl, { tokens, limit: 50 })
          durations.push(result.durationMs)
        } catch {
          errors += 1
        }
      }),
    )
  }

  return {
    concurrency: CONCURRENCY,
    rounds: CONCURRENT_ROUNDS,
    requests: CONCURRENCY * CONCURRENT_ROUNDS,
    errors,
    wallMs: Number((performance.now() - startedAt).toFixed(2)),
    requestMs: distribution(durations),
  }
}

const readFlag = (name: string) => {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? undefined : process.argv[index + 1]
}

const main = async () => {
  const baseUrlValue = readFlag("base-url")
  if (!baseUrlValue) throw new Error("activity-capacity-http: pass --base-url")
  const baseUrl = assertLocalBaseUrl(baseUrlValue)
  const samples = Number(readFlag("samples") ?? DEFAULT_SAMPLES)
  const cohorts: Awaited<ReturnType<typeof measureCohort>>[] = []
  for (const pageSize of [50, 100]) {
    for (const cohort of ALL_COHORTS) {
      process.stderr.write(`measuring HTTP ${cohort.key} @ ${pageSize}\n`)
      cohorts.push(await measureCohort(baseUrl, cohort, pageSize, samples))
    }
  }
  const concurrency = await measureConcurrency(baseUrl)
  process.stdout.write(
    `${JSON.stringify(
      { measuredAt: new Date().toISOString(), samples, cohorts, concurrency },
      null,
      2,
    )}\n`,
  )
}

if (require.main === module) {
  void main().catch((error: Error) => {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  })
}
