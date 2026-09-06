## ADDED Requirements

### Requirement: Branch commit identity headers are scanned

The repository CI gate SHALL match every one of its existing disclosure pattern sources — derived,
structural, and configured — against the author name, author email, committer name, and committer
email of every commit added over the resolved merge base. A matching header MUST produce a finding
with source `commit-header`. No identity class is exempted from a lane. A personal push identity
issued by the forge sits on a domain the structural lane's allowlist accepts, so skipping the
derived lane for that class would leave the regression this requirement exists to catch uncovered
wherever no configured pattern list is supplied.

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

- **WHEN** every branch commit uses a bot, dependency-automation, or role identity whose name and
  address match no disclosure pattern in any lane
- **THEN** every lane still reads all four fields, none matches, and the header lane produces no
  finding and does not fail the scan

#### Scenario: A derived identity is re-pushed under a forge address

- **WHEN** a branch commit carries an identity the repository history already derives patterns from,
  with the address rewritten to the forge's personal push form
- **THEN** the derived lane still matches the header and the scan fails, with no configured pattern
  list supplied

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

### Requirement: The commit-header lane is a repository CI capability only

The commit-header lane SHALL live in the repository CI gate, which is the unskippable one. The
matching change to the contributor preflight is declined: publishing it is an act a standing board
directive forbids, recorded on TIM-487. The resulting asymmetry — the CI gate reads commit identity
headers while the earlier, softer contributor preflight does not — is intentional and MUST NOT be
re-filed later as a scanner-divergence or parity defect.

#### Scenario: A matching header reaches a pull request

- **WHEN** a branch commit carries a matching identity header and no contributor preflight caught it
- **THEN** the repository CI gate fails the pull request before merge, and the absent preflight
  coverage is an accepted gap rather than a defect
