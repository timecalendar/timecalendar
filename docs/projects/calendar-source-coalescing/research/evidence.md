# Repository evidence

Observed 2026-09-27 against fetched `origin/main` at `9a1e2af8`.
The investigation branch is older; current-main versions were read explicitly where changed.
No production systems were queried. Claims below are source observations unless labeled.

| Surface | Observation and implication |
| --- | --- |
| `server/src/modules/fetch/services/fetch.service.ts` | Chooses strategy before transforming URL; unknown-school fallback can apply all registered renamers. Fetch is followed by event pipes and cancellation filtering. Build identity after the actual transformation path. |
| `server/src/modules/fetch/strategies/school-strategy.ts` | Default IcalFetcher, school-specific pipes and per-strategy minimum interval. No explicit cache strategy version currently exists; introduce one in a future approved implementation. |
| `server/src/modules/fetch/renamers/ade-export-window-renamer.ts` | ADE export dates are derived from current date; key effective URL after rewriting. Window changes must partition reuse. |
| `server/src/modules/fetch/schools/univrouen/univrouen-strategy.ts` | Host replacement illustrates stored URL versus effective URL differences. Retry/proxy overrides also exist in other school strategies. |
| `server/src/modules/fetch/fetchers/ical-fetcher.ts` | Current main combines axios download, parse, empty-event validation and retry classification. Has Basic auth and proxy paths; owner-reported absence of auth data does not remove this code. |
| `server/src/modules/fetch/models/calendar-fetch-failure.ts` | Current main distinguishes terminal/transient failures; coalescing must preserve these classifications and Retry-After behavior. |
| `server/src/modules/calendar-sync/calendar-sync.constants.ts` | 7s attempt timeout, 9s total fetch budget, 10s interactive work deadline; at most two configured transport attempts. Waiting for a flight cannot grant a caller a fresh unbounded budget. |
| `server/src/modules/calendar-sync/services/calendar-sync.service.ts` | Claims each due calendar before fetching. Content and change log commit together; subject synchronization and sync-attempt timestamps are separate. Cancellation can restore the claim; existing fetch failures retain content and record an attempt. New-calendar failures are separately recorded. |
| `server/src/modules/calendar-sync/services/calendar-sync-all.service.ts` | User sync has bounded concurrency and isolates calendar failures before hydration. No batch-wide source transaction should be introduced. |
| `server/src/modules/calendar-sync/jobs/sync-calendar.job.ts` | Jobs contain calendarId; current main stops terminal job retries. Regrouping jobs by source changes ownership and scheduling, not merely transport. |
| `server/src/modules/calendar-sync/services/calendar-sync-metrics.service.ts` | Actual transport attempts already have a callback counter; existing active-upstream and outcome accounting surrounds calendar work. Separate demand from actual network work when adding reuse. |
| `docs/mobile/architecture-book/data.md` | Committed OpenAPI contract is authoritative; this exploration needs no API or client change. |

Required repository orientation included README, development environment, migration approach,
roadmap overview and mobile architecture/DoD, with data/calendar topics for compatibility.
Only backend source is proposed for future implementation.

## Evidence limits

Production cohort, absence of auth records, disabled cron and metric-series collision are
owner input, not repository-proven runtime state. No measured same-key arrival distribution,
response-size distribution or available Redis headroom is supplied. Read current main again
before ticket authoring: TIM-573/TIM-574 may change the baseline.
