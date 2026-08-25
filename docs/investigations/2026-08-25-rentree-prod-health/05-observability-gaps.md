# 05 — Observability and paging gaps hide production failures

## Symptom

The stack exposes useful Kubernetes, runtime and trace-derived metrics, but the signals
needed to operate TimeCalendar are either numerically wrong, missing key dimensions,
absent from the log backend, or prevented from notifying anyone.

## Evidence

- `sum(increase(calendar_sync_total[24h]))` reported about 3.18 million syncs. In the same
  moving window, trace-derived outbound HTTP GET spans totalled about 38,600. The custom
  counter is not a credible activity total.
- App metric series from three replicas have no pod/host discriminator. Replica counters
  collide into one VictoriaMetrics series, so resets are interpreted as increases.
- Outbound GET spanmetrics grouped only as `peer_service="none"`: approximately 30,700
  unset/success-status spans and 7,900 error spans in 24 hours. The error share is visible,
  but no metric can attribute it to AMU, Tours or another provider.
- VictoriaLogs returned no `timecalendar` production stream hits over 24 hours. The server
  does not export application logs via OTLP, leaving `kubectl logs` as the only source.
- The custom queue/job metrics and structured job-run lines on `main` are not present in
  production because the newer image is not deployed.
- Tempo caught long/error traces, but one retained sync trace had controller children
  continuing long after the HTTP server span ended. Firestore instrumentation also emits
  “Cannot execute the operation on ended Span,” reducing timing trust.
- `platform/terraform/envs/observability/timecalendar.tf` defines TimeCalendar dashboards
  and rules. `contacts.tf` explicitly creates an all-time mute and attaches it to the
  catch-all Grafana notification route, so alert evaluation cannot deliver a notification.

## Root cause

1. The collector deliberately removes high-cardinality resource attributes from
   spanmetrics, but the application counter also lacks a replica identity. Multiple
   monotonic producers therefore violate the single-series counter assumption.
2. HTTP client instrumentation does not populate a sanitized `peer.service`/domain
   dimension, while the domain label exists only on the unusable custom counter.
3. The server exports traces and metrics but has no OTLP log transport.
4. Async instrumentation, especially around Firestore and request lifecycle, permits work
   to end or mutate spans after their parent has ended.
5. The platform alert mute is intentional technical debt (documented as `CHA-180`) but has
   no time bound or rentrée exception.

## Impact

- Operators cannot state trustworthy sync rates or per-school error rates from dashboards.
- Incident diagnosis requires production shell access and ad hoc SQL instead of a stable
  dashboard/log workflow.
- Application errors such as health failures and ended-span warnings are invisible to
  VictoriaLogs and cannot pivot cleanly from traces.
- Existing alerts provided no warning for restart growth, creation failures, stale
  deployment or missing logs during rentrée.

## Potential solutions

1. **Repair metric producer identity with bounded cardinality.** Preserve a pod/instance
   resource attribute for app-defined counters, or emit/aggregate through a design where
   each replica has a distinct time series. Do not globally add high-cardinality labels to
   all spanmetrics.
2. **Add a sanitized bounded upstream dimension.** Set normalized hostname/domain on
   outbound calendar spans or a corrected counter; strip query strings, tokens and
   credentials. This enables per-school RED views but needs an allowlist/cardinality cap.
3. **Export structured application logs over OTLP.** Include severity, service, environment,
   pod and trace correlation; explicitly redact URLs, contact content and user identity.
   This improves incident response but adds transport/dependency and ingestion volume.
4. **Fix async span lifecycle and add trace assertions.** Ensure work is awaited or
   detached into a new trace before the request span ends; upgrade/patch Firestore
   instrumentation only with a bounded compatibility test.
5. **Remove the all-time mute through a controlled alert test.** Route ticket/page
   severities to named owners, fire a synthetic alert, verify delivery and rollback. This
   is a human-reviewed Terraform operation and should not be coupled to app telemetry code.
6. **Add freshness/deadman signals.** Alert on old production SHA, missing logs/metrics,
   restart acceleration and school creation failure ratios. Alerts only become useful
   after delivery and the underlying metrics are trustworthy.

Follow-ups: [TIM-192](/TIM/issues/TIM-192) and [TIM-193](/TIM/issues/TIM-193).

