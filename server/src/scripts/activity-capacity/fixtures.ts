/**
 * Deterministic fixture corpus for the Activity capacity measurement (TIM-394).
 *
 * Two layers, and the first one is the load-bearing part (design decision D3):
 *
 *   1. A **background corpus** — hundreds of thousands of calendars and roughly
 *      a million calendar logs that nobody reads. Measuring a 100-calendar page
 *      against a table that contains *only* those 100 calendars' rows proves
 *      nothing: index selectivity, buffer behaviour, and the planner's choice
 *      between an index scan and a sequential scan all depend on how small the
 *      requested slice is relative to the whole table. A fixture without
 *      background volume produces flattering plans and meaningless budgets.
 *   2. The **measurement cohorts** seeded on top — 1, 10, and 100 calendars,
 *      each over a recent (30-day) and a year-long history, plus one
 *      many-changes-in-one-log calendar.
 *
 * Everything is derived from indices and a single fixed seed. There is no
 * `random()` anywhere: two runs of the seeder produce byte-identical rows, so a
 * measurement can be re-run and compared rather than merely repeated.
 *
 * Every string is synthetic. No name, title, location, or token is copied from
 * production, and no production value was consulted to write them — the shapes
 * come from the aggregate byte and change-count distributions only.
 */

import { createHash } from "node:crypto"

/**
 * The seeder needs nothing but "run this parameterized statement". A `pg.Client`
 * satisfies it as-is; the CI tripwire wraps the Jest worker's TypeORM
 * `DataSource` in it, so the harness and the test seed from the same code rather
 * than from two implementations that drift.
 */
export interface SqlRunner {
  query<R = unknown>(text: string, values?: unknown[]): Promise<{ rows: R[] }>
}

/** Namespaced so a fixture row is always identifiable in a shared database. */
export const FIXTURE_NAMESPACE = "tim-394-activity-capacity"

/**
 * The reference instant every fixture timestamp is measured back from. Fixed, so
 * the corpus does not drift with the wall clock and two runs on different days
 * still produce identical rows.
 */
export const FIXTURE_REFERENCE_DATE = new Date("2026-08-29T00:00:00.000Z")

const DAY_SECONDS = 86_400
const RECENT_WINDOW_SECONDS = 30 * DAY_SECONDS
const YEAR_WINDOW_SECONDS = 365 * DAY_SECONDS

/**
 * Production shape, as measured on 2026-08-29 and reported on TIM-394.
 *
 * Each entry is `[quantile, value]`; the seeder interpolates linearly between
 * them, so a cohort of n calendars reproduces the measured distribution rather
 * than n copies of its mean. That matters because the mean is not where the
 * cost is: the p99 calendar carries seven times the p50's history.
 */
type Quantiles = readonly (readonly [number, number])[]

/** Q3 — logs per calendar over the whole one-year retention window. */
export const LOGS_PER_CALENDAR_YEAR: Quantiles = [
  [0, 1],
  [0.5, 23],
  [0.9, 83],
  [0.95, 109],
  [0.99, 164],
  [1, 911],
]

/**
 * Q4 — logs per calendar over the last 30 days. Measured in August, so this is
 * the seasonal *floor*, not term time; Ticket 8 re-measures in September.
 */
export const LOGS_PER_CALENDAR_RECENT: Quantiles = [
  [0, 1],
  [0.5, 1],
  [0.9, 4],
  [0.95, 5],
  [0.99, 9],
  [1, 22],
]

/** Q6 — event changes packed into one log (`oldItems + newItems + changedItems`). */
export const CHANGES_PER_LOG: Quantiles = [
  [0, 1],
  [0.5, 2],
  [0.95, 45],
  [0.99, 214],
  [1, 3656],
]

/**
 * Production's calendar population is 75% zero-log calendars (444,072 calendars,
 * 111,530 with any log). The background corpus reproduces that ratio so the
 * planner sees a realistically sparse `calendar_log` relative to `calendar`.
 */
const BACKGROUND_LOGGED_FRACTION = 0.25

export type HistoryVariant = "recent" | "year"

export type CohortSpec = {
  /** Stable key — used for the deterministic ids and as the report label. */
  readonly key: string
  readonly calendars: number
  readonly variant: HistoryVariant
}

/** The 1/10/100 × recent/year spine the specification fixes. */
export const COHORTS: readonly CohortSpec[] = [
  { key: "c1-recent", calendars: 1, variant: "recent" },
  { key: "c1-year", calendars: 1, variant: "year" },
  { key: "c10-recent", calendars: 10, variant: "recent" },
  { key: "c10-year", calendars: 10, variant: "year" },
  { key: "c100-recent", calendars: 100, variant: "recent" },
  { key: "c100-year", calendars: 100, variant: "year" },
]

