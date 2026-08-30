## ADDED Requirements

### Requirement: Chart exposes server pod annotations for GitOps-driven rollout

The TimeCalendar Helm chart SHALL expose an optional `server.podAnnotations` map and render
it onto `spec.template.metadata.annotations` of the server Deployment, so that a GitOps
commit can change the pod template and roll the server pods without any live-cluster write.

`k8s/timecalendar/values.yaml` SHALL declare `server.podAnnotations: {}` with a comment
stating that setting or changing any key rolls the server pods on the next ArgoCD sync, and
that this is the supported way to apply a change to a Secret consumed through `envFrom`.

The chart MUST NOT compute a checksum of `timecalendar-env-secret`, and MUST NOT set any
annotation value by default.

#### Scenario: A stamp value reaches the server pod template

- **WHEN** the chart is rendered with a single key set under `server.podAnnotations`
- **THEN** the server Deployment's `spec.template.metadata.annotations` contains exactly
  that key and value
- **AND** the annotation appears nowhere else in the rendered output, in particular not on
  the Deployment's own `metadata`

#### Scenario: The rest of the render is unaffected by a stamp

- **WHEN** the chart is rendered with and without a key set under `server.podAnnotations`
- **THEN** the two renders differ only by the added `annotations:` line and its key line

### Requirement: The pod-annotation default is inert

With `server.podAnnotations` unset, the chart's rendered output SHALL be byte-identical to
the render produced before this capability was added. The default MUST emit no
`annotations` key at all on the server pod template, not an empty `annotations: {}` map.

#### Scenario: Production render is unchanged by the default

- **WHEN** the chart is rendered at `origin/main` and at the implementation, both against
  the committed `lyrolab/platform` production values and with no `server.podAnnotations`
  override
- **THEN** the two rendered outputs are byte-identical and their SHA-256 digests are equal

#### Scenario: Preproduction render is unchanged by the default

- **WHEN** the chart is rendered at `origin/main` and at the implementation, both against
  the committed `lyrolab/platform` preproduction values and with no `server.podAnnotations`
  override
- **THEN** the two rendered outputs are byte-identical and their SHA-256 digests are equal

#### Scenario: Bare chart emits no annotations key

- **WHEN** the chart is rendered with no values overrides
- **THEN** the server Deployment render contains no `annotations:` line

### Requirement: Pod annotations are scoped to the server Deployment

`server.podAnnotations` SHALL affect only `templates/server-deployment.yaml`. The web
Deployment MUST NOT gain a pod-annotation mechanism in this change, because only the server
consumes `timecalendar-env-secret`.

#### Scenario: Web Deployment ignores server pod annotations

- **WHEN** the chart is rendered with and without a key set under `server.podAnnotations`
- **THEN** the rendered web Deployment is identical in both cases

#### Scenario: Web template is untouched

- **WHEN** the change's diff is inspected
- **THEN** `k8s/timecalendar/templates/web-deployment.yaml` has no modifications
