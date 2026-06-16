# mobile-architecture-book Specification

## Purpose
Defines the living Architecture Book for the React Native app — where it lives,
what it must contain, and the requirement that migration docs treat it as the
single source of rules so no second book ever appears. Companion to
[`mobile-app-scaffold`](../mobile-app-scaffold/spec.md); the book's change
process is defined in `docs/react-native-migration/00-exploration/migration-approach.md` §7.
## Requirements
### Requirement: The Architecture Book lives at docs/mobile/architecture-book/
The living Architecture Book for the React Native app SHALL exist as Markdown files under `docs/mobile/architecture-book/` — this directory IS the book, not a mirror of one maintained elsewhere.

#### Scenario: Book exists at the canonical location
- **WHEN** the repository is inspected after the scaffold lands
- **THEN** `docs/mobile/architecture-book/` contains at least one Markdown file constituting the Architecture Book

### Requirement: The book is seeded with the rules that are already real
The initial Architecture Book SHALL contain: the book's charter (what it is and how it changes, referencing migration-approach §7), the R-1…R-6 working rules from `migration-approach.md` §6, and the decisions made concrete by this change (SDK 56 baseline, TypeScript strict flags, CNG, `APP_VARIANT` identity, standalone-project placement, effective minimum OS floors).

#### Scenario: Seed content present
- **WHEN** the Architecture Book is read
- **THEN** it states the charter, the R-1…R-6 rules, and the scaffold-time decisions, each with its rationale or a pointer to the deciding document

### Requirement: Migration docs name the Architecture Book's location
The migration documents SHALL identify `docs/mobile/architecture-book/` as the canonical Architecture Book location, so later roadmap steps (notably the "five living artifacts" step) do not create a second book.

#### Scenario: Docs point at the book
- **WHEN** `docs/react-native-migration/00-exploration/migration-approach.md` and `docs/react-native-migration/01-roadmap/01-foundation.md` are read
- **THEN** both reference `docs/mobile/architecture-book/` as where the Architecture Book lives

### Requirement: All five living artifacts exist as siblings under docs/mobile/architecture-book/
The five living artifacts named in `migration-approach.md` §2 SHALL all exist under
`docs/mobile/architecture-book/` — the Architecture Book (`architecture.md`), the ADR log
(`decisions/`), the Definition of Done (`definition-of-done.md`), the Rule changelog
(`architecture-changelog.md`), and the golden-path exemplar placeholder (`golden-path.md`).
No artifact SHALL be created in a second location outside this directory.

#### Scenario: The four remaining artifacts join the book
- **WHEN** `docs/mobile/architecture-book/` is inspected after this change
- **THEN** it contains `architecture.md`, a `decisions/` directory, `definition-of-done.md`,
  `architecture-changelog.md`, and `golden-path.md`
- **AND** none of these artifacts exists anywhere outside `docs/mobile/architecture-book/`

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
- **WHEN** `docs/mobile/architecture-book/decisions/` is inspected
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
The golden-path exemplar (`docs/mobile/architecture-book/golden-path.md`) SHALL be the **real** reference
extracted from the three landed Phase-2 pattern-establishment features (Settings, Personal events,
School selection) — NOT a placeholder. It SHALL name, **for each architectural axis**, the canonical
landed feature that exemplifies it (local key-value + native controls + i18n → Settings; structured
device-local CRUD + forms + write error path → Personal events; server read + offline cache + nested
navigation → School selection), and SHALL document the **common spine** the three converged on: the
`src/features/<feature>/<layer>/` folder shape with `data/` / `store/` / `form/` sublayers, the
per-sublayer barrel + feature-level barrel discipline (no cycle), the presentational-screen-in-
`src/components/` + thin-route-in-`src/app/` split, the data/query/store/db seam conventions, the
screen/test/e2e skeleton shape, and the i18n/a11y call-site conventions. Every claim SHALL **point at
a real file** (R-1 pointer style) rather than re-deriving the content inline. The file SHALL NOT state
that there is "no reference feature to copy yet."

#### Scenario: The exemplar names a canonical feature per axis
- **WHEN** `docs/mobile/architecture-book/golden-path.md` is read after this change
- **THEN** it names Settings, Personal events, and School selection as the canonical exemplars for
  their respective axes
- **AND** it points at the real `src/features/<feature>/<layer>/` files, the presentational screens,
  and the thin routes for each
- **AND** it no longer contains the placeholder statement that no reference feature exists yet

