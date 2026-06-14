## Context

The TimeCalendar server already runs the OpenTelemetry Node SDK (`@opentelemetry/sdk-node`) booted from `server/src/config/observability/tracer.ts` (imported first in `main.ts` so auto-instrumentations patch `http`/`express`/etc. before they load). It exports OTLP/gRPC traces and metrics to whatever `OTEL_EXPORTER_URL` points at. Today both preprod and production set that to a legacy collector (`otelcol-dev-collector.lyro-opentelemetry.svc.cluster.local:4317`) which forwards to a SigNoz VPS.

The platform now runs an in-cluster observability stack in the `observability` namespace: a shared OTLP collector fans traces to Tempo, metrics to VictoriaMetrics, and logs to VictoriaLogs, all read through one Grafana. The collector derives RED metrics from the full unsampled span stream via a spanmetrics connector (before tail-sampling), and applies tail-sampling keyed on `deployment.environment.name` (1% production / 100% preprod / always-error) to the Tempo branch only. VictoriaMetrics ingests OTLP with Prometheus naming, so OTLP resource attributes flatten to underscore labels (`service_name`, `deployment_environment_name`) and dotted metric names become underscore counters with `_total` suffix.

The migration is therefore mostly a **routing change** plus dashboard authoring. The one real code hazard is that the existing `calendar_sync_total` counter attaches the raw upstream exception message as a label, which is unbounded and becomes a permanent VictoriaMetrics cardinality problem once it lands there.

This change spans two repositories:
- **`timecalendar/`** (this repo): server code (metric hygiene + one new domain metric) and the Helm chart defaults under `k8s/`.
- **`platform/`** (separate repo): per-environment `values.yaml` for the OTLP endpoint, the legacy collector teardown, and the Terraform-managed Grafana dashboards under `terraform/envs/observability/`.

## Goals / Non-Goals

**Goals:**
- Route TimeCalendar telemetry (preprod + production) to the in-cluster collector and remove the SigNoz dependency.
- Eliminate the unbounded `error`-message label before it reaches VictoriaMetrics; keep all custom-metric labels bounded.
- Add `push_notifications_sent_total{result, type}` — the one missing operationally meaningful domain metric.
- Stand up Grafana dashboards for TimeCalendar (Service Overview, Calendar Sync Health, Infra) scoped to `service_name="timecalendar"`.

**Non-Goals:**
- App logs → VictoriaLogs (no Winston→OTLP transport this change).
- A `MetricService`/registration abstraction, request-context interceptor, or global exception filter.
- SLO recording rules and multi-window burn-rate alerts.
- Mobile-app observability (Firebase Crashlytics/Analytics) — a separate lane, untouched.
- Any change to the shared collector CR (TimeCalendar is already a supported tenant by `service.name`).

## Decisions

### D1 — Cut both environments at once, not staged
Repoint preprod and production in the same change. **Why:** both already point at the same legacy collector and already speak OTLP/gRPC; the destination collector is proven by existing tenants; the transport is byte-identical (OTLP/gRPC :4317). RED dashboards are driven by spanmetrics, which the collector derives regardless of sampling, so there is no data-shape risk specific to production. *Alternative considered:* preprod-soak-then-prod — rejected as unnecessary ceremony for a same-protocol endpoint swap; the rollback is a one-line revert of the endpoint value.

### D2 — Fix cardinality at the source, using the bounded exception name
Replace `error: fetchedEvents.error?.message` on `calendar_sync_total` with `error_type` — the **exception's name/class**, derived exactly the way the platform's established convention does it for span attributes: `error?.name ?? (error as object)?.constructor?.name ?? "unknown"`. This yields a bounded label (`TimeoutError`, `HttpException`, `TypeError`, …) — the set of exception classes a code path can throw is finite. **Why this derivation:** it matches the bounded `error.name` discriminator already used elsewhere in the platform for error tagging, so dashboards and intuition transfer; and the collector's metric-cardinality guard collapses per-pod identity but does **not** trim arbitrary app-OTLP metric datapoint labels, so an unbounded label on an app counter flows straight into VictoriaMetrics as permanent series sprawl. The exception name preserves the "what kind of failure" breakdown the dashboard needs without the explosion. *Alternatives:* a hand-curated enum (`timeout`/`http_4xx`/…) — rejected as more code and a second convention to maintain when the exception name is already the platform pattern; drop the label entirely (loses the at-a-glance failure-mode split); keep the raw message (rejected — the landmine). Also confirm the remaining labels are bounded: `school` (school code slug), `status`, `action` are enums/slugs; `domain` (feed hostname) is bounded by the count of distinct upstream providers (acceptable, monitor).

