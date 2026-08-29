# Tasks

Server-only feature plus one mechanical generated-client regen. Everything lands on
`TIM-395-add-the-v1-paginated-calendar-log-api` in one PR.

**Local prerequisites** (server tests and OpenAPI generation both need Postgres + Redis; nginx is
not needed):

```bash
bin/server-compose.sh up -d postgres redis   # from the repo root; see docs/agent-dev-environment.md
cd server && npm ci
```

Sections 1–6 are the implementation. Section 7 is the evidence the close gate needs.

## 1. Request and response contract

- [x] 1.1 Add `server/src/modules/calendar-log/models/dto/search-calendar-logs-v1.dto.ts` —
  `SearchCalendarLogsV1Dto` with:
  - `tokens`: `@IsArray()`, a `@Transform` that deduplicates **only when the value is already an
    array** (so a bare string still reaches `@IsArray()` and 400s), `@ArrayMaxSize(100)` applied
    after dedup, `@IsString({ each: true })`, `@IsNotEmpty({ each: true })`;
  - `limit?`: `@IsInt() @Min(1) @Max(100)`, class default `= 50`. Do **not** add
    `@Type(() => Number)` — the body is JSON, so `"50"` must 400 (design D5).
    **`@IsOptional()` was deliberately dropped**: the class default already covers the omitted
    case, and a DTO test proved `@IsOptional()` lets an explicit `limit: null` through validation,
    which reaches Postgres as `LIMIT NULL` — read as *unbounded*, the exact failure this endpoint
    exists to prevent. `@ApiPropertyOptional` keeps the published contract honest, since the
    plugin would otherwise infer `limit` as required;
  - `cursor?`: `@IsOptional() @IsString() @IsNotEmpty()`;
  - `unreadSince?`: `@IsOptional() @IsISO8601({ strict: true })`, kept as a string on the DTO.
  - _Verify:_ `npx jest search-calendar-logs-v1` — a DTO unit test covering every 400 row of the
    tech spec's API-behavior table plus the 150-dupes-to-3-unique case.
- [x] 1.2 Add `calendar-log-v1.dto.ts` — `CalendarLogV1 extends OmitType(CalendarLogGet, ["calendarToken"] as const)`
  (design D9) — and `calendar-log-search-v1-response.dto.ts` —
  `CalendarLogSearchV1Response { items: CalendarLogV1[]; nextCursor: string | null; asOf: Date; unreadCount?: number }`
  with the `@ApiProperty` annotations the Swagger plugin needs for the nullable and optional
  fields.
  - _Verify:_ `cd server && npx tsc --noEmit`.
- [x] 1.3 Add `@IsArray()` to the existing `GetCalendarLogsDto.tokens`. Change nothing else in that
  file.
  - _Verify:_ the existing legacy controller test still passes, plus a new case asserting
    `{"tokens": "abc"}` → 400.

## 2. Cursor codec

- [x] 2.1 Add `server/src/modules/calendar-log/models/calendar-log-cursor.ts`: `encodeCursor` /
  `decodeCursor` over base64url JSON `{ v: 1, a, c, i }`, where `a` and `c` are Postgres
  `timestamp` **text** renderings and `i` is a uuid (design D3).
- [x] 2.2 `decodeCursor` throws `BadRequestException` with a constant message — never echoing the
  input — when the value is not base64url, not UTF-8 JSON, not an object, has `v !== 1`, is
  missing a field, or when `a`/`c` fail `^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d{1,6})?$` or
  `i` fails a uuid match. Validation runs before any value reaches SQL (design D4).
  - _Verify:_ `npx jest calendar-log-cursor` — round-trip including a `.641234` microsecond value;
    rejection cases for non-base64, valid base64 of non-JSON, JSON array, `v: 2`, missing `i`,
    `a: "2026-13-45"`, `i: "not-a-uuid"`; and an assertion that the thrown message contains
    neither the submitted cursor nor any of its decoded fields.
- [x] 2.3 Privacy-negative test: encode a cursor from a fixture row and assert the decoded payload
  contains no calendar token and no event title, location, or UID.

## 3. Repository queries

- [x] 3.1 Add `CalendarLogRepository.getSnapshotTime(): Promise<{ asOf: Date; asOfText: string }>`
  running `SELECT now()::timestamp AS "asOf", (now()::timestamp)::text AS "asOfText"`. Both forms
  come from one round trip: the `Date` goes on the wire, the text goes in the cursor (design D2/D3).
