## ADDED Requirements

### Requirement: ADR 037 ratifies the self-hosted OTA architecture

The Architecture Book SHALL contain and index ADR 037 recording self-hosted xprem with Cloudflare R2 asset storage, xprem control-plane mode using the existing production Postgres service without ClickHouse, signed updates, fingerprint runtime compatibility, and silent application at a background-to-foreground boundary. The ADR SHALL contain the exact sentence: “channel pointers and rollout percentages are imperative, deliberately.”

#### Scenario: OTA architecture is recorded before deployment inputs arrive

- **WHEN** ADR 037 and the ADR index are read
- **THEN** they identify xprem, R2, Postgres without ClickHouse, update signing, fingerprint compatibility, and silent foreground application as the ratified target
- **AND** they distinguish that target from endpoint, identifier, credential, certificate-path, and publishing inputs deferred to later work

#### Scenario: Rollout control is deliberately imperative

- **WHEN** ADR 037 describes channel pointers and staged rollouts
- **THEN** it contains the exact sentence “channel pointers and rollout percentages are imperative, deliberately.”
- **AND** it explains that incident-time rollout and rollback changes are not reconciled from Git

### Requirement: Current OTA and observability guidance reflects ADR 037

The Architecture Book SHALL update `eas.md` with the non-blocking silent-apply policy and self-hosted target, update `firebase.md` with the five OTA Crashlytics keys and owned-seam rule, reconcile `architecture.md` so it points rule changes to the canonical existing `CHANGELOG.md`, and append this rule change there. `runtime.md` SHALL change only if the implementation changes its reusable runtime/native baseline contract.

#### Scenario: Topical guidance points to the ratified decision

- **WHEN** `eas.md` and `firebase.md` are read after implementation
- **THEN** they describe their current OTA runtime and observability contracts
- **AND** they point to ADR 037 instead of duplicating deployment inputs

#### Scenario: Existing changelog receives the rule change

- **WHEN** the Architecture Book directory is inspected
- **THEN** `CHANGELOG.md` contains the OTA rule-change entry
- **AND** `architecture.md` distinguishes the rule changelog from implementation history retained by Git
- **AND** no `architecture-changelog.md` duplicate is created

## MODIFIED Requirements

### Requirement: All five living artifacts exist as siblings under docs/mobile/architecture-book/

The five living artifacts named in `migration-approach.md` §2 SHALL all exist under
`docs/mobile/architecture-book/` — the Architecture Book (`architecture.md`), the ADR log
(`decisions/`), the Definition of Done (`definition-of-done.md`), the Architecture Book
changelog (`CHANGELOG.md`), and the golden-path exemplar (`golden-path.md`). No artifact SHALL
be created in a second location outside this directory.

#### Scenario: The living artifacts use their canonical paths

- **WHEN** `docs/mobile/architecture-book/` is inspected
- **THEN** it contains `architecture.md`, a `decisions/` directory, `definition-of-done.md`,
  `CHANGELOG.md`, and `golden-path.md`
- **AND** no duplicate `architecture-changelog.md` exists

### Requirement: The extraction is recorded in the Rule changelog

The Rule changelog (`docs/mobile/architecture-book/CHANGELOG.md`) SHALL contain a dated entry recording
the golden-path extraction, the Architecture Book reconciliation, and the pattern ADR — because the
act of blessing the pattern and reconciling the book is itself a rule change (migration-approach §7).

#### Scenario: The changelog entry exists

- **WHEN** the Rule changelog is read
- **THEN** it records the golden-path exemplar extraction, book reconciliation, and pattern ADR,
  pointing at the affected sections