> Note: the platform's reusable metric decorator separately tags a raw `error: <message>` on failures with no allowlist at the metric layer — a latent instance of the very hazard this change fixes. We copy the *intent* (the bounded exception-name discriminator), not that line, and do not adopt that decorator here.

### D3 — Add exactly one domain metric, via the existing thin meter pattern
Add `push_notifications_sent_total{result, type}` using the same direct `meter.createCounter(...)` pattern already in `calendar-sync-metrics.service.ts` — no new abstraction. **Why:** the proposal scopes a "few key metrics," and push delivery is the only domain signal with no current coverage; HTTP/DB/outbound RED already come free from spanmetrics so no other custom metrics are warranted.

**Instrumentation point:** `FirebaseService.notify(...)` — the single real FCM send site. (Email is not a push channel; `EmailNotifier` is out of scope. `FcmNotifier.onNewSubscription` is a no-op, so today the only FCM sends are calendar-change notifications.) The send site has exactly three bounded outcomes, which become the `result` values:
- `success` — `messaging().send()` resolves.
- `invalid_token` — the known `messaging/registration-token-not-registered` case (`isInvalidTokenError`), today swallowed and logged; counting it makes token churn visible.
- `failure` — any other thrown error.

`type` is the FCM `data.action` already carried on the payload (`calendar_changed` today, via the existing `FCM_CALENDAR_CHANGED_ACTION` constant) — bounded and future-proof for new actions. *Alternative:* a richer notifier abstraction — rejected as out of scope (parity work).

### D4 — Dashboards as new Terraform JSON, scoped by service label
Author new dashboard JSON in `platform/terraform/envs/observability/dashboards/` in a new "TimeCalendar" Grafana folder, each panel scoped to `service_name="timecalendar"` (and `deployment_environment_name` as a template variable). Pin the existing datasource UIDs (`victoriametrics`, `tempo`). **Why:** dashboards are GitOps/Terraform-managed (never hand-clicked, which would drift); per-service JSON keeps TimeCalendar's views isolated from other tenants. Dashboards:
- **Service Overview** — HTTP RED from `traces_spanmetrics_calls_total` / `_duration_milliseconds_bucket` (SERVER); outbound RED by `peer_service` (CLIENT spans = upstream feed fetches); Node runtime (event loop, heap, GC) if present.
- **Calendar Sync Health** — sync rate, success ratio by `school`/`domain`, errors by `error_type`, create-vs-update, all from `calendar_sync_total`.
- **Infra / USE** — TimeCalendar pod CPU/RAM/restarts/PVC from cluster-wide KSM/node-exporter.
- **Notifications** (panels, folded into Service Overview or its own board) — from `push_notifications_sent_total`.

### D5 — Sequence the code fix at or before the repoint
Ship the `error_type` fix in the same change and ensure it is deployed no later than the endpoint repoint. **Why:** the hazard is specifically the raw label landing in VictoriaMetrics; as long as the fixed image is what runs when telemetry first hits VM, no bad series is ever created.

