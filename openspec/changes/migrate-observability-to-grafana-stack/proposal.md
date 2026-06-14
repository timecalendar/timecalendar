## Why

The TimeCalendar server currently exports OpenTelemetry traces and metrics to a legacy OTel collector (`otelcol-dev` in `lyro-opentelemetry`) that forwards to a SigNoz VPS. We now run a first-class in-cluster observability stack — VictoriaMetrics (metrics), Tempo (traces), and Grafana (read) behind a shared OTLP collector in the `observability` namespace. Migrating onto it removes the external SigNoz dependency, puts TimeCalendar telemetry next to the rest of the platform under one Grafana, and unlocks free RED metrics (from the collector's spanmetrics connector) and per-dependency outbound RED. Doing it now matters because the existing `calendar_sync_total` metric carries a raw exception message as a label — harmless on SigNoz, but a one-way cardinality explosion once it lands in VictoriaMetrics, so the cutover and the metric fix must ship together.

## What Changes

- **Repoint telemetry export.** Change the OTLP export target for both preprod and production from the legacy collector to the in-cluster collector (`otelcol-collector.observability.svc.cluster.local:4317`). This is a platform-repo `values.yaml` change in two environments; the server already speaks OTLP/gRPC and reads the endpoint from config.
- **Fix the cardinality landmine.** Replace the unbounded `error: <raw message>` label on `calendar_sync_total` with a bounded `error_type` (exception class / small enum). Audit the other labels (`school`, `domain`, `status`, `action`) to confirm they are bounded slugs.
- **Add one domain metric.** Introduce `push_notifications_sent_total{result, type}` for FCM/push delivery — the one operationally meaningful signal with no metric today. (RED for HTTP, DB, and outbound feed fetches comes free from the collector's spanmetrics, so no hand-rolled latency histograms.)
- **Create Grafana dashboards.** A new "TimeCalendar" Grafana folder (Terraform-managed) scoped to `service_name="timecalendar"`: Service Overview (HTTP RED + outbound RED by `peer_service` + Node runtime), Calendar Sync Health (from `calendar_sync_total`), and Infra/USE (from cluster-wide KSM/node-exporter). A Notifications panel set if the push metric lands.
- **Retire TimeCalendar's legacy routing (not the collector).** After cutover, TimeCalendar's dependency on the legacy collector / SigNoz ends. The legacy collector itself is **kept and untouched** — it is shared by other workloads, so its teardown and the SigNoz retirement are out of scope. The done-criterion is that TimeCalendar no longer uses the old stack.
- **Out of scope (deliberately):** app logs → VictoriaLogs, a MetricService/registration abstraction, request-context interceptor, global exception filter, and SLO recording rules + burn-rate alerts. Mobile-app observability (Firebase Crashlytics/Analytics) is a separate lane and untouched.

## Capabilities

### New Capabilities
- `server-observability`: How the TimeCalendar server emits telemetry — the OTLP export target and resource attributes, the bounded-cardinality rules for custom metrics, and the specific domain metrics it exposes (`calendar_sync_total`, `push_notifications_sent_total`).
- `observability-dashboards`: The Grafana dashboards and folder presenting TimeCalendar's RED/runtime/infra and calendar-sync health, scoped to the service in the shared stack.

### Modified Capabilities
<!-- None — no existing observability capability spec. -->

## Impact

- **Server code (`server/`):** `modules/calendar-sync/services/calendar-sync.service.ts` (drop raw `error` label, add `error_type`); `modules/calendar-sync/services/calendar-sync-metrics.service.ts` (counter description/labels); a new push counter wired into `modules/notifier` / `modules/firebase`. No change to `config/observability/tracer.ts` boot path beyond what's needed; the SDK already exports OTLP/gRPC.
- **Platform repo (`platform/`):** `kubernetes/.../20-apps/timecalendar-preprod/values.yaml` and `timecalendar-production/values.yaml` (`timecalendar.otel.exporterUrl`) — the only deploy change. **The shared `otelcol` collector CR needs no edit** (TimeCalendar is a drop-in tenant), and the legacy collector is **left running, untouched** (shared by other workloads; its teardown is out of scope).
- **Terraform (`platform/terraform/envs/observability/`):** a new, isolated `timecalendar.tf` declaring a new `grafana_folder "timecalendar"` + dashboard resources and new `dashboards/timecalendar-*.json` files, applied via the `platform-observability` workspace. **No existing resource is edited**, so the co-tenant service already on the stack is unaffected.
- **Dependencies:** no new server runtime deps required for the migration itself; the unused `@opentelemetry/exporter-trace-otlp-http` dep can be cleaned up. No new external services — removes the SigNoz dependency.
- **Verification (post-cutover):** confirm templated span names (low-cardinality routes), confirm Node runtime metrics are present from the current auto-instrumentation, and confirm production trace sampling (collector applies 1% prod / 100% preprod / always-error) is acceptable.
