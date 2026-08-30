# Activity revival epic

**Date:** 2026-08-30  
**Paperclip research:** [TIM-275](https://paperclip.lyrolab.fr/TIM/issues/TIM-275)  
**Status:** Ready to split into implementation tickets  
**Products:** React Native mobile app and server

## Summary

React Native exposes an Activity screen that shows timetable changes for every calendar held on
the device. The screen is always reachable from the Events section of Settings and remains useful
offline through a dedicated SQLite cache.

The server exposes a bounded, cursor-paginated endpoint at
`POST /v1/calendar-logs/search`. The existing unversioned endpoint remains available for older
clients. React Native fetches the newest page after calendar synchronization, relevant push
messages, explicit refreshes, and sufficiently stale foreground/open events. Older history loads
only as the student scrolls.

Activity uses an exact unread count since the screen was last viewed. Opening Activity marks the
currently known history as read. New and changed events can open the existing event-details
screen; cancelled events are historical records and are not pressable.

The delivery shape is:

```text
calendar sync transaction
        |
        +--> calendar content
        |
        +--> calendar_log rows (one-year server retention)
                       |
                       v
            POST /v1/calendar-logs/search
                       |
                       v
        paginated upsert into SQLite activity_logs
               |                         |
               v                         v
       Settings unread badge       Activity screen
                                         |
                                         +--> current event details for new/changed items
```

## Why this exists

Flutter contains a complete Activity implementation, but the feature has been hard-disabled since
the commit that introduced it. TIM-275 established that it was held back for server
performance/capacity reasons as student volume grew and the old update jobs could not keep up. It
was not disabled because of a known privacy, data-integrity, or UX defect.

The underlying server path is active. Calendar synchronization detects changes and writes
`calendar_log` rows in the same database transaction as the calendar content. A local smoke test
of `POST /calendar-logs/search` returned new, changed, and cancelled events successfully. The
server prunes history after one year.

The current read contract is not suitable for launch:

- It returns every matching log within the one-year retention window.
- It has no cursor, limit, or response bound.
- Its DTO validates each value as a string but does not assert that `tokens` is an array.
- It echoes calendar tokens even though the consumer can identify calendars by server ID.

React Native already holds the required calendar tokens in `user_calendars`, and its generated
client contains the legacy calendar-log operation. It does not yet have an Activity route, cache,
refresh coordinator, unread state, or Settings destination.

## Goals

- Make timetable change history available from Settings for every student holding a calendar.
- Bound every server request with cursor pagination and validated request limits.
- Preserve the existing unversioned endpoint for compatibility.
- Keep up to one year of fetched Activity history in a dedicated SQLite cache.
- Render cached history immediately when offline or when refresh fails.
- Load older pages on demand rather than downloading a year of history eagerly.
- Show an exact unread count since Activity was last viewed, capped visually at `99+`.
- Refresh recent Activity after calendar sync, relevant push receipt, manual refresh, screen open,
  and app foreground according to one shared freshness policy.
- Reuse the existing event-details route for new and changed events.
- Keep Activity available regardless of notification subscription preferences.
- Ship localized French and English copy, accessible interactions, and native React Native design.
- Define measurable server, mobile, and rollout verification before production release.

## Out of scope

- Changing calendar-difference detection rules or calendar-log creation semantics.
- Redesigning the notification outbox, delivery frequencies, or push payloads.
- Changing the server's one-year calendar-log retention.
- Downloading the entire year automatically on first launch or in the background.
- Building a historical snapshot event-details screen.
- Making cancelled entries navigate to an event that no longer exists.
- Migrating Flutter's rebuildable `calendar_logs` cache into React Native.
- Adding account authentication, calendar ownership, or a replacement for token capabilities.
- Adding an Activity preference or coupling Activity to notification preferences.
- Adding a mobile feature-flag framework.
- Adding a server kill switch for the initial release.
- Changing Flutter source, generated Dart clients, or Flutter behavior.
- Creating or dispatching Paperclip tickets while this specification is being written.

## Product behavior

### Discoverability

- Settings contains an **Activity** row in the existing Events section.
- The row is always visible when the app can hold calendars; it is not controlled by notification
  settings.
- A trailing unread badge shows `1` through `99`, then `99+`.
- The row remains visible with zero calendars and opens the normal empty state.

### Activity timeline

- Logs are ordered newest first.
- One server `calendar_log` row is one visual group because it represents one detected sync change.
- The group header shows the change time and calendar name.
- Items inside a group appear in this order: new, changed, cancelled.
- New items use a positive treatment, changed items use an informational treatment, and cancelled
  items use a destructive treatment. Colors come from the shared theme and must satisfy the
  architecture book's contrast requirements.
- Changed items show only meaningful differences available in the contract, including time and
  location changes.
- Pull-to-refresh reloads the newest page.
- Reaching the end loads the next older page when one exists.
- Loading another page never blocks or blanks already cached content.

### Empty and error states

The empty state is reassuring because an empty history is normal for a newly added calendar:

- English: **No recent changes. Timetable updates will appear here.**
- French: **Aucune modification récente. Les changements d'emploi du temps apparaîtront ici.**

When refresh fails and cached rows exist, the screen keeps the rows and shows a compact retryable
message explaining that the latest changes could not be checked. When refresh fails without cached
rows, the screen shows a full retry state. Passive background and foreground failures do not
interrupt the current screen.

### Event navigation

- A new item opens `/event-details/:uid` using the new event UID.
- A changed item opens `/event-details/:uid` using the new version's UID.
- A cancelled item is not pressable because the current event no longer exists.
- If a new or changed event has disappeared since the Activity record was created, the existing
  event-details not-found state is the expected result.
- Activity does not build or retain a second event-details model from the historical payload.

## Architecture decisions

### 1. Use a path-level versioned POST search endpoint

The bounded contract is:

```http
POST /v1/calendar-logs/search
Content-Type: application/json
```

The legacy `POST /calendar-logs/search` remains available and keeps its response shape. The `/v1`
route is an explicit path-level controller route, consistent with the migration specifications
that already introduce scoped `/v1` endpoints. This epic does not enable global NestJS versioning
or move unrelated endpoints.

A GET collection with comma-separated `calendarToken` query values is not used. Calendar tokens
are bearer capabilities and must not be placed in URLs, where infrastructure commonly records
paths and query strings. A body also avoids URL-length limits for students holding many calendars.
POST is appropriate because this is a compound search over secret inputs rather than creation of a
calendar log.

### 2. Use stable keyset pagination

The request contract is:

```ts
type CalendarLogSearchV1Request = {
  tokens: string[];
  limit?: number;
  cursor?: string;
  unreadSince?: string;
};
```

Validation and defaults:

- `tokens` is required and must be an array.
- Every token must be a non-empty string.
- Duplicate tokens are collapsed before querying.
- At most 100 unique tokens are accepted.
- An empty array returns an empty first page without querying calendar logs.
- `limit` defaults to 50 and must be an integer from 1 through 100.
- `cursor`, when present, must be a valid server-issued cursor for this endpoint.
- `unreadSince`, when present, must be an ISO-8601 timestamp.
- Unknown tokens return no rows and do not make the whole request fail.

The response contract is:

```ts
type CalendarLogSearchV1Response = {
  items: CalendarLogV1[];
  nextCursor: string | null;
  asOf: string;
  unreadCount?: number;
};

type CalendarLogV1 = {
  id: string;
  calendarId: string;
  calendarName: string;
  calendarChange: CalendarChangeGet;
  createdAt: string;
  updatedAt: string;
};
```

`calendarToken` is deliberately absent from `CalendarLogV1`. React Native maps `calendarId` to its
held `user_calendars.id`; returning the capability adds no product value.

The first page captures a database `asOf` timestamp. Results are ordered by
`createdAt DESC, id DESC` and constrained to rows at or before that snapshot. `nextCursor` is an
opaque, versioned encoding of the snapshot and the last `(createdAt, id)` pair. Following pages
therefore remain stable if a new calendar log arrives while the student is scrolling.

The server reads one extra row to determine whether `nextCursor` exists. Invalid, malformed, or
unsupported cursor versions return 400. The cursor contains no token or event data and is treated
as opaque by clients.

When `unreadSince` is supplied on an initial-page request, `unreadCount` counts matching rows where
`createdAt > unreadSince` and `createdAt <= asOf`. Following-page requests omit `unreadSince` and do
not repeat the count query.

### 3. Keep the legacy endpoint compatible but validate its array correctly

The legacy endpoint continues returning `CalendarLogGet[]`, including `calendarToken`, with no new
pagination fields. Its request DTO gains explicit array validation so a bare string no longer
silently produces an empty success response. Valid existing array requests keep their behavior.

React Native uses only the v1 operation. Flutter source and generated clients remain untouched.

### 4. Query through existing identities and verify the database plan

The repository resolves calendar tokens through the indexed `calendar.token`, then pages logs
using the existing calendar/date indexes and stable ID tie-breaker. Query code uses parameterized
values only and never includes tokens in explicit application logs, metrics, traces, or errors.

The endpoint ticket must capture representative PostgreSQL `EXPLAIN (ANALYZE, BUFFERS)` evidence
for one, ten, and one hundred calendars with recent and year-long history. A new composite index is
added only if those plans show that the existing `calendar.token`,
`calendar_log(calendar, createdAt)`, and `calendar_log(createdAt)` indexes cannot meet the agreed
budget. This avoids an unproven production index migration while keeping performance an explicit
release gate.

### 5. Store Activity as an incremental SQLite cache

React Native adds two tables through the normal Drizzle migration flow.

```ts
activityLogs = {
  id: string, // primary key; server calendar_log id
  calendarId: string,
  calendarName: string,
  changeJson: string, // CalendarChangeGet encoded as JSON text
  createdAt: string, // canonical UTC ISO-8601
  updatedAt: string, // canonical UTC ISO-8601
};

activityState = {
  id: 1, // singleton row
  lastReadAt: string | null,
  unreadCount: number,
  lastSuccessfulRefreshAt: string | null,
  olderPageCursor: string | null,
  olderPageComplete: boolean,
};
```

`activity_logs` is indexed by `createdAt` and `calendarId`. Structured changes use defensively
decoded JSON text, matching the existing cache posture for structured calendar-event fields. A
malformed row does not crash the whole timeline; it is skipped and recorded through the existing
unexpected-local-data path.

Successful pages are upserted by log ID in one transaction. They never replace the whole table:
pagination and offline history require incremental merge. The transaction also:

- removes rows older than one year relative to the server's latest known `asOf`;
- removes rows whose `calendarId` is no longer held by the device;
- advances the older-page cursor only after the page is stored successfully; and
- updates refresh and unread metadata only after the relevant writes succeed.

The first successful fetch on an empty cache stores its `nextCursor` as `olderPageCursor`.
Subsequent newest-page refreshes preserve an existing older-page cursor so a partially completed
historical backfill does not restart from page two. If the server later rejects a stored cursor,
the client clears that cursor and safely begins a new chain from the newest page; upsert identity
makes repeated pages harmless.

Both tables are backend-bound rebuildable data. Environment switching and database reset clear
them alongside calendar events and user calendars. They are not Phase-09 Flutter import targets.

### 6. Coordinate refreshes through one Activity data seam

`mobile/src/features/activity/` owns `data/` and `ui/` layers. Only `activity/data` imports the
generated calendar-log client or accesses Activity tables through `@/db`.

One Activity refresh coordinator owns the newest-page request, local transaction, single-flight
deduplication, freshness timestamp, and error classification. Screens and other features call its
public operations rather than invoking the generated mutation directly.

The coordinator may use the existing TanStack Query client for in-flight deduplication and
ephemeral request state, but the query result is not the offline source of truth and is not added
to the persisted school-selection query cache. SQLite remains authoritative for rendered history
and unread metadata.

The dependency graph stays acyclic:

```text
calendar sync -------> activity data -------> calendar-sources data
notifications -------> activity data
activity UI ----------> activity data
activity UI ----------> /event-details route string
root runtime ---------> activity data
```

Activity UI routes directly to the public event-details URL and does not import calendar feature
internals. Calendar sync may call the Activity data seam after its own successful local event
transaction without creating a reverse Activity-to-calendar dependency.

### 7. Apply one refresh policy to every trigger

The newest page refreshes under these rules:

| Trigger                                               | Policy                                               | User-visible failure              |
| ----------------------------------------------------- | ---------------------------------------------------- | --------------------------------- |
| Activity pull-to-refresh                              | Always force                                         | Yes; cached content stays visible |
| Relevant `calendar_changed` or `calendar_digest` push | Always force                                         | No                                |
| Successful calendar sync                              | Always force after event storage succeeds            | No                                |
| Activity screen open                                  | Refresh when last success is older than five minutes | Yes on the screen                 |
| App moves to foreground                               | Refresh when last success is older than five minutes | No                                |
| Cold launch                                           | Startup calendar sync causes the post-sync refresh   | No                                |

Concurrent triggers join one in-flight newest-page request. A passive failure does not move
`lastSuccessfulRefreshAt`, so a later trigger can retry. A calendar-sync success is not converted
into a calendar-sync failure when the independent Activity refresh fails.

Notification receipt requests calendar sync and Activity refresh independently. The Activity
single-flight coordinator removes the duplicate when calendar sync also completes and requests a
refresh. This preserves the push guarantee even if the event sync call itself fails.

Older-page loading is separate from newest-page refresh. It is driven only by the Activity screen,
uses `olderPageCursor`, and cannot block a forced newest-page request.

### 8. Use a server-time read watermark and server-provided unread count

`lastReadAt` is a server-issued `asOf` timestamp, not a device clock timestamp. This prevents a
misconfigured phone clock from permanently hiding or inflating unread changes.

The behavior is:

1. Passive newest-page refresh sends the stored `lastReadAt` as `unreadSince`.
2. The response's exact `unreadCount` is stored and shown in Settings.
3. Opening Activity immediately sets the locally known unread count to zero.
4. If a newest-page request succeeds while Activity is visible, its `asOf` becomes `lastReadAt`
   and unread count remains zero because the student is viewing that snapshot.
5. If Activity opens offline, `lastReadAt` advances only to the newest cached server timestamp.
   A later response can still count server rows created after that point.
6. Activity rows arriving after the stored watermark become unread even when push notifications
   are disabled.

Read state is device-local. Multiple installations holding the same calendar token do not share a
read watermark.

### 9. Keep historical navigation deliberately shallow

The server payload contains only the fields required to describe a change. React Native does not
expand it into a durable event snapshot or copy it into `calendar_events`.

New and changed entries use the current event UID and existing details route. Cancelled entries
remain inert. This keeps the Activity cache rebuildable, avoids two competing event models, and
makes a stale not-found result honest when the current calendar no longer contains the event.

### 10. Ship without a kill switch

The v1 endpoint is a read-only, indexed, page-bounded query with bounded token count. The release
therefore relies on pagination, query-plan evidence, preproduction capacity checks, normal server
observability, and staged deployment rather than a new feature-flag system.

A future emergency server control must return `503 Service Unavailable`, not a successful empty
page. An empty page is real product data and would make an outage indistinguishable from a student
with no changes. React Native already needs the 503/network-failure behavior: retain SQLite rows,
retain unread state, and show cached-data messaging only on the Activity screen.

Adding that control remains a follow-up only if production evidence shows a need.

## API behavior

| Situation                          | Expected response                                                      |
| ---------------------------------- | ---------------------------------------------------------------------- |
| Valid first page                   | 200 with newest stable page, `asOf`, optional unread count, and cursor |
| Valid following page               | 200 with older rows under the original snapshot                        |
| Final page                         | 200 with `nextCursor: null`                                            |
| Empty token array                  | 200 empty page without a log query                                     |
| Unknown token                      | 200; that token contributes no rows                                    |
| Known and unknown tokens           | 200 with rows for known tokens only                                    |
| Duplicate tokens                   | 200; tokens are deduplicated before querying                           |
| More than 100 unique tokens        | 400                                                                    |
| Limit outside 1–100                | 400                                                                    |
| Bare string instead of token array | 400 on v1 and legacy endpoints                                         |
| Invalid timestamp                  | 400                                                                    |
| Invalid or unsupported cursor      | 400                                                                    |
| Unexpected database failure        | Existing sanitized 5xx behavior; no token or event body logged         |

## Mobile state behavior

| Situation                          | Expected behavior                                                                |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| First launch with no calendars     | No request after tokens resolve empty; Activity shows normal empty state         |
| First successful page              | Store rows and initial older cursor; render from SQLite                          |
| Newest refresh repeats known IDs   | Upsert without duplicates                                                        |
| Older page overlaps cached rows    | Upsert safely and continue cursor                                                |
| New calendar is added              | Newest refresh includes its token; historical loading can include its older rows |
| Calendar is removed                | Delete its Activity rows from SQLite immediately                                 |
| Newest refresh fails with cache    | Keep rows and read state; show retry only when screen is visible                 |
| Newest refresh fails without cache | Show retryable full-screen error when Activity is visible                        |
| Older-page request fails           | Keep the list and show an inline retry footer                                    |
| Persisted cursor becomes invalid   | Clear it and restart pagination safely from the newest page                      |
| Activity opens offline             | Clear locally known unread count and render cache                                |
| Environment changes                | Clear Activity tables with all backend-bound data                                |

## Security and privacy

- Calendar tokens remain bearer capabilities and are sent only in HTTPS request bodies.
- The v1 response does not echo calendar tokens.
- Tokens, event titles, locations, descriptions, calendar IDs, log IDs, request bodies, and cursor
  values never appear in explicit metrics labels, analytics, traces, Crashlytics attributes, or
  application log messages.
- Server validation bounds both token count and page size before repository work begins.
- SQL uses parameterized values. Cursor decoding validates types and limits before constructing a
  query.
- Activity SQLite data is not encrypted, matching the existing local calendar/token store. Device
  storage encryption and authenticated-user isolation remain broader platform concerns.
- Removing a held calendar removes its cached Activity history on that device.
- CORS, token entropy, ownership, rotation, and endpoint-specific rate limiting remain unchanged.

## Observability and capacity

> The budgets below are the *initial* ones. They have since been measured and frozen in
> [`activity-capacity-gate.md`](./activity-capacity-gate.md), which also records the production
> volume buckets, the fixture definitions, the query-plan evidence, the index verdict, and the
> default-page-size verdict. Where the two differ, the gate document wins and states why.

Automatic HTTP server spans and request metrics provide route status and latency. The endpoint may
add bounded measurements for page-row count, unread-count duration, and cursor/first-page outcome,
but never labels derived from tokens, calendars, users, events, or cursors.

The production gate uses aggregate evidence only:

- distribution of calendar-log rows per active calendar and approximate held-calendar cohort;
- rows and bytes returned for representative first and following pages;
- first-page and following-page p50/p95/p99 latency;
- unread-count query latency over recent and one-year watermarks;
- PostgreSQL query plan, rows scanned, buffer hits, and temporary-sort behavior;
- application memory and event-loop health during representative concurrent reads; and
- error rate after server and mobile rollout.

Initial acceptance budgets are:

- default 50-log page p95 below 250 ms in representative preproduction data;
- maximum 100-log page p95 below 500 ms;
- no sequential scan of the full `calendar_log` table for a bounded token request;
- no token/event data in telemetry;
- one request per trigger after single-flight collapse; and
- smooth cached scrolling on supported iPhone, iPad portrait, and Android devices.

A single log can contain many changed events, so row pagination is not a strict byte limit. The
capacity ticket records real payload distributions. If default pages materially exceed the mobile
or network budget, the server may lower the default below 50 while retaining the accepted maximum
and contract shape; splitting one calendar-log group across pages is not part of this epic.

## Compatibility

| Consumer                 | Result                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------- |
| React Native             | Uses the v1 paginated contract, SQLite cache, unread state, and Activity UI.            |
| Flutter                  | Keeps the unversioned endpoint and existing generated client; source remains unchanged. |
| Existing server clients  | Valid unversioned array requests keep their response contract.                          |
| Malformed legacy callers | A bare-string `tokens` value changes from silent empty success to 400.                  |
| Notification pipeline    | Continues reading the same `calendar_log` rows independently.                           |
| Existing calendar logs   | Remain available until the existing one-year prune removes them.                        |
| Backend environments     | Activity cache and read state reset with other backend-bound mobile data.               |

## Risks and mitigations

| Risk                                                 | Impact                                                               | Mitigation                                                                                          |
| ---------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| A year of logs creates a large unversioned response. | Server and mobile memory/latency regress.                            | RN uses only bounded v1 cursor pages; legacy stays compatibility-only.                              |
| A single log contains many event changes.            | One item can still create a large page payload.                      | Measure payload distributions; keep groups atomic; lower default page size if evidence requires it. |
| Calendar tokens appear in a GET URL or telemetry.    | Capability leakage exposes private schedules.                        | Use POST body; omit token from v1 response; enforce privacy-negative tests and review.              |
| New logs arrive during pagination.                   | Offset pagination duplicates or skips rows.                          | Snapshot-bound keyset cursor ordered by `(createdAt, id)`.                                          |
| Many triggers fire together.                         | Duplicate API/database work recreates the original capacity concern. | One refresh coordinator, single-flight collapse, and five-minute passive freshness.                 |
| Exact unread count scans too much history.           | Settings refresh becomes expensive.                                  | Count only after `lastReadAt`; verify indexed plans and production distributions.                   |
| Device clock is wrong.                               | Read state hides or invents unread changes.                          | Persist server `asOf`, never local `now`, as the read watermark.                                    |
| Cached history belongs to a removed calendar.        | Old private schedule data remains unexpectedly visible.              | Delete cache rows when the calendar identity is removed.                                            |
| Current event disappears after an Activity entry.    | Tap reaches not-found.                                               | Accept honest current-state navigation; cancelled entries are inert.                                |
| Cursor format changes or expires.                    | Older loading stops.                                                 | Version and validate cursors; reset pagination chain while preserving upserted cache.               |
| SQLite migration or writes fail.                     | Activity cannot update and may appear stale.                         | Record unexpected local failures, keep last-good rows, and expose retry on the screen.              |
| Server outage returns a fake empty page.             | App clears meaning and misleads the student.                         | No kill switch; any future emergency control returns 503 and preserves cache behavior.              |
| Server deploy and mobile release are reversed.       | Mobile calls an unavailable v1 route.                                | Deploy and verify server first; mobile preview and store release follow.                            |

## Verification strategy

### Server tests

- V1 request validation covers array shape, empty/non-empty strings, unique-token cap, limit bounds,
  timestamp parsing, and cursor validation.
- Legacy request validation rejects a bare string while preserving valid array behavior.
- Repository integration tests prove stable `(createdAt DESC, id DESC)` ordering across calendars.
- New logs inserted between page requests do not duplicate or displace rows inside the original
  snapshot.
- Equal `createdAt` values paginate deterministically by ID.
- Unknown and mixed tokens behave as specified.
- `unreadCount` respects tokens, `unreadSince`, and the first page's `asOf`.
- V1 mapping omits `calendarToken`; legacy mapping retains it.
- Cursor payloads contain no calendar token or event content.
- Controller and service failures never log request bodies.
- Committed OpenAPI contains the v1 DTOs/path and preserves the legacy path.
- Representative PostgreSQL plan evidence is recorded without sensitive values.

### React Native data tests

- The Drizzle migration creates Activity tables/indexes and upgrades an existing database.
- Row mapping round-trips valid changes and safely handles malformed cached JSON.
- Page upsert is transactional, idempotent, and ordered newest first.
- Local one-year pruning uses the latest trusted server snapshot.
- Removing a calendar removes only its Activity rows.
- Database/environment reset includes both Activity tables.
- First-page refresh stores server unread count without moving the read watermark while the screen
  is closed.
- Opening Activity clears local unread state and successful visible refresh advances `lastReadAt`.
- Offline open advances only through cached server time.
- Older-page cursor persists across restart and advances only after a successful write.
- Invalid stored cursor resets the chain without deleting cached rows.
- Concurrent triggers issue one newest-page request.
- Five-minute passive freshness and forced-trigger behavior use controlled clocks.
- Fetch failures preserve last-good rows and do not turn calendar-sync success into failure.

### React Native UI tests

- Settings renders Activity in the Events section and routes the full accessible row to
  `/activity`.
- Badge renders 1–99, `99+`, and no badge for zero.
- Activity renders loading, empty, cached-error, empty-error, and populated states in French and
  English.
- Groups and child types render in the specified order.
- Pull-to-refresh and older-page footer retries call the correct operations.
- New and changed rows navigate with the correct UID; cancelled rows are not pressable.
- Dynamic Type/font scaling, screen-reader labels, focus order, live error announcements, contrast,
  and minimum touch targets meet the architecture book.
- Long calendar names, event titles, locations, and large change groups wrap without clipping.

### Integration, Maestro, and device checks

- Extend the local E2E seed with deterministic calendar-log rows covering new, changed, cancelled,
  same-timestamp, unread, and multi-page cases.
- Import the seed calendar, synchronize, open Settings, observe the unread badge, open Activity,
  and confirm it clears.
- Open new/changed details and confirm cancelled items remain inert.
- Exercise pull-to-refresh and infinite scrolling against the real local server.
- Restart offline and confirm cached history renders without a network request succeeding.
- Remove the calendar and confirm its history disappears.
- Verify foreground and push-trigger behavior on real iOS and Android devices.
- Confirm page scrolling and large groups on supported iPhone, iPad portrait, and Android form
  factors.

## Rollout

1. Ship the server v1 endpoint and legacy validation tightening with committed OpenAPI.
2. Run aggregate production-volume analysis read-only and the representative preproduction query
   and concurrency checks.
3. Generate the React Native client and ship SQLite/data behavior to development and preview.
4. Exercise automated and real-device Activity flows against the deployed preproduction server.
5. Deploy the verified server image to production before any store build that calls v1.
6. Release React Native 4.0 through the existing preview/store process.
7. Observe route latency, errors, database behavior, memory, and event-loop health through the
   normal release windows.

Rollback is a mobile release/OTA rollback where runtime compatibility permits, plus normal server
image rollback. The additive v1 route and mobile SQLite tables need no destructive rollback.
The unversioned endpoint remains available throughout.

## Delivery plan and final Paperclip tickets

The delivery chain is [TIM-389](/TIM/issues/TIM-389), derived from the completed research record
[TIM-275](/TIM/issues/TIM-275). The headings below link the final dispatched tickets.

### Parent epic — Ship paginated Activity history in React Native 4.0

**Outcome:** Students can review one year of timetable changes through a bounded, offline-capable,
accessible Activity experience without recreating the server capacity risk that originally kept
the feature disabled.

**Children:** Tickets 1–8 below, wired according to the delivery graph.

### [Ticket 1 — Measure Activity volume and freeze capacity budgets](/TIM/issues/TIM-394)

**Outcome:** Implementation and rollout use real aggregate volume and explicit performance gates.

**Scope:**

- Run read-only, statement-time-limited aggregate queries for calendar-log distribution and active
  calendar cohorts without emitting tokens, calendar/event content, or opaque IDs.
- Build representative local/preproduction fixtures from those aggregate buckets.
- Freeze page payload, latency, query-plan, memory, and concurrency gates.
- Record whether the existing indexes satisfy v1 keyset and unread-count queries.

**Not in scope:** production writes, user-level inspection, a load test against production, index
creation, or endpoint implementation.

**Dependency:** none. It may run in parallel with the first server implementation, but its budgets
gate server acceptance and production rollout.

### [Ticket 2 — Add the v1 paginated calendar-log API](/TIM/issues/TIM-395)

**Outcome:** The server exposes a privacy-safe, stable, cursor-paginated Activity read contract and
preserves legacy consumers.

**Scope:**

- Add path-level `POST /v1/calendar-logs/search` with the request, response, limits, cursor, `asOf`,
  and unread-count semantics in this specification.
- Omit calendar tokens from the v1 response.
- Add explicit array validation to the legacy request DTO without changing valid response shape.
- Implement stable repository queries and sanitized error behavior.
- Add an index migration only if Ticket 1/query-plan evidence requires it.
- Add server tests, privacy-negative checks, bounded telemetry, and committed OpenAPI.

**Not in scope:** global NestJS versioning, GET query tokens, rate limiting, kill switch, retention,
change detection, notification delivery, or Flutter generation.

**Acceptance:** the server tests, compatibility table, initial budgets, and query-plan evidence in
this specification pass.

**Dependency:** Ticket 1 supplies final performance gates; contract work can begin before it ends.

### [Ticket 3 — Add the React Native Activity SQLite model](/TIM/issues/TIM-396)

**Outcome:** React Native has a tested incremental cache and device-local read/pagination state.

**Scope:**

- Add `activity_logs` and singleton `activity_state` schemas and Drizzle migration.
- Extend the `@/db` seam, database reset, and environment reset tables.
- Implement defensive row/domain mapping, transactional page upsert, calendar removal, local
  retention, read state, and older-cursor persistence.
- Add migration, mapper, repository, reset, and corruption tests.
- Record the cache/read-watermark decision in the mobile architecture book and feature map.

**Not in scope:** API requests, screen UI, Flutter cache import, or event snapshot details.

**Dependency:** none; it uses the DTO shape frozen in this specification and may proceed alongside
Ticket 2.

### [Ticket 4 — Generate the v1 client and build the Activity refresh coordinator](/TIM/issues/TIM-397)

**Outcome:** Every trigger shares one bounded, offline-safe Activity fetch/pagination seam.

**Scope:**

- Regenerate the React Native Orval client from Ticket 2's committed OpenAPI.
- Add `features/activity/data` with newest refresh, older-page loading, exact unread count,
  five-minute passive freshness, forced refresh, cursor recovery, and single-flight behavior.
- Read current calendar tokens/IDs through the calendar-sources public data seam.
- Persist successful results through Ticket 3's repository.
- Classify passive, visible, network, malformed-response, and SQLite errors as specified.
- Add coordinator and generated-contract wiring tests.

**Not in scope:** UI, trigger integration in other features, query-cache persistence, or Flutter.

**Dependencies:** Tickets 2 and 3.

### [Ticket 5 — Build the Activity screen and Settings unread entry](/TIM/issues/TIM-398)

**Outcome:** Students can discover, read, refresh, paginate, and navigate Activity with accessible
native React Native presentation.

**Scope:**

- Add thin `/activity` route and root Stack registration.
- Add the Activity row and reactive `1`–`99+` badge to Settings Events.
- Build grouped timeline, item treatments/differences, pull-to-refresh, infinite scrolling, empty
  states, cached failure, empty failure, and inline older-page retry.
- Route new/changed items to current event details and keep cancelled items inert.
- Add French/English strings, theme usage, accessibility, screen tests, and long-content tests.

**Not in scope:** background/foreground/push integration, historical details, new design system,
notification preferences, or a hidden feature gate.

**Dependencies:** Tickets 3 and 4.

### [Ticket 6 — Wire Activity refresh into sync, push, open, and foreground lifecycle](/TIM/issues/TIM-399)

**Outcome:** Activity becomes current through every accepted trigger without duplicate requests or
cross-feature cycles.

**Scope:**

- Trigger a non-blocking forced Activity refresh after successful calendar event storage.
- Trigger Activity independently for relevant foreground, background-tap, and cold-start push
  messages while preserving existing calendar routing.
- Add the five-minute screen-open and app-foreground runtime policy.
- Ensure calendar-sync success remains success when Activity refresh fails.
- Prove single-flight collapse across overlapping notification, sync, open, and foreground events.
- Update ADR 028/current architecture documentation where the push cross-feature contract changes.

**Not in scope:** push payload/server changes, notification preference changes, background fetch,
or new app lifecycle infrastructure beyond the Activity runtime.

**Dependency:** Ticket 4. It may run in parallel with Ticket 5 once the data API is stable.

### [Ticket 7 — Add real-server Activity E2E fixtures and flows](/TIM/issues/TIM-400)

**Outcome:** CI and device checks prove unread, pagination, cache, navigation, and removal against
the actual server contract.

**Scope:**

- Seed deterministic new, changed, cancelled, same-timestamp, unread, and multi-page logs through
  the supported local E2E lifecycle.
- Add a Maestro flow for Settings badge, Activity open/clear, item routing, pull refresh, and older
  loading.
- Add integration coverage for offline restart and calendar removal.
- Document iOS/Android device checks for foreground and push behavior.

**Not in scope:** production data, load testing, broad calendar-sync E2E rewrites, or flaky live
university feeds.

**Dependencies:** Tickets 2, 5, and 6.

### [Ticket 8 — Run Activity capacity gate and release readiness review](/TIM/issues/TIM-401)

**Outcome:** Activity is approved for production only with measured server capacity, complete
compatibility evidence, and an executable rollback plan.

**Scope:**

- Run Ticket 1's representative preproduction page, unread-count, and concurrency checks against
  the release candidate.
- Verify telemetry privacy and route/database health.
- Run all server/mobile automated checks plus required iOS/Android device passes.
- Confirm server-first deployment ordering, compatibility with the previous mobile release, and
  rollback steps.
- Reconcile the Activity roadmap, architecture book, feature map, and final ticket links with the
  implemented contract.

**Not in scope:** enabling a kill switch, changing platform infrastructure, production load tests,
or unrelated RN migration cleanup.

**Dependencies:** Tickets 1, 2, 5, 6, and 7.

## Delivery order

```text
Ticket 1 ───────────────┐
   |                    |
   v                    v
Ticket 2             Ticket 3
   |                    |
   +─────────┬──────────+
             v
          Ticket 4
          /      \
         v        v
    Ticket 5    Ticket 6
         \        /
          v      v
          Ticket 7
             |
             v
          Ticket 8
```

Ticket 1 and Ticket 3 can begin immediately. Ticket 2 may develop against provisional budgets but
cannot close until Ticket 1 freezes its performance gates. Ticket 5 and Ticket 6 can proceed in
parallel after the shared data coordinator is stable.

No Paperclip ticket should be issued until this technical specification and the proposed ticket
boundaries are reviewed and explicitly approved.
