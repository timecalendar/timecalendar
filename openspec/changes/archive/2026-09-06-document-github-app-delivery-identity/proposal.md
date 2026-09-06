# Document the GitHub App delivery identity in the dev-env handbook

## Why

Since 2026-09-06 a Paperclip run at TimeCalendar reaches GitHub as a **company-owned GitHub App
installation**, not as a human account. `docs/agent-dev-environment.md` — the handbook whose stated
purpose is to let "a future agentic system on a different server pick the work up cold" — still
describes the superseded setup on two rows of the §2 toolchain table and in the §12 quick-reference
comment.

Every claim on those lines is now false, and each one is false in a way that costs a run:

| Handbook says | Live workspace says |
| --- | --- |
| `gh` is authenticated as `samuelprak` (admin/push) | `gh auth status` → active account `paperclip-timecalendar[bot]`, from `GH_TOKEN` |
| Git protocol is **SSH**, remote `git@gh-perso:timecalendar/timecalendar.git` | `git remote -v` → `https://github.com/timecalendar/timecalendar.git`, no host alias |
| "ensure `samuelprak` is the _active_ one (`gh auth switch`)" | `gh auth switch` **breaks the run** — it would move `gh` off the App token the run was issued |
| Git identity is `Samuel Prak <samuel.prak.p@gmail.com>` | repo-local `user.name`/`user.email` → `paperclip-timecalendar[bot] <325604666+paperclip-timecalendar[bot]@users.noreply.github.com>` |

The `gh auth switch` line is the expensive one: it is written as an *instruction*, so a cold agent
that follows the handbook actively destroys its own credentials.

## What Changes

`docs/agent-dev-environment.md` only. Three edit sites, one new subsection.

- **§2 table, `gh CLI` row** — rewritten to name the active identity (`paperclip-timecalendar[bot]`,
  via `GH_TOKEN`), the HTTPS remote, and a pointer to the new subsection for the mechanics. The
  `gh auth switch` instruction is deleted, not softened.
- **§2 table, `Git identity` row** — rewritten to the bot author/committer string, marked
  **repo-local** (`.git/config`, inherited by every worktree), with the explicit note that the
  host's *global* git identity is a different, unrelated value that the repo-local setting
  overrides.
- **§2, new subsection `### GitHub delivery identity: the Paperclip GitHub App`** — placed under the
  table beside the existing `### The dev host has no KVM / nested virtualization` callout, which is
  the shape §2 already uses for a fact too long for a table cell. It carries: the per-run
  installation token (`ghs_…`, repository-scoped, ~1 hour), the three env vars, the process-scoped
  credential helper, what is attributed to the bot on GitHub, the prohibitions, and the two
  observable readouts below that look like faults but are not.
- **§12 quick-reference, line 576** — the `gh as samuelprak (SSH)` clause becomes
  `gh as paperclip-timecalendar[bot] (GitHub App token, HTTPS)`. The rest of the line is untouched.

### What this change adds beyond the brief

The Founding Engineer's brief listed the three edit sites and eight facts. Re-verifying each fact in
this workspace turned up three things the brief does not have. All three are in scope — same file,
same subject, and each one is a trap the rewrite would otherwise leave armed.

1. **The host's global git identity is a live, unrelated identity — not the old one.**
   `git config --global user.name` on this host returns a third-party value, while
   `git config --local` returns the bot. The brief's framing ("commit identity is the bot") is true
   but incomplete: an agent that checks its identity from outside a repo checkout, or that reads the
   global config to "confirm", gets a wrong answer that looks authoritative. The `Git identity` row
   must say **repo-local**, and say that global differs on purpose.

2. **`gh auth status` still lists the two stored human accounts, and misreports the protocol.**
   The real readout is three entries: the bot (active, `GH_TOKEN`) plus `vincefox1` and `samuelprak`
   still present in `~/.config/gh/hosts.yml` and inactive. It also prints
   `Git operations protocol: ssh` for the bot — read from `gh`'s stored config, not from the remote,
   which is HTTPS. An agent that runs `gh auth status` to orient itself sees two human accounts and
   the word "ssh", and concludes the handbook's *old* text was right. Documenting the readout is
   what makes the "never `gh auth switch`" prohibition stick.

3. **There is no Markdown format gate in this repo, and running Prettier on this file would be
   destructive.** The brief's constraint — "Prettier formats this repo's Markdown, run the format
   check so CI's docs lint stays green" — has no referent. There is no root Prettier config and no
   root format/lint script; `.prettierrc` exists only in `mobile/`, `server/` and `web/`. No
   workflow in `.github/workflows/` gates `docs/` or Markdown at all. And
   `npx prettier --check docs/agent-dev-environment.md` **already fails on `main`** — running
   `--write` would reflow the entire 600-line file under default settings and bury a 4-line change
   in a whole-file diff. `tasks.md` therefore forbids it and requires the table alignment to be
   matched by hand.

   Consequently "CI green" on this PR means **`ci-build-deploy.yml`**, which is the only workflow
   that runs: it triggers on bare `on: push` with no path filter. `ci-mobile` and `ci-flutter` are
   path-filtered away, and `ci-mobile-e2e` self-skips without the `run-e2e` label.

## Scope

**In:** `docs/agent-dev-environment.md`, plus this change's own `openspec/` artifacts.

**Out:**

- Every other file. Specifically not `bin/setup-worktree.sh`, `.claude/`, `README.md`,
  `docs/mobile/architecture-book/`, or anything under `docs/react-native-migration/`. A repo sweep
  (`git grep -e gh-perso -e samuelprak -e 'gh auth switch'`) returns hits in exactly one other place
  — `app/`, where `fr.samuelprak.timecalendar` and `timecalendar-samuelprak` are the real Flutter
  bundle id and Firebase project name. Those are live identifiers, not stale prose. **Leave them
  alone.**
- Any narration of the old setup or of the migration to the App. No "previously…", no changelog
  paragraph, no dated migration note. The handbook records current state; git holds the history.
- Rewriting §6's commit-footer conventions, or reconciling the handbook's `2026-06-14` verification
  banner. Both are stale in their own right and neither is this ticket.
- Any change to how the credential injection actually works. This change documents the mechanism; it
  does not touch it.

## Sensitive surfaces

**None.** Docs-only. No contract (`openapi/openapi.json`), schema (`server/src/migrations/`),
native/store config (`mobile/app.config.ts`, `mobile/eas.json`, `mobile/firebase/`), or
infrastructure (`terraform/`, `k8s/`, `.github/workflows/`) file is touched.

One handling rule applies even so: the installation token is a **live credential**. It appears in
`$PAPERCLIP_GIT_TOKEN`, in `$GIT_CONFIG_VALUE_1`/`$GIT_CONFIG_VALUE_2`, and in `gh auth status`
output. No task in this change prints an unredacted token, and no token value — not even a
truncated one — may reach the doc, a commit, or the PR body.

## QA

**None required.** No user-visible surface, nothing a human can click, no device pass, no `run-e2e`
label.

## Tasks

See `tasks.md`.
