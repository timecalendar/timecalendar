## 1. Close asynchronous test operations

- [x] 1.1 In `sync.test.tsx`, await the reset test's RNTL `act` call and place that test before at least one other case so the ordinary Jest order remains a CI proof that its act scope closes; change no assertion, then run the file normally and with `--randomize --seed=7`.
- [x] 1.2 In `subscription.test.tsx`, await the reset test's RNTL `act` call and keep the trigger before a later case as a baseline CI proof; change no assertion, then run the file normally and with `--randomize --seed=7`.
- [x] 1.3 In `timezone-settings-screen.test.tsx`, await each `fireEvent.press` directly, removing any redundant outer `act` wrapper, and keep the formerly terminal Automatic case before a later render as a baseline CI proof; change no assertion, then run the file normally and with `--randomize --seed=7`.
- [x] 1.4 In `add-calendar.test.tsx`, await the reset test's RNTL `act` call and keep the trigger before a later case as a baseline CI proof; change no assertion, then run the file normally and with `--randomize --seed=7`.

## 2. Add exception-safe suite teardown

- [x] 2.1 Add targeted `afterEach` resets in `sync.test.tsx` for the mutator response queue and repository spy implementation; reinstall deterministic defaults in `beforeEach` and verify an intentionally unconsumed one-shot value cannot reach the next test.
- [x] 2.2 Add targeted `afterEach` resets/removals in `subscription.test.tsx` for its mutator/token/calendar mocks, localization spy, and notification/language/timezone MMKV keys; reinstall defaults in `beforeEach` and do not call `jest.restoreAllMocks()`.
- [x] 2.3 Move timezone preference cleanup ownership to `afterEach` in `timezone-settings-screen.test.tsx` so a throwing test cannot leave MMKV state for another test; retain deterministic pre-test setup only if the suite still needs it.
- [x] 2.4 Add targeted `afterEach` resets in `add-calendar.test.tsx` for the two-response mutator queue and repository spy implementation; reinstall the default upsert behavior in `beforeEach` and do not call `jest.restoreAllMocks()`.

## 3. Record the reusable rule

- [x] 3.1 Update `docs/mobile/architecture-book/testing.md` with the RNTL 14 async-helper rule, targeted `afterEach` ownership for one-shot mocks/spies/test storage, and the prohibition on global restore that protects harness-installed native spies.
- [x] 3.2 Add a dated entry to `docs/mobile/architecture-book/CHANGELOG.md`; record that no ADR is needed because the change applies the existing test-isolation contract without a costly-to-reverse architecture decision.

## 4. Verification and CI proof

- [x] 4.1 Run the four affected files with `npx jest --ci --randomize --seed=<n>` for every seed 1–25 and record the complete green sweep; rerun and classify timeout-only failures under ADR 044 rather than weakening a wait, matcher, or timeout.
- [x] 4.2 Run at least three full mobile-suite randomized seeds, including seed 7, and record each exact command and result.
- [x] 4.3 Run local-green checks for the touched mobile surface: focused Jest in ordinary declaration order, `npx tsc --noEmit`, `npm run lint`, and formatting/check hooks.
- [x] 4.4 Run the exact CI unit/coverage proof `npm test -- --coverage`, confirming the reordered existing cases pass without any assertion change and coverage thresholds remain green.

### Verification record

- Focused ordinary order: `npx jest --ci <four affected files>` — 4/4 suites and 25/25 tests passed.
- Focused random order: `npx jest --ci --randomize --seed=<n> <four affected files>` — every seed 1–25 passed, 4/4 suites and 25/25 tests per seed.
- Full random order: `npx jest --ci --randomize --seed=1`, `--seed=7`, and `--seed=13` — 119/119 suites and 828/828 tests passed for each seed.
- Full seed 25 additionally exposed an unrelated pre-existing `splash-screen.test.tsx` order dependency; all four suites in this change passed in that run.
- Static/format gates: `npx tsc --noEmit` and `npm run lint` passed; the latter includes the repository's Prettier check.
- Coverage baseline: `npm test -- --coverage` passed, 119/119 suites and 828/828 tests, with configured thresholds satisfied.
