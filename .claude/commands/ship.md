---
description: Drive one change end-to-end through the autonomous pipeline — plan → apply → simplify → review (loop) → archive → PR → wait green → zero-touch merge.
argument-hint: <roadmap step or feature description> [change-name]
---

# /ship — the autonomous change conductor

You (the main loop) are the **conductor**. You do not write the change's code yourself — you
dispatch the four specialized sub-agents and own git/PR/merge. The reviewer is the merge gate;
merging is **zero-touch** once it approves and CI is green (the user has granted full repo control).

**Request:** $ARGUMENTS

## The pipeline

### 0. Set up the branch
- `git fetch origin && git switch -c feat/mobile-<slug> origin/main` (branch from up-to-date main).
  If the planner hasn't named the slug yet, create the branch right after step 1 using its output.

### 1. PLAN — spawn `change-planner`
Hand it the roadmap step / feature description (and suggested change name if given). It produces
the apply-ready OpenSpec change and returns `CHANGE / BRANCH / SUMMARY / HUMAN_BLOCKED / ADR_NOTES`.
- If it reports a blocking ADR fork it could not resolve, write/confirm the inbox note, stop this
  pipeline, and tell the user. Otherwise continue.

### 2. APPLY — spawn `change-implementer`
Give it the change name + branch. It implements tasks, updates the Architecture Book, gets local
green, commits. Read its `LOCAL_CHECKS`. If it reports a hard failure it couldn't fix, treat that
like a review round (go to step 5's fix path) — don't proceed to review on red.

### 3. SIMPLIFY — spawn `change-simplifier`
Quality-only cleanup of the diff. It commits if it changed anything.

### 4. REVIEW — spawn `change-reviewer`
It runs `code-review` (high) + verifies tasks/DoD/Book and returns a `VERDICT` block. Parse it.

### 5. REVIEW LOOP (cap: 3 rounds)
- `VERDICT: APPROVE` → go to step 6.
- `VERDICT: REQUEST_CHANGES` → spawn `change-implementer` again with the `BLOCKING` findings, then
  `change-simplifier`, then `change-reviewer`. Increment the round counter.
- After **3** rounds still not approved → write an inbox escalation describing the unresolved
  disagreement, leave the PR in **draft**, stop, and tell the user. Do not merge.

### 6. ARCHIVE
- `openspec validate "<name>"` then archive:
  `mkdir -p openspec/changes/archive && git mv openspec/changes/<name> openspec/changes/archive/<YYYY-MM-DD>-<name>`
  (use today's date). If delta specs exist, sync them to `openspec/specs/` first. Commit the archive.

### 7. PR + merge
- Push: `git push -u origin feat/mobile-<slug>`.
- Open PR ready (not draft): `gh pr create --fill --title "..." --body "<summary + DoD + 🤖 footer>"`.
  Body ends with: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- **E2E:** do NOT add the `run-e2e` label — per the user, E2E runs on `main` only (and is slow).
  If you want extra confidence on a runtime-heavy change (storage, theming, splash, EAS), run
  Maestro **locally** (`mobile/e2e/run_e2e.sh`) — it's faster than CI.
- **Wait for green — DO NOT use `--auto`.** `main` is **not a protected branch**, so
  `gh pr merge --auto` merges the instant the PR is mergeable, *before* CI finishes — it does
  **not** wait for green. Enforce green yourself: `gh pr checks <pr> --watch --interval 30`
  (run in background; the gate is the `CI mobile checks` / `test-mobile` job: gen-drift, tsc,
  lint, jest — `CI build & deploy` runs too but only server/web matters for non-server changes).
  - Checks fail → spawn `change-implementer` with the failure output, re-run simplify+review if the
    fix is non-trivial, push, wait again.
- **Green → merge (only then):** `gh pr merge <pr> --squash --delete-branch`. Never before the
  watch reports all required jobs `SUCCESS`.

### 8. Report
Tell the user: change name, PR link, merge SHA, any inbox handoffs created, what's next.

## Parallel dispatch (multiple independent steps)
When given several independent steps, you MAY run pipelines concurrently — spawn the agents in
`isolation: "worktree"` (fresh worktrees need `npm run setup:worktree`; see the worktree memory) and
`run_in_background: true`. **But serialize merges**: merge one PR, then rebase the others onto the new
`main` before merging, because every change touches shared files (`docs/mobile/architecture-book/architecture.md`,
`mobile/app.config.ts`, the lockfile) and zero-touch merges can break each other. Respect real
dependencies (e.g. splash depends on theming + the DoD artifact).

## Invariants
- Reviewer is the sole merge gate; never merge without `VERDICT: APPROVE` + green CI.
- Never block on human-only work — inbox it (`docs/react-native-migration/inbox/`) and continue.
- Report outcomes faithfully: if CI is red or a step was skipped, say so.
