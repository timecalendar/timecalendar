## Why

The React Native unit gate reports all 151 suites and 1,311 tests passing but keeps the Node process alive behind referenced cache timers, so local and CI completion cannot be trusted. The same baseline emits actionable React `act` warnings from test work that escapes its owning test, weakening the harness's existing isolation contract.

## What Changes

- Give test-owned TanStack Query clients one shared construction and teardown pattern that disables cache-lifetime timers under Jest and clears client state after each test.
- Repair the affected component and hook suites so every asynchronous RNTL 14 render, event, rerender, unmount, rejection, and state cleanup settles inside its owning test or exception-safe teardown.
- Add focused regression proof for the retained-timer seam and for warning-free execution of the suites that currently emit `act` diagnostics.
- Verify the complete `mobile/` Jest command returns exit code 0 naturally, without `--forceExit`, console suppression, sleeps, retries, or relaxed assertions.
- Keep the Architecture Book's testing guidance aligned with the executable test-query-client and teardown patterns.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-test-harness`: Require the full Jest gate to terminate naturally and require test-owned asynchronous React and TanStack Query resources to be settled without actionable console diagnostics.

## Impact

- Affected repository areas: `mobile/src/test-support/`, test-local QueryClient wrappers, and the currently warning component/hook suites under calendar, calendar sources, feedback, notifications, personal events, school selection, splash, and shared hooks; `docs/mobile/architecture-book/testing.md` may receive a pointer-level clarification.
- Production runtime behavior, dependencies, translations, accessibility behavior, testIDs, public feature barrels, and dependency direction remain unchanged.
- No OpenAPI/generated client, database migration, native/store/EAS configuration, deployment/CI workflow, secret path, or legacy Flutter sensitive surface is expected to change.
