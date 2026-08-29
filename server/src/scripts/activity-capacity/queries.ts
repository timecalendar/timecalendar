/**
 * The Activity v1 read path's SQL, as a single source of truth.
 *
 * TIM-394 measures a query shape the endpoint does not yet run: `POST
 * /v1/calendar-logs/search` is Ticket 2's (TIM-395). A measurement of a query
 * shape is only worth anything if the shipped endpoint runs *that* shape, so
 * this module is written to be **relocated**, not copied.
 *
 * STANDING OBLIGATION ON TICKET 2 (design decision D1 of the
 * `measure-activity-capacity-budgets` change): move this file to
 * `server/src/modules/calendar-log/repositories/activity-search.queries.ts` and
 * import it from *both* the shipped repository and this harness. The harness
 * must never keep a private copy — if Ticket 2 changes the query, the harness
 * has to change with it or fail to compile. The alternative (two copies that
 * drift) is how a capacity gate silently stops describing production.
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
const pageColumns = `"id", "calendarId", "calendarChange", "createdAt", "updatedAt"`

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
  SELECT ${pageColumns}
  FROM "calendar_log"
  WHERE "calendarId" = ANY($1)
    AND "createdAt" <= $2
    AND ("createdAt", "id") < ($3, $4)
  ORDER BY "createdAt" DESC, "id" DESC
  LIMIT $5
`
    : `
  SELECT ${pageColumns}
  FROM "calendar_log"
  WHERE "calendarId" = ANY($1)
    AND "createdAt" <= $2
  ORDER BY "createdAt" DESC, "id" DESC
  LIMIT $3
`

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
