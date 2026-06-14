# Tasks

> Spans two repos. Tasks tagged `[platform]` happen in the `platform/` repo;
> all others are in this (`timecalendar/`) repo. Section 2 (server fix) must be
> deployed at or before Section 3 (repoint) — see design D5.

## 1. Server — metric hygiene (the cardinality fix)

- [ ] 1.1 Add a small pure helper `toErrorType(error: unknown): string` returning the bounded exception name (`error?.name ?? (error as object)?.constructor?.name ?? "unknown"`) — matching the platform's existing error-tagging convention (design D2). Unit-test it against the error shapes produced by `fetchEvents`.
- [ ] 1.2 In `modules/calendar-sync/services/calendar-sync.service.ts`, replace the `error: fetchedEvents.error?.message` label on `calendar_sync_total` with `error_type: toErrorType(...)`. Remove the raw message from the label set entirely.
- [ ] 1.3 Confirm the errors `fetchEvents` surfaces carry meaningful `.name`s; if a generic `Error` dominates, give the known failure modes named error classes (or map them) so `error_type` is useful — still bounded.
- [ ] 1.4 Audit the remaining `calendar_sync_total` labels (`school`, `domain`, `status`, `action`) — confirm each is a bounded slug/enum; note `domain` (feed hostname) as bounded-by-provider-count in the counter description.
- [ ] 1.5 Update the counter description in `calendar-sync-metrics.service.ts` to reflect the bounded label set.

## 2. Server — push notification metric

- [ ] 2.1 Add a `push_notifications_sent_total` counter (description + `{result, type}` labels) following the existing thin `meter.createCounter(...)` pattern (a `firebase`-module or `notifier`-module metrics holder mirroring `calendar-sync-metrics.service.ts`).
- [ ] 2.2 Increment it at the single FCM send site `FirebaseService.notify(...)` with bounded `result` — `success` (send resolves), `invalid_token` (the existing `isInvalidTokenError` branch, currently swallowed), `failure` (any other throw) — and `type` from the payload `data.action` (e.g. `calendar_changed`).
- [ ] 2.3 Add/extend tests covering all three `result` outcomes (the `firebase.service.test.ts` already exercises success + invalid-token paths).

## 3. Server — cleanup & verification

- [ ] 3.1 Remove the unused `@opentelemetry/exporter-trace-otlp-http` dependency from `server/package.json` (the SDK uses the gRPC exporter).
- [ ] 3.2 Confirm Node runtime metrics (`nodejs.*`/`v8.*`) are emitted by the current auto-instrumentation; if absent, enable `RuntimeNodeInstrumentation` in `config/observability/tracer.ts`.
- [ ] 3.3 Run server lint + tests; confirm green.

## 4. Platform — repoint export endpoint `[platform]`

> The shared collector needs **no** change — TimeCalendar is a drop-in tenant routed by `service.name` (design D6). These tasks only change the endpoint TimeCalendar points at.

- [ ] 4.1 In `kubernetes/clusters/do-fra1-cluster01/20-apps/timecalendar-preprod/values.yaml`, set `timecalendar.otel.exporterUrl` to `http://otelcol-collector.observability.svc.cluster.local:4317` (currently `otelcol-dev-collector.lyro-opentelemetry...`).
- [ ] 4.2 In `kubernetes/clusters/do-fra1-cluster01/20-apps/timecalendar-production/values.yaml`, set the same `timecalendar.otel.exporterUrl`.
- [ ] 4.3 Ensure the deployed server image is the fixed one from Section 1 before/at the same time as this repoint (design D5). Push; let ArgoCD sync both environments.
- [ ] 4.4 Confirm no collector CR edit is needed: the shared `otelcol` already keeps generic `service.name`, spanmetrics dimensions, PII scrub, and env-keyed sampling (no per-service config). Verify only — do not edit.

## 5. Verify the cutover

- [ ] 5.1 Confirm traces for `service.name=timecalendar` appear in Tempo (Grafana Explore) for both environments.
- [ ] 5.2 Query VictoriaMetrics: `service_name="timecalendar"` series present, spanmetrics RED (`traces_spanmetrics_calls_total` / `_duration_milliseconds_*`) present, and `calendar_sync_total` carries `error_type` with **no** `error` label.
- [ ] 5.3 Confirm spanmetrics span names are route templates (e.g. `GET /calendars/by-token/:token`), not per-token (cardinality sanity check).
- [ ] 5.4 Confirm `push_notifications_sent_total` lands with bounded labels.
- [ ] 5.5 Confirm `vm_rows_ignored_total` stays `0` after the new tenant joins (no label-length/cardinality rejects) and the collector replicas stay healthy — the co-tenant no-impact check (design D7).

## 6. Dashboards `[platform]` — additive, isolated (design D6)

- [ ] 6.1 Create `terraform/envs/observability/timecalendar.tf` with a **new** `grafana_folder "timecalendar"` (uid `timecalendar`) and one `grafana_dashboard` resource per JSON below. **Do not edit `main.tf` or any existing dashboard** (no co-tenant impact).
- [ ] 6.2 `dashboards/timecalendar-service-overview.json`: HTTP RED (spanmetrics SERVER), outbound RED by `peer_service` (CLIENT = upstream feed fetches), Node runtime panels; scoped `service_name="timecalendar"` with a `deployment_environment_name` template variable; pin datasource UIDs (`victoriametrics`, `tempo`).
- [ ] 6.3 `dashboards/timecalendar-calendar-sync-health.json`: sync rate, success ratio by `school`/`domain`, failures by `error_type`, create-vs-update — from `calendar_sync_total`.
- [ ] 6.4 `dashboards/timecalendar-infra.json`: TimeCalendar pod CPU/RAM/restarts/PVC from KSM/node-exporter.
- [ ] 6.5 Notifications panels from `push_notifications_sent_total` (own board `dashboards/timecalendar-notifications.json` or folded into Service Overview).
- [ ] 6.6 Apply via the `platform-observability` Terraform workspace; confirm the new "TimeCalendar" folder + dashboards render with live data and the other tenant's folder/dashboards are unchanged in the plan (only `grafana_folder.timecalendar` + `grafana_dashboard.timecalendar_*` added).

## 7. Confirm TimeCalendar is off the old stack `[platform]`

> **The legacy collector is NOT decommissioned here** (design D7) — it is shared by other workloads and its teardown is out of scope. This section only confirms the done-criterion: TimeCalendar no longer uses the old stack. The repoint in Section 4 is what achieves it.

- [ ] 7.1 Confirm after cutover that TimeCalendar no longer sends to the legacy collector (no TimeCalendar traffic in its logs / monitoring); the legacy collector itself is left running, untouched.
- [ ] 7.2 Confirm no remaining references to the legacy endpoint exist in TimeCalendar's own config (this repo's `k8s/` defaults + the platform repo's `timecalendar-*/values.yaml`).
