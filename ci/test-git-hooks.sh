#!/usr/bin/env bash

set -euo pipefail

readonly HOOK="${1:-.husky/pre-commit}"
readonly REPO_ROOT="$(git rev-parse --show-toplevel)"
readonly EXPECTED_NAME='paperclip-timecalendar[bot]'
readonly EXPECTED_EMAIL='325604666+paperclip-timecalendar[bot]@users.noreply.github.com'
readonly FOREIGN_NAME='Not The Bot'
readonly FOREIGN_EMAIL='not-the-bot@example.invalid'

FIXTURE_ROOT=""

cleanup() {
  if [[ -n "$FIXTURE_ROOT" ]]; then
    rm -rf -- "$FIXTURE_ROOT"
  fi
}

trap cleanup EXIT

# The tracked pre-commit hook has to run under *both* values git's core.hooksPath can
# hold. That slot lives in the shared .git/config, so it is one host-wide value that
# the last husky install wins: husky 9 writes `.husky/_`, husky 7 wrote `.husky`, and
# a worktree provisioned off an older branch flips it back. The two values invoke the
# hook by different routes, and each assertion below guards a property that only one
# route needs — which is exactly why a regression is invisible on the machine that
# introduces it. Details:
# openspec/changes/archive/2026-08-30-upgrade-husky-9/design.md.

assert_hook_is_executable() {
  local mode
  mode="$(git ls-files -s -- "$HOOK" | awk '{print $1}')"

  if [[ "$mode" != "100755" ]]; then
    echo "FAIL: $HOOK is tracked with mode ${mode:-<untracked>}, expected 100755." >&2
    echo "  Under core.hooksPath=.husky git execs the hook directly and checks the" >&2
    echo "  executable bit, so a 100644 hook is treated as ABSENT: the commit is" >&2
    echo "  created UNLINTED, signalled only by a suppressible advice.ignoredHook" >&2
    echo "  hint. Under core.hooksPath=.husky/_ husky runs it as 'sh -e <file>'," >&2
    echo "  which never consults the bit — so wherever husky 9 is installed this" >&2
    echo "  regression cannot be reproduced locally." >&2
    echo "  Rewriting the hook by delete-and-recreate is what drops the bit. Fix:" >&2
    echo "    chmod +x $HOOK && git update-index --chmod=+x $HOOK" >&2
    return 1
  fi
}

assert_lint_staged_runs_through_npx() {
  if grep -Eq '^[[:space:]]*lint-staged\b' "$HOOK"; then
    echo "FAIL: $HOOK invokes lint-staged bare; it must go through npx." >&2
    echo "  husky 9 prepends node_modules/.bin to PATH in .husky/_/h, which makes" >&2
    echo "  a bare 'lint-staged' look redundant-but-fine — but that export runs ONLY" >&2
    echo "  under core.hooksPath=.husky/_. Under core.hooksPath=.husky git invokes" >&2
    echo "  this hook directly, nothing augments PATH, and a bare invocation dies" >&2
    echo "  'lint-staged: command not found' and ABORTS the commit outright." >&2
    echo "  npx resolves from node_modules regardless of PATH; that is what makes" >&2
    echo "  the hook work under either slot value. Do not simplify it away." >&2
    return 1
  fi

  if ! grep -Eq '^[[:space:]]*npx[[:space:]]+lint-staged\b' "$HOOK"; then
    echo "FAIL: $HOOK does not run 'npx lint-staged'." >&2
    echo "  The hook's whole job is to hand staged files to lint-staged, which" >&2
    echo "  discovers mobile/package.json's nested config. See the" >&2
    echo "  mobile-lint-format capability." >&2
    return 1
  fi
}

