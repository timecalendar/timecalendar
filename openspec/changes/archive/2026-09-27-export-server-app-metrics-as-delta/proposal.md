## Why

The shared metrics collector removes the server instance label before storing application metrics and expects DELTA measurements from each replica. The server currently exports cumulative measurements, so replica streams collide and counter rates can show false resets or inflated volume. Reliable sync metrics are needed before the calendar fetch shadow measurement is evaluated.

## What Changes

- Export every server application metric instrument with DELTA temporality, including synchronous and observable UpDownCounters.
- Test the exporter used by the production SDK for every OpenTelemetry instrument kind; a stock DELTA preference is insufficient for UpDownCounters.
- Correct the server observability runbook and the Calendar Architecture Book boundary note to reflect the collector's stored-series semantics and post-deploy validation.
- Keep collector configuration, dashboards, alerts, and production image promotion outside this change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `server-telemetry-integrity`: The server exports DELTA application measurements while retaining its sanitized instance resource attribute in OTLP.
- `timecalendar-observability-operations`: Operator queries and proof describe collector-merged series rather than per-pod cumulative series.

## Impact

- Server exporter setup and focused tests in `server/src/config/observability/`.
- `docs/server/observability.md` and the existing server-observability boundary in `docs/mobile/architecture-book/calendar.md`.
- No API contract, schema, dependency, native config, deployment, CI, or legacy Flutter changes. The production image is pinned separately; a manual tag bump after merge is needed before live validation.
