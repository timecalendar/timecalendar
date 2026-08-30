#!/usr/bin/env bash

set -euo pipefail

readonly HOOK="${1:-.husky/pre-commit}"

# The tracked pre-commit hook has to run under *both* values git's core.hooksPath can
# hold. That slot lives in the shared .git/config, so it is one host-wide value that
# the last husky install wins: husky 9 writes `.husky/_`, husky 7 wrote `.husky`, and
# a worktree provisioned off an older branch flips it back. The two values invoke the
# hook by different routes, and each assertion below guards a property that only one
# route needs — which is exactly why a regression is invisible on the machine that
# introduces it. Details: openspec/changes/upgrade-husky-9/design.md.

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
  # `:!openspec/changes/` is load-bearing, not cosmetic. A proposal that documents
  # the removal of husky 7's `. "$(dirname "$0")/_/husky.sh"` preamble must quote
  # that path to explain itself, and `openspec archive` carries those artifacts to
  # openspec/changes/archive/ permanently. Unscoped, this assertion is red the day
  # it is added and red on main forever after. The criterion has always meant "no
  # *operative* file still sources the helper", and scoping by path is the only
  # spelling of it that stays stable as people write about the change.
  local hits
  hits="$(git grep -n 'husky\.sh' -- ':!openspec/changes/' || true)"

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

assert_hook_is_executable
assert_lint_staged_runs_through_npx
assert_no_husky_helper_references

echo "Git hook mode, npx invocation and husky-helper references passed"
