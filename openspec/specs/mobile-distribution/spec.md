# mobile-distribution Specification

## Purpose

TBD - created by archiving change add-mobile-eas. Update Purpose after archive.

## Requirements

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

### Requirement: expo-updates wired with a fingerprint runtime version policy

The app SHALL configure `expo-updates` with a `runtimeVersion` policy of `fingerprint`, so a remote
JavaScript update is delivered only to a build whose native runtime is compatible and a
native-affecting change forces a new native build. Release configs SHALL use
`https://ota.timecalendar.app/manifest` as `updates.url`. The app SHALL remain linked to EAS project
`@samuelprak/timecalendar` with project ID `3b427ef6-1aae-4175-8217-ea447ee6df6b` through
`extra.eas.projectId`, resolving from `EAS_PROJECT_ID` with that committed public fallback; the EAS
identifier SHALL NOT select or derive the xprem delivery URL.

#### Scenario: Runtime version uses the fingerprint policy

- **WHEN** any app configuration is resolved
- **THEN** `runtimeVersion` is `{ "policy": "fingerprint" }`

#### Scenario: Release config resolves xprem delivery and EAS linkage independently

- **WHEN** preview or production config is resolved without `EAS_PROJECT_ID`
- **THEN** `updates.url` is `https://ota.timecalendar.app/manifest`
- **AND** `extra.eas.projectId` is `3b427ef6-1aae-4175-8217-ea447ee6df6b`

#### Scenario: EAS project override does not redirect update delivery

- **WHEN** release config is resolved with `EAS_PROJECT_ID` set to another valid project ID
- **THEN** `extra.eas.projectId` uses the environment value
- **AND** `updates.url` remains `https://ota.timecalendar.app/manifest`

### Requirement: Channels mapped from one build-time source

The project SHALL stamp release channel membership through the `expo-channel-name` entry in
`updates.requestHeaders`, sourced from a required `OTA_CHANNEL` value of `preview` or `production`.
`mobile/eas.json` SHALL set that environment value in the matching release profiles and SHALL
contain no `channel` keys. Local release builds SHALL use the same environment input. Missing or
unknown release-channel values SHALL fail config resolution rather than defaulting to production.

#### Scenario: Preview and production resolve distinct headers

- **WHEN** production-identity config is resolved with `OTA_CHANNEL=preview` or
  `OTA_CHANNEL=production`
- **THEN** `updates.requestHeaders["expo-channel-name"]` equals the supplied allowed value
- **AND** the other release lane is not selected

#### Scenario: EAS config has no second channel authority

- **WHEN** `mobile/eas.json` is recursively inspected
- **THEN** it contains no property named `channel`
- **AND** its preview and production profile environments set their matching `OTA_CHANNEL`

#### Scenario: Invalid release channel fails closed

- **WHEN** production-identity config is resolved without `OTA_CHANNEL` or with an unknown value
- **THEN** config resolution fails before a binary or update can be produced

### Requirement: Submit configuration skeleton without committed secrets

`eas.json` SHALL include submit configuration for iOS (App Store Connect) and Android (Play) such
that a human can submit an explicitly selected artifact after supplying credentials. The iOS
`preview` profile SHALL commit public App Store Connect app identifier `1479613630` as its exact
destination. Credential-bearing values, including the Apple account/team authentication inputs and
the Google Play service-account key, SHALL remain referenced through environment variables or a
key-file path and SHALL NOT be committed. The production submit profile SHALL remain unchanged by
this preview-only correction.

#### Scenario: Preview submission has one deterministic App Store destination

- **WHEN** `mobile/eas.json` is inspected in the repository
- **THEN** `submit.preview.ios.ascAppId` is exactly the string `1479613630`
- **AND** it is not an unresolved environment placeholder
- **AND** the profile's `appleId` and `appleTeamId` remain environment-backed

#### Scenario: Submit configuration carries no credentials

- **WHEN** the preview and production submit profiles are inspected
- **THEN** Apple account/team authorization and the Play service-account key remain outside git
- **AND** the committed preview App Store Connect identifier is treated only as public destination
  metadata
- **AND** the production submit profile and Android internal-track submission shape are unchanged

#### Scenario: Configuration correction performs no store action

- **WHEN** this engineering change is completed
- **THEN** no app is built, signed, uploaded, submitted, promoted, distributed, or installed
- **AND** a future store action still requires separately supplied credentials and explicit human
  authorization

