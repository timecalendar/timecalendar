## 1. Baseline evidence and reproducible load

- [x] 1.1 Read the observability runbook referenced by the production-health investigation, query Tempo for representative long `POST /calendars/sync` traces, and record a redacted attempt/span timeline that explains the ~150-second controller and child work after HTTP span end; verify the note contains no token, query-bearing URL, credential, or event payload.
- [x] 1.2 Add a deterministic server load/profile fixture using synthetic calendars and event arrays at documented representative sizes, including more due calendars than the proposed worker bound and unstable-UID change detection; make it report request p50/p95, peak upstream concurrency, maximum event-loop delay, and unfinished operations.
- [x] 1.3 Run the unchanged implementation with `node --cpu-prof` and the load fixture, retain a reviewable redacted profile/summary under `docs/investigations/2026-08-25-rentree-prod-health/`, and identify whether JSON hydration and/or change detection meet the design's optimisation gate.

## 2. Request lifetime, retry, and concurrency bounds

- [x] 2.1 Add named constants for the 10-second batch work deadline, concurrency three, seven-second attempt timeout, two retry-enabled attempts, and nine-second fetch budget; cover their ordering invariant (fetch budget < batch budget < mobile timeout) in a focused unit test.
- [x] 2.2 Extend the fetcher/strategy call contract with an optional cancellation context and thread one `AbortSignal` from `CalendarSyncController` through `CalendarSyncAllService`, `CalendarSyncService`, `FetchService`, school strategies, and `IcalFetcher`, cleaning the controller timer/socket listener in `finally`.
- [x] 2.3 Make cancellation bypass the existing upstream-error persistence path: check before opening the content transaction, do not update `lastUpdatedAt`/`syncPlannedAt` for an aborted fetch, and let an already-open transaction settle atomically; add service tests for both sides of that boundary.
- [x] 2.4 Replace the user path's unbounded `Promise.all` with a local cancellation-aware three-worker loop that starts no queued calendar after abort, isolates individual failures, awaits every started promise, and preserves oldest-due-first order; add tests that deterministically assert peak concurrency and zero work after completion.
- [x] 2.5 Rework `IcalFetcher` to one normal attempt or two retry-enabled attempts within the shared nine-second budget, pass the signal to Axios, cap each attempt at the lesser of seven seconds and remaining budget, and short-circuit cancellation/401; add fake-timer/MSW tests for success on retry, hard timeout, parent cancellation, and unchanged basic-auth errors.
- [x] 2.6 Add a controller lifecycle regression test proving a deadline or simulated connection close aborts Axios work, ends all child spans before the controller operation settles, and still returns last-known content when a response can be sent.

## 3. Remove unnecessary hydration and confirmed CPU stalls

- [x] 3.1 Replace `findDueForSyncWithContent` with a metadata-only due-calendar query that retains the school relation but never joins `CalendarContent`; add a repository query-shape regression test (including a large JSON row) and update service tests/callers.
- [x] 3.2 Prove successful metadata-only candidates still load prior content exactly once inside `saveWithTransaction`, preserve the pessimistic lock, emit the same `CalendarLog`, and leave `findByTokensWithContent` as the unchanged response hydration path.
- [x] 3.3 If task 1.3 confirms change detection as a material CPU hot spot, replace repeated UID/content `.find` scans with duplicate-safe indexes and run parity tests across unchanged, changed, removed, past, duplicate-content, and unstable-UID cases; otherwise record the negative profile finding and leave this code unchanged.
- [x] 3.4 Add a large-calendar complexity regression test for the profile-confirmed path that fails the previous quadratic implementation without relying on a flaky wall-clock threshold (for example, instrumented comparison counts), then rerun the CPU profile to show the hot frame is removed.

## 4. Trace and metric lifecycle

- [x] 4.1 Extend `CalendarSyncMetricsService` with bounded-cardinality batch/phase durations, selected-started-completed counts, active upstream work, attempt count, and `success|partial_deadline|client_cancelled|error` outcomes; unit-test every outcome and assert no user-controlled value is used as a label.
- [x] 4.2 Add awaited active spans for candidate selection, per-calendar work, diff/persist, and response hydration, ending each in `finally`; use an in-memory exporter test to prove no child span ends after its controller/batch parent on success, deadline, or disconnect.
- [x] 4.3 Add `service.instance.id` from the runtime hostname to the OTel resource and verify in a tracer configuration test that two process identities produce distinct resource attributes, making counter-reset aggregation valid across replicas.

## 5. Performance and regression verification

- [x] 5.1 Run the post-change synthetic load/profile with the same fixture and parameters as task 1, record the before/after CPU frames, p50/p95, peak concurrency, unfinished work, and event-loop maximum, and require response p95 below 15 seconds plus a lower event-loop maximum than baseline.
- [x] 5.2 Add a CI proof test that exercises more than three due calendars with never-settling/retrying upstreams and large stored content; it MUST fail the old unbounded/15-attempt/content-hydrating implementation and pass only when concurrency, cancellation, attempt, query-shape, and no-detached-work invariants hold.
- [x] 5.3 Run local-green verification from `server/`: TypeScript build/typecheck, ESLint for touched sources, and the targeted calendar-sync, calendar repository, change-detection, fetcher, metrics, tracing, and CI-proof suites; record exact commands and results in the investigation evidence.

## 6. Durable guidance and rollout proof

- [x] 6.1 Update `docs/mobile/architecture-book/calendar.md` with the current server-side sync budget, cancellation, concurrency, last-known-content, and metadata-only selection contract; link to the OpenSpec capability instead of duplicating implementation detail.
- [x] 6.2 Complete the production-health investigation entry with the root-cause explanation, redacted baseline/fixed evidence, metric names, and copy-paste Tempo/PromQL queries for endpoint p95, event-loop delay, pod restarts, attempt amplification, cancellations, and per-instance counter validity.
- [x] 6.3 Add a rollout acceptance checklist owned by the deployment follow-up: after the code is deployed through the existing platform process, compare a traffic-normalised 24-hour window against baseline and require lower sync p95/event-loop delay/restart rate with no material school success-rate regression; explicitly state that this PR neither deploys nor changes probes.
- [x] 6.4 Confirm the final diff does not touch `openapi/openapi.json`, generated clients, migrations, `k8s/`, Terraform, workflows, native/store config, or legacy Flutter; if implementation discovers any such need, stop and flag the sensitive-surface expansion before applying it.
