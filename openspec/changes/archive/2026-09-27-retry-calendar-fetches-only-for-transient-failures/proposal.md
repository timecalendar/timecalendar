## Why

Retry-enabled calendar sources currently repeat every fetch or parse failure, even when the same invalid input, authentication problem, or permanent network failure cannot succeed on a second attempt. Background jobs likewise spend all configured BullMQ attempts on terminal failures, amplifying upstream load and delaying useful work during calendar-sync incidents.

## What Changes

- Classify calendar fetch outcomes with a finite server-owned retry disposition instead of retrying every caught error.
- Retry only timeouts that leave enough total budget, connection resets, HTTP 429 responses whose `Retry-After` permits another attempt inside the budget, and HTTP 502/503/504 responses.
- Treat known timetable UI links, invalid URLs, empty/no-events results, invalid iCalendar, authentication failures, TLS/certificate failures, permanent DNS failures, other HTTP 4xx responses, and unclassified failures as terminal.
- Preserve the existing maximum of two upstream attempts and one nine-second absolute fetch budget, including any `Retry-After` wait.
- Propagate terminal state through an explicit typed calendar-sync error contract and translate it to BullMQ's non-retryable semantics; transient failures retain the existing job retry policy.
- Extend backend telemetry with a bounded final retry-classification value while retaining the existing attempt counter and excluding URLs, response bodies, exception messages, and arbitrary network codes from labels.
- Keep empty calendars as failures, preserve full source URLs in `calendar_failure`, and retain every school strategy's proxy, URL transformation, and minimum-sync behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `server-calendar-sync-policy`: define the retryable and terminal failure matrix, budget-aware `Retry-After` handling, explicit terminal job behavior, and bounded final-classification telemetry.

## Impact

- **Server modules:** iCalendar fetch classification/retry control, fetch and calendar-sync error propagation, the background calendar job boundary, calendar-sync metrics, and focused tests under `server/src/modules/fetch/` and `server/src/modules/calendar-sync/`.
- **API and persisted data:** no request/response contract, OpenAPI, generated-client, schema, or migration change. The accepted `calendar_failure` record shape and full source-URL storage policy remain unchanged.
- **School behavior:** proxy selection, URL renamers, event transforms, and minimum-sync intervals remain unchanged.
- **Dependencies:** use BullMQ's installed terminal-error semantics; no dependency change is planned.
- **Sensitive surfaces:** none. `openapi/openapi.json`, generated clients, migrations, native/store configuration, deployment/CI files, and legacy Flutter remain untouched.
