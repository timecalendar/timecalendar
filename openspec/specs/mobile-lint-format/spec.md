# mobile-lint-format Specification

## Purpose
The lint/format rules that gate hand-written mobile code (`mobile/eslint.config.js`). The authoritative, prose rule inventory lives in the Architecture Book "Lint & format"; this spec tracks requirements as they are added per change. (The scaffold-era rules from `add-mobile-lint-format` are documented in the Architecture Book but not yet promoted here — that change predates spec promotion.)
## Requirements
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

### Requirement: Feature-module import boundaries are lint-enforced
Lint SHALL enforce the layered feature-module import boundaries
([ADR 014](../../../../.claude/rules/mobile/decisions/014-layered-feature-module-pattern.md))
via `eslint-plugin-boundaries`, reported as errors and gated by the `test-mobile`
CI job. The boundaries lint SHALL be layered **on top of** the existing seam bans
(`no-restricted-imports` for the storage/chrome/axios seams, `no-restricted-globals`
for `fetch`), which remain unchanged. The boundary checks SHALL resolve the `@/`
alias (via `eslint-import-resolver-typescript`) so that import targets are
classified by their resolved file, not the literal specifier string. The following
four boundaries SHALL be enforced:

- **B-1** — only a feature's `data/` sublayer may import the generated API client
  (`@/api/generated/**`) or the `@/db` seam.
- **B-2** — a feature sublayer (`data/`/`store/`/`form/`/…) SHALL NOT import its own
  feature-level barrel (`@/features/<feature>`); it imports a sibling sublayer's
  sub-barrel directly.
- **B-3** — presentational screens (`src/components/**`) and routes (`src/app/**`)
  SHALL NOT import `@/api/generated/**` or the `@/db` seam directly; they consume a
  feature through its barrel.
- **B-4** — the documented infra→feature seam — `@/hooks/use-color-scheme` and
  `@/i18n` importing `@/features/settings/prefs` and `@/features/settings/prefs/store`
  ([ADR 009](../../../../.claude/rules/mobile/decisions/009-settings-feature-prefs.md))
  — SHALL be allowed.

The current mobile source tree SHALL already satisfy these boundaries (the rule
lands green; it adds the gate around compliant code).

#### Scenario: A screen reaching into the generated API or db seam is blocked
- **WHEN** a file under `src/components/**` or `src/app/**` imports from
  `@/api/generated/**` or `@/db`
- **THEN** `npm run lint` reports a `boundaries/dependencies` error naming the B-3
  boundary

#### Scenario: A non-`data` sublayer reaching the generated API or db seam is blocked
- **WHEN** a feature sublayer other than `data/` (e.g. `form/`, `store/`) imports
  from `@/api/generated/**` or `@/db`
- **THEN** `npm run lint` reports a `boundaries/dependencies` error naming the B-1
  boundary, while the same import from the feature's `data/` sublayer is allowed

#### Scenario: A sublayer importing its own feature barrel is blocked
- **WHEN** a file in `src/features/<feature>/<layer>/` imports the feature-level
  barrel `@/features/<feature>`
- **THEN** `npm run lint` reports a `boundaries/dependencies` error naming the B-2
  (cycle) boundary

#### Scenario: The documented infra→feature edge is allowed
- **WHEN** `@/hooks/use-color-scheme` imports `@/features/settings/prefs`, or
  `@/i18n` imports `@/features/settings/prefs/store`
- **THEN** `npm run lint` reports no boundaries violation for those imports

#### Scenario: The existing seam bans are unchanged
- **WHEN** the boundaries rule is added
- **THEN** the existing `no-restricted-imports` (storage/chrome/axios seams) and
  `no-restricted-globals` (`fetch`) rules continue to apply with their current
  options, and `npm run lint` (`--max-warnings 0`) stays green on the current tree

