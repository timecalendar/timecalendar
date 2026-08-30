# Design — upgrade husky 7 → 9

Every mechanical claim below was measured, not recalled: against the `husky@9.1.7` tarball
(`package/index.js`, `package/bin.js`, `package/husky`) and against a throwaway git repo that
reproduces both `core.hooksPath` values. Line references are to the tarball; commit-behaviour
tables are observed output.

## What husky v9 actually does

`index.js` (25 lines, the whole installer):

| Line | Effect |
|---|---|
| `:14` | `git config core.hooksPath .husky/_` — **not** `.husky` |
| `:20` | writes `.husky/_/.gitignore` containing `*`, so `_` self-ignores |
| `:21` | copies the `husky` shim runner to `.husky/_/h` |
| `:22` | writes a generated shim for **all 14 hook names**, unconditionally, at `mode: 0o755` |
| `:23` | writes `.husky/_/husky.sh` — a stub that echoes the *"They WILL FAIL in v10.0.0"* notice |

So under v9 git never invokes `.husky/pre-commit`. It invokes the gitignored, generated
`.husky/_/pre-commit` shim → `.husky/_/h` → the tracked hook. The tracked hook is still not the
thing git calls.

`_/h` (the runner) matters more than the installer:

```sh
s=$(dirname "$(dirname "$0")")/$n
[ ! -f "$s" ] && exit 0          # :6  — missing tracked hook exits 0, silently
export PATH="node_modules/.bin:$PATH"   # :16
sh -e "$s" "$@"                  # :17 — invoked via `sh`, NOT execve
```

Lines `:16` and `:17` are the source of the two asymmetries that drive this design.

**Consequence for a fresh worktree:** `core.hooksPath` points at `.husky/_`, which does not exist.
Git finds no hook and the commit succeeds **silently, with no message at all**. The `exit=2` failure
is genuinely gone, and TIM-423's actionable *"Run `npm run setup:worktree`"* line goes with it.

## Decision: accept the lost message rather than re-create it

v9 offers no hook-side place to print a "your worktree is not set up" warning — when the slot points
at a non-existent `.husky/_`, nothing of ours runs. The alternatives are a wrapper script, a
`prepare`-time check, or committing a `_` directory; all three re-introduce a generated-file seam
that this change exists to delete, and the third fights the installer, which rewrites `_` on every
install.

**Decision:** accept the trade and record it in the docs. `docs/agent-dev-environment.md` §5 already
states that the first action in a new worktree is `bash bin/setup-worktree.sh`; that is the real
countermeasure and it predates both TIM-423 and this change. The docs change from *"the hook skips
with a warning"* to *"a worktree that has not run `bin/setup-worktree.sh` runs no hooks at all,
silently"*.

## Decision: the hook must keep mode `100755` — this is a gate, not hygiene

The two invocation paths are **not symmetric about the executable bit**. Measured in a throwaway
repo, both slots × both modes:

| Slot | How the tracked hook is invoked | mode `644` | mode `755` |
|---|---|---|---|
| `.husky` | git runs it **directly** (`execve`, checks `X_OK`) | **skipped — commit succeeds** | runs, blocks |
| `.husky/_` | shim → `_/h` → `sh -e "$s"` | runs, blocks | runs, blocks |

`sh <file>` does not consult the executable bit, so under the v9 slot the mode is genuinely
irrelevant. Under the v7 slot git treats a non-executable hook as **absent**, printing only:

```
hint: The '.husky/pre-commit' hook was ignored because it's not set as executable.
hint: You can disable this warning with `git config advice.ignoredHook false`.
```

— and creates the commit anyway.

**Why this needs a gate.** The tracked hook is `100755` and 11 lines today; this change cuts it to
2. Rewriting a file by delete-and-recreate (or by a `Write` tool) is the natural way to do that and
records `100644`. The result lints on the machine that ran the upgrade (slot `.husky/_`) and
**silently does not lint on every worktree still holding the v7 slot** — 33 of 49. The only signal
is one suppressible hint line in noisy commit output.

**Decision:** `git ls-files -s .husky/pre-commit` reading `100755` is a hard acceptance criterion
and a CI assertion. It renders in `git show` as `old mode` / `new mode`, so the Reviewer can read it
straight off the diff. Prefer `sed -i`/in-place edit over delete-and-recreate; if the file is
recreated, `chmod +x` and `git update-index --chmod=+x` before committing.

## Decision: keep `npx lint-staged` — do NOT simplify to bare `lint-staged`

This is a second asymmetry, in the same direction, and it is a live simplification trap: a reader
who knows v9 puts `node_modules/.bin` on `PATH` will correctly observe that `npx` is redundant —
**under the v9 slot only**. `_/h:16` does that export; direct git invocation under the `.husky` slot
does not. Measured with a stand-in binary present only in `node_modules/.bin`:

| Hook body | slot `.husky` | slot `.husky/_` |
|---|---|---|
| `fakelint` (bare) | `fakelint: not found`, **rc=1, commit blocked** | runs, commit created |
| `npx --no-install fakelint` | runs, commit created | runs, commit created |

Unlike the mode regression this one is **loud** — it hard-fails the commit rather than silently
skipping — but it breaks committing outright in the 33 worktrees on the old slot, which is the exact
failure class TIM-423 was filed to remove.

**Decision:** the hook body stays `npx lint-staged`. `npx` resolves from `node_modules` regardless
of `PATH`, which is precisely what makes the hook slot-agnostic. This is asserted in CI so a future
simplifier pass cannot quietly remove it, and is called out in the spec delta as a contract rather
than an incidental spelling.

## Non-decision: the shebang is *not* load-bearing (measured, contra intuition)

The symmetric-looking hypothesis — that `#!/bin/sh` is as load-bearing as the mode, since git
`execve`s the hook directly under the v7 slot — is **false**. Measured: a hook with mode `755` and
no shebang runs correctly under **both** slots. Git's `run-command` retries with the shell when
`execve` fails with `ENOEXEC`.

Recorded so nobody adds a spurious third gate. Keep `#!/bin/sh` for readability; do not test for it.

## Decision: `test -x .husky/_/pre-commit` is kept, with its meaning stated

`index.js:22` writes all 14 shims unconditionally, so this test proves only that *a v9 install ran
in this worktree*. It does **not** prove the tracked hook exists, is wired, or will run — `_/h:6`
exits 0 when the tracked hook is missing.

**Decision:** keep it as the cheap positive check that the upgrade's install step worked, and never
treat it as the wiring proof. The wiring proof is an actual staged commit (Tasks §5).

## Decision: reconcile `mobile-lint-format:169` as a *generic-hook* contract, not a new capability

The clause "without changes to the hook itself" was written when mobile's contribution was purely
`mobile/package.json`'s nested `lint-staged` block. This change edits the hook, so the clause is now
false. Two options: create a new repo-tooling capability for the hook, or restate the existing
requirement.

**Decision:** restate the existing requirement. What mobile depends on is not that the hook is
*unchanged* but that it is *generic* — that it invokes `npx lint-staged` and carries no
mobile-specific knowledge, so nested-config discovery does the work. That is a property of
`mobile-lint-format`, and spinning up a new capability for a two-line shell script would add a spec
surface without adding a contract. The `npx` and mode constraints ride along as scenarios, which is
what makes them survive a future refactor.

## Migration hazard: the `core.hooksPath` slot is host-wide and last-install-wins

`core.hooksPath` is a **single value** in `/home/dev/projects/perso/timecalendar/.git/config`
(`git config --show-origin --get core.hooksPath` reports that file, not any worktree's). All 49
worktrees on this host share it. Both versions write it on install — v7 `lib/index.js:24` → `.husky`,
v9 `index.js:14` → `.husky/_`. **The last install anywhere on the host wins everywhere**, and it will
keep oscillating for as long as sibling worktrees provision off a v7-pinned `main`: every
`bin/setup-worktree.sh` run on an unrebased branch flips it back to `.husky`.

| Worktree state | Count | After the flip to `.husky/_` |
|---|---|---|
| v7-era `.husky/_/` (`husky.sh` only, no shims) | 33 | **silently stops linting** |
| no `.husky/_` at all | 15 | no hook (already the TIM-423 case) |
| full v9 `_/` with all 14 shims | 1 | works |

Two consequences for validation, both binding on Tasks §5:

1. `git config --get core.hooksPath` is **not** evidence for any single worktree. One v9 install
   anywhere makes it read `.husky/_` in all 49, including the ones that are silently not linting —
   it returns the reassuring answer on exactly the broken worktrees. It is a *recorded observation*
   attached to each commit test, never a pass/fail gate.
2. A hook test in "a second, untouched worktree" is uninterpretable unless the slot value at that
   moment is recorded alongside it. The same worktree lints or does not depending on a value some
   other worktree last wrote.

This is why the two decisions above matter more than they look: because the tracked hook after this
change is a plain `#!/bin/sh` + `npx lint-staged` with no helper dependency and mode `755`, it is
runnable under **both** slot values — directly when the slot is `.husky`, via the generated shim when
it is `.husky/_`. That is what downgrades the fleet-wide flip from a blocker to a one-time
per-worktree migration. Drop either the mode or the `npx` and that property is gone.
