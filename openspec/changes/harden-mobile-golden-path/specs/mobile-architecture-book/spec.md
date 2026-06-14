# mobile-architecture-book (delta) — golden-path exemplar extracted, Architecture Book reconciled to the three landed features

## MODIFIED Requirements

### Requirement: The golden-path placeholder sets the right expectation
The golden-path exemplar (`.claude/rules/mobile/golden-path.md`) SHALL be the **real** reference
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
- **WHEN** `.claude/rules/mobile/golden-path.md` is read after this change
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

## ADDED Requirements

### Requirement: The Architecture Book is reconciled to what the three features actually taught
The Architecture Book (`.claude/rules/mobile/architecture.md`) SHALL be reconciled (pointer style
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
- **WHEN** `.claude/rules/mobile/decisions/` is inspected after this change
- **THEN** it contains a numbered ADR blessing the layered feature-module pattern
- **AND** the ADR README index has a row for it with its revisit trigger
- **AND** the ADR records the feature-boundary lint (TIM-135) as the pending encodable follow-up

### Requirement: The extraction is recorded in the Rule changelog
The Rule changelog (`.claude/rules/mobile/architecture-changelog.md`) SHALL gain a dated entry recording
the golden-path extraction, the Architecture Book reconciliation, and the new pattern ADR — because the
act of blessing the pattern and reconciling the book is itself a rule change (migration-approach §7).

#### Scenario: The changelog entry exists
- **WHEN** the Rule changelog is read after this change
- **THEN** its newest entry records this change (golden-path exemplar extracted, book reconciled, ADR
  added), dated, pointing at the affected sections
