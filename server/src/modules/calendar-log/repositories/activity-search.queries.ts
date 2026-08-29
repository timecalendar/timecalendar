/**
 * The Activity v1 read path's SQL, as a single source of truth.
 *
 * The shipped Activity endpoint and its capacity harness import this module.
 * Keeping one production-owned SQL source ensures that the frozen performance
 * gate continues to measure the exact query shape serving requests.
 *
 * Every value is bound as a positional parameter. There is no string
 * interpolation anywhere in this file: the harness runs against fixtures today
 * and the shipped repository will run against real tokens tomorrow.
 *
 * Contract this implements — `docs/react-native-migration/05-tech-specs/activity-revival.md`,
 * architecture decision 2:
 *
 *   - Tokens resolve through the indexed `calendar.token`.
 *   - Pages are keyset-ordered `createdAt DESC, id DESC`, constrained to
 *     `createdAt <= asOf`, filtered by the resolved calendar IDs, reading
 *     `limit + 1` rows so the caller can decide `nextCursor` without a second
 *     query.
 *   - `unreadCount` counts `createdAt > unreadSince AND createdAt <= asOf` over
 *     the same calendar set.
 */

/**
 * Token → calendar resolution.
 *
 * Also projects `name`, because `CalendarLogV1.calendarName` has to come from
 * somewhere and this is the cheapest place: the caller has already resolved
 * tokens to calendars, so it holds `(id, name)` in memory and can attach the
 * name to each row without joining `calendar` back onto every page query. That
 * keeps the page query single-table, which is what makes
 * `IDX_calendar_log_calendar_createdAt` a covering access path for the keyset.
 *
 * `$1` — `text[]`, the de-duplicated token list (at most 100, validated upstream).
 */
export const resolveCalendarsByTokenSql = `
  SELECT "id", "name"
  FROM "calendar"
  WHERE "token" = ANY($1)
    AND "deletedAt" IS NULL
`

/**
 * Columns the v1 page projects. `calendarToken` is deliberately absent from the
 * response contract, so it is absent here too — a page query must never carry a
 * capability it does not need.
 */
const PAGE_COLUMNS = [
  "id",
  "calendarId",
  "calendarChange",
  "createdAt",
  "updatedAt",
] as const

const pageColumns = (alias?: string) =>
  PAGE_COLUMNS.map((column) =>
    alias ? `${alias}."${column}"` : `"${column}"`,
  ).join(", ")

/**
 * The keyset page.
 *
 * Two shapes rather than one nullable-cursor shape. A single statement with
 * `($3::timestamptz IS NULL OR ("createdAt", "id") < ($3, $4))` would let the
 * first page and the following pages share one prepared statement, but it also
 * hides the row-comparison behind an `OR` that the planner cannot push into the
 * index. Since the whole point of this module is to measure the access path, the
 * two shapes stay separate and each is measured on its own.
 *
 * First page (`hasCursor: false`):
 *   `$1` `uuid[]` calendar IDs · `$2` `timestamptz` asOf · `$3` `int` limit + 1
 *
 * Following page (`hasCursor: true`):
 *   `$1` `uuid[]` calendar IDs · `$2` `timestamptz` asOf ·
 *   `$3` `timestamptz` cursor createdAt · `$4` `uuid` cursor id · `$5` `int` limit + 1
 *
 * The row-value comparison `("createdAt", "id") < ($3, $4)` is what makes the
 * cursor stable when two logs share a `createdAt`: it is a single lexicographic
 * comparison, not `createdAt < $3 OR (createdAt = $3 AND id < $4)`, so no row is
 * skipped and none is returned twice.
 */
export const calendarLogPageSql = (hasCursor: boolean) =>
  hasCursor
    ? `
  SELECT ${pageColumns()}
  FROM "calendar_log"
  WHERE "calendarId" = ANY($1)
    AND "createdAt" <= $2
    AND ("createdAt", "id") < ($3, $4)
  ORDER BY "createdAt" DESC, "id" DESC
  LIMIT $5
`
    : `
  SELECT ${pageColumns()}
  FROM "calendar_log"
  WHERE "calendarId" = ANY($1)
    AND "createdAt" <= $2
  ORDER BY "createdAt" DESC, "id" DESC
  LIMIT $3
`

