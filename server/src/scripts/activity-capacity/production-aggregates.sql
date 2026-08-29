-- Activity capacity gate (TIM-394) — production aggregate read.
--
-- WHO RUNS THIS: the Founding Engineer, and only the Founding Engineer. No pipeline
-- stage of this change opens a production connection.
--
-- SAFETY PROPERTIES, all checkable by reading this file:
--   * Every statement is a SELECT. There is no INSERT, UPDATE, DELETE, or DDL.
--   * Every block runs inside `BEGIN TRANSACTION READ ONLY`, so a write would be
--     rejected by the server even if one were somehow introduced.
--   * Every block sets `statement_timeout`, so nothing can pin production for long.
--   * Every projected column is a count, a bucket label, a percentile, a byte size,
--     or a whole date. No calendar token, calendar name, URL, event title, event
--     location, event description, calendar ID, or calendar-log ID is selected.
--
-- Blocks are independent transactions, ordered cheap → expensive, so a timeout in a
-- later block does not discard the results of an earlier one. Q7 is the expensive
-- one and is explicitly droppable (see its header).
--
-- Please post the results back on TIM-394 as plain tables. Ticket 1 uses them to size
-- the local fixture corpus; nothing else in the ticket is blocked on them.


-- ---------------------------------------------------------------------------
-- Q1 — calendar_log totals and the actual retention window.
-- Answers: how big is the table, and does the one-year prune really hold?
-- ---------------------------------------------------------------------------
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '5s';

SELECT
  count(*)                                              AS calendar_log_rows,
  count(DISTINCT "calendarId")                          AS calendars_with_logs,
  min("createdAt")::date                                AS oldest_log_day,
  max("createdAt")::date                                AS newest_log_day,
  (max("createdAt")::date - min("createdAt")::date)     AS retention_span_days
FROM "calendar_log";

COMMIT;


-- ---------------------------------------------------------------------------
-- Q2 — calendar population.
-- Answers: how many calendars exist, and how many are actually live? The
-- difference between `live_calendars` and `calendars_with_logs` (Q1) is the
-- number of calendars carrying zero logs, which the Q3 buckets cannot show.
-- ---------------------------------------------------------------------------
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '5s';

SELECT
  count(*)                                                                AS all_calendars,
  count(*) FILTER (WHERE "deletedAt" IS NULL)                             AS live_calendars,
  count(*) FILTER (WHERE "deletedAt" IS NULL
                     AND "lastAccessedAt" > now() - interval '30 days')   AS active_30d,
  count(*) FILTER (WHERE "deletedAt" IS NULL
                     AND "lastAccessedAt" > now() - interval '365 days')  AS active_365d
FROM "calendar";

COMMIT;


-- ---------------------------------------------------------------------------
-- Q3 — logs per calendar, whole retention window: buckets + percentiles.
-- Answers: what does a year of history actually look like for one calendar?
-- This sizes the fixture cohorts' history depth.
-- ---------------------------------------------------------------------------
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '60s';
SET LOCAL lock_timeout = '5s';

WITH per_calendar AS (
  SELECT "calendarId", count(*) AS log_count
  FROM "calendar_log"
  GROUP BY "calendarId"
)
SELECT
  CASE
    WHEN log_count <= 10   THEN '1: 1-10'
    WHEN log_count <= 50   THEN '2: 11-50'
    WHEN log_count <= 200  THEN '3: 51-200'
    WHEN log_count <= 1000 THEN '4: 201-1000'
    ELSE                        '5: 1000+'
  END       AS logs_per_calendar_bucket,
  count(*)  AS calendars
FROM per_calendar
GROUP BY 1
ORDER BY 1;

WITH per_calendar AS (
  SELECT "calendarId", count(*) AS log_count
  FROM "calendar_log"
  GROUP BY "calendarId"
)
SELECT
  count(*)                                                            AS calendars_measured,
  round(avg(log_count), 2)                                            AS mean_logs,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY log_count)             AS p50_logs,
  percentile_cont(0.90) WITHIN GROUP (ORDER BY log_count)             AS p90_logs,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY log_count)             AS p95_logs,
  percentile_cont(0.99) WITHIN GROUP (ORDER BY log_count)             AS p99_logs,
  max(log_count)                                                      AS max_logs
FROM per_calendar;

COMMIT;


-- ---------------------------------------------------------------------------
-- Q4 — logs per calendar over the last 30 days only.
-- Answers: how much history does a *newest page* refresh actually cover? This
-- decides whether a default 50-log page is one week or one year of a calendar's
-- life, which in turn decides how often the client paginates at all.
-- ---------------------------------------------------------------------------
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '60s';
SET LOCAL lock_timeout = '5s';

