# Tasks — upgrade husky 7 → 9

Start from `origin/main` @ `17b1a48f` or later. Line numbers below were re-measured on `17b1a48f`
and are **locator aids only** — this ticket has already burned one stage on stale numbers, so every
prose task carries the needle string too. Re-grep before editing; if a number is off, trust the
string.

## 1. The dependency bump

- [x] 1.1 Root `package.json`: `devDependencies.husky` `^7.0.0` → `^9.1.7`. Leave the `lint-staged`
      dependency and the `overrides.lint-staged` block alone — `overrides.lint-staged` (line 27) is
      a transitive-dependency override, not a second lint-staged config.
- [x] 1.2 Root `package.json` `scripts.prepare`: `husky install || true` → `husky || true`. Keep
      `|| true`: `index.js:11` returns a non-empty *string* (not a throw) when `.git` is absent, but
      the guard also covers `--ignore-scripts` and non-git installs.
- [x] 1.3 `npm install` at the repo root to update `package-lock.json`. Commit the lockfile. Expect
      the deprecation line from `bin.js:24` to **disappear** from install output — that is the first
      confirmation the new `prepare` took effect.

## 2. The hook itself (mode is load-bearing — read Design first)

- [x] 2.1 Reduce `.husky/pre-commit` from 11 lines to exactly two: `#!/bin/sh` and `npx lint-staged`.
      Both the TIM-423 guard block (`:2`–`:8`) and the source line (`:9`) go.
- [x] 2.2 **Edit in place** (`sed -i`, or an editor that preserves the inode's mode). Do NOT
      delete-and-recreate and do NOT use a `Write`-style whole-file replacement: that records
      `100644`, which git **silently ignores** under `core.hooksPath = .husky` — the state 33 of 49
      worktrees are in. See Design, *"the hook must keep mode `100755`"*.
- [x] 2.3 Verify before committing: `git ls-files -s .husky/pre-commit` starts with `100755`. If it
      reads `100644`, fix with `chmod +x .husky/pre-commit && git update-index --chmod=+x .husky/pre-commit`.
- [x] 2.4 **Keep `npx`.** Do not shorten to bare `lint-staged`. Under the `.husky` slot nothing
      prepends `node_modules/.bin` to `PATH` (that is `_/h:16`, which only runs under the `.husky/_`
      slot), so a bare invocation dies `command not found` and aborts the commit. See Design.
- [x] 2.5 `sh -n .husky/pre-commit` is clean.

## 3. `bin/setup-worktree.sh`

- [x] 3.1 `:96` — `npx husky install` → `npx husky`. (`husky install` still works in 9.x but prints
      `husky - install command is DEPRECATED` to stderr on every worktree setup.)
- [x] 3.2 `:92`–`:95` — the comment block beginning *"The root install's `prepare` already
      regenerates the gitignored `.husky/_/`"* still describes the correct mechanic under v9 (the
      installer does regenerate `_`), but re-read it against the new command name and adjust any
      wording that implies the v7 helper specifically.
- [x] 3.3 `:5` — header line *"`.husky/_/` (the pre-commit hook then skips its checks with a
      warning)"*. False under v9: there is no warning, because with the slot pointing at a
      non-existent `.husky/_` nothing of ours runs. Rewrite to the new true statement (below).
- [x] 3.4 `:12` — *"root's `prepare` regenerates husky"* stays true; review, edit only if the
      surrounding wording implies the v7 helper.

## 4. Prose reconciliation

The single new true statement, to be used consistently:

> A worktree that has not run `bin/setup-worktree.sh` runs **no hooks at all, silently** —
> `core.hooksPath` points at the gitignored `.husky/_`, which does not exist there.