/**
 * The many-changes-in-one-log case, carrying the measured p95 / p99 / max change
 * counts in three separate logs. This is the cohort the worst-case page byte
 * number comes from.
 */
export const MANY_CHANGES_COHORT: CohortSpec = {
  key: "many-changes",
  calendars: 1,
  variant: "year",
}
const MANY_CHANGES_PER_LOG = [45, 214, 3656] as const

export const ALL_COHORTS: readonly CohortSpec[] = [
  ...COHORTS,
  MANY_CHANGES_COHORT,
]

export type SeedScale = {
  /** Background calendars. Production: 444,072. */
  readonly backgroundCalendars: number
  /** Background calendar logs. Production: 3,893,928. */
  readonly backgroundLogs: number
}

/**
 * Default local scale. Deliberately below production's 444k/3.9M because the
 * property that matters is the *ratio* of a requested slice to the whole table,
 * not the absolute row count: a 100-calendar year cohort is ~3,500 rows, which
 * is 0.09% of production's table and 0.35% of this one. Both are far inside the
 * range where an index scan must win, and the smaller table is the *conservative*
 * direction — fewer pages to scan makes a sequential scan cheaper, so a plan
 * that stays on the index here would stay on it at production scale too.
 *
 * Raise it with `--calendars` / `--logs` when the machine has the disk for it;
 * the gate document records the scale every number was measured at.
 */
export const DEFAULT_SCALE: SeedScale = {
  backgroundCalendars: 100_000,
  backgroundLogs: 1_000_000,
}

// ---------------------------------------------------------------------------
// Deterministic identity
// ---------------------------------------------------------------------------

const md5Hex = (key: string) =>
  createHash("md5").update(`${FIXTURE_NAMESPACE}:${key}`).digest("hex")

/**
 * A UUID derived from a key. PostgreSQL accepts 32 unhyphenated hex digits as a
 * uuid, and so does this — the hyphens are added purely so the value reads as a
 * UUID in a plan or a log line.
 */
export const fixtureUuid = (key: string): string => {
  const hex = md5Hex(key)
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-")
}

/** Synthetic token, shaped like a real one (opaque, URL-safe) but derived. */
export const fixtureToken = (key: string): string =>
  `tim394${md5Hex(`token:${key}`).slice(0, 20)}`

const cohortCalendarKey = (cohort: CohortSpec, index: number) =>
  `${cohort.key}/calendar/${index}`

/** The calendar ids a cohort resolves to — the harness's query input. */
export const cohortCalendarIds = (cohort: CohortSpec): string[] =>
  Array.from({ length: cohort.calendars }, (_, index) =>
    fixtureUuid(cohortCalendarKey(cohort, index)),
  )

/** The tokens a cohort resolves from — the endpoint's real request input. */
export const cohortTokens = (cohort: CohortSpec): string[] =>
  Array.from({ length: cohort.calendars }, (_, index) =>
    fixtureToken(cohortCalendarKey(cohort, index)),
  )

// ---------------------------------------------------------------------------
// Deterministic distribution
// ---------------------------------------------------------------------------

/**
 * Linear interpolation through measured quantiles. `quantile` is clamped, so a
 * caller may pass 0 or 1 to ask for the observed minimum or maximum.
 */
export const fromQuantiles = (points: Quantiles, quantile: number): number => {
  const q = Math.min(1, Math.max(0, quantile))
  for (let i = 1; i < points.length; i++) {
    const [upperQ, upperValue] = points[i]
    if (q > upperQ) continue
    const [lowerQ, lowerValue] = points[i - 1]
    const span = upperQ - lowerQ
    const ratio = span === 0 ? 0 : (q - lowerQ) / span
    return Math.max(
      1,
      Math.round(lowerValue + ratio * (upperValue - lowerValue)),
    )
  }
  return points[points.length - 1][1]
}

/**
 * The quantile calendar `index` of `count` stands at. Midpoints rather than
 * `index / count`, so a 1-calendar cohort lands on the median instead of the
 * minimum and a 100-calendar cohort reaches p99.5 instead of stopping at p99.
 */
const midpointQuantile = (index: number, count: number) => (index + 0.5) / count

const logsForCalendar = (cohort: CohortSpec, index: number) =>
  fromQuantiles(
    cohort.variant === "year"
      ? LOGS_PER_CALENDAR_YEAR
      : LOGS_PER_CALENDAR_RECENT,
    midpointQuantile(index, cohort.calendars),
  )

