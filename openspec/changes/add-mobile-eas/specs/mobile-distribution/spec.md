## ADDED Requirements

### Requirement: EAS build profiles aligned to the app variants
The project SHALL define an `eas.json` with three build profiles — `development`,
`preview`, and `production` — each setting build behavior consistent with the existing
`APP_VARIANT` identity rules. The `development` profile SHALL build the development
variant (`APP_VARIANT=development` → app id `fr.samuelprak.timecalendar.dev`); the
`preview` and `production` profiles SHALL build the production identity
(`fr.samuelprak.timecalendar`, `APP_VARIANT` unset) so dogfood and store builds carry the
real store bundle and the production Firebase project.

#### Scenario: Development profile builds the dev variant
- **WHEN** a build runs with the `development` profile
- **THEN** `APP_VARIANT=development` is set for the build
- **AND** the resulting app id is `fr.samuelprak.timecalendar.dev` with the
  `timecalendar-dev` Firebase config and the dev-variant network exceptions

#### Scenario: Preview and production profiles build the production identity
- **WHEN** a build runs with the `preview` or `production` profile
- **THEN** `APP_VARIANT` is not set to `development`
- **AND** the resulting app id is `fr.samuelprak.timecalendar` with the
  `timecalendar-samuelprak` Firebase config and no cleartext/local-networking exception

### Requirement: Internal distribution profile for dogfooding
The `preview` profile SHALL use `distribution: "internal"` and produce directly
installable artifacts (an iOS device `.ipa` and an Android `.apk`), so a human can install
the production-identity app on a real device for dogfooding without the full store flow.
The `development` profile SHALL also use internal distribution but target the iOS simulator
and an Android `.apk` for the fast inner loop.

#### Scenario: Preview build is installable on a real device
- **WHEN** the `preview` profile is built
- **THEN** the artifacts are an iOS device-installable `.ipa` and an Android `.apk`
- **AND** the distribution is internal (shareable install URL / internal testing), not store

#### Scenario: Production build produces store artifacts
- **WHEN** the `production` profile is built
- **THEN** it uses `distribution: "store"` with an Android `.aab` app bundle and an iOS
  store `.ipa`

### Requirement: expo-updates wired with a fingerprint runtime version policy
The app SHALL configure `expo-updates` with a `runtimeVersion` policy of `fingerprint`,
so an over-the-air JS update is only delivered to a build whose native runtime is
compatible, and any native-affecting change forces a new native build rather than a
silently incompatible OTA. The `updates.url` and `extra.eas.projectId` SHALL be sourced
from the EAS project (filled by `eas init`), with the configuration parsing cleanly when
the value is absent so type-checking and `expo config` stay green before initialization.

#### Scenario: Runtime version uses the fingerprint policy
- **WHEN** the app configuration is resolved
- **THEN** `runtimeVersion` is `{ "policy": "fingerprint" }`

#### Scenario: Config resolves without a real project id
- **WHEN** `expo config --json` runs before `eas init` has supplied a project id
- **THEN** the configuration parses without error (the project id reads from env or a
  marked placeholder)

### Requirement: Channels mapped to profiles
The project SHALL map EAS Update channels to build profiles: the `preview` profile SHALL
use the `preview` channel (the internal dogfood track) and the `production` profile SHALL
use the `production` channel. `eas update --channel <name>` SHALL deliver JS-only updates
to installed builds on the matching channel.

#### Scenario: Dogfood update targets the preview channel
- **WHEN** a JS-only update is published with `eas update --channel preview`
- **THEN** installed `preview` builds receive the update
- **AND** `production` builds do not

### Requirement: Submit configuration skeleton without committed secrets
`eas.json` SHALL include a `submit` configuration skeleton for iOS (App Store Connect)
and Android (Play) such that a human can run `eas submit` after supplying credentials.
Credential-bearing values (Apple id, App Store Connect app id, Apple team id, Google Play
service-account key) SHALL be referenced via environment variables or a key-file path and
SHALL NOT be committed.

#### Scenario: Submit skeleton carries no secrets
- **WHEN** `eas.json` is inspected in the repository
- **THEN** the `submit` profiles reference credentials by env var or key-file path
- **AND** no Apple/Google credential value is committed

### Requirement: EAS Build remains human-invoked; CI is not changed
EAS Build/Submit/Update SHALL be invoked manually by a human this step; the change SHALL
NOT add an EAS CI workflow (`.eas/workflows/`) nor alter the existing CI build path (the
native E2E continues to build via `expo prebuild` + native tooling, not EAS).

#### Scenario: No EAS CI wiring added
- **WHEN** the change is applied
- **THEN** no `.eas/workflows/` is added and the existing CI workflows are unchanged
- **AND** dogfood builds are produced by a human running `eas build`/`eas submit`/`eas update`
