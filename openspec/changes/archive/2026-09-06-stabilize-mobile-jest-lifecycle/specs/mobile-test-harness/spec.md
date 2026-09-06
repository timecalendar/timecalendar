## ADDED Requirements

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
