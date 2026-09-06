# Design — document the GitHub App delivery identity

This change ships prose. The design is therefore (a) what the mechanism actually is, verified
first-hand, (b) where in the handbook each fact goes, and (c) three decisions that constrain how the
Applier writes it.

## The mechanism, as verified in this workspace

Every line below was read out of the live execution workspace on 2026-09-06, on branch
`TIM-467-docs-describe-the-github-app-delivery-identity-in-agent-dev-environment-md`. Token values
are redacted here and must stay redacted everywhere.

| Fact | How it was verified | Result |
| --- | --- | --- |
| Remote is HTTPS | `git config --get remote.origin.url` | `https://github.com/timecalendar/timecalendar.git` |
| Active `gh` account | `gh auth status` | `paperclip-timecalendar[bot]`, source `GH_TOKEN`, active |
| Stored human accounts still present | `gh auth status` | `vincefox1` and `samuelprak` from `~/.config/gh/hosts.yml`, both **inactive** |
| Token kind and scope | `${PAPERCLIP_GIT_TOKEN:0:5}`; `gh api /installation/repositories` | `ghs_…` (installation token), 390 chars, scoped to exactly `timecalendar/timecalendar` |
| Token carries no user | `gh api /user` | `403 Resource not accessible by integration` |
| Env vars carrying it | `env` | `GH_TOKEN`, `GITHUB_TOKEN`, `PAPERCLIP_GIT_TOKEN` — identical value |
| Credential helper is env-scoped | `GIT_CONFIG_COUNT` / `GIT_CONFIG_KEY_*` | `COUNT=3`; key 0 `credential.helper` = **empty**; keys 1–2 `credential.https://github.com.helper` and `credential.https://www.github.com.helper` = an inline `sh` function |
| Nothing written to global config | `git config --global --get-regexp credential` | Only the host's pre-existing `gh auth git-credential` entries — the run adds none |
| Repo-local commit identity | `git config --local --get user.name` / `user.email` | `paperclip-timecalendar[bot]` / `325604666+paperclip-timecalendar[bot]@users.noreply.github.com` |
| Global commit identity differs | `git config --global --get user.name` | A different, unrelated third-party value — overridden by repo-local |
| `gh` version | `gh --version` | `2.98.0` |

The inline helper answers only for `protocol=https` **and** `host=github.com`/`www.github.com`,
printing `username=x-access-token` and the token as the password. Key 0 setting `credential.helper`
to the empty string is the load-bearing part: an empty value resets git's accumulated helper list,
and because `GIT_CONFIG_*` is applied after `~/.gitconfig`, it suppresses the host's global
`gh auth git-credential` helpers — which would otherwise answer first, with a *human* account's
token.

### The two readouts that look like faults

Both must appear in the doc, because both are what an agent sees when it tries to orient itself.

1. `gh auth status` prints **`Git operations protocol: ssh`** under the bot entry. This is read from
   `gh`'s stored config; it does not describe the remote, which is HTTPS, and it does not affect how
   pushes authenticate. Ignore it.
2. `gh api /user` returns **403 `Resource not accessible by integration`**. An installation token
   authenticates as an app installation, not as a user, so there is no authenticated user to return.
   This is correct behaviour, not a broken token. `gh api /installation/repositories` is the check
   that actually confirms the token works, and it returns the single repository the token is scoped
   to.

## Decisions

### Decision 1 — the mechanics go in a subsection, not in the table cells

**Decision.** The §2 table keeps two short rows; the token/helper/attribution mechanics move to a new
`### GitHub delivery identity: the Paperclip GitHub App` subsection directly under the table.

**Why.** §2's table is a *toolchain inventory* — one line per tool. The full mechanism is roughly a
dozen facts including two counter-intuitive readouts, and it does not compress into a cell without
becoming unreadable. §2 already solved this problem once: `### The dev host has no KVM / nested
virtualization` is a fact too big for the JDK/Maestro rows, promoted to a subsection immediately
under the table. This follows that precedent exactly rather than inventing a shape.

**Also.** The table is hard-padded — every row pads column 1 to 18, column 2 to 148 and column 3 to
229 characters. A cell longer than its column forces re-padding all nine rows, turning a four-line
change into a whole-table diff. Keeping the rows short keeps the padding stable and the diff
reviewable.

