# Add an import-order lint rule + sweep the mobile tree

## Why

The Architecture Book already bans parent-relative imports (`../`) and forces the
`@/` alias to cross directories, but it does **not** enforce *order* within an
import block — third-party vs. `@/` alias vs. relative are sorted by hand today.
The Phase-0 scaffolding review (TIM-117 §E1) flagged this import-source/order
inconsistency as the last open lint gap, and the CEO green-lit closing it now
("about import rule it's totally the best moment to introduce eslint rules").

Sequenced last on purpose: an `eslint --fix` sweep rewrites import blocks across
the whole tree, so it had to wait for the cleanup (TIM-119) and the web-drop +
brand-theme work (TIM-120) to land first, then sweep the settled tree once.

## What Changes

- Add `eslint-plugin-simple-import-sort` (the lighter, idiomatic autofixable
  default over `import/order`) to `mobile/eslint.config.js`, with two rules:
  `simple-import-sort/imports` and `simple-import-sort/exports`, both `error`.
- Configure import groups so the canonical order is **side-effect → Node
  builtins + third-party → `@/` alias → relative**, complementing (not replacing)
  the existing `../` ban: the alias is the only cross-directory path, so the
  `@/` group is unambiguous.
- Run `npm run lint -- --fix` to normalize the existing tree; commit the sweep.
- Keep the zero-warnings policy (`expo lint --max-warnings 0`) and the
  generated-code exemption (`src/api/generated/**`) intact.
- Update the Architecture Book "Lint & format" rule inventory and append a Rule
  changelog entry (a new lint rule landed). No ADR — tooling, not architectural.

## Impact

- Affected specs: `mobile-lint-format` (one ADDED requirement: import ordering).
- Affected code: `mobile/eslint.config.js`, `mobile/package.json` +
  `mobile/package-lock.json` (new devDependency), and any source files whose
  import/export order the `--fix` sweep normalizes.
- Affected docs: `.claude/rules/mobile/architecture.md` (Lint & format),
  `.claude/rules/mobile/architecture-changelog.md` (new entry).
- No runtime behavior change: import *order* is inert at runtime, and side-effect
  imports keep their relative order (so the `@/i18n` init seam is unaffected).
