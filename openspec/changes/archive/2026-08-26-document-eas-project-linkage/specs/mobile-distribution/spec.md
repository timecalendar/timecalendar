## MODIFIED Requirements

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
