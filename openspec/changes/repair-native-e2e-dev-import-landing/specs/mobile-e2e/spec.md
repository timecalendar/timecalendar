## MODIFIED Requirements

### Requirement: E2E builds reach the local server

The `development` app variant SHALL be able to reach a server on the host machine over plain HTTP, and an e2e build SHALL be both pointed at that server and authorized to select it. Android cleartext traffic and iOS local-networking ATS exceptions are enabled for that variant only; the e2e build bakes the platform-correct base URL (`http://10.0.2.2:3005` on Android, `http://localhost:3005` on iOS) via `EXPO_PUBLIC_API_URL`, and bakes `BACKEND_ENVIRONMENT_CAPABILITY=development` alongside it. Both variables are required together: the capability is what admits the `local` environment, and a build that omits it resolves the production API and silently discards the baked URL.

#### Scenario: A release-config dev-variant build calls the harness server

- **WHEN** a release-configuration build of the `development` variant runs on an emulator/simulator while the harness server listens on host port 3005
- **THEN** the app's HTTP request reaches the server (not blocked by Android cleartext policy or iOS ATS) without Metro running

#### Scenario: An e2e build resolves the baked URL rather than production

- **WHEN** an e2e build bakes `EXPO_PUBLIC_API_URL` and the app starts with no stored environment selection, as it does after every flow's `launchApp: clearState: true`
- **THEN** the effective API base URL is the baked local URL, not `PRODUCTION_API_URL`

#### Scenario: The production variant carries no exceptions

- **WHEN** the app is built with `APP_VARIANT` unset or `production`
- **THEN** no cleartext or local-networking exception is present in the native config