assert_no_husky_helper_references() {
  # Both exclusions are load-bearing, not cosmetic, and for the same reason: any
  # file whose *job* is to explain why the v7 helper is gone has to name it. The
  # OpenSpec proposal does (and `openspec archive` carries it to
  # openspec/changes/archive/ permanently); so does this script, in the comment
  # above and in the failure message below. Unscoped, this assertion is red the day
  # it is added and red on main forever after.
  #
  # Note the self-reference: excluding this file was NOT in the original design,
  # because the gate was first verified while it was still untracked and `git grep`
  # searches tracked files only. That made it look green against the very tree it
  # would fail on once committed.
  #
  # The rule this keeps re-teaching: scope a grep gate by PATH, never by wording,
  # and measure it against the committed tree including the documents that describe
  # the change. The criterion means "no *operative* file still sources the helper" —
  # a description of the removal is not an instance of it.
  local hits
  hits="$(git grep -n 'husky\.sh' -- ':!openspec/changes/' ':!ci/test-git-hooks.sh' || true)"

  if [[ -n "$hits" ]]; then
    echo "FAIL: operative files still reference husky 7's generated helper:" >&2
    echo "$hits" >&2
    echo "  .husky/_/husky.sh is husky 7/8's sourced preamble. It is deprecated in" >&2
    echo "  9.x and HARD-FAILS in v10. It is also gitignored, so it never exists in" >&2
    echo "  a fresh worktree. A hook that sources it breaks there; prose that" >&2
    echo "  describes it documents a mechanic this repo no longer uses." >&2
    return 1
  fi
}

assert_hook_invokes_identity_guard() {
  if ! grep -Eq '^[[:space:]]*\./ci/check-commit-identity\.sh[[:space:]]*\|\|[[:space:]]*exit([[:space:]]+[0-9]+)?[[:space:]]*$' "$HOOK"; then
    echo "FAIL: $HOOK must invoke the identity guard with explicit '|| exit' propagation." >&2
    echo "  Under core.hooksPath=.husky/_ husky runs the tracked hook with sh -e," >&2
    echo "  but under core.hooksPath=.husky git executes its plain sh script" >&2
    echo "  directly. Without explicit propagation that route discards a guard" >&2
    echo "  failure and continues to lint-staged." >&2
    return 1
  fi
}

assert_identity_guard_is_executable() {
  local mode
  mode="$(git ls-files -s -- ci/check-commit-identity.sh | awk '{print $1}')"

  if [[ "$mode" != "100755" ]]; then
    echo "FAIL: ci/check-commit-identity.sh is tracked with mode ${mode:-<untracked>}, expected 100755." >&2
    echo "  The pre-commit hook executes the guard directly, so a missing executable" >&2
    echo "  bit refuses every guarded commit instead of checking its identity." >&2
    return 1
  fi
}

assert_identity_guard_holds_one_identity() {
  local identity_count
  identity_count="$({ grep -oE '[][A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+' ci/check-commit-identity.sh || true; } | sort -u | wc -l | tr -d '[:space:]')"

  if [[ "$identity_count" != "1" ]]; then
    echo "FAIL: ci/check-commit-identity.sh contains $identity_count distinct addresses, expected exactly one." >&2
    echo "  The guard is an allowlist of the delivery bot only; adding any second" >&2
    echo "  identity or a denylist must fail this harness." >&2
    return 1
  fi
}

create_fixture_repo() {
  local name=$1
  local repo="$FIXTURE_ROOT/$name"

  mkdir -p "$repo/hooks" "$repo/bin"
  git -c init.defaultBranch=main init -q "$repo"
  ln -s "$REPO_ROOT/.husky/pre-commit" "$repo/hooks/pre-commit"
  ln -s "$REPO_ROOT/ci" "$repo/ci"
  git -C "$repo" config core.hooksPath hooks
  printf '#!/bin/sh\nexit 0\n' >"$repo/bin/npx"
  chmod +x "$repo/bin/npx"
  printf '%s\n' "$name" >"$repo/fixture.txt"
  git -C "$repo" add fixture.txt

  printf '%s\n' "$repo"
}

commit_count() {
  git -C "$1" rev-list --count HEAD 2>/dev/null || printf '0\n'
}

