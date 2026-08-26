## ADDED Requirements

### Requirement: Build infrastructure recommendation is documented as an ordered pack

The repository SHALL provide an ordered mobile build-infrastructure documentation pack that states
the decision, target architecture, workflow contracts, cache policy, security and operations model,
and phased adoption plan. The pack SHALL link to the existing OTA environment guidance and clearly
state that the change is documentation-only.

#### Scenario: Maintainer evaluates the recommendation

- **WHEN** a maintainer opens the build-infrastructure README
- **THEN** it presents the hybrid recommendation and an ordered path through every supporting topic
- **AND** it distinguishes native builds and E2E from OTA delivery

### Requirement: Persistent Mac execution has a narrow trust boundary

The guidance SHALL keep ordinary and pull-request CI on hosted runners, attach the persistent Mac
runner only to a private orchestration repository, and permit it to execute only trusted exact-SHA
jobs. It SHALL retain a hosted fallback and SHALL prohibit the Mac from becoming the sole release
path or store-credential holder.

#### Scenario: Untrusted pull request requests native E2E

- **WHEN** code from a public-repository pull request is evaluated
- **THEN** that code cannot select or execute on the persistent Mac runner
- **AND** hosted CI remains available for the applicable checks

### Requirement: Distribution workflows preserve exact build provenance

The guidance SHALL define manual internal, beta, and production build contracts that resolve an
immutable commit SHA, build signed artifacts on EAS, record the resulting EAS build IDs and app
identity, and submit those exact build IDs only after the applicable protected approval. It SHALL
distinguish TestFlight internal-group submission from external-group Beta Review.

#### Scenario: Approved iOS beta is promoted

- **WHEN** an iOS beta build is approved for an external TestFlight group
- **THEN** the EAS Workflows `testflight` job distributes the exact recorded EAS build ID and handles
  Beta App Review
- **AND** the workflow does not rebuild from a mutable branch reference

#### Scenario: Approved iOS internal build is promoted

- **WHEN** an iOS build is approved for an internal TestFlight group
- **THEN** EAS Submit submits the exact recorded EAS build ID to the named internal group

### Requirement: Persistent caches remain reproducible and free of credentials

The guidance SHALL define cache keys and retention for downloaded dependencies and externalized
native build outputs while excluding generated source trees, mutable workspaces, credentials, and
secret-bearing artifacts. It SHALL require bounded disk usage, per-run cleanup, and recurring
clean-cache verification.

#### Scenario: Warm native E2E run completes

- **WHEN** a trusted iOS E2E run reuses eligible warm cache entries
- **THEN** cache identity includes the relevant lockfiles and toolchain versions
- **AND** the run still scrubs its workspace and credential-bearing state on completion

#### Scenario: Clean-cache canary runs

- **WHEN** the scheduled clean-cache proof executes
- **THEN** the same workflow succeeds without relying on retained derived outputs

### Requirement: Adoption is evidence-gated and reversible

The guidance SHALL stage adoption from inventory and baseline through an iOS E2E pilot, routine E2E,
internal delivery, and beta/production rehearsal. It SHALL define measurable speed, reliability,
security, and fallback exit criteria, and SHALL defer Android-on-Mac adoption until a comparative
benchmark proves a net pipeline benefit.

#### Scenario: iOS pilot is evaluated

- **WHEN** the minimum pilot window and run count are complete
- **THEN** maintainers compare warm performance, clean-cache reliability, failure classes, security
  controls, and hosted fallback evidence against the documented go/no-go criteria
- **AND** routing can return to hosted infrastructure without blocking signed builds or releases
