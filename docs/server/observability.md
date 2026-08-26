# Server observability

This runbook defines the application-owned telemetry contract for the TimeCalendar
server. Run every check in preproduction before using these signals for a production
decision. Replace `preprod` below only with the exact deployed environment resource
value.

## Signal contract

All three signals carry `service.name=timecalendar`,
`deployment.environment.name`, and the sanitized pod-derived
`service.instance.id` (`unknown` when the runtime hostname is unusable).

| Signal | Bounded application fields |
| --- | --- |
| `calendar_sync_total` | `domain`, `school`, `status`, `error_type`, `action` |
| application logs | severity, `context`, optional `error.type`, active trace/span IDs |
| `calendar.sync` spans | `action`, `school`, `upstream.domain`, optional `error.type` |
| outgoing HTTP spans | `peer.service`, `upstream.domain` |

The complete `domain`, `upstream.domain`, and `peer.service` vocabulary is:

```text
ensea.fr esiee.fr grenet.fr u-bourgogne.fr u-pec.fr
univ-amu.fr univ-angers.fr univ-eiffel.fr univ-lehavre.fr
univ-lyon1.fr univ-orleans.fr univ-poitiers.fr univ-rennes1.fr
univ-rouen.fr univ-st-etienne.fr custom invalid
```

`status` is `success | error`; `action` is `create | update`; `school` is a
registered lowercase school slug or `unknown`; `error_type`/`error.type` is a
bounded error class identifier or `unknown`. Instance IDs match
`[A-Za-z0-9._-]{1,253}` or are `unknown`.

Privacy is invariant: no calendar URL, hostname outside the reviewed vocabulary,
port, path, query, token, credential, cookie, email, UUID/opaque identifier,
request/response body, calendar event, or raw error/stack may occur in a metric label,
log body/attribute, span name, or span attribute. Absolute URLs in logs become
`[url:<bounded-domain>]`; sensitive values become redaction tokens.

## VictoriaMetrics

Per-instance rate (each cumulative series is rated before display):

```promql
sum by (service_instance_id) (
  rate(calendar_sync_total{deployment_environment_name="preprod"}[5m])
)
```

Aggregate only after the per-series `rate`:

```promql
sum(rate(calendar_sync_total{deployment_environment_name="preprod"}[5m]))
```

Upstream, outcome, action, and bounded error breakdowns:

```promql
sum by (domain, status) (rate(calendar_sync_total{deployment_environment_name="preprod"}[5m]))
sum by (action) (rate(calendar_sync_total{deployment_environment_name="preprod"}[5m]))
sum by (error_type) (rate(calendar_sync_total{deployment_environment_name="preprod",status="error"}[5m]))
```

Unexpected upstream labels (expected result: no series):

```promql
calendar_sync_total{deployment_environment_name="preprod",domain!~"ensea\\.fr|esiee\\.fr|grenet\\.fr|u-bourgogne\\.fr|u-pec\\.fr|univ-amu\\.fr|univ-angers\\.fr|univ-eiffel\\.fr|univ-lehavre\\.fr|univ-lyon1\\.fr|univ-orleans\\.fr|univ-poitiers\\.fr|univ-rennes1\\.fr|univ-rouen\\.fr|univ-st-etienne\\.fr|custom|invalid"}
```

Reset/collision sanity:

```promql
sum by (service_instance_id) (resets(calendar_sync_total{deployment_environment_name="preprod"}[30m]))
count(count by (service_instance_id) (calendar_sync_total{deployment_environment_name="preprod"}))
```

For a two-pod synthetic exercise, expect two distinct non-`unknown` instance values,
non-negative rates, and resets only for the restarted pod. The aggregate rate must
equal the sum of the displayed per-instance rates. The success fixture reports its
reviewed domain; the custom and unsafe fixtures report `custom` and `invalid`.

## VictoriaLogs

Find the synthetic failure by resource, severity, and context:

```logsql
_stream:{service_name="timecalendar",deployment_environment_name="preprod"} severity_text:~"ERROR|FATAL" context:="CalendarSyncService" "SyntheticUpstreamError"
```

Copy the returned trace ID and pivot to one record:

```logsql
_stream:{service_name="timecalendar",deployment_environment_name="preprod"} trace_id:="<trace-id>"
```

Each query should return a sanitized body, bounded context/error class, and trace/span
correlation. These negative searches must return zero rows (substitute the exact
fixtures used by the preproduction exercise):

```logsql
_stream:{service_name="timecalendar",deployment_environment_name="preprod"} "synthetic-calendar-token-never-export"
_stream:{service_name="timecalendar",deployment_environment_name="preprod"} "student-observability@example.test"
_stream:{service_name="timecalendar",deployment_environment_name="preprod"} "ade.ensea.fr/feed"
```

## Tempo

Find sync traces and slow syncs with TraceQL:

```traceql
{ resource.service.name = "timecalendar" && resource.deployment.environment.name = "preprod" && name = "calendar.sync" }
{ resource.service.name = "timecalendar" && name = "calendar.sync" && duration > 2s }
```

Break slow requests down by the finite upstream attribute in Grafana's table view:

```traceql
{ resource.service.name = "timecalendar" && name = "calendar.sync" && span.upstream.domain != nil } | by(span.upstream.domain)
```

Open a retained slow trace. The HTTP server span must contain `calendar.sync`, which
must contain the awaited outgoing HTTP and database spans. Compare the timeline end
markers: every descendant end must be at or before the HTTP server span end. There
must be no Express `middleware`/router layer spans. Search the trace JSON for the three
negative fixtures from the VictoriaLogs section; all must be absent from span names
and attributes.

## Stop and rollback

Stop production rollout if an instance ID is missing/unsafe, concurrent pods collide,
an upstream value falls outside the vocabulary, any negative privacy search matches,
OTLP application logs are absent, correlation is missing, or a child ends after its
HTTP parent. Do not change shared collector policy in this change. Escalate the
instance-promotion or log-endpoint assumption to the Founding Engineer. Rollback is an
application-image revert; telemetry storage and schemas require no rollback.
