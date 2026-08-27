## Context

Production runs three Node.js API replicas. Over the observed rentrée window they accumulated 14, 31, and 25 restarts; memory remained below the 768 MiB limit and database p95 was about 18 ms, while `nodejs_eventloop_delay_max_seconds` reached 157 seconds. `POST /calendars/sync` handles roughly 7.7k calls/day, averages about 3 seconds, and has a p95 above 10 seconds. Long traces include controller spans around 150 seconds and downstream work after the HTTP server span ends.

Four current-code facts line up with that evidence:

1. retry-enabled `IcalFetcher` instances run 15 serial attempts with a 10-second Axios timeout, producing a 150-second worst case without backoff or an outer deadline;
2. the queue refactor removed `pLimit(10)` from `syncAllForUser` and left an unbounded `Promise.all`, despite the existing spec still requiring bounded concurrency;
3. `findDueForSyncWithContent` joins `CalendarContent`, whose JSON transformer materialises every event before the batch starts, although an existing-calendar sync uses only metadata and later reloads prior content under a pessimistic lock;
4. event diffing repeatedly scans arrays and can perform quadratic synchronous work, including a second content-comparison pass for providers with unstable UIDs.

The React Native fetch seam aborts at 15 seconds. Today that closes the client connection but does not reach Axios, so OTel can end the server span at socket close while retry chains and synchronous transforms continue in its context. The proposal must preserve the endpoint schema, last-known-content behaviour, per-school URL semantics, atomic content/log transaction, and background queue contract.

## Goals / Non-Goals

**Goals:**

- establish a reproducible, privacy-safe trace/CPU baseline before optimisation;
- make the user request's upstream work finish or cancel before the client timeout;
- restore an explicit concurrency bound and bound retry amplification;
- remove unnecessary content hydration and confirmed quadratic CPU work;
- make before/after latency, event-loop delay, cancellation, and replica metrics trustworthy;
- keep health probes able to reveal a regression instead of extending them to tolerate it.

**Non-Goals:**

- deploying current `main`, changing the background fan-out schedule, or creating a worker-only deployment;
- changing a school's matching, URL rewriting, credentials, event mapping, or minimum sync interval;
- changing `POST /calendars/sync` request/response types or the mobile cache contract;
- tuning Kubernetes probes in this PR;
- solving unrelated Firestore ended-span noise or every production-health finding.

## Decision 1 — Profile the deployed symptom and a safe local reproduction before editing

The Applier first records one or more existing production Tempo traces for long `POST /calendars/sync` requests: server-span lifetime, Axios child attempt count/timing, and children whose end exceeds the server span. Only trace relationships and bounded attributes are retained. It then creates a deterministic fixture with synthetic events at observed representative sizes and more due calendars than the concurrency bound, runs the current code under `node --cpu-prof` plus event-loop monitoring, and records top frames, p50/p95, maximum event-loop delay, and peak concurrency.

The same fixture and command run after each optimisation. Raw production calendar URLs, tokens, custom auth, and event content never enter the repo. The evidence summary belongs under `docs/investigations/2026-08-25-rentree-prod-health/`, with raw synthetic profiles either checked in when reviewable or attached to the issue and referenced by checksum.

**Why:** a trace proves the 150-second retry lifecycle; a CPU profile distinguishes JSON transformation and diff complexity from merely slow I/O. A single synthetic benchmark without a production trace would not explain the ended-span observation. Profiling a production pod with an inspector or replaying customer payloads is rejected as unsafe.

## Decision 2 — One controller-owned cancellation tree with a 10-second work deadline

`CalendarSyncController` creates an `AbortController` for batch sync, aborting it at 10 seconds or when the Express request closes before completion. The signal is threaded through `CalendarSyncAllService`, `CalendarSyncService`, `FetchService`, the selected strategy, and `IcalFetcher`. Listener and timer cleanup happens in `finally`.

Cancellation is distinct from an upstream failure. `IcalFetcher` immediately rethrows it; `CalendarSyncService` checks the signal after fetch and before starting the persistence transaction, so cancellation does not write failure timestamps or advance `syncPlannedAt`. A transaction already in progress is allowed to settle atomically. `CalendarSyncAllService` waits for every started promise to settle before resolving, but builds the normal response from last-known content for calendars that did not finish.

**Why 10 seconds:** the client aborts at 15 seconds, so this leaves five seconds for the final content query, class transformation, response serialization, and network variance. The exact value is a named constant and the load proof must show response p95 below the client bound. Letting the load balancer/client be the deadline is rejected because it ends the server span without cancelling child work. Moving sync to the queue is rejected because the current client contract requires the response to contain refreshed content.

## Decision 3 — Three request workers, with queued work aware of cancellation

Replace `Promise.all(calendars.map(...))` with a small local bounded-worker helper and `USER_SYNC_CONCURRENCY = 3`. Workers pull the next due calendar only while the signal is live. Individual calendar failures are collected rather than rejecting the batch; all started work is awaited.

**Why three:** it is below the former limit of ten, prevents one user with many tokens from multiplying Axios and diff work across a pod, and still permits parallel I/O within the ten-second budget. The profile/load fixture must expose peak concurrency, making later tuning evidence-driven. Re-adding `p-limit` is unnecessary for this narrow worker loop, and serial execution would unnecessarily reduce the chance that several healthy calendars refresh before the deadline.

## Decision 4 — Two attempts inside one absolute iCal budget