WITH per_calendar AS (
  SELECT "calendarId", count(*) AS log_count
  FROM "calendar_log"
  WHERE "createdAt" > now() - interval '30 days'
  GROUP BY "calendarId"
)
SELECT
  count(*)                                                            AS calendars_measured,
  round(avg(log_count), 2)                                            AS mean_logs_30d,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY log_count)             AS p50_logs_30d,
  percentile_cont(0.90) WITHIN GROUP (ORDER BY log_count)             AS p90_logs_30d,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY log_count)             AS p95_logs_30d,
  percentile_cont(0.99) WITHIN GROUP (ORDER BY log_count)             AS p99_logs_30d,
  max(log_count)                                                      AS max_logs_30d
FROM per_calendar;

COMMIT;


-- ---------------------------------------------------------------------------
-- Q5 — size of one calendar_log row's change payload.
-- Two different numbers, both needed:
--   * `stored_*`  = pg_column_size, i.e. what the database reads off disk
--     (TOAST-compressed). Sizes buffer/IO cost.
--   * `wire_*`    = octet_length(::text), i.e. serialized JSON length. Sizes the
--     HTTP response, which is what the 50-log page budget is actually about.
-- Note the v1 response adds small constant fields per row (id, calendarId,
-- calendarName, timestamps); `wire_*` is the dominant term, not the whole one.
-- ---------------------------------------------------------------------------
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '120s';
SET LOCAL lock_timeout = '5s';

SELECT
  count(*)                                                                          AS rows_measured,
  round(avg(pg_column_size("calendarChange")), 1)                                   AS stored_mean_bytes,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY pg_column_size("calendarChange"))    AS stored_p50_bytes,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY pg_column_size("calendarChange"))    AS stored_p95_bytes,
  percentile_cont(0.99) WITHIN GROUP (ORDER BY pg_column_size("calendarChange"))    AS stored_p99_bytes,
  max(pg_column_size("calendarChange"))                                             AS stored_max_bytes,
  round(avg(octet_length("calendarChange"::text)), 1)                               AS wire_mean_bytes,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY octet_length("calendarChange"::text)) AS wire_p50_bytes,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY octet_length("calendarChange"::text)) AS wire_p95_bytes,
  percentile_cont(0.99) WITHIN GROUP (ORDER BY octet_length("calendarChange"::text)) AS wire_p99_bytes,
  max(octet_length("calendarChange"::text))                                          AS wire_max_bytes
FROM "calendar_log";

COMMIT;


-- ---------------------------------------------------------------------------
-- Q6 — number of event changes packed into one calendar_log row.
-- Answers the specification's stated risk: "a single log can contain many changed
-- events, so row pagination is not a strict byte limit". The p99 here becomes the
-- fixture's many-changes-in-one-log case.
-- json_typeof guards rows whose payload is not the expected array shape.
-- ---------------------------------------------------------------------------
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '120s';
SET LOCAL lock_timeout = '5s';

WITH counts AS (
  SELECT
    CASE WHEN json_typeof("calendarChange" -> 'newItems') = 'array'
         THEN json_array_length("calendarChange" -> 'newItems') ELSE 0 END
    + CASE WHEN json_typeof("calendarChange" -> 'oldItems') = 'array'
           THEN json_array_length("calendarChange" -> 'oldItems') ELSE 0 END
    + CASE WHEN json_typeof("calendarChange" -> 'changedItems') = 'array'
           THEN json_array_length("calendarChange" -> 'changedItems') ELSE 0 END
    AS items
  FROM "calendar_log"
)
SELECT
  count(*)                                                  AS rows_measured,
  round(avg(items), 2)                                      AS mean_items,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY items)       AS p50_items,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY items)       AS p95_items,
  percentile_cont(0.99) WITHIN GROUP (ORDER BY items)       AS p99_items,
  max(items)                                                AS max_items
FROM counts;

WITH counts AS (
  SELECT
    CASE WHEN json_typeof("calendarChange" -> 'newItems') = 'array'
         THEN json_array_length("calendarChange" -> 'newItems') ELSE 0 END
    + CASE WHEN json_typeof("calendarChange" -> 'oldItems') = 'array'
           THEN json_array_length("calendarChange" -> 'oldItems') ELSE 0 END
    + CASE WHEN json_typeof("calendarChange" -> 'changedItems') = 'array'
           THEN json_array_length("calendarChange" -> 'changedItems') ELSE 0 END
    AS items
  FROM "calendar_log"
)
SELECT
  CASE
    WHEN items = 0       THEN '0: 0'
    WHEN items <= 5      THEN '1: 1-5'
    WHEN items <= 25     THEN '2: 6-25'
    WHEN items <= 100    THEN '3: 26-100'
    WHEN items <= 500    THEN '4: 101-500'
    ELSE                      '5: 500+'
  END       AS items_per_log_bucket,
  count(*)  AS logs
