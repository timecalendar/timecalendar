## Why

Activity history was disabled because the legacy read path had no cursor, no limit, and no response
bound (activity-revival.md:60): a single student's request could return a year of logs in one
unversioned payload. TIM-394 measured the real cost — a 50-log page is p99 ~981 KB — and TIM-395
shipped the bounded `POST /v1/calendar-logs/search` replacement.

Reviving Activity in React Native now turns on one thing: every trigger that wants fresh Activity —
calendar sync, a push notification, opening the screen, foregrounding the app — must share **one**
bounded fetch. Four triggers each issuing their own request is exactly the capacity risk that got
the feature switched off, arriving by a different route.

## What Changes

- **Verify, do not regenerate, the v1 Orval client** (D1). The client was committed by `5f14a146`;
  this change asserts an empty generator diff and consumes the existing operation.
- **Extend `mobile/src/features/activity/data/`** — the module TIM-396 landed in `b378adb8` — with
  the Activity fetch and pagination seam: newest-page refresh, older-page loading, five-minute
  passive freshness vs. forced refresh, single-flight deduplication, cursor recovery, and error
  classification. The module and its barrel already exist; this change adds to both.
- **Refuse to issue a request the contract cannot answer usefully** (D6). No Activity request is
  sent unless the device holds between 1 and 100 unique calendar tokens. A zero-token request is a
  `200` that clears the unread badge on the newest page and **permanently** marks the older-page
  chain complete — neither is recoverable through any later refresh.
- **Add a removal-driven ownership prune** (D7) — `pruneToHeldCalendars` — so "removing a calendar
  removes its cached Activity history" survives the zero-token guard. Exposed here, wired by
  Ticket 6.
- **Persist every successful result through Ticket 3's repository.** SQLite stays the authoritative
  source for rendered history and unread metadata; the coordinator uses no TanStack Query at all
  (D8), so nothing can reach the persisted school-selection query cache.
- **Read calendar tokens and ids through the calendar-sources public barrel** (D9), never by
  importing calendar feature internals, keeping the dependency graph acyclic. Hidden calendars count
  as held.
- **NOT changed:** no UI (Ticket 5), no trigger wiring into sync/push/lifecycle/removal (Ticket 6),
  no server change, no Flutter change, no persisted Activity query cache, no read-watermark write.

## Capabilities

### New Capabilities

- `mobile-activity-refresh` — the single Activity fetch/pagination seam: refresh policy,
  single-flight, pagination, cursor recovery, request preconditions, and error classification.

### Modified Capabilities

- `mobile-activity-cache` — gains one repository operation, the standalone ownership prune (D7).

## Impact

- **Code:** `mobile/src/features/activity/data/` (new coordinator + request modules, one added
  repository operation, extended barrel). No change to the generated client, the OpenAPI spec, the
  database schema, or any migration.
- **Sensitive surfaces:** `mobile/src/api/generated/` and `openapi/openapi.json` are a committed
  contract that CI gates for drift — this change **reads** them and proves no drift; it never
  hand-edits them. Privacy: no token, calendar name, event title/location/description, calendar ID,
  log ID, request body, or cursor value may reach analytics, Crashlytics, or a log message
  (negative test required).
- **Boundaries:** only `activity/data` may import the generated calendar-log client or touch
  Activity tables via `@/db` — enforced by the existing B-1…B-4 feature-boundary lint rules, with
  the generated-client restriction added to the same config.
- **Cross-ticket:** Ticket 6 ([TIM-399](/TIM/issues/TIM-399)) must call `pruneToHeldCalendars` on
  calendar removal; its brief names sync, push, open and foreground but not removal, so the gap is
  flagged on that ticket.
- **Risk:** the single-flight guarantee rests on a check-then-assign adjacency that no type or lint
  rule protects (design, Risks). The concurrency test is the only thing that catches a regression.
