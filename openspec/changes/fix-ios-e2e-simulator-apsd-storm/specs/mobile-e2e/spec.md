## ADDED Requirements

### Requirement: The CI iOS simulator runs without the APNs daemon

The `e2e-mobile-ios` job SHALL disable and boot out `com.apple.apsd` in the selected simulator's `user/foreground` launchd domain after the simulator finishes booting and before the application is installed or any Maestro flow runs. The job SHALL do this through `mobile/e2e/quiesce-ios-simulator.sh`, which SHALL fail the step when `com.apple.apsd` is still listed in the simulator's launchd after the bootout. The job SHALL NOT compensate for host starvation with added retries or longer timeouts. A device-free baseline check SHALL pin both the workflow call and the script's behavior on every pull request that touches the E2E harness or workflow.

#### Scenario: The simulator is quiesced before the app is installed

- **WHEN** the iOS job boots the selected simulator
- **THEN** it runs the quiesce script with that simulator's UDID after `xcrun simctl boot` and before `xcrun simctl install`
- **AND** the script waits for boot completion, disables `user/foreground/com.apple.apsd`, and boots it out

#### Scenario: The daemon survives the bootout

- **WHEN** the simulator's `launchctl list` still contains `com.apple.apsd` after the bootout
- **THEN** the script exits non-zero with a message naming the daemon and the UDID
- **AND** the iOS job fails at the boot step instead of running flows on a starved host

#### Scenario: The daemon was already gone

- **WHEN** `launchctl bootout` returns non-zero because the service is not loaded
- **THEN** the script continues to the check and succeeds when `com.apple.apsd` is not listed

#### Scenario: The quiesce call is removed or reordered

- **WHEN** the iOS boot step no longer calls the quiesce script, or calls it after `xcrun simctl install`
- **THEN** `test_ci_mobile_e2e.sh` fails on the pull request

#### Scenario: The script stops checking its result

- **WHEN** the script is changed so it exits zero while a fake `xcrun` reports `com.apple.apsd` still loaded, or so a failed `launchctl disable` is ignored
- **THEN** `test_quiesce_ios_simulator.sh` fails on the pull request without a simulator
