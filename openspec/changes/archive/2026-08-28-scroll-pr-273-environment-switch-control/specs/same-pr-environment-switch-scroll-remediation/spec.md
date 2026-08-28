## ADDED Requirements

### Requirement: The existing environment control is revealed without weakening the flow

PR #273's shared `mobile/.maestro/environment-switch.yaml` flow SHALL contain exactly one
`scrollUntilVisible` command immediately after `tapOn: "Settings"` and immediately before the
existing `extendedWaitUntil` for `id: "settings-environment"`. The command MUST target
`element.id: "settings-environment"`, use `direction: DOWN`, and use `timeout: 60000`. The existing
wait and every subsequent selector, tap, confirmation, and final environment-marker assertion
SHALL remain unchanged.

#### Scenario: The off-screen control is revealed on either native viewport

- **WHEN** the shared flow opens Settings on Android or iOS and the environment control is below the
  visible viewport
- **THEN** Maestro scrolls down until `id: "settings-environment"` is visible, bounded by 60000 ms
- **AND** the unchanged readiness wait subsequently verifies the same id before Maestro taps it

#### Scenario: The switch contract remains intact after the scroll

- **WHEN** the scroll and existing wait complete
- **THEN** the flow still taps the existing environment control and `Preproduction`, asserts
  `Clear data and switch?`, taps `Clear and switch`, and waits for the existing preproduction marker

#### Scenario: The remediation remains isolated to one flow command

- **WHEN** the implementation diff is reviewed
- **THEN** only the specified `scrollUntilVisible` command is added to
  `mobile/.maestro/environment-switch.yaml`
- **AND** every other Maestro flow, product layout/runtime file, Architecture Book rule, and
  sensitive surface remains unchanged
- **AND** `.github/workflows/ci-mobile-e2e.yml` still contains exactly the four existing development
  backend-capability entries

#### Scenario: Fresh native proof is exact-head

- **WHEN** the one-command implementation is committed and pushed to the existing PR branch
- **THEN** fresh baseline, Android native E2E, and iOS native E2E jobs run against that exact head
- **AND** Simplifier and Reviewer do not rely on earlier-head native evidence