### Requirement: EAS Build remains human-invoked; CI has no release automation

EAS Build and Submit SHALL remain deliberately invoked and SHALL NOT add an EAS or GitHub build
workflow in this change. xprem publishing, channel/branch administration, rollout, and rollback
SHALL remain separate operator actions and SHALL NOT be added by this change. The native E2E path
SHALL continue to build through Expo prebuild and native tooling rather than EAS. The existing
generic `Generate Expo type declarations` CI step SHALL set `APP_VARIANT=development` so its Expo
config render explicitly selects Metro/development mode; it SHALL NOT set `OTA_CHANNEL` or establish
a job-wide/default release channel.

#### Scenario: No build or publish automation is added

- **WHEN** the change is applied
- **THEN** `.eas/workflows/` and every EAS/GitHub build or publish workflow are unchanged
- **AND** no publish token, publish command wrapper, channel mutation, rollout, or rollback action is
  added

#### Scenario: Generic type generation resolves development config explicitly

- **WHEN** the existing `Generate Expo type declarations` CI step runs
- **THEN** that step sets `APP_VARIANT=development`
- **AND** it sets no `OTA_CHANNEL` and no job-wide/default channel exists
- **AND** release config resolution still fails closed without an explicit valid `OTA_CHANNEL`

### Requirement: Expo Updates launch fallback is explicitly non-blocking

Release app configuration SHALL set `updates.fallbackToCacheTimeout` to `0` while retaining the
fingerprint runtime-version policy, production identity, production Firebase files, and profile
artifact guarantees. Development configuration SHALL preserve its identity and network exceptions
while disabling automatic OTA delivery.

#### Scenario: Release config retains the safe OTA shape

- **WHEN** preview or production app configuration is resolved
- **THEN** `updates.fallbackToCacheTimeout` is `0`
- **AND** the xprem URL, fingerprint policy, production app id, Firebase files, and artifact shape
  remain selected

#### Scenario: Development config cannot poll xprem automatically

- **WHEN** Expo resolves configuration with `APP_VARIANT=development`
- **THEN** the development app id, Firebase files, and network exceptions remain selected
- **AND** Expo Updates automatic delivery is disabled

### Requirement: The deployed xprem app exposes one public signing trust root

Release app configuration SHALL send `expo-app-id` value
`e89170b9-5b32-44f0-8f78-33eadb60ec28` and an empty `xprem-branch` value in
`updates.requestHeaders`. It SHALL embed `mobile/codesigning/certs/certificate.pem` through
`updates.codeSigningCertificate` with metadata key id `main` and algorithm `rsa-v1_5-sha256`, so
all downloaded updates require a valid signature from xprem's database-managed per-app key. The
certificate SHA-256 fingerprint SHALL remain
`D9:24:B6:3E:67:2D:0F:D3:3D:28:F9:C9:24:C5:33:89:62:8E:83:3B:92:94:08:50:01:66:1B:E8:6F:4D:64:4A`.
The repository SHALL NOT contain the private key, a release-time signature-disable switch, or a
separately generated Expo signing key pair.

#### Scenario: Preview and production carry the xprem trust contract

- **WHEN** either release app configuration is resolved
- **THEN** its request headers contain the exact xprem app id and an empty branch override
- **AND** its code-signing certificate and metadata point at the committed public trust root with
  key id `main` and algorithm `rsa-v1_5-sha256`

#### Scenario: Unsigned or forged updates fail closed

- **WHEN** a release binary downloads an update without a valid signature from the private key
  corresponding to the embedded certificate
- **THEN** `expo-updates` rejects the update before application

#### Scenario: Private signing material remains outside git

- **WHEN** repository ignore rules and the final branch diff are inspected
- **THEN** private-key directories and common private key/container extensions are ignored
- **AND** the committed public certificate remains the only signing material in the repository
- **AND** no private key, dashboard credential, API token, or second signing trust root is present

### Requirement: Store distribution profiles for release lanes

The `preview` and `production` profiles SHALL both use `distribution: "store"`, produce an Android
app bundle and store-signed iOS archive, and retain remote build-number auto-incrementing. The
`development` profile SHALL remain the only internal profile and SHALL target the iOS simulator and
an Android APK for the Metro/dev-client loop.

#### Scenario: Preview build retains store-compatible artifacts