// ---------------------------------------------------------------------------
// Synthetic payloads
// ---------------------------------------------------------------------------

const TITLES = [
  "Analyse numérique — CM",
  "Thermodynamique appliquée — TD",
  "Programmation systeme — TP",
  "Anglais scientifique",
  "Projet integrateur — soutenance",
  "Statistiques inferentielles — CM",
  "Mecanique des fluides — TD",
  "Electronique analogique — TP",
]

const LOCATIONS = [
  "Amphi A",
  "Salle B204",
  "Laboratoire 3",
  "Batiment C — 112",
  "Salle informatique 2",
]

const TEACHERS = [
  ["A. Fixture"],
  ["B. Fixture", "C. Fixture"],
  ["D. Fixture"],
  [],
]

const TYPES = ["cm", "td", "tp", "tp2", "project", "exam", "class"]

/**
 * A description long enough to be honest. Production stores the whole
 * `CalendarEvent`, description included, which is why a stored change payload
 * averages 1.5 KB and a wire payload 6.7 KB. A fixture event with an empty
 * description would understate every byte number this harness reports.
 */
const DESCRIPTION =
  "Seance programmee par le service de scolarite. Merci de consulter " +
  "l'espace pedagogique pour les supports et les modalites d'evaluation. " +
  "Toute modification est signalee par notification."

/**
 * One synthetic event in the shape production actually stores: the full
 * `CalendarEvent`, not the five-field projection the v1 response returns. The
 * gap between the two is measured, not assumed — see `cli.ts`.
 */
const fixtureEvent = (seed: number, index: number) => {
  const startsAt = new Date(
    FIXTURE_REFERENCE_DATE.getTime() -
      ((seed * 37 + index * 3) % 365) * DAY_SECONDS * 1000,
  )
  return {
    uid: `${md5Hex(`event:${seed}:${index}`).slice(0, 24)}@fixtures.invalid`,
    title: TITLES[(seed + index) % TITLES.length],
    startsAt: startsAt.toISOString(),
    endsAt: new Date(startsAt.getTime() + 5_400_000).toISOString(),
    location: LOCATIONS[(seed * 3 + index) % LOCATIONS.length],
    allDay: false,
    description: DESCRIPTION,
    teachers: TEACHERS[(seed + index) % TEACHERS.length],
    tags: [],
    type: TYPES[(seed * 5 + index) % TYPES.length],
    fields: null,
    exportedAt: FIXTURE_REFERENCE_DATE.toISOString(),
  }
}

/**
 * A `calendarChange` carrying `changes` counted items, distributed across the
 * three arrays the way a real diff is: an added-events log, a removed-events
 * log, and a modified-events log rotate by index. `changedItems` holds *pairs*,
 * so it is the expensive shape per counted item — production's byte-per-item
 * ratio only reproduces if some logs use it.
 */
export const fixtureCalendarChange = (seed: number, changes: number) => {
  const events = Array.from({ length: changes }, (_, index) =>
    fixtureEvent(seed, index),
  )
  switch (seed % 3) {
    case 0:
      return { oldItems: [], newItems: events, changedItems: [] }
    case 1:
      return { oldItems: events, newItems: [], changedItems: [] }
    default:
      return {
        oldItems: [],
        newItems: [],
        changedItems: events.map((event, index) => [
          event,
          {
            ...event,
            title: `${event.title} (modifie)`,
            location: LOCATIONS[index % LOCATIONS.length],
          },
        ]),
      }
  }
}

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

export type SeedReport = {
  scale: SeedScale
  backgroundCalendars: number
  backgroundLogs: number
  cohorts: { key: string; calendars: number; logs: number }[]
  totalCalendars: number
  totalLogs: number
  seedMs: number
}

/**
 * Removes every fixture row this module can create, so a re-seed is idempotent
 * and a shared dev database is left as it was found. Scoped by the fixture
 * token prefix — nothing else is touched.
 */
export const clearFixtures = async (client: SqlRunner): Promise<void> => {
  await client.query(
    `DELETE FROM "calendar_log"
     WHERE "calendarId" IN (SELECT "id" FROM "calendar" WHERE "token" LIKE 'tim394%')`,
  )
  await client.query(`DELETE FROM "calendar" WHERE "token" LIKE 'tim394%'`)
}

/**
 * The background corpus, seeded server-side.
 *
 * `INSERT … SELECT … FROM generate_series(…)` is not an optimisation detail
 * here: a million rows through an ORM loop is tens of minutes and a million
 * round trips, which in practice means the corpus quietly shrinks until it is
 * too small to make the plans meaningful. This lands in one statement per table.
 */
