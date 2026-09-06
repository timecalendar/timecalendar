# mobile-test-harness Specification

## Purpose
TBD - created by archiving change add-mobile-test-harness. Update Purpose after archive.
## Requirements
### Requirement: Jest + RNTL unit/component harness

`mobile/` SHALL have a Jest test harness on the `jest-expo` preset with React Native Testing Library, runnable as `npm test`, with tests colocated next to the source they cover (`*.test.ts` / `*.test.tsx`).

#### Scenario: Tests run green with one command

- **WHEN** `npm test` is run in `mobile/`
- **THEN** Jest runs all colocated tests under the `jest-expo` preset and exits 0 with at least one real component test passing

#### Scenario: Component behavior is tested at the mutator seam

- **WHEN** the schools screen component test runs
- **THEN** it mocks `src/api/mutator` (the single designed fetch seam), renders the screen through the real generated hook and a QueryClient, and asserts the seeded-shape school data renders — without any network access

### Requirement: Coverage reporting on, K-3 thresholds deferred

The harness SHALL produce a coverage report in CI, and SHALL NOT yet enforce `coverageThreshold`. The K-3 gate (90% logic paths / 70% global) is recorded as explicit debt whose trigger is the first feature with logic paths (Settings).

#### Scenario: CI reports coverage without gating on it

- **WHEN** the `test-mobile` CI job runs the Jest step
- **THEN** coverage is collected and reported, and the job's pass/fail depends only on test results, not on coverage percentages

#### Scenario: The deferral is recorded where it will be found

- **WHEN** a contributor reads the Architecture Book's testing section
- **THEN** the K-3 deferral, its rationale, and its trigger (first logic-bearing feature) are stated explicitly

### Requirement: CI gate for unit tests

The `test-mobile` CI job SHALL run the unit test suite with the same entrypoint used locally, so local and CI cannot diverge on what "passing" means.

#### Scenario: The CI job fails on a failing test

- **WHEN** any Jest test fails on a pushed commit
- **THEN** the `test-mobile` job fails via the same `npm test` entrypoint a developer runs locally

### Requirement: Explicit per-test time budget, sized for the harness

The Jest harness SHALL declare an explicit per-test time budget in `mobile/jest.config.js`,
sized for what this harness actually does — mount real React Native component trees, under
coverage instrumentation, on a possibly cold transform cache — rather than inheriting
Jest's default, which is sized for trivial units. The budget SHALL be at least 20 000 ms,
and a test SHALL NOT carry its own local override to work around the suite-wide budget.

The budget is a capacity setting: it bounds how long a test may take to *execute*. It SHALL
NOT be used, and SHALL NOT be cited as precedent for using, a longer query wait
(`waitFor` / `findBy*`), a retry, or a weakened matcher to make a failing assertion pass.

#### Scenario: A first-render-heavy test is not billed a false failure

- **WHEN** the suite runs with `--coverage` on a cold transform cache while the machine is
  contended, and one test is the first to mount a component tree whose React Native / Expo
  host components register lazily
- **THEN** that test completes and reports its real cost, instead of failing with
  `Exceeded timeout of … ms for a test`

#### Scenario: A genuinely missing element still fails immediately

- **WHEN** a screen stops rendering a value one of its tests asserts with a synchronous
  query such as `getByText`
- **THEN** that test fails at the assertion, in milliseconds, and the budget does not delay
  or mask the failure

#### Scenario: The budget cannot silently drift back to the default

- **WHEN** the per-test budget is removed from `mobile/jest.config.js`, or lowered below
  the floor
- **THEN** the baseline `Run tests` job fails on the config guard test

### Requirement: A platform override in a test is restored before the next test

