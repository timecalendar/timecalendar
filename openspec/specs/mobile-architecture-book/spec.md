# mobile-architecture-book Specification

## Purpose
Defines the living Architecture Book for the React Native app — where it lives,
what it must contain, and the requirement that migration docs treat it as the
single source of rules so no second book ever appears. Companion to
[`mobile-app-scaffold`](../mobile-app-scaffold/spec.md); the book's change
process is defined in `docs/react-native-migration/00-exploration/migration-approach.md` §7.
## Requirements
### Requirement: The Architecture Book lives at .claude/rules/mobile/
The living Architecture Book for the React Native app SHALL exist as Markdown files under `.claude/rules/mobile/` — this directory IS the book, not a mirror of one maintained elsewhere.

#### Scenario: Book exists at the canonical location
- **WHEN** the repository is inspected after the scaffold lands
- **THEN** `.claude/rules/mobile/` contains at least one Markdown file constituting the Architecture Book

### Requirement: The book is seeded with the rules that are already real
The initial Architecture Book SHALL contain: the book's charter (what it is and how it changes, referencing migration-approach §7), the R-1…R-6 working rules from `migration-approach.md` §6, and the decisions made concrete by this change (SDK 56 baseline, TypeScript strict flags, CNG, `APP_VARIANT` identity, standalone-project placement, effective minimum OS floors).

#### Scenario: Seed content present
- **WHEN** the Architecture Book is read
- **THEN** it states the charter, the R-1…R-6 rules, and the scaffold-time decisions, each with its rationale or a pointer to the deciding document

### Requirement: Migration docs name the Architecture Book's location
The migration documents SHALL identify `.claude/rules/mobile/` as the canonical Architecture Book location, so later roadmap steps (notably the "five living artifacts" step) do not create a second book.

#### Scenario: Docs point at the book
- **WHEN** `docs/react-native-migration/00-exploration/migration-approach.md` and `docs/react-native-migration/01-roadmap/01-foundation.md` are read
- **THEN** both reference `.claude/rules/mobile/` as where the Architecture Book lives

### Requirement: All five living artifacts exist as siblings under .claude/rules/mobile/
The five living artifacts named in `migration-approach.md` §2 SHALL all exist under
`.claude/rules/mobile/` — the Architecture Book (`architecture.md`), the ADR log
(`decisions/`), the Definition of Done (`definition-of-done.md`), the Rule changelog
(`architecture-changelog.md`), and the golden-path exemplar placeholder (`golden-path.md`).
No artifact SHALL be created in a second location outside this directory.

#### Scenario: The four remaining artifacts join the book
- **WHEN** `.claude/rules/mobile/` is inspected after this change
- **THEN** it contains `architecture.md`, a `decisions/` directory, `definition-of-done.md`,
  `architecture-changelog.md`, and `golden-path.md`
- **AND** none of these artifacts exists anywhere outside `.claude/rules/mobile/`

### Requirement: The Architecture Book points at the other four artifacts
The Architecture Book (`architecture.md`) SHALL link to each of the other four living
artifacts rather than duplicating their content (R-1 pointer style), so the book remains the
entry point while each artifact is the source of truth for its own concern. The book's
pre-existing forward-references to these artifacts (the "five artifacts foundation step", the
"Rule changelog", the "`decisions/` log") SHALL resolve to the now-real files.

#### Scenario: Book links rather than duplicates
- **WHEN** the Architecture Book is read
- **THEN** it names all five artifacts and links to the four siblings
- **AND** it does not duplicate the DoD checklist, the ADRs, the changelog, or the golden-path
  content inline

### Requirement: The five resolved knobs K-1…K-5 are recorded as real ADRs
The ADR log SHALL contain one ADR for each of the resolved knobs K-1…K-5 from
`migration-approach.md` §8, each recording the decision, its rationale, its status (including
any revisit that has already fired), and its "revisit if" trigger. The ADR log SHALL provide
a template and an index so future decisions follow one shape.

#### Scenario: K-1…K-5 ADRs present
- **WHEN** `.claude/rules/mobile/decisions/` is inspected
- **THEN** it contains a numbered ADR for each of K-1 (SDK target), K-2 (minimum OS),
  K-3 (coverage), K-4 (Phase 1 feature order), and K-5 (calendar spike)
- **AND** the K-1 and K-2 ADRs record the revisits that already fired at scaffold time

#### Scenario: ADR log has an index and a template
- **WHEN** the `decisions/` directory is read
- **THEN** a `README.md` indexes the ADRs and states the ADR process
- **AND** a template file gives the standard ADR shape for future decisions

### Requirement: The Definition of Done captures the obligations the book defers to it
The Definition of Done SHALL contain the per-feature checklist from `migration-approach.md`
§5, SHALL state the ✅ Done / ➖ N/A-with-reason rule (no third state), and SHALL capture every
concrete obligation that existing Architecture Book sections explicitly defer to the DoD —
including manual VoiceOver/TalkBack passes, touch-target minimums, color contrast, reduced
motion, Dynamic Type, the coverage threshold owned by the first logic feature (K-3), and
on-device analytics/observability verification.

#### Scenario: DoD is complete enough for the splash to pass
- **WHEN** the Definition of Done is read before the splash feature (roadmap step 13)
- **THEN** it lists every DoD axis from migration-approach §5
- **AND** each axis names its concrete obligations and points at its owning book section or
  live gate, with no obligation left homeless

### Requirement: The Rule changelog starts truthful
The Rule changelog SHALL be an append-only, dated log of every change to the rules, and SHALL
be seeded with the rule-establishing changes that have already landed (so it does not
misrepresent history), plus an entry for this change.

#### Scenario: Changelog reflects prior rule eras
- **WHEN** the Rule changelog is read
- **THEN** it contains a dated entry for each prior change that established or moved a rule
  (scaffold, api-client, test-harness, lint-format, i18n, a11y, firebase)
- **AND** it contains an entry for the creation of the four living artifacts

### Requirement: The golden-path placeholder sets the right expectation
The golden-path exemplar artifact SHALL exist as a placeholder that states the exemplar is
earned in Phase 1.5 (not declared now), names what a future exemplar must demonstrate, and
points at the current closest references, so it is an honest signpost rather than a template
to copy prematurely.

#### Scenario: Placeholder does not pretend to be the exemplar
- **WHEN** `golden-path.md` is read before Phase 1.5
- **THEN** it states the exemplar is not yet extracted and will be earned from Phase 1 features
- **AND** it points at the current closest reference surfaces rather than presenting a
  copy-me template

