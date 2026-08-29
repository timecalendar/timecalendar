# timecalendar-chart-probes Specification

## Purpose
TBD - created by archiving change split-k8s-liveness-from-readiness. Update Purpose after archive.
## Requirements
### Requirement: Server liveness is dependency-free
The TimeCalendar Helm chart SHALL render the server Deployment liveness probe with HTTP
path `/health/live`, so transient database unavailability is not classified as process
death.

#### Scenario: Server Deployment is rendered
- **WHEN** the chart renders `templates/server-deployment.yaml`
- **THEN** the server container liveness probe uses `path: /health/live` exactly once

#### Scenario: Database health endpoint is unavailable
- **WHEN** the Node process serves `/health/live` but the database-backed `/health` route
  is failing
- **THEN** the rendered liveness contract continues probing `/health/live` and does not
  instruct kubelet to restart the process because of the database failure

### Requirement: Server readiness remains database-aware
The TimeCalendar Helm chart SHALL render the server Deployment readiness probe with HTTP
path `/health`, preserving the existing database-aware admission signal.

#### Scenario: Server Deployment is rendered
- **WHEN** the chart renders `templates/server-deployment.yaml`
- **THEN** the server container readiness probe uses `path: /health` exactly once

#### Scenario: Database health endpoint is unavailable
- **WHEN** the database-backed `/health` route fails while the process remains live
- **THEN** the rendered readiness contract causes Kubernetes to remove the pod from ready
  Service endpoints without changing the liveness route

### Requirement: Probe split is protected by the chart CI seam
The repository MUST include a focused Helm render assertion that binds `/health/live` to
`livenessProbe` and `/health` to `readinessProbe`, and the existing chart CI job MUST run
that assertion.

#### Scenario: Probe paths are swapped or duplicated
- **WHEN** either probe block renders the other probe's path or more than one path
- **THEN** the focused chart-render assertion fails

#### Scenario: Intended probe split is rendered
- **WHEN** the existing chart CI script renders the server Deployment
- **THEN** the probe assertion passes without requiring a new workflow or test dependency
