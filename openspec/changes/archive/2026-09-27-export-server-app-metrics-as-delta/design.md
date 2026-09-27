## Context

`createObservabilitySdk` creates its metric reader through a production exporter factory. The current factory constructs `OTLPMetricExporter` without a temporality preference, so it emits cumulative measurements. The shared collector removes `service.instance.id` from application metrics, sums DELTA measurements by collector instance, and converts them to cumulative series for storage. Cumulative input from multiple server replicas therefore corrupts rates. The installed OpenTelemetry exporter accepts `temporalityPreference`, but its stock DELTA selector still returns CUMULATIVE for UpDownCounters. `calendar_sync_upstream_active` is a synchronous UpDownCounter.

## Goals / Non-Goals

**Goals:** Export DELTA measurements for every metric instrument kind, prove the production factory's selection, and describe the stored-series contract accurately.

**Non-Goals:** Change metric names or labels, collector policy, dashboards, alerts, tracing, logging, OpenAPI, or production deployment configuration.

## Decision 1 — Override the exporter selection method

Use a small subclass of `OTLPMetricExporter` that overrides its public `selectAggregationTemporality` method to return `AggregationTemporality.DELTA` for every `InstrumentType`. Keep the production exporter factory as the single construction path and make it construct this subclass. This preserves the existing gRPC exporter, endpoint handling, aggregation choice, and reader lifecycle. A `temporalityPreference: DELTA` option is insufficient because the installed selector leaves both UpDownCounter kinds cumulative; the constructor has no custom-selector option. Avoid modifying SDK internals or using a type cast to replace a private selector.

## Decision 2 — Test the production factory, not an injected stand-in

Expose the narrow production metric-exporter factory for the focused test, and have `createObservabilitySdk` use that same factory by default. The test calls `selectAggregationTemporality` for each `InstrumentType` value and expects DELTA, with explicit cases for `UP_DOWN_COUNTER` and `OBSERVABLE_UP_DOWN_COUNTER`. Keep the existing injected-factory endpoint/resource test, but do not use its independently constructed metric exporter as temporality evidence. A focused test must fail if the production factory reverts to the stock exporter or stock DELTA preference.

## Decision 3 — Document the collector boundary

Retain sanitized `service.instance.id` on OTLP resources for traces, logs, and pre-collector diagnostics. Explain that stored application metric series are grouped by `collector_instance`, without pod identity. Replace the runbook's per-instance metric and reset examples with aggregate rate and hourly-volume checks, and add a short pointer in the Calendar Architecture Book's existing server-observability boundary. The platform dashboard queries already apply `rate` to stored series before summing; its pod panels use infrastructure metrics. No platform query assumes a per-pod cumulative application series.

## Risks / Trade-offs

- The selected OpenTelemetry API may change on a dependency upgrade. A production-factory test covering every instrument kind catches a change in method behavior or new instrument kinds.
- An UpDownCounter DELTA sample represents a change in active operations, not the absolute active count. The collector's conversion reconstructs the cumulative active value for stored queries. A negative delta is valid.
- Old and new production samples cannot be compared as a clean continuous counter across rollout. Evaluate post-deploy rates only after the separately pinned production image has been advanced and a fresh window has elapsed.

## Migration Plan

Merge this server-only PR after exact-head CI succeeds. The production image tag is pinned in a separate deployment repository and requires a manual bump after merge; this PR does not perform that act. Once live, compare hourly `sum(increase(calendar_sync_upstream_attempt_total{service_name="timecalendar",deployment_environment_name="production"}[1h]))` with the server's outbound client `traces_spanmetrics_calls_total` volume over the same hour. Their values should have the same order of magnitude, allowing for non-calendar client spans. Roll back with the previous server image if the collector or stored-series behavior regresses.

## Open Questions

None for implementation. Production validation waits for the later image-tag rollout.