### D6 — Platform changes are additive and isolated; the shared collector is untouched
The shared in-cluster collector (`otelcol` in `observability`) already routes generically by `service.name`, derives spanmetrics with service-agnostic dimensions, scrubs PII generically, and tail-samples on `deployment.environment.name`. TimeCalendar is therefore a **drop-in tenant: no collector CR edit is required.** The Terraform dashboard work is added in a **new file** (`platform/terraform/envs/observability/timecalendar.tf`) declaring a **new** `grafana_folder "timecalendar"` (uid `timecalendar`) plus `grafana_dashboard` resources pointing at new `dashboards/timecalendar-*.json` files. Nothing in the existing `main.tf` (the other tenant's folder/dashboards) or the existing dashboard JSON is modified. **Why a new file, not appending to `main.tf`:** keeps the diff isolated, makes the resources trivially removable, and guarantees no accidental edit to another tenant's resources. *Alternative:* template a single shared dashboard set across services — rejected; dashboards are per-service JSON here and TimeCalendar's panels/labels differ.

### D7 — No-impact guarantee for the co-tenant service
This change must not perturb the other service already on the stack. The guarantees:
- **VictoriaMetrics is label-namespaced.** TimeCalendar series carry `service_name="timecalendar"`; they never collide with another service's series. Cardinality is purely additive, and TimeCalendar is low-volume.
- **No shared Terraform resource is edited.** New folder, new dashboard resources, new JSON files only (D6). No change to alerts, the notification policy, recording rules, or datasources.
- **The legacy collector is NOT decommissioned by this change.** It is shared by other workloads, so tearing it down or retiring the SigNoz VPS is explicitly out of scope. **This change only stops TimeCalendar from *routing* to the legacy collector** (the `values.yaml` repoint); the legacy collector keeps running, untouched, for everything else that still uses it. The done-criterion is simply that TimeCalendar no longer exports to the old stack.
- **No shared infrastructure is edited** — not the new `otelcol` collector CR, not the legacy collector, not the OpenTelemetry Operator. The only deploy change is TimeCalendar's own export endpoint.

## Risks / Trade-offs

- **[Unbounded `error` label lands in VictoriaMetrics before the fix]** → D2 + D5: fix shipped in the same change, deployed at/before the repoint; verify with a `__name__`/label query post-cutover that `calendar_sync_total` has no `error` label.
- **[Span-name cardinality from un-templated routes]** → Routes are templated (`@Get("by-token/:token")`), so Express instrumentation should emit `GET /calendars/by-token/:token`. Low risk; verify on first data that `traces_spanmetrics_calls_total{service_name="timecalendar"}` span names are route templates, not per-token.
- **[Node runtime panels empty if RuntimeNodeInstrumentation isn't active]** → Verify on first data; if absent, enabling it is a one-line addition to the auto-instrumentation config (small follow-up, not a blocker for the rest).
- **[Production traces only 1% sampled]** → Inherited from the collector's env-keyed tail-sampling. RED/metrics are unaffected (spanmetrics taps pre-sampling) and errors are always kept; accepted. Revisit only if prod debugging proves trace-starved.
- **[Cross-repo coordination]** → The server image fix (this repo) and the endpoint repoint (platform repo) must land in a compatible order (D5). Document the order in tasks; the endpoint change is trivially revertible.
- **[Adding a tenant raises load on the shared collector / VM]** → TimeCalendar is low-volume and VM has headroom; cardinality is additive and label-namespaced (D7). Verify post-cutover that `vm_rows_ignored_total` stays `0` (no label-length/cardinality rejects) and collector replicas are healthy.
- **[Touching the shared legacy collector breaks other workloads]** → The legacy collector is shared. This change does **not** remove or modify it — TimeCalendar only stops routing to it (D7). Its teardown + SigNoz retirement is out of scope.

## Migration Plan

1. Land the server-code changes (metric hygiene + push counter) and build a new image.
2. Repoint `timecalendar.otel.exporterUrl` in both platform `values.yaml` files to the in-cluster collector; ArgoCD syncs. Ensure the running image is the fixed one (D5).
3. Verify in Grafana: traces in Tempo, `service_name="timecalendar"` series in VictoriaMetrics, spanmetrics RED present, `calendar_sync_total` has `error_type` and no `error`.
4. Apply the Terraform dashboards (new `timecalendar.tf`, `platform-observability` workspace) — additive, no existing resource touched (D6).
5. After cutover, TimeCalendar no longer routes to the legacy collector and its SigNoz dependency ends — the done-criterion. Do **not** remove the legacy collector; it is shared and its teardown is out of scope (D7).

**Rollback:** revert the `exporterUrl` value (telemetry returns to the legacy collector); dashboard/metric changes are additive and safe to leave.

## Open Questions

- ~~Final shape of `error_type`~~ — **resolved (D2):** use the bounded exception name (`error?.name ?? error?.constructor?.name ?? "unknown"`), matching the platform's existing error-tagging convention. Confirm during implementation that the errors surfaced by `fetchEvents` carry meaningful `.name`s (wrap/rename if a generic `Error` dominates).
- ~~Whether `push_notifications_sent_total` `type` needs more than `calendar_changed`~~ — **resolved (D3):** `type` is the FCM `data.action`; today that's only `calendar_changed`, kept as a dimension for future actions.
