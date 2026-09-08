## ADDED Requirements

### Requirement: Chart offers an opt-in server ConfigMap checksum

The TimeCalendar Helm chart SHALL declare `server.configMapChecksumEnabled` as a boolean with a default of `false`. When and only when the value is `true`, the chart SHALL compute `checksum/config` from the complete rendered `server-configmap.yaml` using `{{ include (print $.Template.BasePath "/server-configmap.yaml") . | sha256sum }}` and SHALL place that annotation on the server Deployment's `spec.template.metadata`.

The chart MUST preserve all existing `server.podAnnotations`. While the checksum gate is enabled, the chart-computed value MUST be the single authoritative value for the `checksum/config` key.

#### Scenario: Default production and preproduction renders are inert

- **WHEN** the branch and `origin/main` charts are rendered against the current production and preproduction platform values without enabling `server.configMapChecksumEnabled`
- **THEN** neither branch render contains a chart-computed `checksum/config` annotation
- **AND** each branch render is byte-identical to its corresponding `origin/main` render
- **AND** merging the implementation cannot restart either environment

#### Scenario: Explicit enablement annotates only the server pod template

- **WHEN** the chart is rendered against either current platform values file with `server.configMapChecksumEnabled=true`
- **THEN** exactly one `checksum/config` annotation appears under the server Deployment's `spec.template.metadata`
- **AND** it does not appear on Deployment metadata or anywhere in the `timecalendar-web` Deployment

#### Scenario: Existing server pod annotations compose with the checksum

- **WHEN** the chart is rendered with the checksum gate enabled and an arbitrary entry in `server.podAnnotations`
- **THEN** both the arbitrary entry and exactly one chart-computed `checksum/config` entry appear on the server pod template
- **AND** a caller-provided `checksum/config` value cannot create a duplicate key or replace the computed checksum while the gate is enabled

### Requirement: Server ConfigMap content controls the enabled checksum

The enabled `checksum/config` value SHALL depend on the rendered server ConfigMap and MUST NOT depend on Deployment-only values.

#### Scenario: A nested ConfigMap value changes the checksum

- **WHEN** two otherwise identical enabled renders use different `timecalendar.crisp.websiteId` values
- **THEN** the extracted `checksum/config` values differ

#### Scenario: A server image tag does not change the checksum

- **WHEN** two otherwise identical enabled renders use different `server.tag` values
- **THEN** the extracted `checksum/config` values are equal
- **AND** only the rendered image reference, not the checksum source, reflects the tag change

### Requirement: Server environment source precedence remains explicit

The server Deployment template SHALL retain `configMapRef` before `secretRef` in its `envFrom` list and SHALL carry a Helm template comment immediately above that list explaining that the order is deliberate. The comment MUST state that later sources win duplicate keys, the Secret is authoritative for keys present in both sources, and swapping the sources or removing a duplicated key from `timecalendar-env-secret` silently falls back to the unmaintained ConfigMap value.

The warning MUST NOT change the rendered Kubernetes manifest.

#### Scenario: Secret remains the later environment source

- **WHEN** the server Deployment is rendered
- **THEN** `configMapRef` is the first `envFrom` source
- **AND** `secretRef` is the second `envFrom` source

#### Scenario: Ordering warning remains source-only

- **WHEN** the template is rendered with the checksum gate disabled
- **THEN** the Helm template comment is absent from the rendered manifest
- **AND** it contributes no line or whitespace delta relative to `origin/main`

### Requirement: ConfigMap checksum activation remains separate from implementation

The repository implementation SHALL keep `server.configMapChecksumEnabled` false by default and MUST NOT enable or set it in the current production or preproduction platform values. Activation and the resulting server rollout SHALL remain a separate authorized change tracked by [TIM-314](/TIM/issues/TIM-314).

The implementation MUST NOT attempt to checksum `timecalendar-env-secret`, because that resource is supplied outside this Helm chart.

#### Scenario: Implementation merges without a rollout

- **WHEN** this repository change is merged and ArgoCD renders it with current live values
- **THEN** the server pod-template Kubernetes object is unchanged
- **AND** no ConfigMap-checksum-driven rollout is triggered

#### Scenario: Secret-only change is not misrepresented as covered

- **WHEN** `timecalendar-env-secret` changes without another pod-template mutation
- **THEN** this ConfigMap checksum mechanism provides no restart guarantee
- **AND** the limitation is documented for operators and reviewers

### Requirement: Web Deployment remains outside server checksum behavior

`k8s/timecalendar/templates/web-deployment.yaml` MUST remain unchanged, and enabling or disabling `server.configMapChecksumEnabled` MUST NOT alter its rendered output.

#### Scenario: Web render is isolated

- **WHEN** `templates/web-deployment.yaml` is rendered with the checksum gate disabled and enabled
- **THEN** the two renders are byte-identical
