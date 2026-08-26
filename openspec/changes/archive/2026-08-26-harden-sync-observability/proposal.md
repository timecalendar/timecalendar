## Why

Production telemetry currently merges cumulative application counters from different
pods, exposes arbitrary user-supplied feed hosts as metric labels, omits Nest
application logs from OTLP, and shows some framework child spans extending beyond the
HTTP server span. Operators therefore cannot trust per-pod sync volume, upstream
health, long-request traces, or error searches during the rentrée load window.

## What Changes

- Give every server process a stable-for-the-pod `service.instance.id`, sourced from
  the Kubernetes-provided hostname and normalized to a safe fallback, so cumulative
  counters no longer collide while cardinality remains proportional to live pod churn.
- Replace raw calendar URL host labels with one shared finite upstream classifier. It
  reports reviewed provider domains and collapses every custom, malformed, local, or
  unknown destination to bounded sentinel values; the same classifier annotates
  outbound sync spans.
- Export Nest application logs over OTLP/gRPC through the existing collector endpoint.
  A single logger seam preserves console output, correlates records with active traces,
  and sanitizes URLs, credentials/tokens, email addresses, and identifier-like PII
  before either sink receives a record.
- Align the OpenTelemetry SDK/exporter dependency cohort, remove misleading Express
  middleware layer spans, and add an awaited calendar-sync span so trace children
  finish before their HTTP server parent and long requests retain useful causal detail.
- Add automated telemetry contract tests plus a version-controlled server
  observability runbook with VictoriaMetrics, VictoriaLogs, and Tempo preproduction
  queries. Update the calendar Architecture Book page to point at the backend
  observability boundary and its privacy/cardinality rules.
- Keep the change application-only. No collector-wide cardinality policy, Terraform,
  Kubernetes, workflow, OpenAPI, database schema, mobile runtime, or legacy Flutter
  change is required.

## Capabilities

### New Capabilities

- `server-telemetry-integrity`: Resource identity, bounded sync/upstream dimensions,
  OTLP application-log export and sanitization, and valid trace lifecycle semantics.
- `timecalendar-observability-operations`: Version-controlled queries and checks that
  prove TimeCalendar metrics, logs, and traces answer the production-health questions.

### Modified Capabilities

<!-- None. The earlier observability migration change is still active and has not
     produced canonical specs under openspec/specs/; this follow-up therefore defines
     independently valid additive capabilities instead of targeting an unarchived
     delta. -->

## Impact

- **Server runtime:** `server/src/config/observability/`, server bootstrap/logger
  wiring, calendar sync instrumentation, and focused unit/integration tests.
- **Dependencies:** declare and align the directly imported OpenTelemetry API, SDK,
  exporter, resource, and semantic-convention packages to one compatible minor cohort;
  no major dependency bump.
- **Documentation:** a server observability runbook and a narrow calendar Architecture
  Book pointer.
- **External contract/data:** no controller/DTO, `openapi/openapi.json`, generated
  mobile client, database migration, or persisted-data change.
- **Sensitive surfaces:** none. `.github/workflows/`, `terraform/`, `k8s/`, native/store
  config, and legacy `app/` remain untouched; no secrets or certificates are committed.
