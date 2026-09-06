## Why

Every commit an agent run makes to this repository is supposed to be authored and committed
by the delivery bot. Today nothing in the repository makes that true, and nothing in the
repository would notice if it stopped being true.

TIM-480's diagnosis measured where the identity actually comes from. Nothing the harness
injects sets one: `GIT_AUTHOR_*` / `GIT_COMMITTER_*` are absent from the run environment, and
the three `GIT_CONFIG_KEY_*` entries it does inject are **credential helpers only** — they
authenticate the *push*, they do not sign the *commit*. Identity therefore falls through to
config files, and the only file naming the bot is one hand-set line in the single shared
clone's `.git/config`. That file is unversioned, host-local, and shared by every worktree.

Delete that line, clone the repository afresh, or provision a worktree from a different
clone, and git silently resolves a **human** identity instead — on this host through an
`includeIf.gitdir:` in the global config that matches every worktree path. The commit
succeeds, the push succeeds, CI is green, and the first evidence is a human name in the
public history of a public repository. TIM-480 measured the historical footprint of exactly
that failure: 419 of 456 commits on `main` carry a human identity in a header.

The corrected state is currently held up by one mutable line nobody versions. This change
replaces it with a check that lives in the repository, runs at the moment the commit is
created, and fails closed.

## What Changes

- **New guard script `ci/check-commit-identity.sh`** (POSIX `sh`, no Node, no network). It
  resolves the identity git is about to stamp on this commit with
  `git var GIT_AUTHOR_IDENT` / `git var GIT_COMMITTER_IDENT` — the same resolution order git
  itself uses, so it sees environment overrides, `--author`, and every config layer — and
  requires an exact match against **one** allowlisted identity, the delivery bot. Author and
  committer are both checked.
- **The guard only fires for agent runs.** With `PAPERCLIP_RUN_ID` unset or empty it exits 0
  before reading anything. A human committing to this repository sees no output and no
  friction, whatever identity they commit under.
- **`.husky/pre-commit` gains one line**, `./ci/check-commit-identity.sh || exit 1`, ahead of
  `npx lint-staged`. The `|| exit 1` is load-bearing, not defensive style: under
  `core.hooksPath=.husky` git execs the tracked hook directly with a plain `#!/bin/sh` and no
  `-e`, so a failing first command would be **discarded** and the hook would exit with
  lint-staged's status. The guard would then be silently inert under one of the two
  `core.hooksPath` values this repo has to support — the exact regression shape
  `ci/test-git-hooks.sh` exists for.
- **`ci/test-git-hooks.sh` grows a behavioural half.** The existing assertions are static
  (`git ls-files` mode, `git grep`). The new ones build a throwaway repository, point
  `core.hooksPath` at the real tracked hook, and run **real `git commit`s** through it: the
  refusal case, the two inert cases, the committer-only case, and an assertion that the
  refusal text does not contain the identity it rejected. A gate that has only ever been
  observed passing is not evidence that it can fail.
- **`docs/agent-dev-environment.md`** records the guard in the delivery-identity subsection,
  including its three honest limits (`--no-verify`, a worktree with no `.husky/_`, and the
  hook events git never runs `pre-commit` for), and states plainly that the hook alone does
  not close the channel.

## Capabilities

### New Capabilities

- `agent-delivery-identity`: the repository-versioned requirement that a commit created by an
  agent run carries the delivery bot as both author and committer, enforced at commit time,
  inert for humans, and proven by a test that constructs the failing condition.

### Modified Capabilities

- `mobile-lint-format`: its pre-commit requirement currently pins the root hook as "a two-line
  `#!/bin/sh` script whose only action is `npx lint-staged`". This change adds a line, so the
  clause is reconciled through this delta rather than by a drive-by edit. What mobile actually
  depends on — no mobile-specific knowledge in the hook, `npx` invocation, mode `100755` — is
  restated and kept; "two lines" and "only action" are replaced by an explicit, bounded list
  of what the hook may contain.

## Impact

- **Code / config:** `ci/check-commit-identity.sh` (new, mode `100755`), `.husky/pre-commit`
  (one line), `ci/test-git-hooks.sh` (new assertions). No workflow change — `test-hooks`
  already runs the harness on every push, and the harness stays pure git + shell so the
  Node-less CI job keeps working.
- **Docs:** `docs/agent-dev-environment.md` §2 delivery-identity subsection, plus a
  cross-reference on §6's pre-commit bullet.
- **Sensitive surfaces:** `ci/` and the git-hook path. A broken pre-commit hook blocks **every
  commit by every agent on every branch**, so the inert paths need at least as much scrutiny
  as the firing one. Flagged for the Reviewer; no human merge tier on this board.
- **Not in scope.** History rewriting — TIM-480 dispositioned the 419-commit footprint as
  *accept, no rewrite*. The `disclosure-scan` commit-header lane, which is the unskippable CI
  backstop and belongs to TIM-482. Host credential state — the global git config, the `gh`
  config, and the clone's `.git/config` are untouched by this change; the live human OAuth
  tokens on the host are a board item raised on TIM-480. Merge policy is unchanged.
