## MODIFIED Requirements

### Requirement: Pre-commit lints staged mobile files
`mobile/package.json` SHALL declare a `lint-staged` configuration running `eslint --cache --fix` on staged JS/TS files, picked up by the root pre-commit hook through lint-staged's nested-config discovery. The root hook SHALL stay generic — a two-line `#!/bin/sh` script whose only action is `npx lint-staged` — carrying no mobile-specific knowledge and no husky-version-specific preamble. The hook SHALL invoke lint-staged through `npx` and SHALL be tracked with file mode `100755`, because those two properties are what make it run under either `core.hooksPath` value (git invokes it directly when the slot is `.husky`, and through husky's generated shim when the slot is `.husky/_`).

#### Scenario: Staged mobile file with a violation blocks the commit
- **WHEN** a mobile file containing an unfixable lint error is staged and `git commit` runs
- **THEN** the pre-commit hook fails and the commit is aborted

#### Scenario: Staged mobile file with a fixable violation is rewritten in place
- **WHEN** a `mobile/**/*.ts` file with an auto-fixable lint violation is staged and `git commit` runs
- **THEN** `eslint --cache --fix` rewrites the staged file and the commit proceeds with the fixed content

#### Scenario: The hook resolves lint-staged without husky's PATH injection
- **WHEN** the pre-commit hook runs under `core.hooksPath = .husky`, where git invokes the tracked hook directly and nothing has prepended `node_modules/.bin` to `PATH`
- **THEN** `npx` resolves lint-staged from `node_modules` and the mobile lint gate still runs — whereas a bare `lint-staged` invocation would fail with `command not found` and abort the commit

#### Scenario: The tracked hook stays executable
- **WHEN** the pre-commit hook is modified and `git ls-files -s .husky/pre-commit` is read
- **THEN** the mode is `100755` — a hook recorded as `100644` is silently ignored by git under `core.hooksPath = .husky`, so the commit succeeds unlinted with only a suppressible `advice.ignoredHook` hint
