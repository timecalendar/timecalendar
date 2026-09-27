## Context

`IcalFetcher` currently gives selected school strategies either one request or two requests inside a shared nine-second budget. Its catch block retries every error except the existing HTTP 401 basic-auth challenge, then converts the last error to one `BadRequestException`. This erases whether another request could help. `CalendarSyncService` also folds fetch, parse, and empty-result errors into one internal failure result, while `SyncCalendarJob` propagates every thrown error into BullMQ's three-attempt policy.

The fetch path already exposes an attempt callback and cancellation signal, and calendar-sync telemetry already owns an unlabeled upstream-attempt counter. The design must preserve those bounds, existing public error behavior for calendar creation, the persisted claim/minimum-sync policy, full source URLs in `calendar_failure`, and all school strategy configuration.

## Goals / Non-Goals

**Goals:**

- Make retry decisions from an explicit, finite failure classification.
- Keep all transport attempts and `Retry-After` waits inside the existing two-attempt, nine-second, cancellation-aware envelope.
- Give background jobs a typed way to stop BullMQ retries for terminal calendar failures.
- Export only bounded attempt and final-classification telemetry.
- Pin the full retry matrix, job behavior, school strategy invariants, and failure-storage policy with focused tests.

**Non-Goals:**

- Changing endpoint DTOs, generated clients, database schema, or stored `calendar_failure` fields.
- Accepting empty calendars or changing user-facing recovery behavior.
- Changing a school's matchers, proxy use, URL transformations, event pipes, or minimum-sync interval.
- Changing BullMQ's attempt count/backoff for failures that remain retryable.
- Editing mobile, legacy Flutter, native/store configuration, deployment/CI configuration, or Architecture Book rules.

## Decisions

## Decision 1 — One finite classifier owns retryability

Add a fetch-domain failure type carrying a closed `classification`, a `retryable` disposition derived by code, and the original `cause`. The classifier examines structured inputs only: Axios response status and headers, Axios/Node error code, parser outcome, validated URL shape, and the existing authentication error payload. It never derives behavior from error-message text.

The retryable set is exactly:

- `timeout` when the absolute budget still permits another attempt;
- `connection_reset` for `ECONNRESET`;
- `rate_limited` for HTTP 429;
- `bad_gateway`, `service_unavailable`, and `gateway_timeout` for HTTP 502, 503, and 504.

The terminal set includes `ui_link`, `invalid_url`, `no_events`, `invalid_ical`, `authentication`, `tls`, `dns_permanent`, `http_client`, and `unknown`. TLS and permanent-DNS recognition use reviewed finite code sets; an unrecognized code is terminal because this feature retries only known transient categories. Known timetable UI paths may be identified from the transformed URL after the first failed response/parse, so they retain one attempt but never receive a second. HTTP 401/403 are authentication failures, all other 4xx responses except 429 are `http_client`, and all status codes outside the explicit transient set are terminal.

The fetcher throws the typed failure when it exhausts or declines its local retry. `CalendarSyncService` normalizes empty post-filter event arrays and the preserved basic-auth `CustomError` into the same internal classification. It retains the original cause for existing HTTP/error serialization behavior and does not put the cause, URL, response, or network code into metric labels.

Alternatives rejected:

- Message matching is brittle, locale-dependent, and expressly cannot provide the job contract.
- Retrying unknown errors is fail-open amplification and contradicts the allowlisted transient policy.
- Scattering code checks across the fetcher, sync service, and job would let their decisions drift.

## Decision 2 — `Retry-After` shares the absolute fetch budget

For HTTP 429, parse `Retry-After` as either non-negative delta-seconds or an HTTP date relative to the current clock. A missing or malformed header requests no added delay. A valid past date becomes zero delay. The wait is cancellation-aware and uses the same absolute `budgetEndsAt` as both Axios attempts.

A second attempt starts only when the requested delay is strictly less than the remaining budget. After the wait, its Axios timeout is clamped to the new remaining budget and the existing seven-second per-attempt maximum. If the delay reaches or exceeds the remaining budget, the fetcher returns the final `rate_limited` failure immediately; it does not sleep to the deadline or begin a doomed request. Tests use an injected clock/timer seam or fake timers so delta/date parsing and boundary behavior are deterministic.

Alternatives rejected:

- Sleeping independently of the fetch budget would let 429 responses extend request lifetime.
- Requiring a full seven seconds after the wait would discard useful shorter attempts even though the established policy already clamps attempts to remaining time.
- Exponential delay inside `IcalFetcher` duplicates BullMQ's job-level backoff and does not fit the interactive request budget.

