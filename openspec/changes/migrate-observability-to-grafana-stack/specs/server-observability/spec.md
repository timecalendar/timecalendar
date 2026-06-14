## ADDED Requirements

### Requirement: Telemetry export target
The server SHALL export OpenTelemetry traces and metrics over OTLP/gRPC to the in-cluster shared collector when observability is enabled, with the export endpoint supplied by configuration (`OTEL_EXPORTER_URL`) rather than hardcoded.

#### Scenario: Configured endpoint is honored
- **WHEN** the server boots with `OTEL_ENABLED` true and `OTEL_EXPORTER_URL` set to the in-cluster collector address
- **THEN** the SDK starts and exports traces and metrics over OTLP/gRPC to that address

#### Scenario: Both environments target the in-cluster collector
- **WHEN** preprod and production are deployed
- **THEN** each sets the OTLP export endpoint to the in-cluster collector (`otelcol-collector.observability.svc.cluster.local:4317`) and no longer targets the legacy SigNoz-forwarding collector

### Requirement: Service identity on telemetry
The server SHALL attach a stable service identity to all emitted telemetry so it is distinguishable in the shared stack.

#### Scenario: Resource attributes are present
- **WHEN** the server emits spans or metrics
- **THEN** each carries `service.name = "timecalendar"` and `deployment.environment.name` set to the deployment stage

### Requirement: Bounded-cardinality custom metric labels
Custom metrics SHALL only attach labels whose value space is bounded (slugs, enums, booleans). The server SHALL NOT attach raw exception messages, free text, identifiers, or any unbounded value as a metric label.

#### Scenario: Calendar sync failure records a bounded error discriminator
- **WHEN** a calendar sync fails and `calendar_sync_total` is incremented
- **THEN** the failure is recorded with a bounded `error_type` label derived from the exception name (the error's `name`/class, not its message), and no raw exception message is attached as a label

#### Scenario: Sync metric labels are all bounded
- **WHEN** `calendar_sync_total` is incremented
- **THEN** its labels are limited to bounded values (`status`, `action`, `error_type`, `school` code, feed `domain` host) and contain no unbounded free text

### Requirement: Calendar sync metric
The server SHALL emit a `calendar_sync_total` counter capturing the outcome of each calendar sync, broken down by bounded dimensions sufficient to chart success ratio and failure modes.

#### Scenario: Successful sync
- **WHEN** a calendar sync completes without error
- **THEN** `calendar_sync_total` is incremented with `status = "success"` and the `action` (create/update) dimension

#### Scenario: Failed sync
- **WHEN** a calendar sync fails
- **THEN** `calendar_sync_total` is incremented with `status = "error"` and an `error_type` dimension

### Requirement: Push notification metric
The server SHALL emit a `push_notifications_sent_total` counter at the FCM send site capturing push delivery outcomes, so push volume, failure rate, and token churn are observable.

#### Scenario: Successful push is counted
- **WHEN** an FCM push send resolves successfully
- **THEN** `push_notifications_sent_total` is incremented with `result = "success"` and a bounded `type` (the notification action, e.g. `calendar_changed`)

#### Scenario: Push to an unregistered token is counted distinctly
- **WHEN** an FCM push send fails because the device token is no longer registered
- **THEN** `push_notifications_sent_total` is incremented with `result = "invalid_token"`

#### Scenario: Other push failures are counted
- **WHEN** an FCM push send throws any other error
- **THEN** `push_notifications_sent_total` is incremented with `result = "failure"`
