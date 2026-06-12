# Tasks — add-mobile-lint-format

## 1. Prettier alignment

- [x] 1.1 Replace `mobile/.prettierrc` with a byte-for-byte copy of `web/.prettierrc` (`singleQuote: false`, `trailingComma: "all"`, `semi: false`)
- [x] 1.2 Run `npx prettier --write .` across `mobile/` (src, config files) as a formatting-only change
- [x] 1.3 Run `npm run generate` in `mobile/` and confirm regen is idempotent against the reformatted tree (verified via content hash + `prettier --check`; the `git diff` framing only applies once committed)

## 2. ESLint base config

- [x] 2.1 Add devDependencies to `mobile/`: `eslint`, `eslint-config-expo`, `eslint-plugin-prettier`, `eslint-config-prettier`, `eslint-plugin-i18next`, `eslint-plugin-react-native-a11y`, `@eslint/compat`
- [x] 2.2 Create `mobile/eslint.config.js` extending `eslint-config-expo/flat` + `eslint-plugin-prettier/recommended`; ignore `src/api/generated` from hand-written-code rule blocks (formatting still applies), plus build output (`.expo`, `android`, `ios`, `node_modules`)
- [x] 2.3 Add `.eslintcache` to `mobile/.gitignore`
- [x] 2.4 Verify `npm run lint` (expo lint) picks up the config and runs; fix any baseline errors from `eslint-config-expo` defaults on the current tree

## 3. Architecture rules

- [x] 3.1 Strings: enable `i18next/no-literal-string` as `error` (JSX text + user-facing props `accessibilityLabel`, `accessibilityHint`, `placeholder`; `testID` exempt); add file-level `eslint-disable` comments tagged `TODO(i18n-step-6)` to the existing template screens/components that violate it
- [x] 3.2 A11y: register `eslint-plugin-react-native-a11y` via `fixupPluginRules` from `@eslint/compat` and enable the touchable rules (`has-accessibility-props`, `has-valid-accessibility-role`, `has-accessibility-hint` — finalize the list against the real tree); if the fixup path is broken under ESLint 9, implement the pre-agreed D4 fallback (minimal local rule for touchables) instead and note it in the Book
- [x] 3.3 Navigation: `no-restricted-imports` ban on `@react-navigation/*` with a message naming Expo Router
- [x] 3.4 Boundaries: in the same commented config block — `no-restricted-imports` ban on `../*` patterns (alias-only cross-directory imports) and on `axios`; a scoped block for files outside `src/app/` banning `@/app/*` imports
- [x] 3.5 Raw fetch: `no-restricted-globals` ban on `fetch` with a message directing to the generated client, with an override allowing it in `src/api/mutator.ts`
- [x] 3.6 Verify each rule fires: temporarily introduce one violation per rule (hardcoded string, bare Pressable, `@react-navigation/native` import, `../` import, `axios` import, `@/app/*` import from a component, raw `fetch` in a component) and confirm lint errors, then revert

## 4. Pre-commit and CI

- [x] 4.1 Add `lint-staged` block to `mobile/package.json`: `"*.{js,jsx,ts,tsx}": ["eslint --cache --fix"]`
- [x] 4.2 Verify pre-commit end-to-end: stage a mobile file with an auto-fixable issue (commit succeeds, file fixed) and one with an unfixable error (commit blocked); confirm root `npx lint-staged` resolves mobile's config
- [x] 4.3 Add a lint step to the `test-mobile` job in `.github/workflows/build.yaml` (after typecheck), running the same `npm run lint` entrypoint with `--max-warnings 0`
- [x] 4.4 Confirm the full `test-mobile` job passes locally-equivalent: `npm ci`, codegen drift check, typecheck, lint

## 5. Architecture Book

- [x] 5.1 Add a lint/format section to `.claude/rules/mobile/architecture.md`: rule inventory (strings, a11y, navigation, boundaries, fetch, axios) with what each encodes and a pointer to `eslint.config.js`; note the strings-rule suppressions as debt owned by the i18n step; note the `../*`-ban ↔ alias-pattern dependency and the `globalThis.fetch` evasion caveat
- [x] 5.2 Update the data-layer section: replace the "not yet lint-gated (R-1 debt)" prose caveat on raw fetch with a pointer to the enforcing rule; same for "No axios in mobile"
- [x] 5.3 Update `docs/react-native-migration/01-roadmap/01-foundation.md` step 4 with the done marker and any deviations (e.g. D4 fallback if taken)
