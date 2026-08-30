## Why

Root `package.json` pins `husky: ^7.0.0`, whose hooks source a generated helper
(`. "$(dirname "$0")/_/husky.sh"`). `.husky/.gitignore` holds exactly `_`, so that helper is never
checked out — and `core.hooksPath` lives in the *shared* git config, so every `git worktree`
inherits the tracked hook but not the helper. Commits in a fresh worktree died `exit=2` until
TIM-423 (PR #325) guarded the source line. That guard makes a worktree committable but lets it
commit unlinted code; it shipped as an explicitly shallow fix. This is the real one.

The v7/v8 preamble is deprecated in 9.x and **hard-fails in v10** — the stub v9 writes at
`.husky/_/husky.sh` is a notice ending *"They WILL FAIL in v10.0.0"*, and it is the only reason a
v7-shaped hook still appears to work. `husky install` is deprecated too (`bin.js:24`). husky 7 is
four years stale, and both failure modes — the loud `exit=2` before TIM-423, the silent unlinted
commit after — die in the same move.

## What Changes

- **Bump root `husky` `^7.0.0` → `^9.1.7`** and change root `prepare` from `husky install || true`
  to `husky || true`. 7 → 9 directly; v8 is a documentation waypoint, not a required install. v9
  requires Node ≥ 18, already satisfied.
- **Reduce `.husky/pre-commit` to a generic two-line hook**: `#!/bin/sh` + `npx lint-staged`. Both
  the TIM-423 guard block and the `. "$(dirname "$0")/_/husky.sh"` source line go. The hook then
  carries no husky-version knowledge at all, which is what makes it runnable under *both*
  `core.hooksPath` values during the fleet-wide migration (see Design).
- **`bin/setup-worktree.sh`**: `npx husky install` → `npx husky`, plus the header and step prose
  that describe v7 mechanics.
- **Prose reconciliation across four surfaces.** After TIM-423 the repo says in five places that a
  helper-less worktree "skips its checks with a warning". Under v9 that is false: `core.hooksPath`
  points at the gitignored `.husky/_`, so a fresh worktree finds **no hook at all** and commits
  **silently**. Every one of those sentences is rewritten to the new true statement.
- **`openspec/specs/mobile-lint-format/spec.md:169`** currently requires mobile's `lint-staged`
  config be "picked up by the existing root husky pre-commit hook **without changes to the hook
  itself**". This change edits the hook, so that clause is reconciled through this delta rather
  than by a drive-by edit — restated as a *generic-hook* contract, which is the property mobile
  actually depends on.
- **New CI hygiene job** (`ci/test-git-hooks.sh` + a `test-hooks` job in `ci-build-deploy.yml`)
  asserting the hook's file mode, its `npx` invocation, and the absence of any `husky.sh`
  reference **outside `openspec/changes/`**. This makes the two silent-regression gates permanent
  instead of review-time-only. The path exclusion is load-bearing: this change's own artifacts
  quote the helper path, and archiving carries them onto `main` for good (tasks 5.6, 6.1).
- **NOT changed:** no Architecture Book edit and no `architecture-changelog.md` entry — the Book's
  only husky sentence (`lint-format.md:19`, "picked up by the root husky hook") is version-agnostic
  and stays true. No archived OpenSpec change is touched. No attempt to re-create TIM-423's
  actionable message: v9 gives no hook-side place to print it, and the handbook already establishes
  the countermeasure (`bash bin/setup-worktree.sh` is the first action in a new worktree).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities

- `mobile-lint-format`: the pre-commit requirement stops asserting that the root hook is *unchanged*
  and instead pins what mobile actually needs from it — a **generic** hook that invokes
  `npx lint-staged` and nothing else, so lint-staged's nested-config discovery picks up
  `mobile/package.json`'s block with no mobile-specific knowledge in the hook, under either
  `core.hooksPath` value.

## Impact

- **Code / config:** `package.json` (devDependency major + `prepare`), `package-lock.json`,
  `.husky/pre-commit` (11 lines → 2, **mode must stay `100755`**), `bin/setup-worktree.sh`,
  `ci/test-git-hooks.sh` (new), `.github/workflows/ci-build-deploy.yml` (one job).
- **Docs:** `docs/agent-dev-environment.md` (8 hits / 6 sites), `README.md:66`–`:67`
  (surgical — only the parenthetical is false), and this change's spec delta for
  `openspec/specs/mobile-lint-format/spec.md:169`.
- **Host-wide side effect:** the first v9 `prepare` flips `core.hooksPath` from `.husky` to
  `.husky/_` in the **shared** `/home/dev/projects/perso/timecalendar/.git/config`, for all 49
  worktrees at once. Worktrees still holding a v7-era `.husky/_/` (33 of 49 — `husky.sh` only, no
  per-hook shims) then resolve to a directory with no `pre-commit` shim and **stop running hooks
  silently**. This is a one-time migration each worktree fixes by re-running
  `bin/setup-worktree.sh`, not a blocker — but it is why validation must not happen only in the
  worktree that ran the upgrade, and why every commit test must record the slot value it ran under.
- **Sensitive surfaces:** `package.json` is a dependency major bump and the change mutates
  host-wide `.git/config` state. Flagged for Reviewer scrutiny; no human merge tier on this board.
- **Risk:** the two silent-regression modes are (1) the hook losing mode `100755` via
  delete-and-recreate and (2) `npx lint-staged` being "simplified" to bare `lint-staged`. Both are
  invisible in the upgrading worktree and both disarm or break the 33-worktree majority. Both are
  measured in Design, gated in Tasks, and enforced by the new CI job.
