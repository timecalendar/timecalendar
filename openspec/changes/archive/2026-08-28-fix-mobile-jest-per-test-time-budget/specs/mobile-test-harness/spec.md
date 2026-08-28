## ADDED Requirements

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