- **WHEN** the `preview` profile is inspected or built
- **THEN** its distribution is `store`, Android artifact is an app bundle, and iOS artifact is a
  store archive
- **AND** its production identity and auto-increment behavior are unchanged

#### Scenario: Development remains the only internal profile

- **WHEN** the `development` profile is inspected
- **THEN** it remains an internal dev-client build targeting the iOS simulator and Android APK

### Requirement: OTA channel fingerprint behavior is empirically recorded without weakening safety

The project SHALL resolve the SDK-56 fingerprint runtime version for preview and production on iOS
and Android, record whether the channel-specific request header changes each platform's result, and
retain proof that a native-affecting change still changes the fingerprint. A fingerprint exclusion
MUST NOT ignore app config, EAS config, package manifests/locks, config plugins, native projects, or
the signing certificate; `.fingerprintignore` SHALL be absent unless a narrower channel-only input
is proven safe and the native-change control remains effective.

#### Scenario: Preview and production comparison is reproducible

- **WHEN** a maintainer follows the recorded project-local SDK-56 commands
- **THEN** they can reproduce the iOS and Android preview/production runtime versions and inspect
  the sources responsible for equality or difference

#### Scenario: Native-affecting change remains isolated

- **WHEN** the recorded native-affecting fixture is applied in a scratch copy
- **THEN** the fingerprint differs from its unchanged control on the affected platform
- **AND** no broad fingerprint exclusion was used to obtain the result

### Requirement: iOS builds preserve the iPhone and iPad device-family contract

The mobile app SHALL support both iPhone and iPad for development, preview, and production iOS configurations. Expo source configuration SHALL remain the authority for that contract, and a clean production-identity prebuild SHALL generate application-target device families `1,2`. Generated native projects SHALL remain disposable and uncommitted.

#### Scenario: Every Expo variant declares tablet support

- **WHEN** development, preview, and production Expo configurations are resolved
- **THEN** each configuration has `ios.supportsTablet` set to `true`
- **AND** each configuration retains the same iPhone+iPad product support contract

#### Scenario: Preview prebuild generates both device families

- **WHEN** a clean iOS prebuild is generated with `OTA_CHANNEL=preview`
- **THEN** the generated application target resolves `TARGETED_DEVICE_FAMILY` to `1,2`
- **AND** no generated `mobile/ios/` project is committed as source

### Requirement: iPad support remains portrait-only

The app SHALL retain top-level Expo orientation `portrait` while supporting tablets and SHALL set `ios.requireFullScreen` to `true`. A clean iOS prebuild SHALL require full-screen presentation, expose only portrait orientations for iPad, and SHALL NOT enable either iPad landscape orientation. Side-by-side iPad multitasking is intentionally outside the supported contract because it requires landscape orientations.

#### Scenario: Source configuration retains portrait intent

- **WHEN** development, preview, and production Expo configurations are resolved
- **THEN** each resolved configuration has `orientation` equal to `portrait`
- **AND** each has `ios.requireFullScreen` set to `true`

#### Scenario: Generated iPad orientations exclude landscape

- **WHEN** the clean preview iOS prebuild is inspected
- **THEN** `UIRequiresFullScreen` is true
- **AND** the effective iPad-supported orientation list uses its iPad-specific value when present or the generic fallback and contains portrait orientation values only
- **AND** `UIInterfaceOrientationLandscapeLeft` and `UIInterfaceOrientationLandscapeRight` are absent

### Requirement: Restored iPad support refreshes runtime compatibility evidence

The repository SHALL resolve and record the post-change SDK 56 iOS runtime fingerprints for preview and production using the project-local managed-workflow commands. Documentation SHALL state that the native device-family change requires a fresh signed iOS binary and SHALL NOT be delivered to the rejected or previous shell as an OTA update. Fingerprint protection SHALL NOT be weakened to preserve an old hash.

#### Scenario: Authoritative fingerprint tables match the corrected source

- **WHEN** the documented iOS preview and production fingerprint commands run on the applied change
- **THEN** their exact results match the values recorded in the Architecture Book and operator guide
- **AND** no broad `.fingerprintignore` excludes native configuration

#### Scenario: Engineering completion does not submit a build

- **WHEN** this change is completed
- **THEN** documentation identifies a fresh signed iOS preview binary as the next release requirement
- **AND** no EAS build, upload, App Store Connect submission, or store-console mutation has been performed by this ticket

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
