## ADDED Requirements

### Requirement: Mobile tests are isolated from declaration order

Every mobile Jest test SHALL await each asynchronous React Native Testing Library operation it starts before returning. A suite that changes mock implementations, one-shot mock queues, spies, or persistent test storage SHALL tear down that suite-owned state after each test, including when the test throws. Teardown SHALL be targeted and SHALL NOT use `jest.restoreAllMocks()` when doing so would remove harness-owned native-module spies.

#### Scenario: Async interaction completes inside its owning test

- **WHEN** a test invokes an asynchronous RNTL helper such as `act`, `fireEvent`, `render`, or `renderHook`
- **THEN** the test awaits the returned work before finishing, and the following test does not inherit an open React act scope

#### Scenario: An unused one-shot mock value cannot reach the next test

- **WHEN** a test queues a one-shot mock implementation and then throws before consuming it
- **THEN** suite-owned `afterEach` teardown removes that implementation before the next test runs

#### Scenario: Persistent preference state is removed after a throwing test

- **WHEN** a test writes a notification, language, or timezone preference and then throws
- **THEN** suite-owned `afterEach` teardown removes the written test state before the next test runs

#### Scenario: Randomized order preserves results

- **WHEN** the affected mobile suites run with Jest test randomization across representative seeds
- **THEN** every test retains the same assertions and results independent of its position in the file

#### Scenario: Harness-owned native spies survive suite teardown

- **WHEN** an affected suite tears down its own spies and mocks
- **THEN** the `AccessibilityInfo` and other native-module spies installed by `jest/setup-*.ts` remain installed for later tests
