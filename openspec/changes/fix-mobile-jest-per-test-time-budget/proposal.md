## Why

The baseline `Run tests` job — the gate in front of every PR on this repo, including the
~34-minute native E2E acceptance heads — carries a named intermittent (TIM-273):
`user-calendars-screen.test.tsx` fails under `npm test -- --coverage`, then passes on
re-run. The standing recovery reflex on this board is *not* to blanket-rerun, so each
firing costs a cycle.

**The reported symptom is a misread.** The failure is not a query miss. Reproduced
**10/10** at the exact head that surfaced it (`1d0254b`, 119 suites / 863 tests) with a
cold Jest cache under CPU contention, the error is always:

```
● UserCalendarsScreen › lists a calendar with its name + school

  thrown: "Exceeded timeout of 5000 ms for a test."

    > 117 |   it("lists a calendar with its name + school", async () => {
      118 |     mockUseUserCalendars.mockReturnValue([calendar()])
      119 |     await render(<UserCalendarsScreen />)
      120 |     expect(screen.getByText("ENSEEIHT")).toBeTruthy()
```

Jest prints the `it(...)` header plus the first lines of the body with a timeout, and line
120 of that excerpt is `getByText("ENSEEIHT")` — which is why the ticket was filed as a
`getByText` failure. No query ever ran. Nothing is order-dependent, no mock leaks across
suites, and no fixture is mutated.

**The mechanism.** `lists a calendar with its name + school` is the first test in the file
that mounts the *populated* branch — `ScrollView` → `CalendarRow` → `SymbolView` +
`Switch`. React Native and Expo host components do their transform, evaluation and
host-component registration **lazily, on first render**, so that whole one-time cost is
billed to whichever test touches them first. Measured on a 16-core dev box, `--coverage`,
cold `--cacheDirectory`, one component per test:

| First render of | Cost |
| --- | --- |
| bare `View` + `Text` | 2.6–2.9 s |
| `ScrollView` | 4.3 s |
| `SymbolView` (expo-symbols) | 2.2–3.5 s |
| `Switch` | 0.17–0.24 s |
| the same tree a second time | **7 ms** |

In the real file that lands as: test 1 (empty state) 0.6–1.2 s, **test 3 (populated list)
4.35 s on an idle box → 7.3–8.2 s contended**, every later test 4–174 ms. Jest's default
per-test budget is **5 000 ms**. The test is not slow because it does too much; it is slow
because it is the first one to touch the expensive components — and it already sits at
**87 % of the budget on an idle 16-core machine**. Coverage instrumentation, a cold cache
and a competing process all draw on that same fixed budget until it tips.

This is a harness-capacity defect, not a test-logic defect, and it is one busy runner away
from red in CI: `ci-mobile.yml` caches npm only, so **every CI run is a cold-cache run**.
The gate is passing at ~87 % of budget on a canary test.

## What Changes

- **An explicit per-test time budget.** `mobile/jest.config.js` sets `testTimeout` above
  the measured worst case, with the mechanism recorded in the config comment. Jest's 5 s
  default is sized for trivial units; this suite mounts real React Native trees under
  coverage instrumentation. **No assertion is relaxed and nothing is polled** — if the
  screen stops rendering the school name, `getByText("ENSEEIHT")` still throws in
  milliseconds.
- **A drift guard in the baseline gate.** A config test (mirroring the existing
  `mobile/app.config.test.ts` pattern) asserts the explicit budget exists and is at or
  above the floor, so a later edit cannot silently restore the 5 s default.
- **A secondary, latent order-dependence, fixed.** While ruling out the ticket's
  "unreset mock leaking across suites" hypothesis: `jest.replaceProperty(Platform, "OS",
  "android")` is never restored in `user-calendars-screen.test.tsx:330` and
  `date-time-field.test.tsx:71`. Under the shipped declaration order nothing after it
  reads `Platform`, so it is dormant today — but `jest --randomize` fails **22 of 25**
  seeds on that file with `Unable to find an element with role: button, name: Actions for
  ENSEEIHT` and `testID: user-calendar-actions-cal-1`. It is a real landmine that would
  produce this ticket's symptom for a genuinely different reason, and it is one line from
  the code being changed. Scoped behind a restoring test-support helper.
- **Book + record.** ADR 044 (the per-test budget is a harness capacity setting, never an
  assertion tool), a `testing.md` entry, a `CHANGELOG.md` line.
- **NOT changed:** no `mobile/src` production code, no assertion weakened, no `waitFor` /
  `findBy` timeout raised, no retry, no `jest.retryTimes`, no `.github/workflows/**`
  (TIM-264 owns that surface), no API contract, no native/store config.

### On the ticket's "do not fix this with a longer timeout"

TIM-273 rules out "a `waitFor`, a retry, a longer timeout, or … weakening the assertion"
because those convert an intermittent into an invisible one. That instruction was written
on the diagnosis that an element was missing. It was not.

The forbidden shape — extending a *query's* wait so a missing element has more chances to
appear — is not proposed and must not be used here. What is proposed is the *per-test
wall-clock budget*, which governs how long the test process may take to execute, not how
long a query may search. Nothing waits, nothing retries, and every assertion keeps exactly
the strength it has today: acceptance criterion 2 ("the assertion still fails if the screen
genuinely stops rendering the school name") is satisfied by construction, and `tasks.md`
requires it to be demonstrated by mutation, not asserted.

Flagging this explicitly rather than quietly: the fix follows the mechanism, and the
mechanism turned out not to be the one the ticket assumed.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `mobile-test-harness`: gains an explicit per-test time budget sized for the harness's
  real cost (React Native trees, coverage instrumentation, cold transform cache) rather
  than Jest's trivial-unit default, plus the rule that the budget is a capacity setting and
  may never be used to give a failing query more chances.

## Impact

- **Code:** `mobile/jest.config.js` (one key + rationale); new `mobile/jest.config.test.ts`
  (drift guard); new `mobile/src/test-support/platform.ts` (restoring platform override) +
  its two call sites, `mobile/src/features/calendar-sources/ui/user-calendars-screen.test.tsx`
  and `mobile/src/components/date-time-field.test.tsx`. No production source touched.
- **Tests:** one new config guard; two existing suites re-scoped around the platform
  helper with no assertion changed.
- **Docs:** ADR 044, `testing.md`, `CHANGELOG.md`.
- **Dependencies / native / schema / contract:** none.
- **Sensitive surfaces:** none. (`mobile/jest.config.js` is the coverage gate's home — the
  `coverageThreshold` block is not touched.)
- **Risk:** a genuinely hung test now takes the new budget instead of 5 s to fail — bounded
  and far inside the CI job budget. The drift guard is a static assertion about config, not
  a proof of absence of flake; the real proof is the reproduce-then-fix demonstration in
  `tasks.md`.
- **Recorded debt (deliberately not done here):** CI restores no Jest transform cache, so
  every `test-mobile` run pays the full cold transform. Caching it would cut both the run
  time and the headroom problem at its source, but it lives in `.github/workflows/**`,
  which this ticket puts out of scope. Recorded in `testing.md` next to the existing E2E
  caching debt.
