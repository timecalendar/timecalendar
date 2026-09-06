## ADDED Requirements

### Requirement: Branch commit identity headers are scanned

The contributor preflight and repository CI gate SHALL match their existing disclosure pattern
sources against the author name, author email, committer name, and committer email of every commit
added over the resolved merge base. A matching header MUST produce a finding with source
`commit-header`.

#### Scenario: A branch author header matches

- **WHEN** a commit added by the branch has an author name or author email that matches a disclosure
  pattern
- **THEN** the scan fails and reports a `commit-header` finding for the matching field

#### Scenario: A branch committer header matches

- **WHEN** a commit added by the branch has a committer name or committer email that matches a
  disclosure pattern
- **THEN** the scan fails and reports a `commit-header` finding for the matching field

#### Scenario: A matching header exists only on the base

- **WHEN** a matching author or committer header is reachable from the base but no commit added over
  the merge base carries it
- **THEN** the header lane reports no finding for that historical commit

#### Scenario: Healthy automation identities pass silently

- **WHEN** every branch commit uses an identity already classified as platform automation,
  dependency automation, or an allowed role address
- **THEN** the header lane produces no finding and does not fail the scan

### Requirement: Commit identity headers use layer-B policy

Every commit-header record SHALL be treated as introduced by the branch. The header lane MUST NOT
consult a count-keyed baseline or apply path-scoped published-identity narrowing.

#### Scenario: A baseline is present

- **WHEN** a branch header matches while a disclosure baseline is supplied
- **THEN** the match fails exactly as it does without a baseline

#### Scenario: Published paths are configured

- **WHEN** a branch header matches a pattern that also declares published repository paths
- **THEN** the header match is not narrowed because the header has no path

### Requirement: Commit-header findings reveal no matched identity

A commit-header finding SHALL identify only a safe abbreviated commit reference, the fixed header
field, the pattern id or class, and the occurrence count. The matched header value MUST NOT appear
in serialized findings or public command output.

#### Scenario: A header finding is emitted

- **WHEN** a branch header contains one or more matching occurrences
- **THEN** every match is redacted from the finding and output while the safe location and complete
  occurrence count remain available

#### Scenario: Commit messages remain a separate source

- **WHEN** the same branch contains a matching commit message and a matching identity header
- **THEN** the message finding reports `commit-message` and the header finding reports
  `commit-header`

### Requirement: Preflight and CI keep commit-header parity

The contributor preflight and repository CI gate SHALL use the same merge-base-to-head scope,
four-field coverage, `commit-header` source value, layer-B policy, and no-match-in-output guarantee.

#### Scenario: The same synthetic branch is scanned by both mechanisms

- **WHEN** both mechanisms receive equivalent patterns and inspect the same branch commits
- **THEN** both reach the same pass/fail verdict for commit headers and identify the same matching
  header fields
