# agent-delivery-identity Specification

## Purpose
TBD - created by archiving change enforce-bot-commit-identity. Update Purpose after archive.
## Requirements
### Requirement: A commit-time guard enforces the delivery identity for agent runs
The repository SHALL carry a versioned guard script, `ci/check-commit-identity.sh`, that refuses to let a commit be created when the identity git is about to record as **author** or as **committer** is not the delivery bot, and that does so only when the commit is being made by an agent run. The guard SHALL resolve both identities with `git var GIT_AUTHOR_IDENT` and `git var GIT_COMMITTER_IDENT`, which return the values git itself is about to use — resolved through environment overrides, `git commit --author`, and every config layer — rather than reading any single config key. The guard SHALL require an exact match on both the name and the email of one allowlisted identity. The guard SHALL be POSIX `sh`, depend on nothing beyond `git`, and be tracked with file mode `100755`.

#### Scenario: An agent run committing under a foreign identity is refused
- **WHEN** `PAPERCLIP_RUN_ID` is set and the resolved author identity is anything other than the delivery bot
- **THEN** the guard exits non-zero, the pre-commit hook fails, and no commit object is created

#### Scenario: The committer half is checked, not only the author
- **WHEN** `PAPERCLIP_RUN_ID` is set, the resolved author is the delivery bot, and the resolved committer is a different identity — the shape a stray `GIT_COMMITTER_NAME`/`GIT_COMMITTER_EMAIL` export produces
- **THEN** the guard exits non-zero and the commit is refused

#### Scenario: An identity that cannot be resolved is refused, not admitted
- **WHEN** `PAPERCLIP_RUN_ID` is set and `git var` exits non-zero because no identity can be resolved
- **THEN** the guard refuses the commit — an unresolvable identity fails closed rather than passing the check

#### Scenario: The delivery bot commits normally
- **WHEN** `PAPERCLIP_RUN_ID` is set and both resolved identities are the delivery bot
- **THEN** the guard exits 0 silently and the commit proceeds to the rest of the hook

### Requirement: The guard is inert for human commits
The guard SHALL exit 0 on its first statement when `PAPERCLIP_RUN_ID` is unset or empty, before resolving any identity, so that a person committing to this repository is unaffected whatever identity they commit under and sees no output, no delay, and no failure mode introduced by this check.

#### Scenario: A human commits under their own identity
- **WHEN** `PAPERCLIP_RUN_ID` is absent from the environment and the resolved identity is not the delivery bot
- **THEN** the commit is created normally and the guard prints nothing

#### Scenario: The inert path is proven with the variable explicitly removed
- **WHEN** the check for this behaviour runs inside an agent run, where `PAPERCLIP_RUN_ID` is already exported into the environment the test inherits
- **THEN** the test removes the variable explicitly (`env -u PAPERCLIP_RUN_ID`) rather than merely not setting it — a case that only omits it runs with it still set, and silently re-tests the refusal path while reporting green

### Requirement: The guard carries an allowlist of one identity and never a denylist
The guard SHALL name only the delivery bot's identity and SHALL NOT contain any list of disallowed human names, addresses, or domains. This repository is public, so a denylist committed here would publish the exact strings it exists to keep out, and would admit any identity nobody thought to list. The check harness SHALL assert this structurally rather than by review: the guard script contains exactly one distinct `@`-bearing token.

#### Scenario: A denylist added to the guard fails the harness
- **WHEN** a second identity, address, or domain is added to `ci/check-commit-identity.sh`
- **THEN** `ci/test-git-hooks.sh` fails on the distinct-address assertion

### Requirement: The rejection message never echoes the identity it rejected
The guard's failure output SHALL name the expected delivery identity in full, SHALL name which field differs (author or committer), and SHALL NOT print the resolved identity. CI logs on this repository are public, and the case the message exists for is exactly the case where the resolved value is a human identity, so echoing it would publish the string the surrounding disclosure rule forbids.

