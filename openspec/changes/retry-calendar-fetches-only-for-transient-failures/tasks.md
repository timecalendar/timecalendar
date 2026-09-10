## 1. Failure classification contract

- [ ] 1.1 Add a server-owned calendar fetch failure type and closed classification/disposition unions that preserve the original cause; verify the types expose no message-matching or user-controlled metric values.
- [ ] 1.2 Implement one pure structured classifier for Axios HTTP status/headers, Node/Axios error codes, parser results, authentication payloads, and known timetable UI URL shapes; add a table-driven unit test enumerating timeout, connection reset, 429, 502/503/504, UI link, invalid URL, no events, invalid iCalendar, authentication, TLS/certificate, permanent DNS, other 4xx, other status, and unknown cases.

## 2. Budget-aware fetch retries

- [ ] 2.1 Refactor `IcalFetcher` to retry only classifier-approved transient failures while preserving cancellation, proxy/auth configuration, one attempt for normal sources, two attempts for retry-enabled sources, seven seconds per attempt, and one nine-second absolute budget; verify every matrix case asserts its exact attempt count.
- [ ] 2.2 Add cancellable `Retry-After` parsing/waiting for HTTP 429 delta-seconds and HTTP-date values, with missing/malformed values adding no delay and valid delays allowed only when a next attempt can start before the absolute deadline; verify fake-timer boundary tests cover fitting, past, equal-to-budget, over-budget, malformed, and cancellation cases.
- [ ] 2.3 Preserve the existing basic-auth `CustomError` surface and prove authentication, invalid/no-event content, TLS, permanent DNS, non-429 4xx, and unclassified failures never reach a second upstream attempt.

## 3. Calendar-sync and job propagation

- [ ] 3.1 Carry the fetch classification through `CalendarSyncService` as an explicit typed existing-calendar failure while preserving abort handling, persisted sync claims, empty/post-filter no-event failure behavior, and original public errors for creation; verify service tests cover terminal, transient, empty, and cancellation paths.
- [ ] 3.2 Keep new-calendar failure persistence unchanged: store the submitted full source URL and serialized original error under the accepted `calendar_failure` policy; verify the repository/service regression asserts exact full-URL storage without putting that URL in telemetry fixtures or labels.
- [ ] 3.3 Update `SyncCalendarJob` to translate only typed terminal calendar failures to BullMQ `UnrecoverableError`, while propagating transient and unrelated operational errors unchanged; verify job tests prove one terminal execution, retained transient retryability, and no error-message matching.
- [ ] 3.4 Confirm `syncCalendarJobOptions` remains three attempts with the existing exponential backoff and that the persisted minimum-sync claim still prevents duplicate upstream requests during any retry; run the focused fan-out/job and calendar-sync service regressions.

## 4. Bounded telemetry

- [ ] 4.1 Extend `CalendarSyncMetricsService` with exactly one final fetch-outcome record using closed classification and disposition labels while retaining the existing actual-attempt counter; verify success, transient exhaustion, terminal failure, and cancellation are each recorded once.
- [ ] 4.2 Add a cardinality/privacy test proving attempt/final telemetry never contains a raw URL or host, response content, exception message, `Retry-After` value, or arbitrary transport/status code.

## 5. Regression and documentation checks

- [ ] 5.1 Run focused fetch-service and school-strategy tests for proxy-enabled retry schools, generic/school URL-renamer inheritance, and minimum-sync intervals; add only the assertions needed to pin unchanged behavior.
- [ ] 5.2 Review `docs/mobile/architecture-book/calendar.md` against the implemented server contract: if its existing backend summary becomes inaccurate, update only that current-state paragraph and `CHANGELOG.md`; otherwise leave Architecture Book rules untouched and record that no documentation delta was required.
- [ ] 5.3 Confirm the diff does not touch `mobile/**`, `app/**`, `openapi/openapi.json`, `mobile/src/api/generated/**`, `server/src/migrations/**`, native/store configuration, `terraform/**`, `k8s/**`, or `.github/workflows/**`.

## 6. Local-green and CI proof

- [ ] 6.1 Add a dedicated calendar retry CI-proof test that drives the real classifier/fetch/sync/job seams and proves a terminal failure has one upstream attempt and one job execution, while transient work never exceeds two upstream attempts or nine seconds and `Retry-After` cannot extend the budget.
- [ ] 6.2 Run the targeted Jest suites for the classifier, `ical-fetcher`, fetch service/strategies, calendar-sync service, job, failure repository, metrics, and the CI-proof test; record the exact commands and passing counts in the PR.
- [ ] 6.3 From `server/`, run `npm run lint` and `npm run build`, inspect any lint rewrites, and confirm the branch remains limited to the approved backend/docs/OpenSpec scope before handoff.
