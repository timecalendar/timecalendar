# mobile-lint-format — delta spec

## ADDED Requirements

### Requirement: Import and export order is lint-enforced and autofixable
Lint SHALL enforce a canonical import (and export) order in hand-written mobile
code via `eslint-plugin-simple-import-sort`, reported as an error and repairable
by `eslint --fix`. The group order SHALL be: side-effect imports, then Node
builtins together with third-party packages, then the `@/` alias, then relative
imports. Generated code (`src/api/generated/**`) SHALL remain exempt, and
side-effect imports SHALL keep their relative order so import side effects are not
reordered.

#### Scenario: Misordered imports are blocked and fixable
- **WHEN** a file imports a relative module before a third-party package, or a
  `@/` alias import before a third-party package
- **THEN** `npm run lint` reports an error on the import block, and `eslint --fix`
  rewrites it into the canonical order

#### Scenario: The `@/` alias is its own group between third-party and relative
- **WHEN** a file mixes third-party, `@/` alias, and relative imports
- **THEN** the fixed order places third-party first, `@/` alias imports next, and
  relative imports last, each group separated by a blank line

#### Scenario: Side-effect imports keep their relative order
- **WHEN** a file contains a side-effect import such as `import "@/i18n"`
- **THEN** the rule does not reorder it relative to other side-effect imports
  (preserving import side-effect ordering)

#### Scenario: Generated code is exempt
- **WHEN** files under `src/api/generated/` have imports in a different order
- **THEN** the import-order rule reports no violations for those files
