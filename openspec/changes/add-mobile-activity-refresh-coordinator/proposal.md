## Why

> **WIP.** This proposal is being written against a blocker: [TIM-397](/TIM/issues/TIM-397) waits on
> [TIM-396](/TIM/issues/TIM-396) (the Activity SQLite model). What is committed here is the slice
> that **cannot** move when TIM-396 lands — the decisions frozen by the v1 contract already on
> `main`. See `design.md` D1–D5.

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
- **Add `mobile/src/features/activity/data/`** — the single Activity fetch and pagination seam,
  owning newest-page refresh, older-page loading, five-minute passive freshness vs. forced refresh,
  single-flight deduplication, cursor recovery, and error classification.
- **Persist every successful result through Ticket 3's repository.** SQLite stays the authoritative
  source for rendered history and unread metadata; the query result is not the offline source of
  truth and is never added to the persisted school-selection query cache.
- **Read calendar tokens through the calendar-sources public data seam**, never by importing
  calendar feature internals, keeping the dependency graph acyclic.
- **NOT changed:** no UI (Ticket 5), no trigger wiring into sync/push/lifecycle (Ticket 6), no
  server change, no Flutter change, no persisted Activity query cache.

## Capabilities

### New Capabilities
- `mobile-activity-refresh` — *(delta not yet written; pending TIM-396)*

### Modified Capabilities
<!-- pending -->

## Impact

- **Code:** new `mobile/src/features/activity/data/`. No change to the generated client.
- **Sensitive surfaces:** `mobile/src/api/generated/` and `openapi/openapi.json` are a committed
  contract that CI gates for drift — this change **reads** them and proves no drift; it never
  hand-edits them. Privacy: no token, calendar name, event title/location/description, calendar ID,
  log ID, request body, or cursor value may reach analytics, Crashlytics, or a log message
  (negative test required).
- **Boundaries:** only `activity/data` may import the generated calendar-log client or touch
  Activity tables via `@/db` — enforced by the existing B-1…B-4 feature-boundary lint rules.
- **Tests / docs / risk:** *(pending TIM-396)*
