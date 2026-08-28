## Context

The four suites are green in declaration order and fail 15 tests when run together with `--randomize --seed=7`. Focused verbose runs show a trigger test passing and later renders failing with `result.current === null`, missing rendered text, and React warnings about an unawaited or overlapping `act` scope.

React Native Testing Library 14 implements `render`, `renderHook`, `fireEvent`, and its exported `act` as asynchronous functions. The trigger in each suite is therefore concrete:

| Suite | Primary leaked state | Secondary mutable state that needs exception-safe teardown |
| --- | --- | --- |
| `calendar/data/sync/sync.test.tsx` | The reset test calls `act(() => reset())` without awaiting the returned thenable. When randomized first at seed 7, React's global act scope remains open and the other six hooks render with a null result. | `customFetch` one-shot response queue and the module-scope `replaceAll` spy implementation. |
| `notifications/data/subscription.test.tsx` | The reset test also leaves the asynchronous `act` thenable pending; seven later tests fail after it runs early at seed 7. | The `getCalendars` module-scope spy, mutator/token/calendar-hook mocks, and MMKV notification/language/timezone preferences. |
| `settings/ui/timezone-settings-screen.test.tsx` | The Automatic test starts two asynchronous `fireEvent.press` calls without awaiting either; a later render encounters overlapping act scopes. | The MMKV timezone preference written by the selection tests. |
| `calendar-sources/data/user-calendars/add-calendar.test.tsx` | The reset test leaves its asynchronous `act` thenable pending; the later success hook renders with a null result at seed 7. | The two-entry `customFetch.mockResolvedValueOnce` queue and the module-scope `upsert` spy implementation. |

`jest.clearAllMocks()` clears call history only. It does not drain unused `mockResolvedValueOnce` entries or reset implementations, so an early assertion failure can turn one genuine red test into an order-dependent tail. The Jest config intentionally does not enable global `resetMocks` or `restoreMocks`; `jest.restoreAllMocks()` is prohibited because it would also remove the suite-wide `AccessibilityInfo` spies installed by `jest/setup-splash.ts`.

## Goals / Non-Goals

**Goals:**

- Close every testing-library act scope before its test returns.
- Reset only state owned by each affected suite in `afterEach`, so teardown runs after success or failure.
- Preserve every existing assertion and the production-real hook/mutator test boundaries.
- Prove order independence across seeds 1–25 for the four files, then protect the ordinary full-suite and coverage baselines.

**Non-Goals:**

- Enabling `--randomize` in CI or editing `.github/workflows/**`.
- Changing Jest-wide reset/restore settings or any `jest/setup-*.ts` file.
- Revisiting the per-test time budget from ADR 044.
- Changing production code, API contracts, schemas, native configuration, dependencies, or Flutter.

## Decision 1: Await the asynchronous testing-library operation at its call site

The three reset tests will await the returned `act` thenable. The timezone tests will await each `fireEvent.press` directly and avoid wrapping a helper that already owns `act` in an unnecessary outer act scope.

This closes the exact React global state identified by the warnings and keeps the causal operation inside its test. Reordering tests, adding retries, increasing timeouts, or weakening matchers would preserve the leak and are rejected. A generic post-test delay is also rejected because it does not establish which work must finish.

## Decision 2: Reset suite-owned mutable state in `afterEach`

Each suite will add targeted teardown for state it owns:

- reset mutator mocks and repository spy implementations so unused one-shot values cannot cross a test boundary;
- reset the localization spy and other per-case mocked implementations in the subscription suite;
- remove the timezone and notification/settings MMKV keys written by the current test.

`beforeEach` remains responsible for installing deterministic defaults for the next test. `afterEach` owns cleanup, because it runs even when the test body or an assertion throws. Targeted `mockReset`, preference removal, and individual spy handling are used instead of `jest.restoreAllMocks()`.

## Decision 3: Keep randomization as focused proof, not a new CI policy

The implementation proof will run the four files with `--randomize` for seeds 1–25. It will then run at least three distinct full-suite randomized seeds including seed 7, plus `npm test -- --coverage`.

The focused sweep is the discriminating proof for intra-file order dependence and avoids 25 expensive whole-suite runs on a shared host. A timeout under host contention is classified using ADR 044 and rerun; it is not treated as order dependence without reproduction.

No workflow or Jest configuration change is required. The Architecture Book will record the reusable local isolation rule, while the OpenSpec task list records the finite acceptance sweep.

## Risks / Trade-offs

- **[Risk] Targeted reset omits a suite-owned mock added later.** → Name the mocks in the teardown and document that one-shot implementations belong to the test that queues them.
- **[Risk] Resetting a module-scope spy removes the default needed by the next test.** → Reinstall deterministic defaults in `beforeEach` after the prior test's `afterEach` reset.
- **[Risk] A randomized proof fails only because the shared host exceeds ADR 044's capacity regime.** → Rerun timeout-only failures and report them separately from assertion, act-scope, or mock-value failures.
- **[Trade-off] CI still does not continuously randomize tests.** → This ticket removes the known latent dependencies; deciding the recurring CI cost and policy remains explicitly out of scope.

## Migration Plan

No runtime migration or rollback is required. Apply the four test-only isolation changes and documentation update, run the focused and baseline proofs, and revert the test/documentation commit if an unexpected regression appears.

## Open Questions

None. The seed-7 reproduction and RNTL 14 implementation identify the failing mechanism, and the scope and verification tiers are fixed by the issue brief.