An override of `Platform.OS` SHALL be restored before the next test runs, including when
the overriding test throws, so no test observes a platform another test selected.
`usePlatform` is the mechanism for a `describe`-scoped override; a `try`/`finally` that
restores the captured original is equally conforming. Tests SHALL NOT call
`jest.replaceProperty(Platform, "OS", …)` inline in an `it`, and SHALL NOT rely on
`jest.restoreAllMocks()` for the restore, because that would also discard the suite-wide
native-module spies installed by the `jest/setup-*.ts` files.

#### Scenario: The platform is restored even when the overriding test fails

- **WHEN** a test inside a platform-scoped block throws before completing
- **THEN** the following test observes the harness's default platform, not the override

#### Scenario: Test order is not load-bearing

- **WHEN** the suite is run with `jest --randomize`
- **THEN** no test fails because an earlier test changed `Platform.OS`

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

### Requirement: Jest terminates after successful mobile tests

The mobile Jest harness SHALL release every test-owned resource after the final suite and SHALL return exit code 0 naturally when all tests pass. It MUST NOT depend on `--forceExit`, an external signal, or a job timeout to terminate.

#### Scenario: Full serial gate exits naturally

- **WHEN** `npm test -- --runInBand` completes with every mobile suite passing
- **THEN** the Jest process returns exit code 0 on its own after the terminal summary
- **AND** it does not print the Jest did-not-exit warning

#### Scenario: Open-handle diagnostics are not masked

- **WHEN** a mobile test leaves a referenced timer, subscription, request, or other runtime resource active
- **THEN** the owning test or harness cleanup is repaired at its narrow seam
- **AND** neither `--forceExit` nor global console suppression is used to hide it

### Requirement: Test-owned QueryClients do not retain cache timers

Mobile tests that exercise real TanStack Query hooks SHALL create their QueryClient through the shared test-support seam. Test clients SHALL use timer-free garbage-collection defaults for queries and mutations, SHALL remain stable for the mounted provider lifetime, and SHALL clear suite-owned cache state during targeted teardown.

#### Scenario: An inactive query cannot retain Jest

- **WHEN** a hook test fetches data through a test-owned QueryClient and its observer unmounts
- **THEN** the client schedules no referenced cache garbage-collection timer that keeps Jest alive
- **AND** its query and mutation caches are empty after teardown

#### Scenario: Production cache policy is unchanged

- **WHEN** the test QueryClient lifecycle is hardened
- **THEN** the application QueryClient retains its existing production freshness, persistence, retry, and garbage-collection policy

#### Scenario: A cache-expiry test opts into finite time explicitly

- **WHEN** a focused test needs to verify finite cache expiry
- **THEN** it overrides the test default explicitly, advances controlled fake timers, and clears the client before returning

### Requirement: Async React work remains inside its owning test

Every asynchronous RNTL 14 helper and React state transition started by an affected mobile test SHALL be awaited before that test or its exception-safe teardown returns. The affected suites SHALL emit no act-related console errors, and tests MUST NOT settle by adding sleeps, retries, longer query waits, or redundant nested act scopes.

#### Scenario: RNTL events use one awaited act scope

- **WHEN** an affected test renders, fires an event, rerenders, or unmounts through RNTL 14
- **THEN** it awaits the helper directly
- **AND** `fireEvent` is not wrapped in a redundant exported `act`

#### Scenario: Expected rejection commits state before assertion

- **WHEN** a hook action rejects after setting catch/finally state
- **THEN** the rejection is contained inside the awaited act scope
- **AND** error and pending state assertions run only after React commits the update

#### Scenario: External-state teardown follows unmount

- **WHEN** a suite renders a component subscribed to a storage key, timer, or native spy and then cleans that state
- **THEN** it first awaits component cleanup/unmount
- **AND** targeted exception-safe teardown restores the suite-owned state without removing harness-owned spies

#### Scenario: Warning-free regression run

- **WHEN** the affected component and hook suites run together, including representative randomized seeds
- **THEN** their existing behavioral assertions pass
- **AND** output contains no unwrapped-act, overlapping-act, unsupported-act-environment, or unawaited-async-act console error
