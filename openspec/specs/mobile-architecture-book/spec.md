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
