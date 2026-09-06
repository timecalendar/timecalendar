# Tasks — document the GitHub App delivery identity

> **This change ships no code.** Only `docs/agent-dev-environment.md` and this change's own
> `openspec/changes/document-github-app-delivery-identity/` artifacts may change.
>
> Read before starting:
>
> - **Do not run Prettier, or any formatter, on `docs/agent-dev-environment.md`.** There is no root
>   Prettier config and no Markdown gate in CI; the file already fails `npx prettier --check` on
>   `main`, so `--write` would reflow ~600 lines and bury the change. Match the existing table
>   padding by hand (§3.4).
> - **The installation token is a live credential.** It is in `$PAPERCLIP_GIT_TOKEN`, `$GH_TOKEN`,
>   `$GITHUB_TOKEN`, `$GIT_CONFIG_VALUE_1`, `$GIT_CONFIG_VALUE_2`, and in `gh auth status` output.
>   Redact it in every command you run and never let a value — not even truncated — reach the doc, a
>   commit message, or the PR body.
> - Derive the diff baseline as `$(git merge-base origin/main HEAD)`, never a hardcoded SHA.
> - Line numbers below are as of `acbaa0e4`. Locate each site by its text, not by its number.

## 1. Re-verify the facts before writing them

The doc's whole value is that it is true. Re-run each check in your own workspace; the design table
is evidence from a previous run, not a substitute.

- [x] 1.1 `git config --get remote.origin.url` → `https://github.com/timecalendar/timecalendar.git`.
- [x] 1.2 `git config --local --get user.name` and `--get user.email` → `paperclip-timecalendar[bot]`
      and `325604666+paperclip-timecalendar[bot]@users.noreply.github.com`.
- [x] 1.3 `git config --global --get user.name` returns a **different** value. Confirm it differs;
      do not record the value in the doc (it is incidental and can change) — record only that global
      differs and that repo-local wins.
- [x] 1.4 `git config --global --get-regexp credential` and `env | grep -o '^GIT_CONFIG_[A-Z0-9_]*'`
      → the helper arrives through `GIT_CONFIG_COUNT=3` / `GIT_CONFIG_KEY_*`, and the run adds
      nothing to the global config.
- [x] 1.5 `gh auth status` → active `paperclip-timecalendar[bot]` from `GH_TOKEN`; `vincefox1` and
      `samuelprak` listed from `~/.config/gh/hosts.yml`, both inactive; the bot entry prints
      `Git operations protocol: ssh`. Confirm all three, since §2's new subsection asserts them.
- [x] 1.6 `gh api /user` → `403 Resource not accessible by integration`.
      `gh api /installation/repositories --jq '.repositories[].full_name'` → `timecalendar/timecalendar`
      and nothing else.
- [x] 1.7 `printf '%s' "${PAPERCLIP_GIT_TOKEN:0:4}"` → `ghs_`, and `GH_TOKEN`/`GITHUB_TOKEN`/
      `PAPERCLIP_GIT_TOKEN` are the same value. Compare with `[ "$GH_TOKEN" = "$PAPERCLIP_GIT_TOKEN" ]`
      — do not echo them.
- [x] 1.8 If any check disagrees with `design.md`, **stop and report on the issue** before editing.
      A doc that restates a stale design note is the exact failure this change exists to fix.

## 2. The token lifetime is the one fact you cannot read locally

- [x] 2.1 The ~1-hour lifetime comes from GitHub App installation-token semantics and the Founding
      Engineer's brief; there is no local readout for it. Write it as **approximately one hour**, and
      lead with the observable symptom (a mid-run auth failure) rather than the number. Do not assert
      an exact expiry timestamp.

## 3. Edit `docs/agent-dev-environment.md`

Target content is in `design.md` §"Target content" — substance, not verbatim. Match the file's
voice: second person, present tense, **bold** for the load-bearing term, backticks for literals.

- [x] 3.1 **`gh CLI` row** (currently "authenticated as **`samuelprak`** (admin/push)" …
      "Git protocol is **SSH**… `gh auth switch`"). Rewrite both cells per design. The
      `gh auth switch` instruction is **deleted**, not softened — it is the line that makes a cold
      agent destroy its own credentials.
- [x] 3.2 **`Git identity` row** (currently `Samuel Prak <samuel.prak.p@gmail.com>` with an empty
      Notes cell). Column 2 carries the bot author/committer string; the Notes cell — empty today —
      carries "repo-local `.git/config`, inherited by every worktree; the host's global git identity
      is a different, unrelated value that this overrides".
- [x] 3.3 **New subsection** `### GitHub delivery identity: the Paperclip GitHub App`, inserted
      between the §2 table and the existing `### The dev host has no KVM / nested virtualization`
      subsection. Cover the six points of `design.md` §"Target content", in that order.
