# 044 — Set an explicit per-test time budget for the Jest harness

## Status

Accepted.

## Context

The baseline `Run tests` job carries a named intermittent (TIM-273):
`user-calendars-screen.test.tsx` fails under `npm test -- --coverage`, then passes on
re-run. The ticket was filed as `getByText("ENSEEIHT")` failing to find an element.

It was not. Reproduced under a cold Jest cache with CPU contention, the failure is always
`thrown: "Exceeded timeout of 5000 ms for a test."`. Jest prints the `it(...)` header plus
the first lines of the test body with a timeout, and one of those lines happens to be the
`getByText` — which is where the ticket's title came from. **No query ever ran.**

The cost is structural, not test-specific. This harness mounts real React Native trees
under coverage instrumentation, and RN/Expo host components do their transform, evaluation
and host-component registration **lazily, on first render**. That whole one-time cost is
billed to whichever test happens to mount them first. Measured cold (`--coverage`, fresh
`--cacheDirectory`, one primitive per test):

| First render of | Cost |
| --- | --- |
| bare `View` + `Text` | 2.6–2.9 s |
| `ScrollView` | 4.3 s |
| `SymbolView` (expo-symbols) | 2.2–3.5 s |
| `Switch` | 0.17–0.24 s |
| the same tree a second time | **7 ms** |

In the affected file: the first test that mounts the populated list reports **4.1 s idle
and 9.0–9.6 s under CPU contention**, while every other test in the file reports
4–600 ms. Jest's default per-test budget is 5 000 ms, so the gate was passing at ~83 % of
budget on a canary test — and `ci-mobile.yml` caches npm only, so every CI run is a
cold-cache run.

## Decision

Set `testTimeout: 30000` in `mobile/jest.config.js`, with the mechanism recorded in the
config comment, and guard it with `mobile/jest.config.test.ts` (a floor of 20 000 ms) so a
later edit cannot silently restore the default.

**The rule this ADR establishes is not the number.** The per-test timeout is a **harness
capacity setting**: it bounds how long a test may take to *execute*. It is **never** a tool
for giving a failing query more chances to find an element. This ADR must not be cited as
precedent for a longer `waitFor`/`findBy` timeout, a retry, `jest.retryTimes`, or a
weakened matcher — those convert an intermittent into an invisible one, which is exactly
what TIM-273 banned and was right to ban. Every assertion keeps the strength it has today:
with the row's name removed from the screen, the test still fails at the assertion in
**432 ms** with `Unable to find an element with text: ENSEEIHT`.

30 000 ms is ~3.1× the worst observed single-test cost (9.6 s at ~3× CPU
oversubscription on 16 cores). The CI runner is weaker than the measurement box *and*
always cold, so the headroom absorbs a machine we cannot measure from here. It stays far
inside the job budget: on a genuinely hung test, the difference between failing at 5 s and
at 30 s is noise against a 20-minute job.

Alternatives rejected:

- **Mock `expo-symbols` suite-wide.** Buys the 2.2–3.5 s `SymbolView` slice but leaves
  `ScrollView`'s 4.3 s, which is React Native core and not mockable. Insufficient alone,
  and it trades render fidelity for speed on a component that renders fine.
- **Warm the components in `beforeAll`.** Jest applies the same `testTimeout` to hooks, so
  this moves the failure into the hook and reports it worse.
- **A per-test override** (`it("…", fn, 20000)`). Fixes one canary and leaves every other
  "first test to mount a heavy tree" one refactor from the same red. The defect is the
  suite-wide budget, so the fix belongs suite-wide.
- **`jest.retryTimes`.** Rejected outright — see the rule above.
- **Cache Jest's transform directory in CI.** Genuinely attacks the cost rather than the
  budget, but lives in `.github/workflows/**`, out of scope for TIM-273. Recorded as debt
  in [testing.md](../testing.md).

## Consequences

- The baseline gate stops sitting at ~83 % of a per-test budget it never chose. The canary
  now reports its real cost instead of a timeout.
- A genuinely hung test takes 30 s rather than 5 s to fail the build — bounded, and far
  inside the job budget.
- `jest.config.test.ts` joins `app.config.test.ts` as config-shape coverage in the same
  job. It is a static assertion about configuration, **not** a proof that the flake is
  gone; the behavioural proof is the reproduce-then-fix measurement recorded on TIM-273.
- Recorded debt, deliberately not taken here: CI restores no Jest transform cache, so every
  `test-mobile` run pays the full cold transform.

## Revisit if

- A test legitimately approaches 30 s — that is a real problem and should be fixed at the
  test, not by raising the budget again.
- CI gains a warm Jest transform cache, which would cut the cold first-render cost at its
  source and could justify tightening the budget.
- Anyone proposes to cite this ADR for a query wait, a retry, or a relaxed matcher — that
  is a misreading, and the ADR should be made louder rather than followed.
