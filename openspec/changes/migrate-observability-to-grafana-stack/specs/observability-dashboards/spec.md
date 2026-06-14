## ADDED Requirements

### Requirement: TimeCalendar Grafana folder
The observability stack SHALL present TimeCalendar's dashboards in a dedicated, Terraform-managed Grafana folder, with no dashboards hand-created in the UI.

#### Scenario: Dashboards are provisioned as code
- **WHEN** the observability Terraform workspace is applied
- **THEN** a "TimeCalendar" Grafana folder exists containing the TimeCalendar dashboards, defined entirely in version-controlled Terraform/JSON

### Requirement: Dashboards scoped to the service
Every TimeCalendar dashboard panel SHALL be scoped to `service_name="timecalendar"` and SHALL allow selecting the deployment environment, so views isolate this service within the shared stack.

#### Scenario: Panels filter by service and environment
- **WHEN** a TimeCalendar dashboard is opened
- **THEN** its queries filter on `service_name="timecalendar"` and expose a deployment-environment selector (e.g. production / preprod)

### Requirement: Service Overview dashboard
A Service Overview dashboard SHALL present request RED (rate, errors, duration) for inbound HTTP and for outbound upstream-feed dependencies, plus Node runtime health where available.

#### Scenario: HTTP RED is shown
- **WHEN** the Service Overview dashboard is viewed
- **THEN** it shows inbound HTTP request rate, error rate, and latency derived from the collector's spanmetrics series

#### Scenario: Outbound dependency RED is shown
- **WHEN** the Service Overview dashboard is viewed
- **THEN** it shows rate/errors/duration of outbound upstream feed fetches broken down by dependency (`peer_service`)

### Requirement: Calendar Sync Health dashboard
A Calendar Sync Health dashboard SHALL present the calendar-sync business signal from `calendar_sync_total`.

#### Scenario: Sync health is charted
- **WHEN** the Calendar Sync Health dashboard is viewed
- **THEN** it shows sync rate, success ratio (by `school` and/or feed `domain`), failures broken down by `error_type`, and the create-vs-update split

### Requirement: Infra / USE dashboard
An Infra dashboard SHALL present utilization/saturation/errors for TimeCalendar's workloads from cluster-wide infrastructure metrics.

#### Scenario: Workload USE is shown
- **WHEN** the Infra dashboard is viewed
- **THEN** it shows TimeCalendar pod CPU, memory, restarts, and volume usage from kube-state-metrics / node-exporter
