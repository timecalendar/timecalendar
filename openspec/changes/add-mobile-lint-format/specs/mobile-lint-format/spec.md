# mobile-lint-format — delta spec

## ADDED Requirements

### Requirement: Mobile has an ESLint flat config based on eslint-config-expo
The mobile app SHALL have an ESLint 9 flat config at `mobile/eslint.config.js` extending `eslint-config-expo/flat`, and `npm run lint` in `mobile/` SHALL pass with zero errors and zero warnings on the committed tree.

#### Scenario: Lint passes clean on a fresh clone
- **WHEN** `npm ci && npm run lint` is executed in `mobile/`
- **THEN** lint exits 0 with no errors and no warnings

#### Scenario: Generated code is exempt from hand-written-code rules
- **WHEN** files under `mobile/src/api/generated/` would violate an architecture rule (strings, a11y, import restrictions)
- **THEN** lint reports no violations for those files, while they remain subject to formatting

### Requirement: Prettier configuration matches web and server
`mobile/.prettierrc` SHALL be identical in content to `web/.prettierrc` and `server/.prettierrc` (`singleQuote: false`, `trailingComma: "all"`, `semi: false`), the entire mobile tree SHALL be formatted accordingly, and formatting SHALL be enforced as a lint error via `eslint-plugin-prettier` (matching the web/server mechanism).

#### Scenario: Config files are aligned
- **WHEN** `mobile/.prettierrc` is compared to `web/.prettierrc` and `server/.prettierrc`
- **THEN** the formatting options are identical

#### Scenario: Format drift is a lint failure
- **WHEN** a mobile source file is committed with formatting that differs from the Prettier config
- **THEN** `npm run lint` reports an error on that file, and `eslint --fix` repairs it

#### Scenario: Generated client stays in sync with the new format
- **WHEN** `npm run generate` is executed in `mobile/` after the Prettier alignment
- **THEN** `git diff --exit-code src/api/generated` reports no drift

### Requirement: Hardcoded user-facing strings are a lint error
Lint SHALL report an error for hardcoded user-facing strings in JSX text and in user-facing props (at minimum `accessibilityLabel`, `accessibilityHint`, `placeholder`), with `testID` and other non-user-facing props exempt. Pre-existing template screens MAY carry file-level suppression comments tagged as debt to be removed by the i18n step.

#### Scenario: New JSX literal is blocked
- **WHEN** a component renders a hardcoded string such as `<Text>Settings</Text>` in a file without a suppression
- **THEN** lint reports an error on that string

#### Scenario: Suppressions are explicit and tagged
- **WHEN** a pre-existing template file contains hardcoded strings
- **THEN** the file carries a file-level `eslint-disable` comment for the strings rule with a marker referencing its planned removal

### Requirement: Touchable elements require accessibility props
Lint SHALL report an error when touchable/pressable elements lack required accessibility props (role and label coverage per the configured `eslint-plugin-react-native-a11y` rules).

#### Scenario: Touchable without accessibility props is blocked
- **WHEN** a `Pressable`/`TouchableOpacity` (or equivalent touchable) is rendered without the required accessibility props
- **THEN** lint reports an error on that element

### Requirement: Direct @react-navigation imports are banned
Lint SHALL report an error for any import from `@react-navigation/*` in hand-written mobile code, with a message directing to Expo Router.

#### Scenario: Direct navigation import is blocked
- **WHEN** a file imports from `@react-navigation/native` (or any `@react-navigation/*` package)
- **THEN** lint reports an error whose message names Expo Router as the required API

### Requirement: Import boundaries for the current layout are lint-enforced
Lint SHALL enforce: (1) no parent-relative imports (`../*`) — cross-directory imports use the `@/` alias; (2) files outside `src/app/` SHALL NOT import from `@/app/*` (route files are entrypoints, not modules); (3) no imports of `axios`.

#### Scenario: Parent-relative import is blocked
- **WHEN** a file imports via a `../` path
- **THEN** lint reports an error directing to the `@/` alias

#### Scenario: Route file imported as a module is blocked
- **WHEN** a file outside `src/app/` imports from `@/app/...`
- **THEN** lint reports an error

#### Scenario: axios is blocked
- **WHEN** a file imports `axios`
- **THEN** lint reports an error directing to the generated client

### Requirement: Raw fetch outside the mutator is a lint error
Lint SHALL report an error for use of the global `fetch` anywhere in hand-written mobile code except `src/api/mutator.ts`, closing the Architecture Book's R-1 debt on un-gated fetch calls.

#### Scenario: Raw fetch in a component is blocked
- **WHEN** a file other than `src/api/mutator.ts` calls the global `fetch`
- **THEN** lint reports an error directing to the generated API client

#### Scenario: The mutator may use fetch
- **WHEN** `src/api/mutator.ts` calls the global `fetch`
- **THEN** lint reports no violation

### Requirement: Pre-commit lints staged mobile files
`mobile/package.json` SHALL declare a `lint-staged` configuration running `eslint --cache --fix` on staged JS/TS files, picked up by the existing root husky pre-commit hook without changes to the hook itself.

#### Scenario: Staged mobile file with a violation blocks the commit
- **WHEN** a mobile file containing an unfixable lint error is staged and `git commit` runs
- **THEN** the pre-commit hook fails and the commit is aborted

### Requirement: CI gates mobile lint at zero warnings
The `test-mobile` CI job SHALL run mobile lint with `--max-warnings 0` and fail on any error or warning.

#### Scenario: Lint violation fails CI
- **WHEN** a commit introduces a mobile lint error or warning and CI runs
- **THEN** the `test-mobile` job fails at the lint step

### Requirement: The Architecture Book points to the enforcing rules
The Architecture Book SHALL gain a lint/format section recording the rule inventory (what each rule encodes and where it lives), and the data-layer section's prose caveat about un-gated `fetch` SHALL be replaced with a pointer to the enforcing lint rule (per R-1).

#### Scenario: Fetch caveat is resolved
- **WHEN** `.claude/rules/mobile/architecture.md` is read after this change
- **THEN** the data-layer section no longer describes the no-raw-fetch rule as un-encoded prose and instead points to the lint rule

#### Scenario: Rule inventory exists
- **WHEN** the Architecture Book's lint/format section is read
- **THEN** it lists the encoded rules (strings, a11y, navigation, boundaries, fetch, axios) with pointers to their enforcement
