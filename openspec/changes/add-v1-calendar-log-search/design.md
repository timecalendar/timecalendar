## Context

`CalendarLogModule` today is one controller (`POST /calendar-logs/search`), one service method,
one mapper, and a repository whose read methods are unbounded `find()` calls. The relevant schema:

```sql
CREATE TABLE "calendar_log" (
  "id"            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "calendarChange" json NOT NULL,
  "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
  "calendarId"    uuid
);
CREATE INDEX "IDX_calendar_log_calendar_createdAt" ON "calendar_log" ("calendarId", "createdAt");
CREATE INDEX "IDX_calendar_log_createdAt"          ON "calendar_log" ("createdAt");
-- "calendar"."token" carries a plain @Index(); "calendar" is soft-deleted via "deletedAt".
```

Two properties of that schema drive most of the decisions below: `createdAt` is
`timestamp without time zone` at Postgres's default **microsecond** precision, and `calendar` is
soft-deletable.

The global pipe is `CustomValidationPipe` with `whitelist`, `forbidNonWhitelisted`, and
`transform` on, so DTO validation is the first bound on any request and class defaults survive
transformation. Metrics use the thin `meter.createCounter(...)` pattern
(`contact-metrics.service.ts` is the smallest example). Logs pass through `sanitizeLog`, which
redacts URLs, credentials, emails, and UUIDs — a backstop, not a licence to log request bodies.

## Goals / Non-Goals

**Goals**

- A bounded, stable, privacy-safe v1 read contract matching the tech spec exactly.
- Legacy consumers (Flutter) unchanged apart from the malformed bare-string caller.
- Pagination that cannot duplicate or skip a row, including at microsecond `createdAt` collisions.
- Telemetry useful enough to satisfy the capacity gate with no unbounded label.

**Non-Goals**

- Global API versioning, rate limiting, a kill switch, auth, or retention changes.
- Any hand-written mobile code, or any change to `app/`.
- Splitting one calendar-log group across pages (one log is one atomic item).

## Decisions

### D1 — A second controller under a literal `v1/` path prefix

Add `CalendarLogV1Controller` with `@Controller("v1/calendar-logs")` and `@ApiTags("Calendar Logs")`,
registered alongside the existing controller in `CalendarLogModule`.

**Why:** `app.enableVersioning()` is global — it rewrites the route table for every controller in
the app and would push unrelated endpoints under `/v1` or force `VERSION_NEUTRAL` annotations
across the codebase. A literal path prefix is one line, is invisible to every other module, and
matches how the migration specs describe scoped `/v1` endpoints. Reusing `@ApiTags("Calendar Logs")`
keeps Orval's `tags-split` output in the existing `mobile/src/api/generated/calendar-logs/`
file instead of creating a second module for the same domain.

*Alternative considered:* a `@Version("1")` decorator on a shared controller — rejected, it
requires global versioning to be enabled to have any effect.

### D2 — Snapshot-bound keyset pagination, cursor anchored on `(createdAt, id)`

The first page (no `cursor`) captures `asOf` from the **database** clock, not the Node process:

```sql
SELECT now()::timestamp AS "asOf"
```

The cast matches how `createdAt` is stored (`timestamp` columns default to `now()`, which Postgres
casts to a naive local timestamp), so `asOf` and `createdAt` are directly comparable. Every page:

```sql
SELECT ...
FROM "calendar_log" cl
JOIN "calendar" c ON c."id" = cl."calendarId" AND c."deletedAt" IS NULL
WHERE c."token" = ANY($1)
  AND cl."createdAt" <= $2::timestamp                       -- asOf
  AND (cl."createdAt", cl."id") < ($3::timestamp, $4::uuid) -- omitted on the first page
ORDER BY cl."createdAt" DESC, cl."id" DESC
LIMIT $5                                                     -- limit + 1
```

The row-tuple comparison is a single index-orderable predicate, and `id` (uuid, totally ordered in
Postgres) makes equal `createdAt` values paginate deterministically. Reading `limit + 1` rows and
returning at most `limit` is what decides whether `nextCursor` exists — no `COUNT(*)`.

`c."deletedAt" IS NULL` is explicit because the query is hand-built rather than going through
TypeORM's `relations` option, which adds that predicate for you. Dropping it would silently widen
v1 beyond legacy behavior.

**Why keyset over offset:** the whole point of the snapshot is that a log arriving mid-scroll
cannot shift the window. `OFFSET` re-counts from the top on every page and both duplicates and
skips rows when the head grows — the exact failure the tech spec's risk table names.

### D3 — The cursor carries Postgres's own microsecond text, not a JavaScript `Date`

Cursor payload, base64url-encoded:

```jsonc
{ "v": 1, "a": "2026-08-29 18:22:06.641234", "c": "2026-08-29 18:20:25.142981", "i": "<uuid>" }
```

