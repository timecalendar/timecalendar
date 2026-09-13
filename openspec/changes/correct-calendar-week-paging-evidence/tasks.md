## 1. Retarget the immutable evidence

- [ ] 1.1 Update all four build/revision attributions in
      `docs/react-native-migration/inbox/2026-09-12-calendar-week-paging-device-pass.md` from the
      superseded revision to `a14333a9feb0fe47f62fb7270178542f2b21359f`. Compare the result with
      correction commit `b31be5ae4507c4d9305312bc92d30fb6bd8da4a1`; reproduce its evidence
      retarget as edits on this branch rather than cherry-picking it.
- [ ] 1.2 Update only the two affected automated totals: the focused command reports 5 suites and
      72 tests passed, and full coverage reports 177 suites and 1,659 tests passed. Preserve the
      recorded TypeScript, lint, React Doctor, statement-coverage, and branch-coverage results.
- [ ] 1.3 Run a focused content assertion over the note that requires exactly four corrected-revision
      occurrences, no superseded-revision occurrence, the 72-test focused result, and the 1,659-test
      coverage result. Record the command and pass in the PR evidence.

## 2. Reconcile merge and acceptance state

- [ ] 2.1 Replace only the stale Results and gate footer with current state: PR #410 was human-merged
      as `ffc2bd88cedaeaa9d2d2e9a0739d9305f22d1a6d`; the owner checklist and explicit acceptance remain
      pending; and the next renderer slice remains paused for that acceptance.
- [ ] 2.2 Verify every owner checklist box remains unchecked and the device/platform, installed
      build, refresh-rate, assistive-technology, observations, retest, and acceptance fields remain
      pending. Search the added lines and confirm they claim no new native, Android, refresh-rate,
      VoiceOver, or TalkBack result.

## 3. Documentation, Architecture Book, and scope gates

- [ ] 3.1 Run Prettier in check mode on the evidence note and this OpenSpec change, then run
      `git diff --check` and `openspec validate correct-calendar-week-paging-evidence --strict`.
- [ ] 3.2 Re-read `docs/mobile/architecture-book/architecture.md` and `testing.md`; record the
      Architecture Book update as N/A because the correction changes no current architecture or test
      rule. If implementation reveals a rule contradiction, stop and return for re-briefing rather
      than expanding scope.
- [ ] 3.3 Review the final path diff. Outside this OpenSpec change, only
      `docs/react-native-migration/inbox/2026-09-12-calendar-week-paging-device-pass.md` may change.
      Confirm no API/generated client, migration, native/store config, deployment/CI, Architecture
      Book, roadmap, or legacy Flutter path is touched.
- [ ] 3.4 Run the repository disclosure preflight over the complete branch diff and exact public PR
      title/body before each publication. Any finding is a hard stop; report only safe pattern IDs.

## 4. Local-green and exact-head CI proof

- [ ] 4.1 Review the final evidence diff against the known retarget commit and this change's spec,
      confirming the six retarget substitutions plus the footer replacement are the only evidence-note
      changes. Record the focused content assertion, Prettier, strict OpenSpec validation, diff check,
      scope review, and disclosure scan as the documentation-only local-green evidence.
- [ ] 4.2 Push the implementation head and confirm the new PR's reported head SHA matches the exact
      commit tested by the standard CI run and every required check is green. Treat strict OpenSpec
      validation as the CI proof for the proposal contract and the focused content assertion as the
      direct proof of the documentation correction; do not claim that CI reran the historical mobile
      checks or performed owner-device acceptance.
