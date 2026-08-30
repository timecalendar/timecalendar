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

### Requirement: Chart documents Redis logical-DB isolation

The Redis note in the TimeCalendar server ConfigMap template SHALL state that `REDIS_KEY_PREFIX` is retired, that environment isolation is owned by the logical DB index or Redis instance encoded in the sealed `REDIS_URL`, and that the current allocation is production DB 0 and preproduction DB 1. It SHALL identify the `lyrolab/platform` sealed-secret paths as the configuration source and reference [TIM-143](/TIM/issues/TIM-143) and [TIM-294](/TIM/issues/TIM-294).

For a new environment, the note MUST require a distinct logical DB index or Redis instance before deployment and MUST direct the operator to verify the effective value with `printenv REDIS_URL` inside the pod rather than infer it from the encrypted manifest.

#### Scenario: Current production and preproduction allocation is discoverable

- **WHEN** an operator reads the Redis note in `server-configmap.yaml`
- **THEN** the note identifies production as logical DB 0 and preproduction as logical DB 1
- **AND** it identifies the corresponding `lyrolab/platform/kubernetes/clusters/do-fra1-cluster01/20-apps/timecalendar-*/env-sealed-secret.yaml` files as the source of that allocation

#### Scenario: A new environment has an actionable isolation check

- **WHEN** an operator prepares another TimeCalendar environment
- **THEN** the note requires a unique logical DB index or Redis instance before deployment
- **AND** it directs the operator to run `printenv REDIS_URL` in the pod to verify the effective isolation

#### Scenario: Retired prefix guidance remains accurate

- **WHEN** a maintainer considers using `REDIS_KEY_PREFIX` to isolate an environment
- **THEN** the note states that the prefix is retired and that `REDIS_URL` is the isolation boundary
- **AND** it references [TIM-143](/TIM/issues/TIM-143) and [TIM-294](/TIM/issues/TIM-294) for the migration and collision history

### Requirement: Redis note edits preserve the ConfigMap object

Updating the Redis isolation note SHALL NOT add, remove, or modify any ConfigMap field or `data:` key. The parsed server ConfigMap rendered for production and for preproduction SHALL be byte-identical to the corresponding `origin/main` baseline after canonical serialization.

#### Scenario: Production render is unchanged

- **WHEN** the implementation and `origin/main` charts are rendered with `environment=production` and their server ConfigMaps are parsed and canonically serialized
- **THEN** their serialized bytes and SHA-256 hashes are identical

#### Scenario: Preproduction render is unchanged

- **WHEN** the implementation and `origin/main` charts are rendered with `environment=preprod` and their server ConfigMaps are parsed and canonically serialized
- **THEN** their serialized bytes and SHA-256 hashes are identical

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

