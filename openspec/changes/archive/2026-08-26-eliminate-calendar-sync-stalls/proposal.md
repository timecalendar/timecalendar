## Why

Production calendar sync is capable of monopolising a Node.js pod for minutes: the observed event-loop delay reached 157 seconds, `POST /calendars/sync` p95 exceeds 10 seconds, and otherwise healthy pods are repeatedly killed after health checks time out. The current code can explain those signatures: retry-enabled iCal sources perform fifteen serial 10-second attempts, the user request path starts every due calendar with an unbounded `Promise.all`, and it eagerly hydrates full event JSON before any fetch begins.

This is urgent at rentrée volume. The React Native client gives the request 15 seconds, but a closed client connection does not currently stop its calendar work; downstream spans can therefore continue after the HTTP server span has ended and compete with probes and newer requests.

## What Changes

- Capture an anonymised trace exemplar and a reproducible CPU profile before changing the path, then retain a production-safe load fixture as the performance regression proof.
- Put a single deadline and cancellation signal around `POST /calendars/sync`, propagate it through calendar sync and Axios, and settle all started work before the controller returns. A disconnected or timed-out request stops retries and does not launch queued calendars.
- Replace the request path's unbounded `Promise.all` with a small, explicit concurrency bound. Failures remain isolated and the response still returns last-known calendar content.
- Give `IcalFetcher` a bounded attempt policy and an absolute elapsed-time budget. The 401/basic-auth behaviour and school URL transformations do not change.
- Select due calendars without joining `calendar.content`; old content remains loaded only inside the existing locked persistence transaction, while the final public response still hydrates the requested calendars as required by the unchanged API.
- Use the profile to remove confirmed synchronous hot spots in event change detection while preserving its UID/content-fallback semantics, with large-calendar parity and complexity regression tests.
- Add bounded-cardinality phase, attempt, cancellation, in-flight, and duration telemetry; give each process a stable OTel service-instance identity so counters from three replicas no longer collide. Record the evidence and before/after query recipes without calendar tokens, URLs, or event data.
- Keep Kubernetes probe values unchanged in this change. Any probe adjustment requires separate evidence and review because `k8s/` is a sensitive deploy surface; longer tolerances must not mask application stalls.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `server-calendar-sync-policy`: strengthen the existing concurrency requirement into a bounded request-lifetime contract, define cancellation and retry budgets, prohibit content hydration during candidate selection, and require measurable sync-path health.

## Impact

- **Server modules:** `calendar-sync` controller/services/metrics/constants/tests, `fetch/fetchers/ical-fetcher`, `calendar/repositories/calendar.repository`, change-detection helpers/tests, and OTel resource configuration.
- **Documentation:** the production-health investigation and the Architecture Book's calendar sync guidance gain the profile, operational queries, and durable request-budget contract.
- **API contract:** no request or response shape change; `openapi/openapi.json` and generated clients are untouched.
- **Data/schema:** no migration and no stored-data change.
- **Dependencies:** no dependency major bump is planned; prefer a local bounded-worker helper over adding a concurrency package.
- **Sensitive surfaces:** none. In particular, no `k8s/`, workflow, Terraform, native/store configuration, OpenAPI, migration, or legacy Flutter change is included.
- **Operations:** deploying current `main`, changing school URL semantics, and post-deploy probe tuning remain out of scope. Production comparison is a rollout acceptance check, not permission for this PR to deploy itself.