- [x] 3.4 **Preserve the table padding.** Every row pads column 1 to 18, column 2 to 148 and column 3
      to 229 characters. Keep the new cells within those widths so no other row needs re-padding.
      Verify with:
      ```bash
      awk 'NR>=60 && NR<=68 {n=split($0,a,"|"); printf "L%d w1=%d w2=%d w3=%d\n", NR, length(a[2]), length(a[3]), length(a[4])}' docs/agent-dev-environment.md
      ```
      Every line must report `w1=18 w2=148 w3=229` (the Maestro row splits on an escaped `\|` inside
      its own cell, so its `w3` reads short — that is pre-existing and correct).
- [x] 3.5 **§12 quick reference**, the `# 0. Toolchain:` comment. Rewrite the `gh as samuelprak (SSH)`
      clause to `gh as paperclip-timecalendar[bot] (GitHub App token, HTTPS)`. Change nothing else on
      that line and nothing else in §12.
- [x] 3.6 **No historical narration.** Zero sentences describe the previous arrangement or the move to
      the App. No "previously", "used to", "as of 2026-09-06", "migrated", no changelog paragraph.
      Naming the inactive accounts that `gh auth status` prints **today** is current state, not
      history — that is the one permitted mention.

## 4. Verify

- [x] 4.1 **No superseded claim survives.** Scope by path, and stage first — `git grep` sees only
      tracked content, so measure after `git add`:
      ```bash
      git add docs/agent-dev-environment.md
      git grep -nE 'samuelprak|gh-perso|vincefox1|gh auth switch|gh auth login|SSH|ssh' -- docs/agent-dev-environment.md
      ```
      Every surviving hit must be inside the documented `gh auth status` readout or the explicit
      prohibition. No hit may assert that the remote, the protocol, or the active identity is SSH or
      a human account.
- [x] 4.2 **All the facts landed.** Confirm the doc states each of: HTTPS remote; installation token
      in the three env vars; ~1-hour repository-scoped lifetime; process-scoped credential helper
      with nothing written to global config; bot attribution for pushes/PRs/reviews/merges; the
      repo-local commit identity string; the three prohibitions; the expiry symptom and its
      non-escalation; the `gh auth status` readout; the `gh api /user` 403 and the
      `/installation/repositories` alternative.
- [x] 4.3 **No token value anywhere:**
      ```bash
      git diff $(git merge-base origin/main HEAD) | grep -nE 'gh[psuro]_[A-Za-z0-9]{10,}' && echo 'FAIL: token in diff'
      ```
      must print nothing but the `grep` non-match.
- [x] 4.4 **Nothing outside scope changed:**
      ```bash
      git diff --name-only $(git merge-base origin/main HEAD) \
        | grep -vE '^(docs/agent-dev-environment\.md|openspec/changes/document-github-app-delivery-identity/)'
      ```
      must print nothing. In particular `app/`'s `fr.samuelprak.timecalendar` and
      `timecalendar-samuelprak` are live identifiers and must be untouched.
- [x] 4.5 **The diff is targeted, not a reflow:** `git diff --stat $(git merge-base origin/main HEAD) -- docs/agent-dev-environment.md`
      shows on the order of tens of changed lines, not ~600. A whole-file diff means a formatter ran
      (see the preamble) — revert and redo the edit by hand.
- [x] 4.6 `npx openspec validate document-github-app-delivery-identity --strict` passes. If a
      requirement fails on a missing modal verb, the `SHALL` must be on the **first line** of the
      requirement body, not on a wrapped continuation line.
- [x] 4.7 `npx openspec list` shows the change.
- [x] 4.8 Render check: open the §2 table and the new subsection in GitHub's PR "Files changed" view
      (or any Markdown preview) and confirm the table still renders as a table and the subsection
      nests under §2.

## 5. Hand off

- [x] 5.1 Commit with a Conventional Commit subject and the mandatory footer
      `Co-Authored-By: Paperclip <noreply@paperclip.ing>`. Push to this issue's branch — never to
      `main`.
- [x] 5.2 Update the PR body: flip your stage marker to ✅, and record anything §1 found that
      contradicted `design.md`.
- [x] 5.3 **CI expectation.** Only `ci-build-deploy.yml` runs on this PR — it triggers on bare
      `on: push` with no path filter. `ci-mobile` and `ci-flutter` are path-filtered away and
      `ci-mobile-e2e` self-skips without the `run-e2e` label. "CI green" therefore means
      `ci-build-deploy` green on the head SHA; do not wait on checks that will never appear, and do
      not add the `run-e2e` label.
- [x] 5.4 Hand off per `pipeline-core`: one combined PATCH carrying the comment, status and assignee.
- [x] 5.5 **Archive the change before merge** — `npx openspec archive document-github-app-delivery-identity --yes`,
      never with `--skip-specs`: this change carries a real spec delta and skipping it is what leaves
      orphaned change dirs behind. Confirm afterwards that
      `openspec/specs/agent-delivery-identity/spec.md` exists, that
      `openspec/changes/document-github-app-delivery-identity/` is gone, and that
      `npx openspec validate --strict` is clean. Commit the archive on this branch so the promoted
      spec merges with the doc it pins.
