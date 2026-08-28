# Design — per-test time budget for the mobile Jest harness

## How the diagnosis was reached (so it can be re-run, not re-argued)

Everything below is measurement, not inference. The recipe is in `tasks.md` task 1.

1. **Isolated runs prove nothing.** 15 consecutive runs of the file alone: 15/15 green,
   ~1.8 s per run. This is why the original observer could not reproduce it.
2. **Warm full runs prove nothing.** 6 × `npm test -- --coverage` on this branch: 6/6
   green, ~11 s each. 3 × `--runInBand`: green.
3. **The failing head reproduces deterministically under the right conditions.** Extract
   `1d0254b` (the TIM-264 head that surfaced it — `git diff` confirms
   `user-calendars-screen.test.tsx` is byte-identical to `main`), then run
   `--ci --coverage` with a **fresh `--cacheDirectory`** while a second full suite runs:
   **10/10 failures**, always the same test, always
   `thrown: "Exceeded timeout of 5000 ms for a test."`.
4. **`--verbose` localizes the cost.** In the same conditions the file reports
   `✕ lists a calendar with its name + school (7341 / 7675 / 8213 ms)` while every other
   test in the file reports 4–174 ms. A ~500× outlier is not "the box was slow"; it is a
   one-time cost billed to one test.
5. **A five-test probe identifies what the cost is.** Rendering one primitive per test,
   cold, `--coverage`: `View`+`Text` 2.6–2.9 s, `ScrollView` 4.3 s, `SymbolView` 2.2–3.5 s,
   `Switch` 0.17–0.24 s, and **the same tree again 7 ms**. The cost is lazy first-use of
   React Native / Expo host components, not anything the screen or the test does.
6. **The fix is verified against the same repro**, not against repetition: with
   `testTimeout` raised, the identical cold+contended command is 3/3 green and the test
   reports its real cost (~4.1–4.5 s) instead of a timeout.

## Decision: fix the budget, not the cost

**Decision.** Set an explicit `testTimeout` in `mobile/jest.config.js`, sized above the
measured worst case, and record why. Do not chase the render cost.

Alternatives, all measured or checked before rejecting:

- **Mock `expo-symbols` suite-wide** (the established `jest/setup-*.ts` pattern for native
  modules). Buys the 2.2–3.5 s `SymbolView` slice — but leaves `ScrollView`'s 4.3 s, which
  is React Native core and not mockable. Insufficient on its own, and it trades real
  render fidelity for speed on a component that renders fine today. Rejected.
- **Warm the components in `beforeAll`.** Jest applies the *same* `testTimeout` to hooks,
  so this moves the failure from the test to the hook and reports it worse. Rejected.
- **A per-test override — `it("lists a calendar …", async () => {…}, 20000)`.** Fixes the
  one canary and leaves every other "first test that mounts a heavy tree" one refactor
  away from the same red. The defect is the suite-wide budget, so the fix belongs
  suite-wide. Rejected.
- **`jest.retryTimes`.** Converts an intermittent into an invisible one — exactly what
  TIM-273 forbids, and correctly. Rejected outright.
- **Cache Jest's transform directory in CI.** Genuinely attacks the cost (CI is cold on
  every run because `ci-mobile.yml` caches npm only), but lives in `.github/workflows/**`,
  which TIM-273 puts out of scope and TIM-264 owns. Recorded as debt in `testing.md`, not
  done here.

## Decision: 30 000 ms

**Decision.** `testTimeout: 30000`.

- Worst single-test cost observed: **8.2 s** (cold cache, coverage, ~2× CPU
  oversubscription on 16 cores). 30 s is ~3.7× that.
- The CI runner is weaker than the measurement box *and* always cold, so the headroom has
  to absorb a machine we cannot measure from here.
- It stays far inside the job budget, so a genuinely hung test still fails the build
  quickly enough to be useful; the difference between a 5 s and a 30 s failure on a real
  hang is noise against a 20-minute job.
- Round number, one place, documented. There is no case for tuning it to the millisecond:
  the value is a *ceiling on pathology*, not a performance assertion. Anything that
  legitimately approaches 30 s is a real problem and should fail.

## Decision: the guard is a config-drift test, not a repetition proof

**Decision.** Add `mobile/jest.config.test.ts` asserting the explicit budget is present and
at or above the floor.

"It passed N times after" is not proof, and no CI-affordable test can prove a timing flake
is gone. What *can* be pinned permanently is the fix itself: the config test fails the
baseline gate the moment someone deletes the key or drops it back toward the default. This
mirrors `mobile/app.config.test.ts`, which already guards config shape in the same gate —
same pattern, same job, no new machinery.

The behavioural proof lives in `tasks.md` and is a **before/after against the reproduction
recipe**, plus a **mutation check**: delete the school name from the row and confirm the
test fails immediately rather than after 30 s. That is what makes acceptance criterion 2
("the assertion still fails if the screen genuinely stops rendering the school name")
checkable rather than asserted.

## Decision: scope the platform override behind a restoring helper

**Decision.** Add `mobile/src/test-support/platform.ts` exporting a helper that installs a
`Platform.OS` override in `beforeEach` and restores it in `afterEach`, and route both call
sites through it.

```ts
// usage
describe("on Android", () => {
  usePlatform("android")
  it("renders the FAB", async () => { … })
})
```

Why not the obvious alternatives:

- **`jest.restoreAllMocks()` in `afterEach`.** It would also restore the suite-wide spies
  installed by `jest/setup-splash.ts` (`AccessibilityInfo.isReduceMotionEnabled`,
  `addEventListener`), silently un-mocking native reads for every later test in the file.
  `jest/setup-localization.ts` already carries a comment about exactly this hazard class.
  Rejected.
- **Capturing the handle inline and calling `.restore()` at the end of the test.** Leaks
  whenever the test throws before reaching the last line — the failure mode is "one red
  test turns the rest of the file red", which is how a single defect gets misdiagnosed as a
  flake. Rejected in favour of an `afterEach`.
- **Leaving it alone because it is dormant.** It is dormant only because the Android test
  happens to be declared second-to-last and the last test happens not to read `Platform`.
  `--randomize` fails 22/25 seeds. Adding one test at the bottom of that file, or
  reordering two, silently re-creates this ticket. Rejected.

This is deliberately a *second, separate* defect. It is **not** the cause of TIM-273 and
the change must not present it as one — it is a landmine found while ruling the ticket's
own leading hypothesis out, fixed because it is cheap, in-file, and would produce the same
symptom for a different reason.

## Decision: record the rule where it binds

**Decision.** ADR 044 + a `testing.md` bullet.

The durable content is not the number, it is the rule: **the per-test timeout is a harness
capacity setting. It bounds how long a test may take to execute; it is never a tool for
giving a failing query more chances to find an element.** Anyone reaching for a longer
`waitFor`/`findBy` timeout, a retry, or a weakened matcher to settle a red test is doing
the thing TIM-273 correctly banned — and the ADR has to say so next to the timeout it
raises, or the next reader will cite this change as precedent for the opposite.

`testing.md` also picks up the CI cold-cache observation next to the existing E2E caching
debt, so the follow-up is findable.
