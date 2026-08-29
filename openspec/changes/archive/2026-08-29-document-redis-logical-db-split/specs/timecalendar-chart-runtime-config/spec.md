## ADDED Requirements

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
