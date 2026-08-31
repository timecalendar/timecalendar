## MODIFIED Requirements

### Requirement: E2E builds reach the local server

The `development` app variant SHALL be compiled with the explicit `development` backend-environment capability and SHALL be able to reach a server on the host machine over plain HTTP. Every Expo-config evaluation used by the Android and iOS release-config E2E build lanes SHALL receive that capability. Android cleartext traffic and iOS local-networking ATS exceptions SHALL remain enabled for the development variant only, and the E2E build SHALL bake the platform-correct base URL (`http://10.0.2.2:3005` on Android, `http://localhost:3005` on iOS) via `EXPO_PUBLIC_API_URL`.

#### Scenario: A release-config dev-variant build calls the harness server

- **WHEN** a release-configuration build of the `development` variant runs on an emulator/simulator while the harness server listens on host port 3005
- **THEN** resolved Expo config exposes `extra.backendEnvironmentCapability` as `development`
- **AND** fresh storage selects the compiled platform-local URL and the app's HTTP request reaches the server without Metro running
- **AND** the request is not blocked by Android cleartext policy or iOS ATS

#### Scenario: Both native build phases retain development capability

- **WHEN** either native E2E job evaluates Expo config during prebuild or release compilation
- **THEN** the job supplies `BACKEND_ENVIRONMENT_CAPABILITY=development` independently from `APP_VARIANT` and `EXPO_PUBLIC_API_URL`

#### Scenario: The production variant carries no exceptions

- **WHEN** the app is built with `APP_VARIANT` unset or `production` and without an explicit non-production backend capability
- **THEN** no cleartext or local-networking exception is present in the native config
- **AND** the backend capability fails closed to `production`