const seedBackground = async (client: SqlRunner, scale: SeedScale) => {
  const loggedCalendars = Math.max(
    1,
    Math.round(scale.backgroundCalendars * BACKGROUND_LOGGED_FRACTION),
  )

  await client.query(
    `INSERT INTO "calendar"
       ("id", "name", "url", "token", "lastUpdatedAt", "syncPlannedAt",
        "lastAccessedAt", "createdAt", "updatedAt")
     SELECT
       md5($1 || g::text)::uuid,
       'Fixture background calendar ' || g,
       'https://fixtures.invalid/background/' || g || '.ics',
       'tim394bg' || lpad(g::text, 12, '0'),
       $2::timestamp, $2::timestamp, $2::timestamp, $2::timestamp, $2::timestamp
     FROM generate_series(1, $3::int) g
     ON CONFLICT DO NOTHING`,
    [
      `${FIXTURE_NAMESPACE}:background/calendar/`,
      FIXTURE_REFERENCE_DATE,
      scale.backgroundCalendars,
    ],
  )

  // Sixteen payload templates picked by array subscript rather than a per-row
  // correlated `json_agg`: aggregating a JSON document per row over a million
  // rows is minutes of CPU, an array subscript is free. Background payloads are
  // small on purpose — see DEFAULT_SCALE on why small background rows are the
  // conservative choice for a plan assertion.
  const templates = Array.from({ length: 16 }, (_, index) =>
    JSON.stringify(fixtureCalendarChange(index, 1 + (index % 3))),
  )

  // Spread evenly across the one-year retention window, so the background rows
  // interleave with every cohort's history instead of clustering in one corner
  // of the index.
  await client.query(
    `INSERT INTO "calendar_log" ("id", "calendarId", "calendarChange", "createdAt", "updatedAt")
     SELECT
       md5($1 || g::text)::uuid,
       md5($2 || (((g - 1) % $3::int) + 1)::text)::uuid,
       ($7::text[])[(g % 16) + 1]::json,
       $4::timestamp - make_interval(secs => g::float8 * $5::float8 / $6::float8),
       $4::timestamp - make_interval(secs => g::float8 * $5::float8 / $6::float8)
     FROM generate_series(1, $6::int) g
     ON CONFLICT DO NOTHING`,
    [
      `${FIXTURE_NAMESPACE}:background/log/`,
      `${FIXTURE_NAMESPACE}:background/calendar/`,
      loggedCalendars,
      FIXTURE_REFERENCE_DATE,
      YEAR_WINDOW_SECONDS,
      scale.backgroundLogs,
      templates,
    ],
  )
}

type CohortRow = {
  id: string
  calendarId: string
  change: string
  createdAt: Date
}

/**
 * Builds one cohort's rows in memory. Cohorts are small (hundreds of calendars,
 * thousands of logs) and their payloads are large and irregular, which is
 * exactly the case where readable TypeScript beats clever SQL — the background
 * corpus is where the bulk path earns its keep.
 */
const buildCohortRows = (cohort: CohortSpec) => {
  const calendars: { id: string; token: string; name: string }[] = []
  const logs: CohortRow[] = []
  const windowSeconds =
    cohort.variant === "year" ? YEAR_WINDOW_SECONDS : RECENT_WINDOW_SECONDS

  for (let index = 0; index < cohort.calendars; index++) {
    const key = cohortCalendarKey(cohort, index)
    calendars.push({
      id: fixtureUuid(key),
      token: fixtureToken(key),
      name: `Fixture ${cohort.key} calendar ${index}`,
    })

    const isManyChanges = cohort.key === MANY_CHANGES_COHORT.key
    const logCount = isManyChanges
      ? MANY_CHANGES_PER_LOG.length
      : logsForCalendar(cohort, index)
    const step = Math.max(1, Math.floor(windowSeconds / logCount))

    for (let j = 0; j < logCount; j++) {
      // Every seventh log shares its predecessor's timestamp. Ties are not an
      // edge case here — the whole reason the cursor carries `id` as well as
      // `createdAt` is that they happen, so the fixture must contain them or
      // the keyset ordering is never actually exercised.
      const tiedWithPrevious = j > 0 && j % 7 === 0
      const slot = tiedWithPrevious ? j - 1 : j
      const seed = index * 1_000 + j
      const changes = isManyChanges
        ? MANY_CHANGES_PER_LOG[j]
        : fromQuantiles(CHANGES_PER_LOG, midpointQuantile(j, logCount))

      logs.push({
        id: fixtureUuid(`${key}/log/${j}`),
        calendarId: calendars[index].id,
        change: JSON.stringify(fixtureCalendarChange(seed, changes)),
        createdAt: new Date(
          FIXTURE_REFERENCE_DATE.getTime() - slot * step * 1000,
        ),
      })
    }
  }

  return { calendars, logs }
}

