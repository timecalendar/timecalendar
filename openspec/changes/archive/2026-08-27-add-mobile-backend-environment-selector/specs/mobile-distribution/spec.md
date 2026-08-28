## MODIFIED Requirements

### Requirement: EAS build profiles aligned to the app variants

The project SHALL define an `eas.json` with three build profiles — `development`, `preview`, and `production` — each setting build behavior consistent with the existing `APP_VARIANT` identity rules and an independent explicit backend-environment capability. The `development` profile SHALL build the development variant (`APP_VARIANT=development` → app id `fr.samuelprak.timecalendar.dev`) and set the development backend capability; the `preview` and `production` profiles SHALL build the production identity (`fr.samuelprak.timecalendar`, `APP_VARIANT` unset), set `OTA_CHANNEL` to their matching profile name, and independently set respectively the preview and production backend capability.

#### Scenario: Development profile builds the dev variant

- **WHEN** a build runs with the development profile
- **THEN** `APP_VARIANT=development` and the explicit development backend capability are set
- **AND** the resulting app id is `fr.samuelprak.timecalendar.dev` with the `timecalendar-dev` Firebase config and dev-variant network exceptions
- **AND** automatic OTA delivery is disabled

#### Scenario: Preview and production profiles share identity but not backend authorization

- **WHEN** a build runs with the preview or production profile
- **THEN** `APP_VARIANT` is not set to development and `OTA_CHANNEL` is respectively preview or production
- **AND** the independent backend capability is respectively preview or production
- **AND** both retain app id `fr.samuelprak.timecalendar`, production Firebase config, and no cleartext/local-networking exception

## ADDED Requirements

### Requirement: Backend capability config preserves OTA and identity authorities

Resolved app config SHALL expose the normalized backend capability in `extra` without deriving or changing `appVariant`, EAS project linkage, xprem URL, channel request headers, code-signing metadata, bundle/package identity, scheme, Firebase files, permissions, or submission behavior. Config tests SHALL prove all three profiles and malformed/missing fail-closed runtime values.

#### Scenario: Backend capability changes no release authority

- **WHEN** preview and production resolved configs are compared after the capability is added
- **THEN** identity, Firebase, signing, xprem, channel headers, and submit shape remain governed by their existing inputs
- **AND** only the explicit backend capability authorizes runtime environment choices

### Requirement: Post-change fingerprints and native-build consequence are recorded

The implementation SHALL recompute SDK 56 preview and production runtime fingerprints for iOS and Android using the repository-prescribed commands, record the exact results and relevant source differences, and state per lane whether this change is OTA-compatible or requires a fresh native build. It SHALL NOT weaken fingerprint inputs or perform a build, submission, publish, promotion, or rollout.

#### Scenario: Four-lane fingerprint proof is reproducible

- **WHEN** the documented commands run for both profiles and platforms
- **THEN** the recorded hashes can be reproduced and compared with the prior baseline
- **AND** release guidance states the native-build consequence without performing that release act