- [x] 4.1 `docs/agent-dev-environment.md` — 8 hits across 6 sites: `:95` (file-tree gloss *"skips
      when `.husky/_/` is missing"*), `:246`/`:249` (*"skips its checks and prints how to fix it"* —
      the #325 sentence), `:261` (a **second** `npx husky install`, buried in prose and easy to miss
      because it is not in `setup-worktree.sh`), `:285`/`:288` (the pre-commit bullet; `:288` was
      *added* by #325 and repeats the skip-with-a-message claim), `:577`/`:588` (quick-reference
      lines — read them, but they are likely already version-agnostic; do not churn them).
- [x] 4.2 `docs/agent-dev-environment.md` — add a short note recording the **host-wide slot flip**:
      the first v9 `prepare` repoints `core.hooksPath` for every worktree at once, so a pre-existing
      worktree may silently stop linting until it re-runs `bin/setup-worktree.sh`. This is the
      whole point of writing it down — the next agent to hit a silently-non-linting worktree needs
      the cause to be findable.
- [x] 4.3 `README.md` `:66`–`:67` — **surgical**. `:66`'s *"the generated husky helper `.husky/_/`"*
      is still **true** (v9 also generates and gitignores `.husky/_/`) and stays. Only `:67`'s
      parenthetical *"(the pre-commit hook then skips its checks with a warning)"* is false. Do not
      delete the whole clause.
- [x] 4.4 Sweep: `git grep -n -i 'skips its checks\|silently abort\|husky install' --
      ':!openspec/changes/' ':!ci/test-git-hooks.sh'` returns nothing. Both exclusions are
      load-bearing and for the same reason as 5.6's: this change's own artifacts quote the old
      wording, and `ci/test-git-hooks.sh:9` contains the words *"the last husky install wins"* —
      English prose about installing husky, **not** the deprecated `husky install` command this
      sweep is hunting. Excluded by **path**, per the rule 5.6 keeps re-teaching, rather than by
      narrowing the needle to a command-shaped pattern.
      *(Simplifier, 2026-08-30: this sweep was run and ticked during §4, before §6 added
      `ci/test-git-hooks.sh` — so it was green against a tree that did not yet contain the file
      that trips it. Identical in shape to 5.6's untracked-script trap and to the description's
      `:117`: a check verified against an earlier tree than the one it ships against. Re-measured
      after the exclusion: 0 hits.)*

### Do not touch

- [x] 4.5 **Archives are history.** `git grep -ln husky` also matches four archived files (6 hits;
      `-ln` lists files, so the six line citations below are not six files) — leave
      every one byte-for-byte: `openspec/changes/archive/2026-06-12-add-mobile-lint-format/`
      (`proposal.md:17`, `design.md:5,19,56`, `specs/mobile-lint-format/spec.md:83`) and
      `openspec/changes/archive/2026-06-12-scaffold-mobile-expo/design.md:47`. Note that archived
      `spec.md:83` is byte-identical to the live `:169` — the live one is reconciled by this
      change's delta, the archived one is not. *A diff touching `openspec/changes/archive/**` is a
      defect, not thoroughness.*
- [x] 4.6 **Grep decoy.** `docs/mobile/architecture-book/lint-format.md:72` contains *"silently
      never fires"*, but it is about an ESLint flat-config false negative and has nothing to do with
      husky. A `grep silently` sweep surfaces it. Leave it alone.
- [x] 4.7 **No Architecture Book edit and no `architecture-changelog.md` entry.** The Book's only
      husky sentence, `lint-format.md:19` (*"picked up by the root husky hook"*), is
      version-agnostic and stays true under v9. Confirm this by re-reading it; record the
      confirmation rather than making an edit. (The Book is a binding surface — an unnecessary edit
      there costs a changelog entry and a review round.)

## 5. Validation — the acceptance gates

Every commit test below **must record `git config --get core.hooksPath` immediately before the
commit**, in the PR body. Without the slot value the result is unattributable: the same worktree
lints or does not depending on which value some other worktree last wrote. The slot is a *recorded
observation*, never a pass/fail gate — one v9 install anywhere makes it read `.husky/_` in all 49
worktrees, including the ones that are silently broken.