## Decision 3 — Preserve public causes while giving jobs an explicit terminal contract

Introduce a calendar-sync domain failure for existing-calendar fetch outcomes with the closed classification and retry disposition plus its original cause. `CalendarSyncService` continues its current sequence: retain the persisted claim, store/update failure state according to existing rules, then throw. New-calendar creation still writes the submitted full source URL and serialized original cause to `calendar_failure`, then rethrows the original public error so current API status/payload behavior does not change.

`SyncCalendarJob` catches only the typed calendar-sync failure. It converts a terminal instance to BullMQ's exported `UnrecoverableError`, which prevents further job attempts; it propagates retryable instances unchanged. Errors outside the classified upstream/calendar-content path, such as database or queue failures, also propagate unchanged and keep the existing BullMQ retry behavior. No branch compares messages.

Alternatives rejected:

- Setting the job's global attempt count to one would remove recovery for transient and infrastructure errors.
- Throwing `UnrecoverableError` from the fetch module would couple an HTTP/domain layer to BullMQ and affect interactive calls.
- Replacing every public exception with the new domain type risks changing Nest's current response behavior.

## Decision 4 — Record attempts and final outcomes with closed labels

Keep `calendar_sync_upstream_attempt_total` as the count of actual attempt starts. Add one final-outcome counter recorded once per fetch operation with labels selected only from closed TypeScript unions: the failure classification (plus `success` and `cancelled`) and its final disposition (`success`, `transient_exhausted`, `terminal`, or `cancelled`). The classifier, metric types, and table-driven tests share the same finite vocabulary.

No URL, hostname outside the existing reviewed upstream-domain classifier, response body, exception message, `Retry-After` value, or arbitrary error/status code becomes an attribute. Cancellation remains distinct from failure and starts no retry after the signal fires.

Alternatives rejected:

- Using raw Node/Axios codes as labels makes the vocabulary library- and environment-controlled.
- Recording only success/error would not show whether retry work ended as terminal or transiently exhausted.
- Counting planned rather than started attempts would misstate budget- and cancellation-short-circuited work.

## Decision 5 — Focused proofs guard strategy and persistence invariants

Use table-driven fetcher tests for every listed retryable and terminal classification, with explicit attempt counts. Add deterministic timeout and 429 delay/budget boundary tests, a job test that exercises BullMQ terminal translation, and a cross-boundary CI proof showing one terminal upstream attempt and one job execution versus bounded transient retries. Existing strategy tests remain authoritative for proxy construction, generic/school URL-renamer inheritance, and minimum-sync selection; add focused assertions only where the new context or error contract could disturb them.

Calendar-sync service/repository tests must continue to prove that empty post-filter calendars fail and a failed creation stores the original full source URL. A scope check must show no changes under excluded and sensitive paths.

## Risks / Trade-offs

- **[A provider uses a transient condition outside the allowlist]** → classify it as terminal by default, observe the bounded classification counter, and add a reviewed enum case only with evidence.
- **[Node/Axios represents one failure differently across versions]** → classify from structured status/code inputs behind one pure seam and pin representative cases without matching messages.
- **[A 429 leaves only a very short second-attempt window]** → retain the established remaining-budget clamp; the operation still cannot exceed nine seconds.
- **[Wrapping failures changes API behavior]** → rethrow the original cause on creation and keep the domain wrapper at the existing-calendar/job boundary.
- **[BullMQ terminal conversion loses diagnostic context]** → retain the bounded classification in telemetry and preserve the original failure as the domain error cause; do not expose unbounded details as labels.

## Migration Plan

1. Add the finite classifications, structured classifier, and deterministic matrix tests.
2. Apply classification-driven retry and budget-aware `Retry-After` handling in `IcalFetcher`.
3. Propagate classified fetch outcomes through calendar sync while preserving creation failure storage and public causes.
4. Translate terminal domain failures at the calendar job boundary and add bounded final telemetry.
5. Run the focused retry/job/strategy/persistence/telemetry suites, the dedicated CI proof, server lint, and server build.

The change needs no data migration or coordinated deploy. Rollback is a normal application-code revert; existing rows, queue data, metric series, and API clients remain compatible.

## Open Questions

None for apply. Any newly observed transport category remains terminal until a separate evidence-backed change adds it to the finite transient set.
