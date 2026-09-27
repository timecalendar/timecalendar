## MODIFIED Requirements

### Requirement: Per-instance telemetry identity
The server SHALL attach a sanitized `service.instance.id` resource attribute derived
from the runtime pod hostname to its traces, metrics, and logs. The value MUST NOT be
derived from a request, calendar, user, random per-request identifier, or process-start
timestamp. The server SHALL export DELTA application metric measurements so concurrent
pod streams remain additive after the shared collector removes the instance attribute.

#### Scenario: Kubernetes pod emits a counter
- **WHEN** a server pod increments an application counter
- **THEN** its OTLP resource carries the sanitized pod identity and its DELTA measurement can be summed with concurrent pods without cumulative-stream collision

#### Scenario: Runtime hostname is unusable
- **WHEN** the hostname is absent, oversized, or contains disallowed characters
- **THEN** telemetry uses the bounded `unknown` instance value and does not emit the raw input

## ADDED Requirements

### Requirement: DELTA temporality for every application metric instrument
The production server metric exporter SHALL select DELTA temporality for every OpenTelemetry instrument kind, including synchronous and observable UpDownCounters. It MUST NOT rely solely on the stock DELTA preference when that preference selects CUMULATIVE for UpDownCounters.

#### Scenario: Production exporter selects temporality
- **WHEN** the production metric-exporter factory constructs the exporter
- **THEN** `selectAggregationTemporality` returns DELTA for every supported instrument kind

#### Scenario: Active upstream fetch count changes
- **WHEN** `calendar_sync_upstream_active` records a positive or negative UpDownCounter change
- **THEN** the exporter selects DELTA for that instrument and sends the change for collector accumulation