#### Scenario: A refusal is diagnosable without disclosing anything
- **WHEN** the guard refuses a commit
- **THEN** the message states the expected bot name and email, states which of author/committer differs, and says the resolved value is withheld on purpose

#### Scenario: The refusal text is checked against the identity that triggered it
- **WHEN** `ci/test-git-hooks.sh` runs the refusal case under a fabricated identity and captures the guard's stderr
- **THEN** the captured text does not contain that identity's name or address

### Requirement: The guard is wired through the existing husky hook so it cannot be discarded
`.husky/pre-commit` SHALL invoke the guard ahead of `npx lint-staged`, and SHALL propagate its failure explicitly with `|| exit 1`. The explicit propagation is required because this repository's tracked hook must run under both values `core.hooksPath` can hold: husky 9 runs it as `sh -e <file>`, where a failing bare invocation aborts, but under `core.hooksPath = .husky` git execs the tracked file directly with a plain `#!/bin/sh` and no `-e`, where the failure would be discarded and the hook would exit with lint-staged's status — leaving the guard fully working under one slot value and silently inert under the other.

#### Scenario: The hook aborts the commit when the guard refuses
- **WHEN** the guard exits non-zero under `core.hooksPath = .husky`, where nothing sets `-e`
- **THEN** the hook exits non-zero rather than continuing to `npx lint-staged`, and the commit is aborted

#### Scenario: A guard that cannot be executed fails closed
- **WHEN** `ci/check-commit-identity.sh` is missing or has lost its executable mode, so the invocation returns 126 or 127
- **THEN** the commit is refused rather than proceeding, and `ci/test-git-hooks.sh`'s mode assertion is what keeps that state off `main`

### Requirement: The guard is proven to fire, by real commits, in the existing hook harness
`ci/test-git-hooks.sh` SHALL prove the guard by constructing the failing condition and observing a commit refused, not only by observing a green happy path. It SHALL do so in a throwaway repository whose `core.hooksPath` resolves to the real tracked `.husky/pre-commit` and the real `ci/` directory, with `npx` stubbed so the fixture needs no `node_modules` and no network — keeping the Node-less `test-hooks` CI job Node-less. It SHALL remain a pure git-and-shell script invoked by the existing `test-hooks` job, and SHALL NOT become a second harness.

#### Scenario: Each refusal case asserts that no commit was created
- **WHEN** a refusal case runs
- **THEN** the test asserts the repository's commit count did not move, in addition to asserting git's exit status

#### Scenario: The commit's exit status is read directly, never through a pipe
- **WHEN** a case runs `git commit` and wants to capture its output
- **THEN** it redirects to a file and tests git's own status — a pipeline reports the last command's status, so a refused commit piped through another command reads as a successful one

#### Scenario: The harness covers both the firing path and both inert paths
- **WHEN** `ci/test-git-hooks.sh` runs
- **THEN** it exercises: refusal on a foreign author, refusal on a foreign committer, a normal commit with `PAPERCLIP_RUN_ID` removed, a normal commit as the delivery bot, and the no-echo property of the refusal message

### Requirement: The handbook records the guard and its limits without overstating it
`docs/agent-dev-environment.md` SHALL describe the guard in its GitHub delivery identity subsection, and SHALL state its limits rather than claim it closes the channel: it is skippable with `git commit --no-verify`, it is silently inert in a worktree that never installed `.husky/_`, and git does not run `pre-commit` for `rebase`, `cherry-pick`, `merge` or `revert`. The document SHALL name the unskippable backstop — the CI lane that reads the real commit headers — as separate work.

#### Scenario: A reader learns what the hook does not cover
- **WHEN** an agent or operator reads the delivery-identity subsection
- **THEN** it finds the guard's trigger condition, its allowlist-of-one design, all three limits, and an explicit statement that the hook alone does not close the identity channel