- [x] 3.2 Add `CalendarLogRepository.searchPage({ tokens, asOfText, cursor, limit })` using the
  query builder shape in design D2: join `calendar` with an explicit `c."deletedAt" IS NULL`,
  `c."token" = ANY(:tokens)`, `cl."createdAt" <= :asOf::timestamp`, the row-tuple keyset predicate
  when a cursor is present, `ORDER BY cl."createdAt" DESC, cl."id" DESC`, `LIMIT :limit + 1`.
  Select `cl."createdAt"::text` as an extra raw column so the caller can build the next cursor at
  full precision. All values bound as parameters.
- [x] 3.3 Add `CalendarLogRepository.countSince({ tokens, unreadSince, asOfText })` mirroring 3.2's
  token and soft-delete predicates with `cl."createdAt" > :unreadSince AND cl."createdAt" <= :asOf::timestamp`.
  Pass `unreadSince` as a `Date` — the convention `pruneOlderThan` already uses on this column.
- [x] 3.4 Repository integration tests (`calendar-log.repository.test.ts`):
  - stable `(createdAt DESC, id DESC)` ordering across three calendars whose logs interleave;
  - equal `createdAt` across a page boundary → every row exactly once;
  - `createdAt` values differing only below millisecond precision across a page boundary → every
    row exactly once, none skipped (the D3 regression test — insert with explicit microsecond
    values, since `DEFAULT now()` will not reliably reproduce a collision);
  - a row inserted after the snapshot is excluded from every page of that chain;
  - a soft-deleted calendar's logs are excluded;
  - `countSince` respects tokens, `unreadSince`, and `asOf`.
  - _Verify:_ `cd server && npx jest calendar-log.repository`.

## 4. Service and controller

- [x] 4.1 Add `CalendarLogService.searchV1(payload)`:
  - `tokens.length === 0` → return `{ items: [], nextCursor: null, asOf, unreadCount: 0 }` from
    `getSnapshotTime()` alone, with **no** `searchPage` and **no** `countSince` call (design D5);
  - no cursor → `getSnapshotTime()`; cursor present → `decodeCursor` supplies `asOf`;
  - fetch `limit + 1` rows, slice to `limit`, build `nextCursor` from the last returned row's raw
    `createdAt` text and id, else `null`;
  - compute `unreadCount` only when `unreadSince` is present **and** `cursor` is absent; when both
    are present, page normally and omit the field — do not 400 (design D6);
  - no `try/catch` that logs (design D11).
- [x] 4.2 Add `CalendarLogMapper.toCalendarLogV1(entity)` reusing the existing private
  `mapCalendarChange`, never assigning `calendarToken`.
  - _Verify:_ `npx jest calendar-log.mapper` — a case asserting `"calendarToken" in dto === false`
    for v1 and `=== true` for legacy on the same entity.
- [x] 4.3 Add `server/src/modules/calendar-log/controllers/calendar-log-v1.controller.ts` —
  `@Controller("v1/calendar-logs")`, `@ApiTags("Calendar Logs")`, `@Post("search")`,
  `@HttpCode(200)`, `@ApiOperation`, typed `Promise<CalendarLogSearchV1Response>` (design D1).
- [x] 4.4 Register the controller and any new providers in `CalendarLogModule`.
  - _Verify:_ `cd server && npx tsc --noEmit && npm run lint`.

## 5. Telemetry

- [x] 5.1 Add `CalendarLogMetricsService` following `contact-metrics.service.ts`, with the three
  instruments and closed-union label types in design D10. Wire it into the v1 service path only.
- [x] 5.2 Privacy-negative test: drive first-page, following-page, and invalid-cursor requests
  against a stubbed meter and assert every recorded attribute value belongs to the declared unions —
  no token, calendar name, calendar id, log id, or cursor appears in any attribute.
  - _Verify:_ `cd server && npx jest calendar-log-metrics`.

## 6. Controller tests and privacy negatives

- [x] 6.1 v1 controller tests (`calendar-log-v1.controller.test.ts`) covering **every** row of the
  tech spec's API-behavior table: valid first page; valid following page; final page
  (`nextCursor: null`); empty token array; unknown token; known+unknown mixed; duplicate tokens;
  >100 unique tokens → 400; limit outside 1–100 → 400; bare string → 400; invalid timestamp → 400;
  invalid and unsupported-version cursor → 400.
- [x] 6.2 Response-shape test: the serialized v1 item has no `calendarToken` key and the calendar's
  token string appears nowhere in the response body.
- [x] 6.3 Unread-count tests: first page with `unreadSince` returns the exact count scoped to the
  requested tokens and bounded by `asOf`; a request carrying both `cursor` and `unreadSince`
  returns 200, omits `unreadCount`, and does not call `countSince` (spy).
- [x] 6.4 Mid-pagination insert test at the controller level: page 1, insert a new log, page 2 —
  assert no duplicate and no displaced row, and that the new log appears in neither page.
