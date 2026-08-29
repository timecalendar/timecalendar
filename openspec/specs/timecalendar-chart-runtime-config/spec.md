# timecalendar-chart-runtime-config Specification

## Purpose
TBD - created by archiving change render-queue-concurrency-from-chart. Update Purpose after archive.
## Requirements
### Requirement: Chart owns default queue concurrency
The TimeCalendar Helm chart SHALL render `QUEUE_CONCURRENCY` exactly once in the server
ConfigMap from `timecalendar.queueConcurrency`, so ArgoCD owns the runtime setting.

#### Scenario: Environment override is rendered
- **WHEN** the chart is rendered with `timecalendar.queueConcurrency` set to `10`
- **THEN** the server ConfigMap contains `QUEUE_CONCURRENCY: "10"` exactly once

#### Scenario: Production and preproduction preserve the live value
- **WHEN** the chart is rendered against either committed platform production or
  preproduction values
- **THEN** the server ConfigMap contains `QUEUE_CONCURRENCY: "10"`

### Requirement: Queue concurrency has a non-empty safe default
The chart MUST default queue concurrency to `100`, matching the server runtime default,
and MUST NOT render an empty ConfigMap value.

#### Scenario: Bare chart uses the server default
- **WHEN** the chart is rendered without values overrides
- **THEN** the server ConfigMap contains `QUEUE_CONCURRENCY: "100"`

#### Scenario: Empty override cannot stall the queue
- **WHEN** the chart is rendered with `timecalendar.queueConcurrency` set to an empty
  value
- **THEN** the server ConfigMap contains `QUEUE_CONCURRENCY: "100"` and never
  `QUEUE_CONCURRENCY: ""`

### Requirement: ConfigMap scope remains isolated
Adding chart ownership of queue concurrency SHALL NOT change, remove, or duplicate any
other server ConfigMap key.

#### Scenario: Render is compared with the current baseline
- **WHEN** the implementation's server ConfigMap render is diffed against the same values
  rendered from `main`
- **THEN** the only ConfigMap data delta is the added `QUEUE_CONCURRENCY` entry

