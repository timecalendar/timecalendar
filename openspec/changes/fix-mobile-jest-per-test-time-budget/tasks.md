# Tasks

All paths are relative to the repo root. Nothing here touches production source,
`.github/workflows/**`, the API contract, migrations, or native/store config.

## 1. Reproduce the failure first — do not skip this

The whole change is justified by one measurement. Get it yourself before changing
anything, so the "after" number means something.

```bash
# A. a cold Jest cache + coverage + verbose, on the CURRENT branch, unmodified
cd mobile
rm -rf /tmp/tim273-cache
npx jest --ci --coverage --verbose --cacheDirectory /tmp/tim273-cache \
  src/features/calendar-sources/ui/user-calendars-screen.test.tsx
```

- [x] 1.1 Record the reported duration of `lists a calendar with its name + school`.
      Expected ≈ **4.3 s** on an idle box — every other test in the file reports
      4–174 ms. Note it: this is the canary sitting at ~87 % of Jest's 5 000 ms default.
- [x] 1.2 Now add contention and watch it tip. In a second shell run a full
      `npx jest --ci --coverage` loop (or any job that saturates the cores), then repeat
      the command from 1.1 with a fresh `--cacheDirectory`. Expected: the same test reports
      **7–8 s** and the run fails with
      `thrown: "Exceeded timeout of 5000 ms for a test."`, quoting lines 115–120 — which is
      the excerpt that made this look like a `getByText("ENSEEIHT")` failure.
      **Verification:** the failure text says `Exceeded timeout`, never
      `Unable to find an element`.
- [~] 1.3 (optional - SKIPPED, see note, if you want the component-level breakdown) render one primitive per
      test in a throwaway file, cold, with `--coverage`: `View`+`Text` ≈ 2.6–2.9 s,
      `ScrollView` ≈ 4.3 s, `SymbolView` ≈ 2.2–3.5 s, `Switch` ≈ 0.2 s, second render of
      the same tree ≈ 7 ms. Delete the file afterwards — it is a measurement, not a test.

## 2. The fix — an explicit per-test budget

- [x] 2.1 In `mobile/jest.config.js`, add `testTimeout: 30000` with a comment carrying the
      mechanism, not just the number: the harness mounts real RN trees under coverage
      instrumentation; RN/Expo host components register lazily on first render, so that
      one-time cost is billed to whichever test touches them first (measured ≈4.3 s idle,
      ≈8.2 s contended); Jest's 5 s default is sized for trivial units. Point at ADR 044.
      Do **not** touch the `coverageThreshold` block.
      **Verification:** re-run 1.2's contended command — green, and the test now reports
      its real cost instead of a timeout.
- [x] 2.2 Prove the assertion did not get weaker. Temporarily change
      `mobile/src/features/calendar-sources/ui/user-calendars-screen.tsx` so the row stops
      rendering the calendar name (e.g. render the placeholder unconditionally), run the
      file, and confirm `lists a calendar with its name + school` fails **at the
      assertion, in milliseconds** — `Unable to find an element with text: ENSEEIHT`, not a
      30 s timeout. Revert. This is acceptance criterion 2; record the output in the
      handoff.
- [x] 2.3 Add `mobile/jest.config.test.ts` (mirror `mobile/app.config.test.ts`): require
      the config and assert `testTimeout` is defined and `>= 20000`, with a comment naming
      TIM-273 so a future reader knows why the floor exists.
      **Verification:** `npx jest jest.config.test.ts` passes; deleting the key from
      `jest.config.js` makes it fail.

## 3. The secondary defect — an unrestored `Platform.OS` override

This is **not** the cause of TIM-273. It is a separate, currently-dormant order dependence
found while ruling out the ticket's "unreset mock leaking across suites" hypothesis. Keep
it clearly labelled as such in the commit message and the handoff.

- [x] 3.1 Confirm it is real before fixing it:
      `npx jest src/features/calendar-sources/ui/user-calendars-screen.test.tsx --randomize --seed=3 --ci`
      fails with `Unable to find an element with role: button, name: Actions for ENSEEIHT`
      and `testID: user-calendar-actions-cal-1` — the iOS-only affordances, because
      `jest.replaceProperty(Platform, "OS", "android")` at line 330 is never restored.
      (22 of the first 25 seeds fail.)
- [x] 3.2 Add `mobile/src/test-support/platform.ts` exporting a helper that installs a
      `Platform.OS` override in `beforeEach` and restores it in `afterEach` — so the
      restore also happens when the test throws. Do **not** reach for
      `jest.restoreAllMocks()`: it would also discard the suite-wide
      `AccessibilityInfo` spies installed by `jest/setup-splash.ts` (the hazard
      `jest/setup-localization.ts` already documents).