`a` (the snapshot) and `c` (the last row's `createdAt`) are the raw `::text` renderings of the
`timestamp` values, obtained by selecting `cl."createdAt"::text` as an extra raw column alongside
the entity. They are fed back as `$n::timestamp` parameters.

**Why not just serialize the `Date`:** `createdAt` has microsecond precision; a JavaScript `Date`
has millisecond precision, and the `pg` driver truncates on parse. Round-tripping a cursor through
a `Date` would turn an anchor of `.641234` into `.641`, and the next page's
`(createdAt, id) < ('...641', id)` predicate would exclude **every row between `.641` and
`.641234`** — a silent, permanent hole in the student's history that no test asserting "no
duplicates" would catch. Carrying the database's own text preserves the exact value the index is
ordered by.

The `Date`-typed values still appear on the wire: `asOf`, `createdAt`, and `updatedAt` in the
response are the ordinary TypeORM-parsed `Date`s serialized to ISO-8601, exactly as the legacy
endpoint already serializes them. Only the cursor's internals use the text form.

*Alternatives considered:* anchoring on `id` alone and re-deriving `createdAt` with a subquery —
rejected, the daily prune job can delete the anchor row and break the chain; truncating the column
to milliseconds — rejected, a schema change to stored data for a read-path convenience.

**Evidence.** Probed against this repo's Postgres image (four rows sharing the millisecond
`18:20:25.641`, at `.641`, `.641234` ×2, and `.641999`):

| Keyset anchor | Rows returned |
| --- | --- |
| `('…641999', id3)` — full precision, as D3 specifies | `id4`, `id2`, `id1` ✅ |
| `('…641', id3)` — the same anchor via a JS `Date` | `id1` only — **`id4` and `id2` silently skipped** ❌ |
| `('…641234', id4)` — equal timestamps | `id2`, `id1` ✅ tie-broken by uuid |

The column stores and renders `2026-08-29 18:20:25.641234` through `::text`, and the container's
session timezone is `Etc/UTC`. So the millisecond hole is real and reproducible, not theoretical,
and the uuid tie-breaker behaves as the ordering requires.

### D4 — The cursor is opaque and validated, but not signed

Decoding rejects with `400` — a fixed message that never echoes the cursor — when the value is not
base64url, is not UTF-8 JSON, is not an object, has `v !== 1`, is missing a field, or when `a`/`c`
fail a strict `^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d{1,6})?$` match or `i` fails a UUID
match. Validation happens **before** any value reaches SQL.

**Why no HMAC:** the cursor holds no secret and grants no access. Every page re-authorizes against
the `tokens` in the same request body, so a forged cursor can only move the window inside data the
caller could already read. Signing would add a key, a rotation story, and a failure mode
(key rotation invalidating every persisted client cursor) for no threat it closes. The versioned
`v` field is what lets the format change later: an unsupported version is a `400`, and the tech
spec already requires the client to clear a rejected cursor and restart from the newest page.

### D5 — Deduplicate before the 100-token cap; short-circuit the empty array

The DTO applies a class-transformer `@Transform` that collapses duplicates (only when the value is
already an array, so a bare string still reaches `@IsArray()` and fails), then `@ArrayMaxSize(100)`.

**Why in that order:** the tech spec caps *unique* tokens. A device holding three calendars that
sends the same token 150 times is a client bug, not a 400 — but 101 distinct tokens is a bound
violation. Capping the raw array would reject the first; capping after dedup rejects only the
second, which is what the API-behavior table specifies.

`tokens: []` returns `{ items: [], nextCursor: null, asOf, unreadCount: 0 }` without touching
`calendar_log`. `asOf` still comes from `SELECT now()::timestamp` so the client's read watermark is
always database time — that is not a calendar-log query, and it keeps `asOf` from silently
switching source depending on how many calendars a student holds.

### D6 — `unreadSince` on a page request is ignored, not rejected

`unreadCount` is computed only when `unreadSince` is present **and** `cursor` is absent. If a
client sends both, the server pages normally and omits `unreadCount`; it does not 400.

**Why:** the API-behavior table enumerates every 400 case and this is not one of them. The count is
defined against the *first* page's snapshot, so recomputing it per page would be both wasted work
and a subtly different number. Ignoring is forward-compatible; rejecting would break a client that
naively forwards its stored `lastReadAt` on every request.

The count query mirrors the page query's token/soft-delete predicates with
`cl."createdAt" > $unreadSince AND cl."createdAt" <= $asOf`. `unreadSince` is passed as a `Date`
parameter — the same convention the shipped prune job already uses against this column.

### D7 — No index migration unless TIM-394's evidence demands one

`calendar.token` is indexed, `IDX_calendar_log_calendar_createdAt` covers `(calendarId, createdAt)`,
and Postgres can merge per-calendar ordered scans for a bounded token set. The Applier records
`EXPLAIN (ANALYZE, BUFFERS)` for 1, 10, and 100 calendars over recent and year-long history in the
PR body. A migration is added **only** if those plans miss the budget, and the plan evidence
justifying it ships in the same PR body.

**Why the default is "no migration":** `server/src/migrations/` is a sensitive surface and an index
on a large production table is an unproven, non-trivial write. The tech spec makes performance an
explicit release gate precisely so the index decision is evidence-driven rather than speculative.

