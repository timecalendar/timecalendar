## Context

`mobile/src/features/splash/ui/splash-screen.test.tsx` has two dismissal cases that both obtain spies for `AccessibilityInfo.isReduceMotionEnabled` and `Animated.timing`. Jest returns the existing spy when the same property is spied on again, so the motion-allowed case's `Animated.timing` call remains in that spy's history. Declared order hides the leak because the zero-call assertion runs first; seed 25 reverses the relevant cases and exposes it.

The file's current `afterEach` drains pending fake timers and restores real timers, but it does not clean the two mutable spies. `jest/setup-splash.ts` deliberately installs suite-wide `AccessibilityInfo` spies, so blanket restoration would remove harness infrastructure used by this and later suites. The Architecture Book already prohibits `jest.restoreAllMocks()` for this reason.

This is an R-4 leaf test defect: it does not change splash runtime behavior or introduce a costly-to-reverse architecture choice, so no ADR is needed.

## Goals / Non-Goals

**Goals:**

- Make every splash dismissal case start with clean animation call history and a known reduced-motion mock implementation regardless of execution order.
- Ensure cleanup still runs when a test or pending-timer drain throws.
- Keep the existing behavior assertions and timer-driven dismissal proof intact.
- Preserve the suite-wide native-module spies installed by `jest/setup-splash.ts`.

**Non-Goals:**

- No production changes to `SplashScreen`, `useAppReady`, animation timing, or reduced-motion behavior.
- No global Jest reset policy, retry, timeout, wait, matcher, or test-order change.
- No native/device validation: this regression exists entirely in the off-device Jest harness.
- No changes to API contracts, dependencies, schema, native/store config, workflows, or legacy Flutter.

## Decisions

### Decision 1 — Own and reset only the dismissal block's mutable spies

The dismissal test block will retain stable references to the existing reduced-motion spy and its animation spy, then clean those exact mocks in `afterEach`. The animation spy's call history will be cleared. The reduced-motion spy will be reset and returned to the suite default (`false`) so both call history and an unconsumed `mockResolvedValueOnce` queue are removed before another test runs.

This is narrower than `jest.clearAllMocks()`, which would clear unrelated harness mocks, and safer than clearing call history alone, which would still allow a one-shot reduced-motion result to leak if a test throws before consuming it. `jest.restoreAllMocks()` is rejected because it would discard the suite-wide `AccessibilityInfo` spy wrappers rather than restore their known default behavior.

Each case may continue to set the one-shot reduced-motion value it needs, and the zero-call / positive-call assertions remain unchanged.

### Decision 2 — Make timer restoration and mock cleanup one exception-safe teardown

The existing pending-timer drain will be wrapped so real timers and the two targeted mock resets run from a `finally` path. Jest already invokes `afterEach` when the test body throws; the explicit `finally` also covers a failure while draining pending timers. This prevents a primary failure from leaving fake timers or mock state behind and causing misleading downstream failures.

Moving cleanup to `beforeEach` was rejected as the sole mechanism because it would protect the next test but would leave the owning test's state live after completion and would not satisfy the suite's teardown contract. Per-test `try`/`finally` blocks were rejected as repetitive and easier to omit from a future dismissal case.

### Decision 3 — Prove the regression at the file boundary

The existing reduced-motion assertion is the behavioral CI proof: it must still fail if the motionless path schedules an animation. Verification will run the single splash file once in declared order and once with `--randomize --seed=25`, the smallest command that demonstrates both the baseline and the formerly failing ordering. The full mobile suite is left to normal CI; no workflow change or native E2E run is justified for a Jest-only teardown change.

The reusable rule will be added to `docs/mobile/architecture-book/testing.md` and recorded in `CHANGELOG.md`: mutable suite-owned mock state must be reset through exception-safe teardown, with targeted cleanup preferred where global setup owns persistent spies.

## Risks / Trade-offs

- **A reset could erase the suite-wide default implementation.** → Re-establish `isReduceMotionEnabled` as a resolved `false` default while preserving the spy wrapper.
- **A future dismissal spy could be added without cleanup.** → Keep ownership and teardown together in the dismissal block, and document the general rule in the test-harness contract.
- **The file passes ordinary order before the fix, so ordinary verification alone is weak.** → Require the exact seed-25 randomized command in the task and handoff evidence.

## Migration Plan

Test and documentation only. Land the targeted teardown and documentation together; rollback is a straight revert with no persisted or runtime state implications.

## Open Questions

None. The failure, owner, and verification seed are reproducible.
