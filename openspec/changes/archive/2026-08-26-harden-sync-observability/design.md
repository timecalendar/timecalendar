## Context

`server/src/config/observability/tracer.ts` starts one OpenTelemetry `NodeSDK` and
exports traces and metrics over OTLP/gRPC. Its resource identifies the service and
environment but not the process/pod. VictoriaMetrics therefore sees cumulative
`calendar_sync_total`, queue, and push counters from every replica under the same
label set; a restart or a second pod looks like a reset of one series.

Calendar sync currently labels metrics with `new URL(url).hostname`. The URL can be
provided by a user, so the earlier assertion that provider count bounds this label is
false. The HTTP client instrumentation also does not guarantee the `peer_service`
dimension expected by the dashboard. Nest logs stay on stdout and do not enter the
collector's OTLP logs pipeline. Finally, the lockfile contains a 0.218 SDK/exporter
cohort alongside 0.219 instrumentations pulled by
`@opentelemetry/auto-instrumentations-node@0.77.0`; traces also include low-value
Express middleware layer spans whose end times can obscure the HTTP request boundary.

The shared collector already accepts OTLP logs and applies platform-side generic
processing. This change must fix application-owned signal shape before export. It must
not change global collector cardinality behavior, and it must not put a secret,
calendar URL/token, user identifier, email address, request body, or event content in
telemetry.

## Goals / Non-Goals

**Goals:**

- Make application counters distinguishable per running pod without any
  request-derived identity label.
- Make upstream dimensions finite, sanitized, and shared by sync metrics and client
  spans.
- Export useful Nest logs with trace correlation and application-side privacy
  scrubbing.
- Make HTTP trace topology truthful and retain enough sync detail to diagnose long
  requests.
- Commit deterministic tests and preproduction VictoriaMetrics, VictoriaLogs, and
  Tempo proof queries.

**Non-Goals:**

- Mobile/Flutter telemetry, analytics, SLO alerts, or recording rules.
- A global collector processor, cardinality limit, datasource, or dashboard-platform
  change.
- Logging request/response bodies, headers, calendar URLs, tokens, event data, or raw
  error objects.
- OpenAPI, persistence, queue semantics, sync scheduling, or user-visible behavior.

## Decision 1 — Use the Kubernetes runtime hostname as service instance identity

Add `service.instance.id` to the shared SDK resource. A pure resolver accepts only a
non-empty `HOSTNAME` matching a conservative `[A-Za-z0-9._-]` character set and length
limit; otherwise it emits the constant `unknown`. Kubernetes already sets `HOSTNAME`
to the pod name, so this needs no Helm or Downward API change. The attribute is a
resource dimension shared by traces, metrics, and logs and becomes
`service_instance_id` in VictoriaMetrics.

This identity is bounded by process/pod churn, not by requests or calendars. It keeps
concurrent cumulative streams separate and makes per-pod `rate(...)` meaningful.
Dashboards aggregate with `sum without (service_instance_id)` only after calculating a
per-series rate; they never sum raw cumulative values first.

Alternatives rejected:

- A random UUID or process-start timestamp creates a new series on every process
  restart and cannot correlate with Kubernetes.
- A hash bucket has fixed cardinality but permits counter collisions and cannot answer
  per-pod volume.
- A collector-side global policy is outside TimeCalendar's ownership and unnecessary
  because Kubernetes already supplies the instance name to the process.

## Decision 2 — Classify upstreams through one finite allowlist

Introduce a pure `classifyUpstreamDomain` seam. It parses a URL/host without retaining
userinfo, path, query, fragment, or port; lowercases and trims the hostname; then
matches only reviewed exact domains or dot-boundary suffixes from a source-controlled
allowlist. The initial allowlist is derived from the registered university strategies
(`ensea.fr`, `esiee.fr`, `grenet.fr`, `u-bourgogne.fr`, `u-pec.fr`, and the current
`univ-*` provider domains). Values outside that list become `custom`; malformed or
non-HTTP(S) inputs become `invalid`. Loopback/private/link-local hosts are never
reported verbatim.

`calendar_sync_total{domain=...}` uses this classifier instead of raw `URL.hostname`.
The HTTP instrumentation's outgoing-request hook applies the same value as
`peer.service` and `upstream.domain`; therefore the spanmetrics/dashboard dimension
exists even when the HTTP library does not infer it. Only the finite classifier output
is attached—never `url.full`, query parameters, headers, or a raw host. Tests pin the
complete output vocabulary and dot-boundary behavior so adding a provider requires an
explicit reviewed code change.

Alternatives rejected:

- eTLD+1 normalization is sanitized but remains unbounded for arbitrary custom iCal
  URLs.
- Using only the school code cannot describe shared upstream outages and is absent for
  custom imports.
- Collector-side top-N/drop rules lose determinism and would change every tenant.

## Decision 3 — Make one Nest logger seam sanitize before console and OTLP

Create an application logger that implements Nest's `LoggerService`, keeps the normal
console behavior, and emits through `@opentelemetry/api-logs`. Register it with the
Nest application so existing `new Logger(Context)` call sites flow through the same
seam without a broad call-site rewrite. Map Nest levels to OTel severities and let the
logs API attach the active trace/span context.

Before either console or OTLP emission, a pure bounded sanitizer converts inputs to
safe scalar text and applies these rules recursively with depth, item-count, and
length limits:

- replace every absolute URL with a token that contains at most the finite upstream
  classifier value;
- redact bearer/basic credentials, authorization/cookie-like fields, calendar tokens,
  UUIDs/long opaque identifiers, and email addresses;
- allowlist structured attributes (`context`, `error.type`, queue/job enum names,
  service/environment/instance identity, trace/span identifiers) and drop unknown
  object keys instead of serializing request bodies or domain objects;
