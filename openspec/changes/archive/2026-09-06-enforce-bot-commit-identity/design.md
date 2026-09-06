# Design — enforce the bot commit identity at commit time

Everything asserted here was measured during proposal, in a throwaway `git init` repository
wired to a prototype of the guard, on git 2.43.0. Where a measurement contradicted the
obvious design, the measurement is recorded — two of them are the reason this document exists
rather than a one-paragraph ticket.

## Decision 1 — probe the identity with `git var`, not by reading config

**Decision.** The guard resolves the identity with `git var GIT_AUTHOR_IDENT` and
`git var GIT_COMMITTER_IDENT`.

**Why.** A `pre-commit` hook runs before the commit object exists, so there is no header to
read. `git var` is the only probe that returns *the value git is about to use*, resolved
through git's own precedence: `GIT_AUTHOR_*` / `GIT_COMMITTER_*` environment overrides, then
`user.name` / `user.email`, then the per-repo, global and system config layers, then git's
implicit guess. Reading `git config user.email` instead would inspect exactly one of those
layers and miss every override above it.

**Measured, and the reason this matters more than it looks.** `git commit --author="…"` is
**caught** by this probe. That was not obvious — the flag is parsed by `git commit`, not by
config — but git exports the resolved author into the hook's environment, so `git var` sees
it. Prototype: repository config set to the bot, commit run with
`--author="Override Person <override@example.invalid>"`, guard **refused**. The bypass this
design was expected to have to concede does not exist.

**Format.** `git var` returns `Name <email> <unix-ts> <tz>`. The guard matches the prefix
`"$EXPECTED_NAME <$EXPECTED_EMAIL> "` exactly, including the trailing space, rather than
parsing fields out. Exact-prefix matching cannot be loosened by accident the way a substring
or a regex can.

**Failure to resolve is a refusal.** If `git var` exits non-zero — `user.useConfigOnly=true`
with nothing configured, a broken config — the guard refuses under an agent run. It fails
closed: an unresolvable identity is not a bot identity.

## Decision 2 — gate on `PAPERCLIP_RUN_ID`, and exit before reading anything

**Decision.** `[ -n "${PAPERCLIP_RUN_ID:-}" ] || exit 0` is the guard's first statement.

**Why.** Acceptance 1 requires a human to be unaffected and to see no friction. Exiting on the
first line means a human commit does not run `git var`, cannot be slowed by it, and cannot be
broken by a future change to the comparison. `PAPERCLIP_RUN_ID` is the right variable: it is
present in every Paperclip run environment, it is per-run rather than per-host, and it names
the run rather than the workspace, so it stays correct in a clone the harness did not create.

**Not** `PAPERCLIP_TASK_ID` (absent on some wake shapes), not `PAPERCLIP_AGENT_ID` (a
long-lived identity that a host-level export could leak into a human shell), and not "the
resolved identity is not a human" (that would need a denylist of humans, which the ticket
forbids and which would have to be committed to the public repository it protects).

## Decision 3 — an allowlist of exactly one identity, held in the script

**Decision.** Two constants at the top of `ci/check-commit-identity.sh`:

```sh
EXPECTED_NAME='paperclip-timecalendar[bot]'
EXPECTED_EMAIL='325604666+paperclip-timecalendar[bot]@users.noreply.github.com'
```

**Why an allowlist.** A denylist of human addresses is the one thing this file must never be:
it would commit, to a public repository, the exact strings the disclosure rule exists to keep
out of it — and it would silently pass any human identity nobody thought to list. The
allowlist has the opposite failure mode: anything unlisted is refused.

**Why in the script rather than a data file.** A second file is a second thing to keep in sync
and a second thing a worktree can be missing. One identity, two constants, one place.

**Enforced structurally.** `ci/test-git-hooks.sh` asserts the guard contains exactly one
distinct `@`-bearing token. A denylist cannot be added to this file without turning that
assertion red — the property is checked, not merely intended.

## Decision 4 — the rejection message names the expected identity and nothing else

**Decision.** On refusal the guard prints the expected identity in full, says which field
(author or committer) differs, and states that the resolved value is deliberately withheld.

**Why.** CI logs on this repository are public. Printing the resolved author is precisely the
disclosure the surrounding rule forbids, and the regression case — the one where the guard
fires — is exactly the case where the resolved value *is* a human identity. So the one
situation the message is written for is the one situation where echoing it would publish the
string. The expected identity is safe to print because it is the bot, and it is the only
information the reader needs to fix the problem.

Naming the field is safe and useful: "author" versus "committer" is a diagnosis, not an
identity, and it distinguishes a misconfigured `user.email` from an inherited
`GIT_COMMITTER_*` override.

`ci/test-git-hooks.sh` asserts this: the refusal case commits under a fabricated identity and
greps the captured stderr for it.

## Decision 5 — `|| exit 1` in the hook is load-bearing

**Decision.** `.husky/pre-commit` becomes:

```sh
#!/bin/sh
./ci/check-commit-identity.sh || exit 1
npx lint-staged
```