/**
 * The same page, gathered per calendar and merged.
 *
 * **This is the shape the measurement selects.** `calendarLogPageSql` is the
 * shape the specification wrote down, and on a large table it contains a
 * planner cliff:
 *
 *   With `ORDER BY "createdAt" DESC, "id" DESC LIMIT 51` and a `calendarId =
 *   ANY(...)` filter, PostgreSQL may decide to walk `IDX_calendar_log_createdAt`
 *   — the *global* newest-first index — backwards and stop as soon as it has 51
 *   matching rows. Whether that is cheap depends entirely on how far down the
 *   global timeline the requested calendars' rows sit. When the estimate is
 *   wrong, the scan does not stop early; it exhausts the index. Measured at
 *   1,004,934 rows: a 100-calendar request whose calendars have no logs read
 *   140,179 buffers and discarded all 1,004,934 rows in 860 ms to return
 *   nothing. The same request written this way took 1.6 ms and 300 buffers.
 *
 * The cliff is a cost-model discontinuity, not a gradient — at that corpus size
 * 80 calendars planned correctly at 1.4 ms and 100 planned catastrophically. Its
 * position moves with table size and statistics, so it cannot be avoided by
 * capping the token count at some number measured today.
 *
 * This shape removes the choice. Each `LATERAL` is an equality lookup on
 * `calendarId` followed by an ordered walk, which only
 * `IDX_calendar_log_calendar_createdAt` can serve, so the planner has no global
 * index to be tempted by. Each branch reads at most `limit + 1` rows because all
 * of them could legitimately belong to one calendar, and the outer `ORDER BY`
 * merges the branches.
 *
 * Same inputs, same parameter order, same output rows in the same order — this
 * is a plan-stability rewrite, not a contract change.
 *
 * Cost: on a dense 100-calendar request it is roughly 2× the specification's
 * shape (8.2 ms against 3.6 ms), because it descends the index 100 times instead
 * of once. That is the premium for not having a 600× cliff.
 */
export const calendarLogPageLateralSql = (hasCursor: boolean) => `
  SELECT p.*
  FROM unnest($1::uuid[]) AS c(id)
  CROSS JOIN LATERAL (
    SELECT ${pageColumns("l")}, l."createdAt"::text AS "createdAtText"
    FROM "calendar_log" l
    WHERE l."calendarId" = c.id
      AND l."createdAt" <= $2
      ${hasCursor ? `AND (l."createdAt", l."id") < ($3, $4)` : ""}
    ORDER BY l."createdAt" DESC, l."id" DESC
    LIMIT ${hasCursor ? "$5" : "$3"}
  ) p
  ORDER BY p."createdAt" DESC, p."id" DESC
  LIMIT ${hasCursor ? "$5" : "$3"}
`

/** The two page shapes the harness measures against each other. */
export type PageShape = "specification" | "lateral"

export const pageSqlForShape = (shape: PageShape, hasCursor: boolean) =>
  shape === "lateral"
    ? calendarLogPageLateralSql(hasCursor)
    : calendarLogPageSql(hasCursor)

/**
 * The exact unread count.
 *
 * `$1` `uuid[]` calendar IDs · `$2` `timestamptz` unreadSince · `$3` `timestamptz` asOf
 *
 * Half-open on the low side (`>`) and closed on the high side (`<=`), matching
 * the specification: a log written exactly at the stored read watermark is
 * already read, and a log written after the first page's `asOf` snapshot is not
 * counted until the next refresh moves the snapshot forward.
 */
export const unreadCountSql = `
  SELECT COUNT(*)::int AS "unreadCount"
  FROM "calendar_log"
  WHERE "calendarId" = ANY($1)
    AND "createdAt" > $2
    AND "createdAt" <= $3
`

/** Parameters for one page read, in the order the matching statement binds them. */
export const calendarLogPageParams = (input: {
  calendarIds: string[]
  asOf: Date
  limit: number
  cursor?: { createdAt: Date; id: string }
}): unknown[] =>
  input.cursor
    ? [
        input.calendarIds,
        input.asOf,
        input.cursor.createdAt,
        input.cursor.id,
        input.limit + 1,
      ]
    : [input.calendarIds, input.asOf, input.limit + 1]

/** Parameters for one unread count, in the order `unreadCountSql` binds them. */
export const unreadCountParams = (input: {
  calendarIds: string[]
  unreadSince: Date
  asOf: Date
}): unknown[] => [input.calendarIds, input.unreadSince, input.asOf]
