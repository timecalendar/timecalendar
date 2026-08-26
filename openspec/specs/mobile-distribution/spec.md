# mobile-distribution Specification

## Purpose

TBD - created by archiving change add-mobile-eas. Update Purpose after archive.

## Requirements

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
silently incompatible OTA. The app SHALL be linked to the initialized EAS project
`@samuelprak/timecalendar` with project ID `3b427ef6-1aae-4175-8217-ea447ee6df6b`.
`extra.eas.projectId` SHALL resolve to that committed, non-secret ID by default and MAY
be overridden by `EAS_PROJECT_ID`; `updates.url` SHALL be derived from the resolved ID.

#### Scenario: Runtime version uses the fingerprint policy

- **WHEN** the app configuration is resolved
- **THEN** `runtimeVersion` is `{ "policy": "fingerprint" }`

#### Scenario: Fresh clone resolves the initialized EAS project

- **WHEN** `expo config --json` runs without `EAS_PROJECT_ID` set
- **THEN** `extra.eas.projectId` is `3b427ef6-1aae-4175-8217-ea447ee6df6b`
- **AND** `updates.url` is
  `https://u.expo.dev/3b427ef6-1aae-4175-8217-ea447ee6df6b`

#### Scenario: Environment can override the project linkage

- **WHEN** `expo config --json` runs with `EAS_PROJECT_ID` set to another valid project ID
- **THEN** `extra.eas.projectId` uses the environment value
- **AND** `updates.url` is derived from the environment value

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

### Requirement: Expo Updates launch fallback is explicitly non-blocking

The app configuration SHALL set `updates.fallbackToCacheTimeout` to `0` while preserving the existing update URL, fingerprint runtime-version policy, app identities, Firebase files, and EAS profile/channel configuration.

#### Scenario: Production config retains the safe OTA shape

- **WHEN** Expo resolves the production app configuration
- **THEN** `updates.fallbackToCacheTimeout` is `0`
- **AND** the existing `updates.url` and fingerprint runtime-version policy are unchanged
- **AND** the production app id and Firebase file selection are unchanged

#### Scenario: Development config retains its identity

- **WHEN** Expo resolves the configuration with `APP_VARIANT=development`
- **THEN** `updates.fallbackToCacheTimeout` is `0`
- **AND** the development app id, Firebase files, and network exceptions remain selected

### Requirement: The deployed xprem app exposes one public signing trust root

The repository SHALL record the deployed TimeCalendar xprem app UUID
`e89170b9-5b32-44f0-8f78-33eadb60ec28` and SHALL contain its public signing certificate at
`mobile/codesigning/certs/certificate.pem`. The certificate SHA-256 fingerprint SHALL be
`D9:24:B6:3E:67:2D:0F:D3:3D:28:F9:C9:24:C5:33:89:62:8E:83:3B:92:94:08:50:01:66:1B:E8:6F:4D:64:4A`.
The deployed xprem v3.1.2 app SHALL use its database-managed per-app signing key as the single
trust root; the repository SHALL NOT contain that private key or a separately generated Expo
signing key pair.

#### Scenario: Public bootstrap inputs are available to client wiring

- **WHEN** the downstream client initialization reads the repository bootstrap contract
- **THEN** it finds the xprem app UUID and public certificate path above
- **AND** the certificate fingerprint matches the deployed app's exported certificate

#### Scenario: Private signing material remains outside git

- **WHEN** the repository and branch diff are inspected
- **THEN** `mobile/codesigning/` contains the public certificate only
- **AND** no private key, dashboard credential, API token, or second signing trust root is present

#### Scenario: Bootstrap does not claim client wiring

- **WHEN** this change completes
- **THEN** the public app identity and trust root are available
- **AND** endpoint, request-header, channel, and certificate wiring in app configuration remain a
  separate downstream change