**Why not a bare invocation.** This repository must run its tracked hook under **both** values
`core.hooksPath` can hold — `.husky/_` (husky 9, which runs the hook as `sh -e <file>`) and
`.husky` (git execs the tracked file directly). Under `sh -e` a failing bare invocation would
abort. Under direct exec the shebang is a plain `#!/bin/sh` with no `-e`, the failure would be
**discarded**, and the hook's exit status would be `npx lint-staged`'s. The guard would be
inert under one of the two slot values and fully working under the other — invisible on
whichever machine introduces the regression. That is the same failure shape the two existing
assertions in `ci/test-git-hooks.sh` were written for, and it is why `ci/test-git-hooks.sh`
gets an assertion for this line rather than a comment.

**Fail-closed on a missing or non-executable guard.** `./ci/check-commit-identity.sh` returns
126/127 if the file is unreadable or has lost its mode, `|| exit 1` turns that into a refused
commit. That is the correct direction — a guard that cannot run must not read as a pass — and
the harness's mode assertion is what keeps it from happening on `main`.

**cwd.** Git runs hooks with the working directory set to the top level of the working tree
(the worktree's own top level, for a linked worktree), including when `git commit` is invoked
from a subdirectory. `./ci/…` therefore resolves, on the same assumption `npx lint-staged`
already makes on the line below it.

## Decision 6 — the harness runs real commits, and two measurements dictate how

The existing `ci/test-git-hooks.sh` is entirely static: `git ls-files -s` for the mode,
`git grep` for the invocation shape. Static assertions cannot satisfy acceptance 2, which
requires the guard to be shown *refusing* a commit. So the harness gains a fixture: `mktemp -d`,
`git init`, `core.hooksPath` pointed at a directory holding a symlink to the **real** tracked
`.husky/pre-commit`, a symlink to the real `ci/`, and a stub `npx` first on `PATH` (so the
fixture needs no `node_modules` and no network, keeping the Node-less `test-hooks` CI job
Node-less). Identity per case is supplied through `GIT_AUTHOR_*` / `GIT_COMMITTER_*`, which
outrank every config layer and so cannot be perturbed by the host's git configuration.

Two prototype results shape this fixture, and both were false-greens before they were caught:

**Measurement A — the inert-for-humans case must scrub `PAPERCLIP_RUN_ID` explicitly.** The
harness itself runs inside an agent run. `PAPERCLIP_RUN_ID` is therefore already exported into
the environment the test inherits, and a case that simply *does not set* it still runs with it
set. In the prototype that case was written the obvious way and the guard **fired** — the test
believed it was proving "inert for humans" while actually re-proving the refusal path. The
fixture must use `env -u PAPERCLIP_RUN_ID`, and this is the single most important line in the
new tests, because getting it wrong leaves acceptance 1 unproven while showing green.

**Measurement B — the refusal case must not pipe `git commit` through anything.** The
prototype ran `if git commit … | sed 's/^/  /'`, which evaluates *`sed`'s* status, not
git's. Every refused commit reported as committed; only a separate `git rev-list --count`
revealed that no commit existed. Redirect stderr to a file and test `git commit`'s own status
directly. (This is the same trap as `curl … | head` swallowing a failed write.)

**The five cases.** Refused: agent run + foreign identity. Refused: agent run + bot author but
foreign committer — the committer half is checked, and it is the half a stray
`GIT_COMMITTER_*` export would flip. Committed: `PAPERCLIP_RUN_ID` scrubbed + foreign identity
(the human path). Committed: agent run + bot identity (the happy path). And, on the refusal,
the stderr must not contain the rejected identity. Each refusal case asserts the commit count
did not move, not merely that git exited non-zero.

The fabricated identity is `Not The Bot <not-the-bot@example.invalid>`. `.invalid` is
reserved by RFC 2606 and matches no disclosure pattern, so the fixture can be committed to a
public repository without becoming the thing it tests for.

## Limits — stated because the doc is required to state them

A `pre-commit` hook is a good place for this check and a bad place to claim victory from.

1. **`git commit --no-verify` skips it entirely.** So does `core.hooksPath` pointed anywhere
   else. This is git's design, not a defect in the guard.
2. **It is silently inert in a worktree that never installed `.husky/_`.** Under husky 9
   `core.hooksPath` points at a gitignored directory; a fresh worktree that has not run
   `bash bin/setup-worktree.sh` finds no hook at all and commits with no warning. The guard
   inherits that hole exactly.
3. **Git does not run `pre-commit` for every commit-creating operation.** `git rebase`,
   `git cherry-pick`, `git merge` and `git revert` create commits without it. `git commit
   --amend` does run it.

The unskippable backstop is TIM-482's CI lane, which reads the real author and committer
headers of the commits a branch adds over `origin/main` — after the fact, but on a runner
nobody can pass `--no-verify` to. This change and that one are complementary: the hook stops
the bad commit from being written, the CI lane stops it from being merged. Neither replaces
the host-level fix, which is a board item on TIM-480.