#### Scenario: The exemplar documents the common spine via pointers
- **WHEN** the exemplar is read
- **THEN** it documents the feature-folder shape, barrel discipline, the seam boundaries, the
  screen/test/e2e skeleton, and the i18n/a11y conventions
- **AND** each is a pointer to the real files (R-1), not a duplicated inline copy of their content

### Requirement: A new feature can be started by copying the documented scaffolding
The repository SHALL provide a **lightest-sound** scaffolding mechanism that makes "a new feature can
be started by copying it" literally true (the Phase-1.5 exit criterion): a documented "starting a new
feature" checklist in the golden-path exemplar plus a minimal skeleton template tree of valid,
lint-clean stub files. The skeleton template SHALL live **outside `mobile/src/`** (so Metro does not
bundle it, the route harness does not walk it, and the coverage harness does not count it), and the
golden-path exemplar SHALL point at it. The mechanism SHALL NOT be a code generator (recorded as
deferred debt with its trigger instead).

#### Scenario: The copy-this checklist and template exist
- **WHEN** the repository is inspected after this change
- **THEN** the golden-path exemplar contains a step-by-step "starting a new feature" checklist
- **AND** a minimal skeleton template tree exists outside `mobile/src/` that a developer copies into
  `src/features/<feature>/…` and renames

#### Scenario: The template does not contaminate the build or coverage
- **WHEN** the `test-mobile` CI job (tsc + lint + Jest + coverage) runs after this change
- **THEN** it stays green with no new failures attributable to the template files
- **AND** the template files are not compiled, bundled, linted-as-source, or counted toward coverage

### Requirement: The Architecture Book is reconciled to what the three features actually taught
The Architecture Book (`docs/mobile/architecture-book/architecture.md`) SHALL be reconciled (pointer style
preserved) so that the prose the three Phase-2 features proved or refined reflects reality rather than
Phase-0 guesses: the **feature-module folder shape** (now real and varied — `data/` / `store/` /
`form/` sublayers + barrels), the **data-layer query seam** (only a feature's `data/` touches the
generated hooks / `@/db` — review-enforced today, lint-pending), the **query-runtime policy** (no
longer "deliberately unset" — School selection earned it; the note points at the landed
`src/api/query-client.ts` + its ADR), and the **chrome-wrapper pattern** (now a real multi-consumer
seam). No new rule SHALL be encoded by this change (it reconciles and points; it does not add tooling).

#### Scenario: The query-runtime note reflects the earned policy
- **WHEN** the Architecture Book's Data-layer "Query runtime" note is read after this change
- **THEN** it no longer says the policy is deliberately unset / deferred
- **AND** it points at the landed `src/api/query-client.ts` and the ADR that records the policy

#### Scenario: The feature-folder prose reflects the earned shape
- **WHEN** the Architecture Book is read after this change
- **THEN** it documents the `src/features/<feature>/<layer>/` shape with its sublayers and barrels as
  the established feature-module pattern
- **AND** it points at the golden-path exemplar and the blessing ADR rather than duplicating them

### Requirement: The layered feature-module pattern is recorded as an ADR
The ADR log SHALL contain a new ADR that blesses the **cross-feature layered feature-module pattern**
the three features converged on (`src/features/<feature>/<layer>/` with the data/store/form sublayers,
the barrel discipline, the seam boundaries, and the 90/70 logic/presentation coverage split),
generalizing the folder-shape half of ADR 009 (first feature folder) from a sample of one to the
blessed pattern earned from three. The ADR SHALL carry a "revisit if" trigger (notably the pending
`eslint-plugin-boundaries` feature-boundary lint, TIM-135) and SHALL be indexed in the ADR README. It
SHALL NOT supersede ADR 009's infra→feature-edge decision.

#### Scenario: The pattern ADR is present and indexed
- **WHEN** `docs/mobile/architecture-book/decisions/` is inspected after this change
- **THEN** it contains a numbered ADR blessing the layered feature-module pattern
- **AND** the ADR README index has a row for it with its revisit trigger
- **AND** the ADR records the feature-boundary lint (TIM-135) as the pending encodable follow-up

### Requirement: The extraction is recorded in the Rule changelog
The Rule changelog (`docs/mobile/architecture-book/architecture-changelog.md`) SHALL gain a dated entry recording
the golden-path extraction, the Architecture Book reconciliation, and the new pattern ADR — because the
act of blessing the pattern and reconciling the book is itself a rule change (migration-approach §7).

#### Scenario: The changelog entry exists
- **WHEN** the Rule changelog is read after this change
- **THEN** its newest entry records this change (golden-path exemplar extracted, book reconciled, ADR
  added), dated, pointing at the affected sections