- emit a bounded error class plus sanitized message; never export raw stacks or nested
  error payloads by default.

Configure an OTLP/gRPC log exporter and `BatchLogRecordProcessor` on the existing
`NodeSDK`, using the same `OTEL_ENABLED` and `OTEL_EXPORTER_URL`. When telemetry is
disabled, logging remains console-only and does not create exporter traffic. The SDK
is shut down on application termination so buffered logs/spans/metrics flush within a
bounded grace period.

Alternatives rejected:

- Scrubbing only in the collector lets sensitive values cross the application/network
  boundary and makes local logs diverge from exported logs.
- Winston/Pino would add a second logging framework and force a larger call-site
  migration; Nest already provides the required global seam.
- Exporting arbitrary logger argument objects is convenient but cannot uphold the PII
  contract.

## Decision 4 — Align the OTel cohort and remove misleading layer spans

Declare every directly imported OpenTelemetry package and align the SDK, exporters,
resources, logging SDK/API, and auto-instrumentation-compatible experimental packages
to one 0.219/2.8 cohort. Regenerate the lockfile and prove with `npm ls` that no 0.218
SDK/exporter cohort remains. This is a minor compatibility alignment, not a major
dependency upgrade.

Disable `@opentelemetry/instrumentation-express` layer spans. Keep the Node HTTP server
span, Nest controller spans, outgoing HTTP spans, database spans, BullMQ spans, and
runtime metrics. Add one explicit awaited `calendar.sync` active span around the
existing `CalendarSyncService.sync` operation; it carries only bounded `action`,
`school`, and classified `upstream.domain` attributes, records a bounded error type,
and ends in `finally` after all awaited fetch/database/subject work completes.

This removes compression/router middleware spans that add little causal value and can
appear to extend past the server response boundary. It does not paper over detached
application work: a regression test captures an HTTP sync trace with an in-memory span
exporter and asserts that every descendant end time is less than or equal to the HTTP
server span end time. The test also asserts that the sync span contains the upstream
client and database work. Any future genuinely detached task must start a new root or
linked producer/consumer trace rather than remain an HTTP child.

Alternatives rejected:

- Replacing the auto-instrumented HTTP server span with a custom interceptor duplicates
  propagation, status, and route semantics.
- Merely hiding the bad spans in Grafana leaves invalid telemetry in Tempo.
- A dependency bump without a topology regression test cannot prove the reported
  symptom is fixed.

## Decision 5 — Keep operational proof in this repository

Add `docs/server/observability.md` as the runbook for signal names, finite label
vocabularies, privacy rules, and copy/paste preproduction checks. Queries must cover:

- VictoriaMetrics: per-instance sync rate and aggregate rate-after-per-series-rate;
  allowed `domain`/`error_type` values; no raw `error`, URL, token, or unexpected host
  labels; reset/collision sanity.
- VictoriaLogs: known synthetic application error searchable by service,
  environment, severity, trace ID, and context; negative searches for the synthetic
  URL/token/email fixtures.
- Tempo: sync trace lookup, `upstream.domain` breakdown, slow-span cause, and a topology
  check that descendants do not end after the HTTP server span.

Update `docs/mobile/architecture-book/calendar.md` with the boundary: the mobile app
continues to report only its local unexpected failures, while server sync telemetry is
owned by the server runbook and must never receive calendar tokens or URLs from the
client. No mobile code or API contract changes.

The runbook includes a preprod synthetic exercise and expected values, followed by the
production check order. It is evidence and operating guidance, not a deploy act.

## Risks / Trade-offs

- **[Pod names accumulate across rollouts]** → retention already bounds historical
  series, the value is generated by Kubernetes rather than requests, and queries group
  only after per-series rate. Revisit with a stable workload-instance injection only if
  measured churn becomes material.
- **[Known provider moves domain]** → it reports `custom` until the reviewed allowlist
  changes; this degrades attribution safely without increasing cardinality or breaking
  sync.
- **[Sanitizer removes useful detail]** → retain bounded context/error class and trace
  correlation; diagnose sensitive specifics in controlled application state, not the
  shared log backend.
- **[Logger recursion or exporter diagnostics]** → OTel diagnostic logging remains on
  its own console path and is not re-emitted through the application logger; tests
  include exporter-disabled behavior.
- **[Disabling Express spans loses middleware timing]** → HTTP, Nest, explicit sync,
  client, database, and queue spans retain the causal layers operators need. Restore a
  specific middleware span manually only if a measured incident proves its value.
- **[OTLP logs add load]** → batch export, length/depth limits, and existing selective
  job logging bound volume; verify collector acceptance and export errors in preprod.

## Migration Plan

1. Implement pure identity/classification/sanitization helpers and their table-driven
   tests.
2. Align dependencies, configure trace/metric/log exporters, and wire the global
   logger plus bounded SDK shutdown.
3. Replace the sync metric domain, add client/sync attributes, disable Express layer
   spans, and land the in-memory topology proof.
4. Add the runbook and Architecture Book boundary; run focused server lint, typecheck,
   telemetry suites, and the normal CI proof test.
5. Deploy the app-only image to preprod and execute the committed VictoriaMetrics,
   VictoriaLogs, and Tempo checks before production. No collector/Terraform/Helm apply
   is part of this change.

Rollback is one application-image revert. Existing metric/log/trace data remains
queryable; no schema, collector, or infrastructure state must be rolled back.

## Open Questions

None. If preprod disproves that the shared collector promotes
`service.instance.id` or accepts OTLP logs at the existing endpoint, the Applier must
stop and escalate to the Founding Engineer rather than edit global collector policy in
this issue.
