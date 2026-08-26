# Calendar sync event-loop profile

## Privacy boundary

This evidence contains only aggregate timings, span names/counts, and synthetic event
data. It contains no calendar token, query-bearing URL, credential, trace identifier,
resource identifier, or event payload. Production access was read-only.

## Production trace baseline (2026-08-26 UTC)

Tempo was queried through the in-cluster read-only service using this TraceQL shape:

```traceql
{ resource.service.name = "timecalendar" && name = "POST /calendars/sync" && duration > 30s }
```

One representative retained request had this redacted timeline (times are relative to
the root HTTP span):

| Work                                   |   Start |       End | Observation                                             |
| -------------------------------------- | ------: | --------: | ------------------------------------------------------- |
| HTTP `POST /calendars/sync`            | 0.000 s |  60.001 s | Client/proxy lifecycle ended                            |
| `CalendarSyncController.syncCalendars` | 0.001 s | 150.315 s | Controller promise kept running                         |
| Two retry-enabled outbound chains      | 0.023 s | 150.071 s | 30 GET attempts, each approximately 10 s                |
| Last database child                    |       — | 150.162 s | Response hydration/persistence continued after HTTP end |

There were 106 spans ending after the HTTP span, including 20 GET, 20 TLS, 21 TCP,
and 12 database spans. The paired GET attempts start at roughly ten-second intervals
and total 15 attempts per calendar. This explains the approximately 150-second
controller spans exactly: retry-enabled `IcalFetcher` sources perform 15 serial
10-second attempts, while the user batch starts multiple calendars concurrently. The
HTTP/socket span can end at 60 seconds without cancelling Axios, so its controller and
children continue in the ended trace context.

## Reproducible synthetic baseline

The fixture uses eight calendars (more than the proposed worker limit of three), 1,500
events per calendar, seven request samples, and content-identical events with unstable
UIDs. It deliberately exercises eager JSON parsing/class transformation and the
content-fallback change detector without using production data.

Run from `server/`:

```sh
npm run build
node --cpu-prof --cpu-prof-dir <scratch-dir> dist/scripts/profile-calendar-sync.js baseline
```

Baseline result (Node 24.13.0, local workspace):

|      p50 |        p95 | Peak upstream | Max event-loop delay | Unfinished at return |
| -------: | ---------: | ------------: | -------------------: | -------------------: |
| 793.3 ms | 1,428.8 ms |             8 |           1,425.0 ms |                    0 |

The reviewable CPU summary aggregates V8 hit counts by source frame (absolute workspace
paths and the raw profile are intentionally not retained):

| Frame                                           | Hit count |
| ----------------------------------------------- | --------: |
| `find-new-events` scan callback                 |     2,277 |
| `find-removed-and-changed-events` scan callback |     1,673 |
| `detect-bad-ical-implementation` scan callback  |       691 |
| `class-transformer` transform                   |       228 |
| V8 garbage collector                            |       115 |

The raw synthetic-only `.cpuprofile` was generated in the run-owned scratch directory;
the command, fixture dimensions, aggregate results, and top frames above are sufficient
to reproduce and review the finding without retaining machine-specific absolute paths.

## Optimisation gate

The gate is met for both proposed optimisations. Change-detection scans account for the
three hottest application frames and produce 1.425 seconds of event-loop delay in this
fixture. Class transformation is also visible, but materially smaller; production code
confirms it is paid for every selected calendar before fetch. The implementation will
therefore index change detection and remove candidate content hydration.

## Fixed synthetic profile

The identical fixture and Node version were rerun with three workers, metadata-only
selection, and indexed UID/content matching:

| Mode     |      p50 |        p95 | Peak upstream | Max event-loop delay | Unfinished at return |
| -------- | -------: | ---------: | ------------: | -------------------: | -------------------: |
| Baseline | 793.3 ms | 1,428.8 ms |             8 |           1,425.0 ms |                    0 |
| Fixed    |  92.4 ms |   133.0 ms |             3 |              76.6 ms |                    0 |

