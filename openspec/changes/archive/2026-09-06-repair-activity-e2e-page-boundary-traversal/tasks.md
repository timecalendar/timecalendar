## 1. Repair the traversal in `mobile/.maestro/activity.yaml`

- [x] 1.1 Give each of the three page-boundary `scrollUntilVisible` steps
  (`activity-new-e2e-activity-tie-higher`, `-tie-lower`, `-older-anchor`) an explicit
  `speed: 90`, keeping `direction: DOWN` and every existing `assertVisible` untouched.
- [x] 1.2 Restore the `tie-higher` traversal's `timeout` to `60000`, so all three
  page-boundary scrolls carry the suite-standard bound.
- [x] 1.3 Replace the two comment lines that justified the widened bound with the measured
  diagnosis and the overshoot-safety argument: at the default speed a gesture is a drag,
  not a fling; the boundary rows are the **last** rows of history, so maximum overshoot
  clamps onto them rather than past them, and a fixture that adds rows below
  `older-anchor` voids that. Do not name a person, a host path, or any control-plane
  identifier in the comment.
- [x] 1.4 Append the two relative-order assertions after the `older-anchor` step —
  `tie-higher` `above:` `tie-lower`, and `tie-lower` `above:` `older-anchor` — where all
  three rows are co-visible at the foot of the list. Add them; remove nothing.
- [x] 1.5 Verify the file still parses as a Maestro flow and that the flow remains
  cross-platform: no `platform: Android` selector, no bare `back`, no new `optional:`,
  no sleep, no retry.

## 2. Replace the pinned-bound proof with a derived one

- [x] 2.1 In `mobile/e2e/activity-maestro-selectors.test.ts`, delete the
  `"gives only the row-50 pagination traversal the measured wider bound"` case and its
  `120000` expectation.
- [x] 2.2 Add a case that derives the page boundary from its two real sources: read the
  filler count from `server/src/scripts/seed-e2e-activity.ts` and `ACTIVITY_PAGE_LIMIT`
  from `mobile/src/features/activity/data/request.ts`, then assert that the three leading
  logs + the fillers + `tie-higher` equal exactly the page limit, and that the seeded
  `tie-higher` id sorts **above** the `tie-lower` id while both carry the same seeded
  minute. Follow the existing cross-boundary source-reading pattern in
  `mobile/e2e/maestro-selectors.test.ts` (it already reads the server seed script as text).
- [x] 2.3 Add a case pinning the traversal budget: the three page-boundary scrolls appear
  in order, each with `speed: 90` and `timeout: 60000`. The regex in the existing file
  matches `direction` then `timeout`; update it for the added `speed` key rather than
  loosening it to `[\s\S]*`.
- [x] 2.4 Add a case pinning both relative-order assertions, in the asserted direction.
- [x] 2.5 **Prove the discrimination, do not assume it.** With the new test file in place,
  temporarily revert `activity.yaml` to its pre-change form (`git stash push` the flow
  alone, or check out its `main` version to a scratch path and point the test at it), run
  the suite, and record that 2.3 and 2.4 fail. Restore the flow and record that they pass.
  Put both observations in the handoff — a test that only ever passed proves nothing here.

## 3. Record the rule in the Architecture Book

- [x] 3.1 In `docs/mobile/architecture-book/testing.md`, extend the Activity E2E bullet
  with the traversal-gesture rule: a long traversal is bounded by gesture distance
  (`speed`), never by a widened clock; the fast fling is sound only while the target is in
  the terminal viewport; and the boundary itself is derived by the baseline-gate proof
  rather than asserted in prose.
- [x] 3.2 Append a dated entry to `docs/mobile/architecture-book/CHANGELOG.md` naming the
  rule change (migration-approach §7). No ADR: this refines an existing E2E rule, it does
  not add a load-bearing decision.
- [x] 3.3 Re-read `testing.md`'s existing Activity paragraph and confirm the "50-row client
  page boundary" claim it already makes now points at the derived proof, so the two
  documents cannot drift apart.

## 4. Local-green verification

- [x] 4.1 `cd mobile && npx jest e2e/activity-maestro-selectors.test.ts e2e/maestro-selectors.test.ts --maxWorkers=4`
  — both green. (Use `--maxWorkers=4`; a bare pattern matches the worktree path here.)
- [x] 4.2 `cd mobile && npx tsc --noEmit` and `npm run lint` — green.
- [x] 4.3 `openspec validate repair-activity-e2e-page-boundary-traversal` and
  `git diff --check` — clean, with no stray debug artifact.
- [x] 4.4 Confirm the diff touches only `mobile/.maestro/activity.yaml`,
  `mobile/e2e/activity-maestro-selectors.test.ts`, the two Book files, and
  `openspec/changes/**`. No `server/`, no `openapi/openapi.json`, no
  `mobile/src/api/generated/`, no migration, no native/store config.

## 5. Native proof on the exact head — last

- [x] 5.1 Only after simplify and review, add the `run-e2e` label and run the native gate
  on the exact head. It costs ~35 min per platform and **any** later commit voids it, so
  do not take it early.
- [x] 5.2 Attribute the result at **flow and attempt** level, not job level: read
  `activity`'s own `commands.json` / `maestro.log` from the uploaded Maestro debug
  artifact and confirm the three page-boundary steps and both order assertions reached
  `COMPLETED` on Android **and** iOS.
- [x] 5.3 Record the direct job links and the exact SHA in the issue thread before the
  Reviewer handoff.
- [x] 5.4 Not applicable: neither platform ran out of clock. If a future platform run does,
  raise `speed` (the next stop is `95` →
  a 51 ms swipe) or reduce the gesture count — never the assertions, never the bound.
  Re-derive from the artifact's per-gesture advance before changing anything.
