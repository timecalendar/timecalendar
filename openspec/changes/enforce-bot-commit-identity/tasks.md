## 1. The guard script

- [x] 1.1 Add `ci/check-commit-identity.sh` as POSIX `sh` with `set -eu`, tracked mode `100755` (`chmod +x` **and** `git update-index --chmod=+x` — a delete-and-recreate rewrite is what drops the bit). It depends on `git` alone: no Node, no network, no `jq`.
- [x] 1.2 Make `[ -n "${PAPERCLIP_RUN_ID:-}" ] || exit 0` the first statement after the constants, so a human commit resolves nothing and can be broken by nothing below it.
- [x] 1.3 Declare the allowlist as exactly two constants — `EXPECTED_NAME='paperclip-timecalendar[bot]'` and `EXPECTED_EMAIL='325604666+paperclip-timecalendar[bot]@users.noreply.github.com'`. No second identity, address, or domain anywhere in the file, including comments (task 2.6 enforces this).
- [x] 1.4 Check author and committer by exact prefix match on `git var GIT_AUTHOR_IDENT` / `git var GIT_COMMITTER_IDENT` against `"$EXPECTED_NAME <$EXPECTED_EMAIL> "` (trailing space included — `git var` appends ` <unix-ts> <tz>`). Use a `case` statement, not `grep`, so the match cannot be loosened by an unanchored pattern.
- [x] 1.5 Treat a non-zero exit from `git var` as a refusal, not a pass: `ident=$(git var … 2>/dev/null) || refuse …`. Fail closed.
- [x] 1.6 Write the refusal message to **stderr**: the expected name and email in full, which field differs (author or committer), and an explicit line saying the resolved value is withheld because this repository's logs are public. Never interpolate the resolved ident into any output, including any debug or trace line.
- [x] 1.7 Verify: `sh -n ci/check-commit-identity.sh` parses, and `PAPERCLIP_RUN_ID=x sh ci/check-commit-identity.sh` from the worktree root exits 0 (this worktree's identity is the bot).

## 2. Hook wiring and harness

- [x] 2.1 Insert `./ci/check-commit-identity.sh || exit 1` into `.husky/pre-commit` **above** `npx lint-staged`. The `|| exit 1` is required, not stylistic — see design Decision 5. Confirm the hook keeps tracked mode `100755`.
- [x] 2.2 In `ci/test-git-hooks.sh`, add `assert_hook_invokes_identity_guard`: the hook contains a line invoking `ci/check-commit-identity.sh`, and that line carries an explicit `|| exit` propagation. The failure message must explain the two-`core.hooksPath` reason, matching the file's existing house style.
- [x] 2.3 Add `assert_identity_guard_is_executable`: `git ls-files -s ci/check-commit-identity.sh` reports `100755`.
- [x] 2.4 Add a fixture helper that builds a throwaway repo: `mktemp -d`, `git -c init.defaultBranch=main init -q`, a hooks directory holding a symlink to the repository's real `.husky/pre-commit`, a symlink to the real `ci/` directory, `core.hooksPath` set locally to that hooks directory, and a stub `npx` (`#!/bin/sh` / `exit 0`) first on `PATH`. Register a `trap` cleanup. Symlink rather than copy so the tests exercise the tracked files.
- [x] 2.5 Add the five behavioural cases, each supplying identity through `GIT_AUTHOR_*` / `GIT_COMMITTER_*` (which outrank every config layer, so the host's git config cannot perturb them):
  - refused — `PAPERCLIP_RUN_ID` set, author `Not The Bot <not-the-bot@example.invalid>`;
  - refused — `PAPERCLIP_RUN_ID` set, author the bot, committer `Not The Bot <…>`;
  - committed — `env -u PAPERCLIP_RUN_ID`, author `Not The Bot <…>` (the human path);
  - committed — `PAPERCLIP_RUN_ID` set, author and committer the bot;
  - no-echo — the first case's captured stderr contains neither `Not The Bot` nor `not-the-bot@example.invalid`.
- [ ] 2.6 Add `assert_identity_guard_holds_one_identity`: `grep -oE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+' ci/check-commit-identity.sh | sort -u | wc -l` is exactly 1. This is what makes "allowlist, never a denylist" a checked property rather than a review note.
- [ ] 2.7 **`env -u PAPERCLIP_RUN_ID` on the human case is mandatory.** The harness runs inside an agent run, so the variable is already in the environment it inherits; a case that merely omits it runs with it set and silently re-tests the refusal path while reporting green. This was measured on the prototype — see design Decision 6, Measurement A.
- [ ] 2.8 **Never pipe `git commit`.** Redirect stderr to a file and test git's own exit status; a pipeline reports the last command's status, so a refused commit piped through `sed`/`tee` reads as a success. Measured on the prototype — design Decision 6, Measurement B.
- [ ] 2.9 Assert the commit count in every case (`git rev-list --count HEAD`, 0-safe on an empty repo), not only git's exit status. Exit status alone does not prove no commit object was written.
- [ ] 2.10 Keep the harness pure git + shell and keep it invoked by the existing `test-hooks` job. Do not add a Node setup step, do not add a second script, do not touch `.github/workflows/`.

## 3. Documentation

- [ ] 3.1 In `docs/agent-dev-environment.md`, extend the **GitHub delivery identity: the Paperclip GitHub App** subsection with the commit-time guard: what it checks (author and committer), when it fires (`PAPERCLIP_RUN_ID` present), that it is an allowlist of one, and that its message deliberately withholds the rejected identity.
- [ ] 3.2 In the same subsection, state the three limits plainly: `--no-verify` skips it, a worktree that never ran `bash bin/setup-worktree.sh` has no `.husky/_` and runs no hook at all, and git does not run `pre-commit` for `rebase` / `cherry-pick` / `merge` / `revert` (it does for `--amend`). Say explicitly that the hook alone does not close the channel, and name the CI header lane as the unskippable backstop and separate work.
- [ ] 3.3 Add one cross-reference on §6's pre-commit bullet so a reader arriving at "How changes are committed" learns the hook now also gates identity.
- [ ] 3.4 Record what the guard does **not** fix: the host's git config, the host's `gh` config, and the shared clone's `.git/config` are untouched by this change. Do not restate host credential detail beyond that — it is a board item, not repository content.
- [ ] 3.5 No Architecture Book edit and no `architecture-changelog.md` entry: this touches `ci/` and the git-hook path, not `mobile/`. The Book's only husky sentence (`lint-format.md`) stays true. Confirm by re-reading it rather than assuming.

## 4. Local-green verification

- [ ] 4.1 Run `./ci/test-git-hooks.sh` from the worktree root; all assertions pass, including the three pre-existing ones.
- [ ] 4.2 **Prove the harness can fail.** Temporarily break the guard three separate ways and confirm the harness goes red each time, then revert: (a) change `|| exit 1` to a bare invocation in the hook — the propagation assertion must fire; (b) make the guard `exit 0` unconditionally — the two refusal cases must fire; (c) add a second email address to the guard — the one-identity assertion must fire. A harness observed only passing is not evidence. Record the three results in this file.
- [ ] 4.3 Make one real commit in this worktree and confirm it is created with the bot identity and that the guard printed nothing (`git log -1 --format='%an|%cn'`).
- [ ] 4.4 Confirm the hook still lints: stage a `mobile/` TypeScript file with an auto-fixable violation, commit, and confirm `eslint --fix` rewrote it — the guard must not have displaced `npx lint-staged`.
- [ ] 4.5 Run `git commit` from a subdirectory (e.g. `mobile/`) and confirm the guard still resolves `./ci/check-commit-identity.sh` — git sets the hook's cwd to the worktree top level, and this is the assumption the invocation rests on.
- [ ] 4.6 Run `openspec validate enforce-bot-commit-identity` and `git diff --check`. Confirm no secret, no generated-client or OpenAPI drift, no migration, no native/store config, no legacy Flutter file, and no workflow change is present.
- [ ] 4.7 Grep the whole diff for a human name, address, or domain before committing — the guard's own file, the harness fixture, the docs, and the commit messages. The fabricated identity must be the `.invalid` one and nothing else.

## 5. CI proof on the pushed head

- [ ] 5.1 After pushing, confirm the `Test git hooks` job in `CI build & deploy` ran on the exact PR head and is green — including the new behavioural cases, which must work on a runner with no `node_modules` and no network access for `npx`.
- [ ] 5.2 If the job fails on the fixture rather than on the guard, repair the fixture; do not weaken an assertion to make it pass, and do not delete a case.