Normal sources retain one attempt. Sources configured with `withRetries` receive at most two attempts, each with a maximum seven-second Axios timeout and both constrained by a nine-second outer budget/cancellation signal. The second attempt receives only the remaining budget. Basic-auth challenges still short-circuit with the current `CustomError`; request cancellation also short-circuits and is never wrapped in `BadRequestException`.

**Why:** fifteen attempts times ten seconds is the exact 150-second trace signature and creates severe amplification during an upstream outage. One seven-second opportunity plus one bounded retry preserves the intent for flaky ADE instances while fitting inside the controller budget. Merely lowering Axios's per-attempt timeout is rejected because attempt multiplication can still outlive the request. Exponential retry inside an interactive request is rejected because the finite request budget is too short; background BullMQ jobs already own their separate exponential job-level retry policy.

## Decision 5 — Candidate selection is metadata-only; response hydration remains separate

Rename `findDueForSyncWithContent` to reflect its metadata-only result and remove the `content` relation from this query, retaining the `school` relation and fields needed by `CalendarSyncService`. No extra hydration query is needed before fetch: on update, `saveWithTransaction` already reads the previous `CalendarContent` row under its pessimistic lock for the atomic diff. `findByTokensWithContent` remains the final response query and preserves the API exactly.

**Why:** this removes full JSON transfer and `plainToInstance` work for candidates that may time out, fail, or never receive a worker slot. Selecting IDs and then reloading the same metadata is rejected as an unnecessary round trip on the user path; the background fan-out already uses its own IDs-only query.

## Decision 6 — Replace confirmed quadratic diff scans with indexed matching, preserving duplicates

If the baseline CPU profile identifies change detection as a material synchronous hot spot, build per-pass indexes: UID maps for normal comparison and composite-content-key buckets for the unstable-UID fallback. Buckets, rather than a single map entry, preserve duplicate events. Past-event filtering, changed-pair order, threshold semantics, and the existing recursive fallback result remain covered by parity tests before the old scans are removed. If profiling does not confirm this hot spot, retain the code and document that result instead of performing speculative refactoring.

**Why:** current `.find` calls inside loops are O(old × new), and the bad-UID path can repeat the comparison. Index construction reduces the confirmed path to approximately O(old + new) without changing the public model. Hashing whole event JSON is rejected because only the existing comparison fields are semantically relevant.

## Decision 7 — Instrument phases with bounded labels and fix replica identity

Extend `CalendarSyncMetricsService` with histograms/counters for batch and phase duration, candidate/started/completed counts, active upstream operations, attempt count, and terminal outcome (`success`, `partial_deadline`, `client_cancelled`, `error`). Labels are fixed enums or existing bounded school/domain values; tokens, raw URLs, messages, trace IDs, and counts never become labels. Manual spans wrap selection, each calendar, diff/persist, and response hydration using awaited `startActiveSpan` callbacks and `finally` end paths.

Add `service.instance.id` from the pod/process hostname to the OTel resource. This prevents three replicas from exporting indistinguishable monotonic counters, the collision already making `calendar_sync_total` rates unusable. Automatic Node runtime metrics remain the source for event-loop delay; no duplicate custom loop monitor is exported in production.

**Why:** phase timings distinguish upstream latency from synchronous CPU and final serialization, and an instance identity is required for valid counter resets. Raw exception messages and calendar identity are rejected for cardinality and privacy reasons.

## Decision 8 — Probe values do not change without post-fix evidence

The existing liveness configuration permits four consecutive 30-second failures. Extending it would only make a 120-second application stall less visible. This change therefore touches no `k8s/` file. The evidence document records current values and a post-deploy query; if healthy fixed pods still miss probes for a reason unrelated to event-loop blocking, a separate sensitive-surface change can propose new values with Reviewer/human routing.

## Risks / Trade-offs

- **[Fewer retries reduce success for unusually flaky providers]** → record attempt outcome by bounded school/domain, compare success rate, and tune only inside the absolute request budget; school URL semantics stay untouched.
- **[Some calendars remain stale when a large batch reaches its deadline]** → return last-known content as today, record `partial_deadline`, and process due calendars oldest-first. A later client request can retry them after the existing sync policy permits.
- **[Abort races with persistence]** → check cancellation before opening the transaction and let any started transaction finish atomically; never interrupt between content and `CalendarLog` writes.
- **[Manual span misuse creates more ended-span errors]** → use awaited active-span callbacks and `finally`, plus an in-memory-exporter lifecycle test covering deadline and disconnect.
- **[Synthetic load differs from production]** → derive only aggregate fixture sizes from production, pair the CPU profile with real trace timing, and require post-deploy PromQL/Tempo verification as rollout acceptance.
- **[Service-instance identity increases series count]** → bounded by pod replicas and is necessary for valid counters; confirm the collector retains the resource label before relying on the query.

## Migration Plan

1. Capture/redact baseline trace and CPU/load evidence.
2. Land request cancellation, bounded workers, iCal budgets, and metadata-only selection with focused tests.
3. Apply the profile-confirmed diff optimisation, if warranted, and rerun parity/profile tests.
4. Add phase telemetry and instance identity; rerun the representative load proof and targeted server suites.
5. Update the Architecture Book and investigation with before/after local evidence plus production query recipes.
6. Merge without changing probes or deploying. The rollout owner deploys through the existing platform process, compares 24-hour p95/event-loop/restart/attempt metrics at comparable traffic, and opens a separate probe change only if evidence warrants it.

Rollback is a normal code revert. There is no schema, API, or data migration; metrics are additive and safe to leave during rollback.

## Open Questions

None for apply. The only conditional branch is evidence-driven: optimise change detection only if it appears materially in the captured CPU profile; otherwise record the negative finding and keep the current semantics/code.