assert_agent_foreign_author_is_refused() {
  local repo stderr_file
  repo="$(create_fixture_repo foreign-author)"
  stderr_file="$repo/stderr"

  if env PAPERCLIP_RUN_ID=test \
    GIT_AUTHOR_NAME="$FOREIGN_NAME" GIT_AUTHOR_EMAIL="$FOREIGN_EMAIL" \
    GIT_COMMITTER_NAME="$EXPECTED_NAME" GIT_COMMITTER_EMAIL="$EXPECTED_EMAIL" \
    PATH="$repo/bin:$PATH" \
    git -C "$repo" commit -qm fixture >"$repo/stdout" 2>"$stderr_file"; then
    echo "FAIL: an agent commit with a foreign author was accepted." >&2
    return 1
  fi

  if [[ "$(commit_count "$repo")" != "0" ]]; then
    echo "FAIL: the refused foreign-author case created a commit." >&2
    return 1
  fi

  if grep -Fq "$FOREIGN_NAME" "$stderr_file" || grep -Fq "$FOREIGN_EMAIL" "$stderr_file"; then
    echo "FAIL: the identity guard echoed the rejected identity." >&2
    return 1
  fi
}

assert_agent_foreign_committer_is_refused() {
  local repo
  repo="$(create_fixture_repo foreign-committer)"

  if env PAPERCLIP_RUN_ID=test \
    GIT_AUTHOR_NAME="$EXPECTED_NAME" GIT_AUTHOR_EMAIL="$EXPECTED_EMAIL" \
    GIT_COMMITTER_NAME="$FOREIGN_NAME" GIT_COMMITTER_EMAIL="$FOREIGN_EMAIL" \
    PATH="$repo/bin:$PATH" \
    git -C "$repo" commit -qm fixture >"$repo/stdout" 2>"$repo/stderr"; then
    echo "FAIL: an agent commit with a foreign committer was accepted." >&2
    return 1
  fi

  if [[ "$(commit_count "$repo")" != "0" ]]; then
    echo "FAIL: the refused foreign-committer case created a commit." >&2
    return 1
  fi
}

assert_human_commit_is_unchanged() {
  local repo
  repo="$(create_fixture_repo human)"

  if ! env -u PAPERCLIP_RUN_ID \
    GIT_AUTHOR_NAME="$FOREIGN_NAME" GIT_AUTHOR_EMAIL="$FOREIGN_EMAIL" \
    GIT_COMMITTER_NAME="$FOREIGN_NAME" GIT_COMMITTER_EMAIL="$FOREIGN_EMAIL" \
    PATH="$repo/bin:$PATH" \
    git -C "$repo" commit -qm fixture >"$repo/stdout" 2>"$repo/stderr"; then
    echo "FAIL: a human commit with PAPERCLIP_RUN_ID removed was refused." >&2
    return 1
  fi

  if [[ "$(commit_count "$repo")" != "1" ]]; then
    echo "FAIL: the human case did not create exactly one commit." >&2
    return 1
  fi
}

assert_agent_bot_commit_succeeds() {
  local repo
  repo="$(create_fixture_repo bot)"

  if ! env PAPERCLIP_RUN_ID=test \
    GIT_AUTHOR_NAME="$EXPECTED_NAME" GIT_AUTHOR_EMAIL="$EXPECTED_EMAIL" \
    GIT_COMMITTER_NAME="$EXPECTED_NAME" GIT_COMMITTER_EMAIL="$EXPECTED_EMAIL" \
    PATH="$repo/bin:$PATH" \
    git -C "$repo" commit -qm fixture >"$repo/stdout" 2>"$repo/stderr"; then
    echo "FAIL: an agent commit with the delivery bot identity was refused." >&2
    return 1
  fi

  if [[ "$(commit_count "$repo")" != "1" ]]; then
    echo "FAIL: the delivery-bot case did not create exactly one commit." >&2
    return 1
  fi
}

assert_identity_guard_behaviour() {
  FIXTURE_ROOT="$(mktemp -d)"
  assert_agent_foreign_author_is_refused
  assert_agent_foreign_committer_is_refused
  assert_human_commit_is_unchanged
  assert_agent_bot_commit_succeeds
}

assert_hook_is_executable
assert_lint_staged_runs_through_npx
assert_no_husky_helper_references
assert_hook_invokes_identity_guard
assert_identity_guard_is_executable
assert_identity_guard_holds_one_identity
assert_identity_guard_behaviour

echo "Git hook structure and commit-identity behaviour passed"