- [x] 5.1 In the upgrading worktree: `test -x .husky/_/pre-commit && test -f .husky/_/h`. This
      proves a v9 install ran here — nothing more. `index.js:22` writes all 14 shims
      unconditionally, and `_/h:6` exits 0 when the tracked hook is missing, so this is not the
      wiring proof. 5.2 is.
- [x] 5.2 **The commit gate — use the `mobile/` arm.** Stage a deliberately unformatted
      `mobile/**/*.ts` and confirm `eslint --cache --fix` **rewrites it in the commit**. Paste the
      terminal output.
      **The `*.dart` arm is not a valid substitute on this host.** Root `lint-staged` maps `*.dart`
      to `dart format` + `bin/flutter-analyze.sh`, and neither `dart` nor `flutter` is on `PATH`
      (the SDK is at `/home/dev/flutter` but unlinked). lint-staged exits non-zero on
      `command not found`, so the commit is rejected **identically whether the husky wiring is
      correct or catastrophically broken** — it cannot distinguish the two, which is the only thing
      this gate exists to prove. Git hooks inherit the committing shell's environment, so this is
      not fixable by sourcing something first. *(Pre-existing, not caused by this change.)*
- [x] 5.3 A **second, pre-existing** worktree, after re-running `bin/setup-worktree.sh`, also lints
      on commit. Record its slot value. This is the one that catches a fleet-wide regression, so it
      cannot be skipped or substituted with the upgrading worktree.
      *Applier note:* run in a **second worktree created for the test** rather than in one of the
      live agent worktrees — running `setup-worktree.sh` inside another agent's checkout would
      `npm ci` under it mid-run. What it proves is unchanged (an independent worktree, its own
      `node_modules`, its own install, lints on commit); what it does **not** prove is the
      stale-branch case, which is covered by the read-only fleet census in the PR body.
- [x] 5.4 A **fresh** `git worktree` with no `node_modules` and no manual setup can commit. Record
      the slot value, and document that the new tracked hook is runnable under **both** values —
      directly when the slot is `.husky`, via the generated shim when it is `.husky/_`.
- [x] 5.5 `git ls-files -s .husky/pre-commit` reads `100755`. **Hard gate.** In `git show` a
      regression renders as `old mode 100755` / `new mode 100644`.
- [x] 5.6 `git grep -n 'husky\.sh' -- ':!openspec/changes/' ':!ci/test-git-hooks.sh'` returns
      nothing. **A second exclusion was needed — the FOURTH variant of this criterion to prove
      unpassable** (Applier, 2026-08-30). `ci/test-git-hooks.sh` names the helper in its own
      comment and failure message, because a check that exists to ban a string has to say which
      string. It went undetected at first because the gate was verified while the script was still
      **untracked**, and `git grep` searches tracked files only — so it reported green against the
      exact tree it fails on once committed. Same root cause as the previous three: measured
      against the source tree, not the committed tree *including the documents describing the
      change*. Verified after committing, and regression-tested by appending a helper reference to
      `bin/setup-worktree.sh` — still caught, so the exclusion is narrow, not a blanket. **The path
      exclusion is required, not cosmetic** (FE, 2026-08-30, measured on `e9a32c5f`): the unscoped
      `git grep -n 'husky\.sh'` is *already* unpassable on this branch. Rewriting the hook clears
      its 2 hits, but **10 hits remain across 4 files** (re-measured on `0961da19`) — `proposal.md`
      (5), `design.md` (2), `tasks.md` (2), `ci/test-git-hooks.sh` (1) — which quote the helper path
      precisely because they document the mechanics being removed. They cannot be written away, and
      `openspec archive` carries the `openspec/changes/` ones into
      `openspec/changes/archive/…/` permanently. Excluding `openspec/changes/` covers the live
      change and its future archived copy in one pattern, and leaves the criterion meaning what it
      always meant: no *operative* file still references the helper. Measured on `0961da19`:
      scoped = 0 hits, unscoped = 10.
      The FE's original figure was **9**, measured on `e9a32c5f` — correct for that tree, where
      `ci/test-git-hooks.sh` did not yet exist. Its 10th hit is the script's own failure message,
      i.e. exactly the hit the second exclusion was added for, so the pre-script count is the one
      number that cannot justify the post-script criterion. Re-anchored rather than deleted,
      because the drift is the lesson.
      Note: `grep -rn --exclude-dir=node_modules` is **not** a substitute and can never pass —
      `index.js:23` rewrites `.husky/_/husky.sh`, and its content *contains* the literal string
      `/_/husky.sh` (it is the deprecation notice telling you to delete that line). `grep -rn` does
      not honour `.gitignore`; `git grep` searches tracked files only, which is what the criterion
      means.