The fixed p95 is 91% lower and remains far below the 15-second mobile timeout. Maximum
event-loop delay is 95% lower. The previous scan callbacks no longer dominate: the top
application frames are now `eventComparisonKey` (241 samples) and `buildEventIndex`
(132), while the old new-event, removed/changed, and bad-iCal callbacks fall to 41, 41,
and 27 samples respectively.

## Local verification

Run from `server/` on Node 24.13.0:

```sh
npm run lint
npm run build
DATABASE_URL=postgres://postgres@localhost:37291/timecalendar_tim188 npm test -- --runInBand modules/calendar-sync/calendar-sync.constants.test.ts modules/calendar-sync/controllers/calendar-sync-lifecycle.test.ts modules/calendar-sync/controllers/calendar-sync.controller.test.ts modules/calendar-sync/services/calendar-sync-workers.test.ts modules/calendar-sync/services/calendar-sync-metrics.service.test.ts modules/calendar-sync/services/calendar-sync-all.service.test.ts modules/calendar-sync/services/calendar-sync.service.test.ts modules/calendar-sync/calendar-sync-tracing.test.ts modules/calendar-sync/calendar-sync-ci-proof.test.ts modules/calendar/repositories/calendar.repository.test.ts modules/calendar/repositories/calendar-content.repository.unit.test.ts modules/calendar-log/models/change-detection/find-event-changes.test.ts modules/fetch/fetchers/ical-fetcher.test.ts config/observability/tracer.test.ts
```

Results: ESLint and Nest build passed; 14 targeted suites passed (84 tests). The local
database name is intentionally issue-specific because another worktree was running Jest
against the shared default worker database at the same time.

## Telemetry and rollout queries

Use a comparable 24-hour window and retain the production environment selector. The
collector's Prometheus conversion uses underscore-form resource labels.

Endpoint p95 (milliseconds):

```promql
histogram_quantile(0.95, sum by (le) (rate(traces_spanmetrics_duration_milliseconds_bucket{service_name="timecalendar",deployment_environment_name="production",span_name="POST /calendars/sync",span_kind="SPAN_KIND_SERVER"}[24h])))
```

Maximum event-loop delay and restart rate:

```promql
max(max_over_time(nodejs_eventloop_delay_max_seconds{service_name="timecalendar",deployment_environment_name="production"}[24h]))
sum(increase(kube_pod_container_status_restarts_total{namespace="timecalendar-production",container="timecalendar"}[24h]))
```

Attempt amplification and cancellations:

```promql
sum(increase(calendar_sync_upstream_attempt_total{deployment_environment_name="production"}[24h])) / sum(increase(calendar_sync_batch_calendars_sum{deployment_environment_name="production",state="completed"}[24h]))
sum by (outcome) (increase(calendar_sync_batch_outcome_total{deployment_environment_name="production",outcome=~"partial_deadline|client_cancelled"}[24h]))
```

Per-instance counter validity and school success rate:

```promql
sum by (service_instance_id) (increase(calendar_sync_batch_outcome_total{deployment_environment_name="production"}[24h]))
sum by (school) (rate(calendar_sync_total{deployment_environment_name="production",status="success"}[24h])) / sum by (school) (rate(calendar_sync_total{deployment_environment_name="production"}[24h]))
```

Tempo lifecycle check:

```traceql
{ resource.service.name = "timecalendar" && name = "POST /calendars/sync" && duration > 15s }
```

Inspect child timing and require no `calendar_sync.*` child ending after its
`calendar_sync.batch` parent. Do not retain trace attributes containing private URLs.

## Deployment follow-up acceptance checklist

This PR neither deploys code nor changes Kubernetes probes. After deployment through the
existing reviewed platform process, the rollout owner must:

- compare traffic-normalised baseline and fixed 24-hour windows;
- require lower endpoint p95, maximum event-loop delay, and restart rate;
- require attempt amplification at or below two and cancellation outcomes consistent
  with the ten-second work budget;
- require no material per-school sync success-rate regression;
- confirm each live replica has a distinct `service_instance_id` series;
- open a separate sensitive-surface proposal if probe changes are still justified.
