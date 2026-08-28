## ADDED Requirements

### Requirement: Suite-owned mutable mock state is isolated between tests

A mobile Jest suite that mutates spy call history or one-shot mock implementations SHALL reset that suite-owned state before another test can observe it, including when the owning test throws. Cleanup SHALL be scoped so persistent native-module spies installed by `jest/setup-*.ts` remain installed with their harness defaults; suites SHALL NOT use `jest.restoreAllMocks()` when it would discard those setup spies.

#### Scenario: Randomized order does not expose animation call history

- **WHEN** the splash dismissal cases run with Jest randomization and the motion-allowed case executes before the reduced-motion case
- **THEN** the reduced-motion case starts with zero `Animated.timing` calls from earlier cases
- **AND** its existing assertion that no animation was scheduled passes

#### Scenario: Exceptional exit cannot leak one-shot reduced-motion state

- **WHEN** a splash dismissal case exits before consuming or cleaning all of its suite-owned mock state
- **THEN** exception-safe teardown removes its animation call history and queued reduced-motion result
- **AND** the next case observes the harness's default reduced-motion implementation

#### Scenario: Suite-wide native-module spies survive local cleanup

- **WHEN** the splash dismissal teardown resets its suite-owned state
- **THEN** the `AccessibilityInfo` spy wrappers installed by `jest/setup-splash.ts` remain active
- **AND** no blanket mock restoration is required
