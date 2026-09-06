## ADDED Requirements

### Requirement: The handbook records the current GitHub delivery identity

`docs/agent-dev-environment.md` SHALL describe how an autonomous agent run authenticates to GitHub, and SHALL describe only the arrangement that is currently live. It SHALL state that a Paperclip run reaches GitHub as a company-owned GitHub App installation with no human account in the path, that the repository remote is HTTPS `https://github.com/timecalendar/timecalendar.git` with no SSH host alias, and that GitHub attributes pushes, pull requests, reviews and merges to `paperclip-timecalendar[bot]`.

#### Scenario: A cold agent reads §2 to learn how it reaches GitHub

- **WHEN** an agent that has never run on this host reads the §2 toolchain table and the delivery-identity subsection beneath it
- **THEN** it learns the active `gh` account, the HTTPS remote, and the bot attribution, without needing to inspect its own environment first

#### Scenario: The handbook carries no superseded identity claim

- **WHEN** `docs/agent-dev-environment.md` is searched for `samuelprak`, `gh-perso`, `vincefox1`, `gh auth switch`, or a claim that the git protocol is SSH
- **THEN** the only surviving match is the documented `gh auth status` readout, which reports those accounts as present-but-inactive in `~/.config/gh/hosts.yml` — and no sentence describes the previous arrangement or the migration to the App

### Requirement: The handbook records the token injection and its process scope

The handbook SHALL state that each run receives a short-lived, repository-scoped GitHub App installation token, injected as the environment variables `GH_TOKEN`, `GITHUB_TOKEN` and `PAPERCLIP_GIT_TOKEN`, together with a git credential helper supplied through `GIT_CONFIG_COUNT`/`GIT_CONFIG_KEY_*`. It SHALL state that this configuration is process-scoped — nothing is written to `~/.gitconfig` or to `gh` configuration — and that ordinary `git push` and `gh` commands therefore work with no setup step. It SHALL NOT reproduce a token value, in whole or truncated.

#### Scenario: An agent needs to know whether to configure credentials

- **WHEN** an agent reads the delivery-identity subsection before its first push
- **THEN** it learns that credentials are already injected for this process and that no `git` or `gh` configuration step is required of it

#### Scenario: The token lifetime and its failure symptom are recorded

- **WHEN** a long-running heartbeat hits a GitHub authentication failure and its operator or successor consults the handbook
- **THEN** the handbook attributes the failure to the expiry of the approximately one-hour token, states that a fresh heartbeat mints a new one, and states that this is not a broken environment and needs no infrastructure escalation

### Requirement: The handbook states the commit identity and that it is repo-local

The handbook SHALL record the commit author and committer identity as `paperclip-timecalendar[bot] <325604666+paperclip-timecalendar[bot]@users.noreply.github.com>`, SHALL state that it is configured in the repository-local git config and inherited by every worktree, and SHALL warn that the host's global git identity is a different, unrelated value which the repository-local setting overrides.

#### Scenario: An agent verifies who it commits as

- **WHEN** an agent wants to confirm its commit identity and consults the handbook
- **THEN** the handbook directs it to the repository-local configuration and warns that reading the global git identity returns a different value that does not describe its commits

### Requirement: The handbook names the prohibited credential operations and the misleading readouts

The handbook SHALL state that an agent must never run `gh auth login`, never run `gh auth switch`, and never set a personal git identity in a worktree, because each moves the run off the installation token it was issued. It SHALL additionally record the two observable readouts that contradict this arrangement at first glance, each with the reason it is not a fault: that `gh auth status` lists inactive human accounts stored in `~/.config/gh/hosts.yml` and reports `Git operations protocol: ssh` for the bot entry — a value read from `gh` configuration that does not describe the HTTPS remote — and that `gh api /user` returns `403 Resource not accessible by integration` because an installation token authenticates as an installation rather than as a user. It SHALL name `gh api /installation/repositories` as the check that does confirm the token.

#### Scenario: An agent runs gh auth status and sees a human account listed

- **WHEN** an agent runs `gh auth status`, sees `samuelprak` and `vincefox1` listed and `Git operations protocol: ssh` under the active bot entry, and consults the handbook
- **THEN** the handbook predicts exactly that output, explains that the stored accounts are inactive and the protocol line does not describe the remote, and instructs the agent not to switch accounts

#### Scenario: An agent probes its token with gh api /user

- **WHEN** an agent runs `gh api /user`, receives `403 Resource not accessible by integration`, and consults the handbook
- **THEN** the handbook identifies the 403 as correct behaviour for an installation token and points to `gh api /installation/repositories` as the working check, so the agent does not report a broken environment