FROM counts
GROUP BY 1
ORDER BY 1;

COMMIT;


-- ---------------------------------------------------------------------------
-- Q7 — estimated wire bytes of one default (50-log) page. EXPENSIVE, DROPPABLE.
--
-- This is the only block with a window function, so it is the one that can time
-- out. It is bounded two ways: to calendars that were accessed in the last 30
-- days, and to a deterministic pseudo-random sample of 5000 of them
-- (`ORDER BY md5(id::text)` — the ids are used only for sampling and are never
-- projected).
--
-- If it still times out, SKIP IT and say so. Ticket 1's harness measures real
-- serialized page bytes against local fixtures anyway; this block only
-- cross-checks that the fixture is not wildly off production.
-- ---------------------------------------------------------------------------
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '180s';
SET LOCAL lock_timeout = '5s';

WITH sampled_calendars AS (
  SELECT id
  FROM "calendar"
  WHERE "deletedAt" IS NULL
    AND "lastAccessedAt" > now() - interval '30 days'
  ORDER BY md5(id::text)
  LIMIT 5000
),
ranked AS (
  SELECT
    l."calendarId",
    octet_length(l."calendarChange"::text) AS bytes,
    row_number() OVER (
      PARTITION BY l."calendarId"
      ORDER BY l."createdAt" DESC, l."id" DESC
    ) AS rn
  FROM "calendar_log" l
  JOIN sampled_calendars s ON s.id = l."calendarId"
),
pages AS (
  SELECT "calendarId", sum(bytes) AS page_bytes, count(*) AS page_rows
  FROM ranked
  WHERE rn <= 50
  GROUP BY "calendarId"
)
SELECT
  count(*)                                                        AS calendars_sampled,
  round(avg(page_rows), 2)                                        AS mean_page_rows,
  round(avg(page_bytes), 1)                                       AS mean_page_bytes,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY page_bytes)        AS p50_page_bytes,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY page_bytes)        AS p95_page_bytes,
  percentile_cont(0.99) WITHIN GROUP (ORDER BY page_bytes)        AS p99_page_bytes,
  max(page_bytes)                                                 AS max_page_bytes
FROM pages;

COMMIT;


-- ---------------------------------------------------------------------------
-- Q8 — calendars held per notification subscription.
--
-- CAVEAT, and it must be recorded beside the result: the server has no accounts,
-- so "how many calendars does one student hold" is a device-side fact it cannot
-- observe. This is the closest available proxy, and it only covers students who
-- enabled notifications — plausibly skewed toward heavier users. The 1/10/100
-- fixture cohorts stay fixed by the specification regardless; this tells us
-- whether 100 is a realistic ceiling or an absurd one.
-- ---------------------------------------------------------------------------
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '60s';
SET LOCAL lock_timeout = '5s';

WITH per_subscription AS (
  SELECT "notificationSubscriptionId", count(*) AS calendars
  FROM "calendar_notification_subscription"
  GROUP BY "notificationSubscriptionId"
)
SELECT
  CASE
    WHEN calendars = 1     THEN '1: 1'
    WHEN calendars <= 3    THEN '2: 2-3'
    WHEN calendars <= 9    THEN '3: 4-9'
    WHEN calendars <= 24   THEN '4: 10-24'
    WHEN calendars <= 99   THEN '5: 25-99'
    ELSE                        '6: 100+'
  END       AS calendars_per_subscription_bucket,
  count(*)  AS subscriptions
FROM per_subscription
GROUP BY 1
ORDER BY 1;

WITH per_subscription AS (
  SELECT "notificationSubscriptionId", count(*) AS calendars
  FROM "calendar_notification_subscription"
  GROUP BY "notificationSubscriptionId"
)
SELECT
  count(*)                                                    AS subscriptions_measured,
  round(avg(calendars), 2)                                    AS mean_calendars,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY calendars)     AS p50_calendars,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY calendars)     AS p95_calendars,
  percentile_cont(0.99) WITHIN GROUP (ORDER BY calendars)     AS p99_calendars,
  max(calendars)                                              AS max_calendars
FROM per_subscription;

COMMIT;
