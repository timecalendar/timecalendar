## Why

The splash component test passes in its declared order but fails reproducibly under Jest random seed 25 because the motion-allowed case leaves an `Animated.timing` call visible to the reduced-motion case. The test must prove splash behavior independently of intra-file execution order so the mobile Jest gate can randomize safely and failures continue to identify real behavior regressions.

## What Changes

- Add targeted, exception-safe teardown for the splash dismissal tests' suite-owned animation and reduced-motion mock state.
- Preserve the existing assertions, fake-timer control, and suite-wide native-module spies; do not use retries, longer waits, or `jest.restoreAllMocks()`.
- Document the reusable mobile-test rule that mutable spy state must be reset before another test can observe it, even when the owning test throws.
- Verify the splash test file in ordinary order and with randomized seed 25, then retain that randomized command as the CI proof for this regression.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `mobile-test-harness`: component-test-owned mutable spy state is isolated between tests, including under randomized execution and exceptional exits, without discarding suite-wide setup spies.

## Impact

- **Tests:** `mobile/src/features/splash/ui/splash-screen.test.tsx` only; production splash behavior and assertions remain unchanged.
- **Documentation:** `docs/mobile/architecture-book/testing.md` and its changelog record the test-isolation rule.
- **APIs, dependencies, native config, schema, routes:** none.
- **Sensitive surfaces:** none (`openapi/openapi.json`, generated API code, migrations, native/store config, infrastructure, workflows, and legacy Flutter are untouched).
