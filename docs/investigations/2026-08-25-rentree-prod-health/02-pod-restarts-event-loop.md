# 02 — API pods restart during long calendar sync work

## Symptom

All three API replicas are repeatedly restarted. Immediately before termination, health
checks time out even though PostgreSQL latency and memory usage do not indicate a database
or OOM incident.

## Evidence

- At 2026-08-25 18:15 UTC the API pods had 15, 31 and 25 restarts (71 total). Kubernetes
  metrics recorded 11 restarts in the preceding 24 hours.
- Each latest termination reports reason `Error`, exit code 137. Peak container working
  set was 429,817,856 bytes (about 410 MiB), well below the 768 MiB memory limit; Kubernetes
  did not report `OOMKilled`.
- The final matching line in every previous-container log was
  `Health Check has failed!` with a database check timeout after 1,000 ms.
- Recent Kubernetes events report readiness `context deadline exceeded`. Readiness has a
  one-second timeout; liveness has a 30-second timeout.
- `max(max_over_time(nodejs_eventloop_delay_max_seconds[24h]))` was 157.303 seconds.
- In 24 hours, `POST /calendars/sync` handled 7,686 successful HTTP responses, averaged
  3.05 seconds and reached the 10-second p95 histogram boundary. `POST /calendars`
  averaged 3.29 seconds, with 656 HTTP 201 and 436 HTTP 400 responses.
- Tempo retained `/calendars/sync` examples lasting approximately 60 seconds and
  150.3 seconds. The 150.3-second controller operation contained many failed outbound
  GET/TCP/TLS spans at approximately 10 seconds, matching `IcalFetcher`'s timeout.
- In deployed code, calendars are selected with `school` and full `content` relations,
  whose event JSON is transformed through `plainToInstance`. Up to ten calendars are
  synced concurrently. School strategies with retries can issue as many as 15 sequential
  ten-second attempts.
- Earlier database span analysis placed client-operation p95 near 18 ms with a pool size
  of five and no pending work. The health check's database timeout is therefore a victim
  of event-loop unavailability, not evidence that PostgreSQL is slow.
- The same 24-hour spanmetrics window records 70 error spans from Firestore `Listen`.
  `/contact` returned 12 HTTP 500 responses out of 19 attempts.

## Root cause and open hypotheses

**High-confidence contributor:** upstream timeout/retry amplification inside a batch sync
request. A single failing calendar strategy can occupy 150 seconds (15 × 10 seconds), and
a user request may select multiple calendars at concurrency ten. The retained trace
directly shows long controller work plus repeated ten-second network failures.

**Likely contributor requiring profiling:** selection hydrates full event JSON and
`class-transformer` instances before deciding/syncing. Large calendars or many tokens can
create CPU and garbage-collection bursts that block health checks. The 157-second event
loop maximum proves blocking, but metrics alone cannot apportion CPU transformation,
change detection and network callback pressure.

**Instrumentation defect:** in the retained 150-second trace, the HTTP server span ended
around 33.8 seconds while controller work continued to 150.3 seconds. This agrees with
“Cannot execute the operation on ended Span” warnings and means span-parent timing cannot
yet be treated as fully correct.

**Secondary issues:** Firestore listener errors and `/contact` failures are real but do
not explain the dominant sync-shaped long traces. They should not be allowed to disappear
inside the restart fix.

## Impact

- Requests routed to a stalled pod exceed readiness timeouts; repeated liveness failures
  kill and replace the process, interrupting unrelated requests.
- Restart storms reduce effective capacity exactly while rentrée creation/sync traffic is
  climbing.
- Users may receive stale data, retries or failed calendar creation. Contact submissions
  fail for a majority of recent attempts.
- Deploying the new background fan-out before bounding this path could transfer the same
  failure mode from user-triggered batches to continuous queue load.

## Potential solutions

1. **Profile one representative long sync and remove unbounded request work.** Measure CPU,
   heap/GC, selected-calendar count and event count; select IDs/metadata first; move each
   due calendar to independently bounded queue work; end/cancel child work with the HTTP
   request. Best root-cause outcome, but requires disciplined load tests and trace repair.
2. **Bound retries, concurrency and request deadline.** Replace 15 fixed retries with a
   small, jittered policy and per-domain circuit/concurrency limits; ensure the aggregate
   deadline is shorter than proxy/client limits. Fast risk reduction, with a trade-off of
   fewer chances against flaky ADE servers.
3. **Avoid hydrating content during eligibility selection.** Query only IDs and sync
   metadata, then fetch content for a single calendar when change detection needs it.
   Reduces CPU/memory amplification but needs repository and regression-test changes.
4. **Adjust probes only after work is bounded.** A less brittle readiness timeout may
   reduce false negatives, but relaxing liveness alone hides blocked processes and delays
   recovery.
5. **Investigate secondary errors separately.** Repair `/contact`; confirm whether
   Firestore `Listen` errors/recreated spans leak resources. These improve reliability and
   noise but are not substitutes for sync-path profiling.

Follow-ups: [TIM-188](/TIM/issues/TIM-188) and [TIM-194](/TIM/issues/TIM-194).