/** Keeps one multi-row INSERT's parameter payload bounded. */
const CHUNK_BYTES = 4 * 1024 * 1024

const chunkByBytes = (rows: CohortRow[]) => {
  const chunks: CohortRow[][] = []
  let current: CohortRow[] = []
  let bytes = 0
  for (const row of rows) {
    if (current.length > 0 && bytes + row.change.length > CHUNK_BYTES) {
      chunks.push(current)
      current = []
      bytes = 0
    }
    current.push(row)
    bytes += row.change.length
  }
  if (current.length > 0) chunks.push(current)
  return chunks
}

const seedCohort = async (client: SqlRunner, cohort: CohortSpec) => {
  const { calendars, logs } = buildCohortRows(cohort)

  await client.query(
    `INSERT INTO "calendar"
       ("id", "name", "url", "token", "lastUpdatedAt", "syncPlannedAt",
        "lastAccessedAt", "createdAt", "updatedAt")
     SELECT c.id, c.name, 'https://fixtures.invalid/cohort/' || c.token || '.ics',
            c.token, $4::timestamp, $4::timestamp, $4::timestamp, $4::timestamp, $4::timestamp
     FROM unnest($1::uuid[], $2::text[], $3::text[]) AS c(id, token, name)
     ON CONFLICT DO NOTHING`,
    [
      calendars.map((c) => c.id),
      calendars.map((c) => c.token),
      calendars.map((c) => c.name),
      FIXTURE_REFERENCE_DATE,
    ],
  )

  for (const chunk of chunkByBytes(logs)) {
    await client.query(
      `INSERT INTO "calendar_log" ("id", "calendarId", "calendarChange", "createdAt", "updatedAt")
       SELECT l.id, l.cal, l.change::json, l.ts, l.ts
       FROM unnest($1::uuid[], $2::uuid[], $3::text[], $4::timestamp[])
         AS l(id, cal, change, ts)
       ON CONFLICT DO NOTHING`,
      [
        chunk.map((row) => row.id),
        chunk.map((row) => row.calendarId),
        chunk.map((row) => row.change),
        chunk.map((row) => row.createdAt),
      ],
    )
  }

  return { key: cohort.key, calendars: calendars.length, logs: logs.length }
}

export type SeedOptions = {
  scale?: SeedScale
  /** Skip the background corpus. Only for the CI tripwire, which seeds its own. */
  background?: boolean
  cohorts?: readonly CohortSpec[]
  onProgress?: (message: string) => void
}

export const seedFixtures = async (
  client: SqlRunner,
  options: SeedOptions = {},
): Promise<SeedReport> => {
  const scale = options.scale ?? DEFAULT_SCALE
  const cohorts = options.cohorts ?? ALL_COHORTS
  const withBackground = options.background ?? true
  const progress = options.onProgress ?? (() => {})
  const startedAt = Date.now()

  progress("clearing previous fixture rows")
  await clearFixtures(client)

  if (withBackground) {
    progress(
      `seeding background corpus: ${scale.backgroundCalendars} calendars, ` +
        `${scale.backgroundLogs} logs`,
    )
    await seedBackground(client, scale)
  }

  const cohortReports: SeedReport["cohorts"] = []
  for (const cohort of cohorts) {
    progress(`seeding cohort ${cohort.key}`)
    cohortReports.push(await seedCohort(client, cohort))
  }

  // Without fresh statistics every plan captured afterwards is meaningless:
  // the planner would be costing a table it believes is empty.
  progress("ANALYZE")
  await client.query(`ANALYZE "calendar_log"`)
  await client.query(`ANALYZE "calendar"`)

  return {
    scale,
    backgroundCalendars: withBackground ? scale.backgroundCalendars : 0,
    backgroundLogs: withBackground ? scale.backgroundLogs : 0,
    cohorts: cohortReports,
    totalCalendars:
      (withBackground ? scale.backgroundCalendars : 0) +
      cohortReports.reduce((sum, c) => sum + c.calendars, 0),
    totalLogs:
      (withBackground ? scale.backgroundLogs : 0) +
      cohortReports.reduce((sum, c) => sum + c.logs, 0),
    seedMs: Date.now() - startedAt,
  }
}
