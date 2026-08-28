## 1. Isolate splash dismissal mock state

- [x] 1.1 In `mobile/src/features/splash/ui/splash-screen.test.tsx`, give the dismissal block stable ownership of the `Animated.timing` and `AccessibilityInfo.isReduceMotionEnabled` spies, while preserving the current reduced-motion, animation, dismissal, and fake-timer assertions. **Verification:** the diff contains no production-file change and the existing `expect(timing).not.toHaveBeenCalled()` / positive animation assertion remain intact.
- [x] 1.2 Extend the dismissal block's `afterEach` with targeted cleanup: clear animation call history, reset any reduced-motion call history and queued one-shot result, restore the resolved-`false` harness default, and ensure those resets plus `jest.useRealTimers()` execute from a `finally` path even if the test or pending-timer drain throws. Do not use `jest.clearAllMocks()`, `jest.resetAllMocks()`, or `jest.restoreAllMocks()`. **Verification:** `jest/setup-splash.ts` remains unchanged and the suite-wide `AccessibilityInfo` spies remain installed.

## 2. Record the harness contract

- [x] 2.1 Update `docs/mobile/architecture-book/testing.md` with the reusable rule: suite-owned spy history and one-shot implementations are reset through exception-safe teardown before another test runs, and cleanup must preserve persistent `jest/setup-*.ts` spies. **Verification:** the rule points at `src/features/splash/ui/splash-screen.test.tsx` as the concrete pattern and does not prescribe blanket global resets.
- [x] 2.2 Append the corresponding dated entry to `docs/mobile/architecture-book/CHANGELOG.md`. **Verification:** the entry describes a test-harness rule only; no ADR is added because this is an R-4 leaf fix, not a load-bearing architecture decision.

## 3. Local-green and CI proof

- [x] 3.1 Run the splash proof file through the normal Jest entrypoint: `cd mobile && npx jest src/features/splash/ui/splash-screen.test.tsx --ci --runInBand --silent`. This retains the existing no-animation assertion as the CI behavioral proof; do not add a retry, longer wait, local timeout, or weaker matcher.
- [x] 3.2 Run the formerly failing randomized order exactly: `cd mobile && npx jest src/features/splash/ui/splash-screen.test.tsx --ci --runInBand --randomize --seed=25 --silent`. Record that all five tests pass and that the seed is 25.
- [x] 3.3 Run focused static validation for the touched test and proposal: `cd mobile && npx eslint src/features/splash/ui/splash-screen.test.tsx`, then from the repository root run `openspec validate stabilize-mobile-splash-jest-order`. **Verification:** both commands exit 0.
- [x] 3.4 Audit the final diff against scope: only the splash test, Architecture Book testing/changelog pages, and this OpenSpec change may change. Confirm sensitive surfaces are untouched and device verification is N/A for this Jest-only fix.