- [x] 6.5 Privacy-negative log test: spy on `Logger` (and the `TelemetryLogger` path) across a
  forced repository failure and a validation failure; assert no emitted line contains a calendar
  token, cursor value, event title, event location, or the request body. Assert the failure surfaces
  as the standard sanitized 5xx.
- [x] 6.6 Legacy compatibility test: an existing valid array request returns the unchanged
  `CalendarLogGet[]` shape including `calendarToken`.
  - _Verify:_ `cd server && npx jest calendar-log`.

## 7. Contract, evidence, and green

- [x] 7.1 Regenerate and commit the OpenAPI contract:
  ```bash
  bin/server-compose.sh up -d postgres redis
  cd server && npm run generate:openapi
  ```
  Then confirm the legacy path is byte-identical:
  `git diff openapi/openapi.json` must show **only** additions under `/v1/calendar-logs/search`
  and the new component schemas — no change inside `paths./calendar-logs/search` or
  `components.schemas.GetCalendarLogsDto`. This is the CI drift gate
  (`ci-build-deploy.yml`) and it is also the proof for the compatibility requirement.
- [x] 7.2 Regenerate and commit the mobile client (design D8):
  ```bash
  cd mobile && npm ci && npm run generate
  ```
  Commit `mobile/src/api/generated/` only. No hand-written mobile file may appear in the diff.
  Re-run `npm run generate` and confirm `git diff --exit-code src/api/generated` is clean — that is
  exactly what `ci-mobile.yml` runs.
- [x] 7.3 Capture query-plan evidence (design D7). Seed representative fixtures for **1, 10, and
  100** calendars over recent and year-long history, then record
  `EXPLAIN (ANALYZE, BUFFERS)` for the first page, a following page, and the unread count at both a
  recent and a one-year watermark. Paste the plans into the PR body with **no** token, calendar
  name, or event content — plan output only. Note rows scanned, buffer hits, sort/temp behavior,
  and whether any bounded-token request produced a sequential scan of the full `calendar_log`
  table.
- [x] 7.4 Add an index migration **only if** 7.3's plans miss the budget. If added, the justifying
  plan evidence goes in the PR body alongside it; if not added, state in the PR body that the
  existing indexes suffice and why. `server/src/migrations/` is a sensitive surface — a migration
  without that evidence is out of scope.
  - **Outcome: no migration added.** `server/src/migrations/` is untouched. The first measurement
    pass found exactly one plan missing the "no sequential scan" gate — the unread count at 100
    calendars with a one-year watermark. The cause was not a missing index: TypeORM's `getCount()`
    emits `COUNT(DISTINCT cl.id)`, whose sort spilled to a temp file and pushed the planner onto a
    Parallel Seq Scan. `calendar_log.calendarId` is many-to-one, so that DISTINCT was redundant.
    Replacing it with `COUNT(*)` returns the identical count, removes both the seq scan and the
    spill, and is ~8x faster (p95 197.5 ms -> 24.6 ms) — strictly better than the candidate index,
    which only reached p95 88.9 ms and would have added a non-trivial write to a 6.5 GB prod table.
    With that fix the existing indexes meet every budget, with no sequential scan in any plan.
- [x] 7.5 Record the timezone invariant (design's risk list): confirm the DB session and Node
  process both run UTC in the container, and note it in the design's risk section or a code comment
  on `getSnapshotTime` so it is a known invariant rather than an accident.
- [x] 7.6 Architecture Book: **no change required.** `docs/mobile/architecture-book/data.md`
  describes the OpenAPI→Orval seam without enumerating operations, this change adds no mobile rule,
  and the only mobile diff is generated output (design D8). Tick this box after confirming that
  still holds against the final diff — do not skip it silently.
  - **Confirmed against the final diff:** `git diff --name-only origin/main..HEAD | grep ^mobile/`
    returns only `src/api/generated/calendar-logs/calendar-logs.ts` and
    `src/api/generated/timeCalendar.schemas.ts`. No hand-written mobile file and no mobile rule
    change, so the book stands as written.
- [x] 7.7 Local green: `cd server && npx tsc --noEmit && npm run lint && npm test`, and
  `cd mobile && npx tsc --noEmit`.
- [x] 7.8 Measure against the provisional budgets (default 50-log page p95 < 250 ms; maximum
  100-log page p95 < 500 ms; no full-table sequential scan) and post the numbers on
  [TIM-395](https://paperclip.lyrolab.fr/TIM/issues/TIM-395). These are the numbers the close gate
  checks against [TIM-394](https://paperclip.lyrolab.fr/TIM/issues/TIM-394)'s frozen gates — the
  Reviewer parks TIM-395 `blocked` on TIM-394 rather than merging on provisional budgets.
- [x] 7.9 `openspec validate add-v1-calendar-log-search --strict` passes.