### D8 — Regenerate the Orval client in this change

`ci-mobile.yml` triggers on `openapi/**` and its first step runs `npm run generate` in `mobile/`
and fails on any diff under `src/api/generated`. Committing a new OpenAPI path without the
regenerated client turns that required gate red on this PR and every PR after it until someone
regenerates.

So this change commits the regenerated output. It is mechanical Orval output — no hand-written
mobile code, no feature module, no route. Ticket 4 still owns everything that *uses* the client
(the refresh coordinator, the data seam, the tests).

`docs/mobile/architecture-book/data.md` describes the OpenAPI→Orval seam but does not enumerate
operations, and this change alters no mobile rule, so the Architecture Book needs no edit. The
`ADDED`/`MODIFIED` decision is recorded here so the Reviewer can check the omission is deliberate.

### D9 — v1 mapping is a distinct method, not a token-stripping copy

`CalendarLogMapper` gains `toCalendarLogV1(entity)` that builds `CalendarLogV1` and reuses the
existing private `mapCalendarChange`. It never assigns `calendarToken`.

**Why not map to `CalendarLogGet` and `delete` the field:** a delete-after-the-fact leaves the
token on an in-memory object that any future refactor, log line, or serializer could surface, and
it makes the privacy guarantee a runtime side effect rather than a shape. `CalendarLogV1` is
declared as `OmitType(CalendarLogGet, ["calendarToken"] as const)` so the two DTOs cannot drift and
the omission is visible in the type, and a test asserts `"calendarToken" in item === false` on the
serialized response.

### D10 — Telemetry is three instruments with closed-enum labels only

A `CalendarLogMetricsService` following `contact-metrics.service.ts`:

| Instrument | Kind | Labels |
| --- | --- | --- |
| `calendar_log_search_page_rows` | histogram | `{ page: "first" \| "following" }` |
| `calendar_log_unread_count_duration` | histogram (ms) | none |
| `calendar_log_search_total` | counter | `{ page: "first" \| "following", outcome: "ok" \| "invalid_cursor" }` |

Every label value is a literal from a TypeScript union — nothing is derived from a token, calendar
name, calendar id, log id, user, event, or cursor. Row *counts* and durations are aggregate numbers,
not identifiers. A privacy-negative test asserts the recorded attribute values are drawn only from
those unions.

**Why so few:** HTTP route latency and status already come free from auto-instrumentation
(`config/observability/tracer.ts`). These three cover exactly what the capacity gate asks for
(page payload size, unread-count cost, first-page/cursor outcome) and nothing else.

### D11 — Failures propagate; nothing logs a request body

The service adds no `try/catch` that logs. An unexpected repository failure propagates to Nest's
default exception layer as a 500 with its standard body — the existing sanitized behavior. The only
deliberately thrown error is `BadRequestException` for a malformed cursor, whose message is a
constant.

**Why not catch-and-log:** every hand-written catch on this path is a chance to interpolate
`payload` into a message. `sanitizeLog` would redact UUIDs and credentials from such a line, but a
calendar token is an opaque string with no shape a regex can recognize — the redactor is not a
guarantee here. Not logging is. A test spies on `Logger` across a forced repository failure and
asserts no token, cursor, or event title appears in any emitted line.

## Risks / Trade-offs

- **Microsecond text in the cursor is a hand-built concern.** Mitigated by the strict decode regex,
  parameterized SQL, and a dedicated test that inserts rows sharing a millisecond and asserts every
  row is returned exactly once across the full page chain.
- **The `timestamp without time zone` column assumes the DB session and the Node process share a
  timezone.** This change does not widen the assumption — the shipped prune job already relies on
  it — but it is now a recorded invariant rather than an accident. Verified during apply
  (task 7.5) at all three layers:

  | Layer | Setting | How verified |
  | --- | --- | --- |
  | Postgres session | `TimeZone = Etc/UTC`; `now()::timestamp` = `2026-08-29 19:13:06.604691`, `now()` = the same value at `+00` | `SHOW TimeZone` against the Compose container |
  | Server container | `node:24` with no `TZ` override in `server/Dockerfile` and none in the chart env, so the image default UTC applies | Dockerfile + k8s env |
  | Jest | `process.env.TZ = "UTC"` | `server/src/global-setup.ts` |

  `CalendarLogRepository.getSnapshotTime` carries the same note at the call site. A future
  deployment setting a non-UTC `TZ` on the server container is the one change that would break
  this: `asOf` and `unreadSince` would then be compared against `createdAt` in the wrong frame.
- **Cross-calendar merge-ordering at 100 tokens is the plan risk.** Postgres may prefer a bitmap
  scan plus a sort over merging 100 index scans. That is exactly what D7's `EXPLAIN` evidence
  measures, and it is the one finding that would justify a composite index.
- **Regenerating the Orval client widens this PR's diff into `mobile/`.** Mitigated by it being
  generated output, verifiable by re-running `npm run generate` and getting an empty diff.

## Open Questions

None blocking. The one deferred input is TIM-394's frozen budget, which gates *closing* this change
rather than implementing it (see the proposal's close gate).