**Rejected.** Cramming it into the `gh CLI` Notes cell (unreadable, and blows the column width); a
new top-level section (this is toolchain/environment, it belongs in §2); a new file under `docs/`
(the ticket is explicit that this is a one-file change, and a second location is how the handbook
starts disagreeing with itself).

### Decision 2 — document the misleading readouts, not just the rules

**Decision.** The subsection states what `gh auth status` and `gh api /user` actually print, and why
each is not a fault.

**Why.** A bare prohibition ("never run `gh auth switch`") loses to direct observation. An agent that
runs `gh auth status`, sees `samuelprak` in the list and `Git operations protocol: ssh`, and has just
read a handbook that says the identity is the bot over HTTPS, will reasonably conclude the handbook
is stale — and will "fix" its environment by switching accounts, which is exactly the failure the
prohibition exists to prevent. The prohibition only holds if the doc predicts what the agent will
see. Same for the `/user` 403: undocumented, it reads as an expired or broken token and triggers a
false infra escalation.

**Constraint.** Describing what `gh auth status` prints today is *not* narrating the old setup. The
stored accounts are present in `~/.config/gh/hosts.yml` right now; this is current state, stated in
the present tense, with no claim about how it got there.

### Decision 3 — do not run Prettier on this file

**Decision.** The Applier hand-matches the existing table formatting. No formatter runs on
`docs/agent-dev-environment.md`.

**Why.** There is no root Prettier config, no root format script, and no workflow gating `docs/` or
Markdown — so there is no format check to satisfy. `npx prettier --check` on this file already fails
on `main` under default settings, so `--write` would reflow all ~600 lines and bury the change. The
correct diff here is four lines plus one inserted subsection.

**Verification instead.** `git diff --stat` against `git merge-base origin/main HEAD` must show
`docs/agent-dev-environment.md` alone, with a line count consistent with a targeted edit — not a
whole-file rewrite.

## Target content

Substance, not verbatim copy — the Applier writes the final wording and matches the file's voice
(second person, present tense, bold for the load-bearing term).

**`gh CLI` row (col 2 / col 3):** authenticated as **`paperclip-timecalendar[bot]`** via `GH_TOKEN`
(GitHub App installation token) / remote is HTTPS `https://github.com/timecalendar/timecalendar.git`;
no SSH, no host alias; see the delivery-identity subsection below.

**`Git identity` row (col 2 / col 3):** `paperclip-timecalendar[bot]
<325604666+paperclip-timecalendar[bot]@users.noreply.github.com>` / set **repo-locally** in
`.git/config` and inherited by every worktree; the host's global git identity is a different,
unrelated value and the repo-local setting overrides it — do not read the global config to confirm
who you commit as.

**New subsection**, covering in this order:

1. A Paperclip run authenticates to GitHub as a company-owned **GitHub App installation**. There is
   no human account in the path.
2. Each run is issued a short-lived (~1 hour) repository-scoped installation token, injected as
   `GH_TOKEN`, `GITHUB_TOKEN` and `PAPERCLIP_GIT_TOKEN` (same value), plus a **process-scoped** git
   credential helper passed through `GIT_CONFIG_COUNT`/`GIT_CONFIG_KEY_*`. Nothing is written to
   `~/.gitconfig` or to `gh` config. Ordinary `git push` and `gh` commands just work — no setup step.
3. GitHub attributes pushes, PRs, reviews and merges to `paperclip-timecalendar[bot]`.
4. **Never** run `gh auth login` or `gh auth switch`, and never set a personal git identity in a
   worktree. Each of those moves the run off the token it was issued.
5. The two readouts above, each with its one-line "not a fault" explanation, and
   `gh api /installation/repositories` as the check that does work.
6. Expiry: a GitHub auth failure late in a long run means the ~1-hour token expired. A fresh
   heartbeat mints a new one. It is not a broken environment and needs no infra escalation.

**§12 line 576:** `# 0. Toolchain: Node 24.13.0, Docker, gh as paperclip-timecalendar[bot] (GitHub
App token, HTTPS), JDK, Flutter at /home/dev/flutter` — the `gh` clause only; the rest of the line is
unchanged.