- [x] 5.7 No prose anywhere in the repo still claims the hook "skips its checks with a warning" or
      that a commit "silently aborts" because the helper is missing.

## 6. CI proof

- [x] 6.1 Add `ci/test-git-hooks.sh` (`#!/usr/bin/env bash`, `set -euo pipefail`, matching
      `ci/test-timecalendar-chart.sh`'s style) asserting, on the checked-out tree:
      (a) `git ls-files -s .husky/pre-commit` begins with `100755`;
      (b) the hook invokes lint-staged via `npx`, i.e. it does **not** contain a bare
      `lint-staged` invocation at the start of a line;
      (c) `git grep -n 'husky\.sh' -- ':!openspec/changes/' ':!ci/test-git-hooks.sh'` finds nothing.
      **(c) must carry both exclusions** — see 5.6; the script's own text is the fourth instance
      of the same trap, and it is only visible once the script is tracked. Unscoped, this job is red
      the moment it is added (10 hits on `0961da19`, including the script's own) and stays red on `main`
      forever once the change is archived. That failure mode is especially dangerous here because
      6.3 tells you to see the job red before trusting it: unscoped, you would see red, conclude
      the gate works, and ship a permanently-failing job. Confirm (c) passes on the tree *as it
      stands with the artifacts present* — that is the real test of the exclusion.
      Each assertion fails with a message naming *why* it matters — the mode and `npx` regressions
      are both invisible in the worktree that introduces them, so the failure text is the only place
      a future contributor learns the reason.
- [x] 6.2 Add a `test-hooks` job to `.github/workflows/ci-build-deploy.yml` (the workflow runs on
      every push) mirroring `test-chart`: `runs-on: ubuntu-latest`, `actions/checkout@v6`, then
      `./ci/test-git-hooks.sh`. No Node setup needed — the script is pure git + shell.
- [x] 6.3 Prove the job actually fails on regression before trusting it: locally flip the mode to
      `100644`, run `./ci/test-git-hooks.sh`, confirm non-zero and a readable message; then restore.
      Do the same for a bare-`lint-staged` hook body. A hygiene check that has never been seen red
      is not a gate.

## 7. Local green + handoff

- [x] 7.1 `sh -n .husky/pre-commit` clean; `bash -n bin/setup-worktree.sh` clean;
      `bash -n ci/test-git-hooks.sh` clean.
- [x] 7.2 `npx openspec validate upgrade-husky-9 --strict` passes.
- [x] 7.3 No mobile/server source changed, so the mobile and server suites are out of scope for this
      change — do not run them as a reflex. If `package-lock.json` churn extends beyond husky,
      **stop and report** rather than absorbing it: this is a root-workspace lockfile shared with
      `web/` and `openapi/javascript/`.
- [x] 7.4 PR body records: the four slot-value observations from §5, the `git ls-files -s` output,
      and an explicit note that `package.json` (dependency major) and host-wide `.git/config` state
      are the sensitive surfaces for Reviewer scrutiny.