- [x] 3.3 Route both call sites through it, changing no assertion:
      `mobile/src/features/calendar-sources/ui/user-calendars-screen.test.tsx:330` (wrap the
      Android test in a scoped `describe`) and `mobile/src/components/date-time-field.test.tsx:71`.
      **Verification:** seeds 1–25 of `--randomize` on `user-calendars-screen.test.tsx` are
      all green (they were 22/25 red), and `date-time-field.test.tsx` is green under
      `--randomize` too.

## 4. Architecture Book

- [x] 4.1 `docs/mobile/architecture-book/decisions/044-jest-per-test-time-budget.md` from
      `TEMPLATE.md`. The durable content is the **rule**, not the number: the per-test
      timeout is a harness capacity setting that bounds execution time; it is never a tool
      for giving a failing query more chances, and this ADR must not be cited as precedent
      for a longer `waitFor`/`findBy`, a retry, or a weakened matcher. Record the measured
      costs, the rejected alternatives (mock `expo-symbols` — buys 2–3 s but leaves
      `ScrollView`'s 4.3 s; warm in `beforeAll` — hooks share the same budget; a per-test
      override — leaves the next heavy first render exposed), and a revisit trigger (a test
      legitimately approaching 30 s, or CI gaining a warm Jest transform cache).
- [x] 4.2 Add the row to `docs/mobile/architecture-book/decisions/README.md`.
- [x] 4.3 `docs/mobile/architecture-book/testing.md`: one bullet under "Unit / component
      harness" for the explicit budget + the guard test + the never-a-query-wait rule; and
      one line of recorded debt next to the existing E2E caching debt — CI restores no Jest
      transform cache (`ci-mobile.yml` caches npm only), so every `test-mobile` run pays the
      full cold transform. Out of scope here (workflow surface); trigger is the next time
      the gate's wall clock or headroom becomes a problem.
- [x] 4.4 `docs/mobile/architecture-book/CHANGELOG.md`: dated entry under `## 2026-08-28`.

## 5. Green + handoff

- [x] 5.1 `cd mobile && npx tsc --noEmit`, `npm run lint`, `npm test -- --coverage` — all
      clean, coverage gate still satisfied (nothing here moves coverage; the new
      `jest.config.test.ts` sits outside `collectCoverageFrom`'s `src/**` glob).
- [x] 5.2 Re-run the contended cold repro from 1.2 at least 3× — green each time, with the
      canary's real duration recorded. State the numbers in the PR body; they are the
      evidence, and "it passed N times" on its own is not.
- [x] 5.3 File a follow-up ticket (its own worktree, not a child of this one): whole-suite
      `jest --randomize` currently fails 4 unrelated suites — `calendar/data/sync/sync.test.tsx`,
      `notifications/data/subscription.test.tsx`, `settings/ui/timezone-settings-screen.test.tsx`,
      `calendar-sources/data/user-calendars/add-calendar.test.tsx`. Each is a latent
      intra-file order dependence of the same class as task 3. Out of scope for TIM-273 —
      do not fix them here.
- [x] 5.4 Update the PR body's stage line to `apply ✅` and hand to the Simplifier.

## Applier notes

- **1.3 skipped** (it is marked optional). The Proposer's per-primitive breakdown was not
  re-derived; tasks 1.1/1.2 reproduced the failure directly, which is what the change is
  justified by.
- **Load regimes matter more than the proposal assumed.** The canary's cost is dominated by
  how much else competes for the box. Measured after the fix: whole suite cold on 4 cores
  (what CI runs) 0.3 s; single file cold and dedicated 4.1–4.6 s; single file cold with one
  competing suite 7.7–9.8 s (3/3 green — the regime that was red at 5 s); with **two**
  competing cold suites 27–60 s, which exceeds even 30 s. That last regime is ~3× the work
  CI ever does and is not a target — recorded in ADR 044 so a reviewer re-running a heavier
  stress harness does not read expected red as a failed fix.
- **Task 3 extra:** `date-time-field.test.tsx`'s file-level `jest.restoreAllMocks()` existed
  only to undo the `Platform.OS` override. `usePlatform` now owns that restore, so the
  blanket call was removed — it is the exact hazard the design rejects (it would also
  discard `jest/setup-splash.ts`'s `AccessibilityInfo` spies). No assertion changed.
- **5.3 filed as TIM-276** (isolated workspace, no parent).
