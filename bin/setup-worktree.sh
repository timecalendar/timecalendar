#!/usr/bin/env bash
#
# Makes a fresh git worktree workable. Worktrees check out only *tracked* files,
# so every gitignored-but-required file is missing: env files, the Firebase key,
# .husky/_/ (hooks then silently abort), and node_modules. Run this once per new
# worktree. Safe to run repeatedly. No-op when run from the main checkout.
#
# Does, in order:
#   1. resolve the main checkout (works for sibling and nested worktrees)
#   2. symlink branch-independent secrets from main (single source of truth)
#   3. npm install in root + server + mobile (root's `prepare` regenerates husky)
#
# Machine-global setup (/etc/hosts, dev cert trust) is shared across worktrees —
# that's bin/setup-dev.sh, and it does not need re-running per worktree.

set -euo pipefail

green() { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
step() { printf '\n\033[1m%s\033[0m\n' "$*"; }

HERE="$(git rev-parse --show-toplevel)"
MAIN="$(cd "$(dirname "$(git rev-parse --git-common-dir)")" && pwd)"

if [ "$HERE" = "$MAIN" ]; then
  green "This is the main checkout, not a worktree — nothing to do."
  exit 0
fi

step "Worktree setup"
echo "  worktree: $HERE"
echo "  main:     $MAIN"

# Symlink a gitignored, branch-independent file/dir from main into this worktree.
# Skip if a real (non-symlink) file already exists; skip with a warning if the
# source is absent in main.
link_shared() {
  local rel="$1"
  local src="$MAIN/$rel"
  local dst="$HERE/$rel"

  if [ -e "$dst" ] && [ ! -L "$dst" ]; then
    green "✓ $rel already present (real file, left untouched)"
    return
  fi
  if [ ! -e "$src" ]; then
    yellow "– $rel not in main, skipping"
    return
  fi
  if [ -L "$dst" ] && [ "$(readlink "$dst")" = "$src" ]; then
    green "✓ $rel already linked"
    return
  fi

  mkdir -p "$(dirname "$dst")"
  rm -f "$dst"
  ln -s "$src" "$dst"
  green "✓ linked $rel → main"
}

# Reproducible, lockfile-preserving install; falls back to `npm install` when the
# lockfile is out of sync (e.g. mid-development on a branch).
install_deps() {
  local dir="$1" label="$2"
  echo "  ${label}..."
  if (cd "$dir" && npm ci); then
    return
  fi
  yellow "  npm ci failed in $label (lockfile out of sync?) — falling back to npm install"
  (cd "$dir" && npm install)
}

step "1/3  Shared secrets (symlinked from main)"
link_shared server/.env
link_shared web/.env.local
# Symlink the key file (not the config/ dir): a dir symlink isn't matched by the
# `/config/` gitignore rule and would show up as untracked.
link_shared server/config/serviceAccountKey.json
link_shared mobile/.env
link_shared mobile/.env.local
# Expo-generated boilerplate (one `/// <reference types="expo/types" />` line) that
# pulls in CSS-module / global.css types; gitignored, so absent in a fresh worktree
# and `tsc` fails without it. Branch-independent → safe to share from main.
link_shared mobile/expo-env.d.ts

step "2/3  Install dependencies"
install_deps "$HERE" "root (web + openapi/javascript)"
install_deps "$HERE/server" "server"
install_deps "$HERE/mobile" "mobile"

# The root install's `prepare` already regenerates the gitignored .husky/_/, but
# fixing the broken hooks is the whole point of this script — so install them
# explicitly too rather than leaning on a side effect. Idempotent.
step "3/3  Git hooks (husky)"
(cd "$HERE" && npx husky install) && green "✓ pre-commit hook installed"

echo
green "Worktree ready."
yellow "  Note: /etc/hosts and dev-cert trust are machine-global (bin/setup-dev.sh)"
yellow "        and shared across worktrees — no need to re-run them here."
