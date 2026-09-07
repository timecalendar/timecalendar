# ghcr-retention-automation Specification

## Purpose
TBD - created by archiving change repair-ghcr-retention-authentication. Update Purpose after archive.
## Requirements
### Requirement: Scheduled retention authenticates with least privilege

The daily GHCR retention job SHALL authenticate package-version operations with the repository's
ephemeral workflow token, SHALL grant the job only `packages: write`, and SHALL NOT depend on a stored
personal access token. It MUST invoke retention separately for each of the two repository-linked
container packages in `github-token` mode so the action does not enumerate all organization packages.

#### Scenario: The daily schedule evaluates both linked packages

- **WHEN** the retention workflow runs from its daily schedule
- **THEN** one exact-name action invocation lists and evaluates versions for the server package and a
  second exact-name invocation lists and evaluates versions for the web package
- **AND** neither invocation calls the organization package-list operation used by PAT mode

#### Scenario: Workflow permissions are reviewed

- **WHEN** the cleanup job's effective permissions are inspected
- **THEN** package write access is explicit and no unrelated repository permission is granted

#### Scenario: No retention credential is stored

- **WHEN** the workflow's authentication inputs are inspected
- **THEN** both action steps use the ephemeral workflow token and no PAT secret reference remains

### Requirement: Retention preserves current and recoverable images

Each package-specific retention invocation SHALL preserve every version tagged `latest` or
`production` and SHALL keep at least five versions regardless of age. Scheduled runs SHALL retain the
existing one-week timezone-aware cut-off by default while allowing the existing cut-off expression to
select older eligible versions.

#### Scenario: An old version carries a protected tag

- **WHEN** a scheduled run evaluates a version tagged `latest` or `production`
- **THEN** that version is excluded from deletion regardless of its age

#### Scenario: Fewer than five newer versions remain

- **WHEN** age filtering would otherwise leave fewer than five versions of a package
- **THEN** the action retains enough versions to satisfy the five-version floor

#### Scenario: A scheduled run has no manual cut-off input

- **WHEN** the daily schedule starts the workflow without inputs
- **THEN** each package uses the timezone-aware `1 week ago UTC` cut-off

### Requirement: Manual retention runs cannot delete package versions

Every `workflow_dispatch` execution SHALL force dry-run mode from trusted event context rather than a
caller-selectable boolean. Manual callers SHALL retain the optional timezone-aware cut-off input, and
the same cut-off SHALL apply independently to both package invocations.

#### Scenario: A caller dispatches with an aggressive cut-off

- **WHEN** a caller manually dispatches the workflow with any accepted cut-off
- **THEN** both package invocations only report candidate versions and issue no delete operation

#### Scenario: A caller omits the cut-off

- **WHEN** a caller manually dispatches the workflow without a cut-off
- **THEN** both dry-run invocations use `1 week ago UTC`

#### Scenario: A caller attempts to select destructive behavior

- **WHEN** the manual-dispatch inputs are inspected or used
- **THEN** no input exists that can disable dry-run mode

### Requirement: Repository validation prevents retention-policy drift

An always-on repository CI check SHALL deterministically validate the retention workflow's schedule,
job permission, authentication mode, exact package coverage, manual dry-run expression, cut-off
fallback, protected tags, and minimum-version floor. The check MUST reject a PAT reference, an extra
or missing retention invocation, or a package step lacking any required safeguard.

#### Scenario: A required invariant is removed

- **WHEN** a change removes or weakens authentication, manual dry-run, package coverage, tag
  protection, schedule, or minimum retention in one step
- **THEN** the focused check exits non-zero in pull-request CI

#### Scenario: The valid workflow is checked locally and in CI

- **WHEN** the focused validation command runs against the repaired workflow
- **THEN** it exits successfully without contacting GitHub Packages or reading any credential

### Requirement: Both package listings are proven before merge

The final implementation head SHALL have green CI and one successful branch-ref manual dispatch that
uses an explicit timezone-aware cut-off. The manual run MUST execute in forced dry-run mode and MUST
show successful package-version processing for both exact package names without deleting a version.

#### Scenario: Both linked packages accept the workflow token

- **WHEN** the branch-ref dry run executes on the final implementation head
- **THEN** both package-specific action steps complete their version-list processing successfully
- **AND** the evidence identifies the tested head and run without exposing credential material

#### Scenario: One package rejects the workflow token

- **WHEN** either package-specific step returns an authentication or authorization failure
- **THEN** the change is not handed to review as working
- **AND** the issue names the exact package-admin access action required before another dry run

#### Scenario: Repository-token administration is prohibited

- **WHEN** organization policy prevents this repository from receiving admin Actions access to both
  linked packages
- **THEN** the pipeline stops for a revised credential design using a dedicated classic token with
  only `read:packages` and `delete:packages`, stored as an Actions secret and owned by an identity with
  admin access to both packages

