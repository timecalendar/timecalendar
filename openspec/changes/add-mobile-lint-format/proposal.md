# Lint, format, and first custom ESLint rules for mobile

## Why

`mobile/` currently has **no linting at all** — `package.json` declares `"lint": "expo lint"` but there is no ESLint config and no eslint devDependency, and its Prettier config (`singleQuote: true`) diverges from the shared web/server style. Phase 1 step 4 of the foundation roadmap makes lint/format a wired, CI-enforced system *before* features exist, because per R-1 every architectural rule that can be encoded must be — and the encoding machinery is what this step builds. The Architecture Book also explicitly assigns this step an R-1 debt: hand-written `fetch` calls bypassing the generated client are currently only a prose rule.

## What Changes

- **ESLint 9 flat config** for `mobile/` on top of `eslint-config-expo/flat`, with `npx expo lint` (and a plain `eslint .`-equivalent for CI) passing clean.
- **Prettier aligned to web/server** (`singleQuote: false, trailingComma: "all", semi: false`, duplicated into `mobile/.prettierrc`), with the whole mobile tree reformatted — including a regeneration of the committed Orval client, since Orval pipes its output through Prettier and the CI drift gate diffs it.
- **First architecture rules, encoded** (plugins where they exist, custom only for gaps):
  - **No hardcoded strings** in JSX — live as `error` from day one; existing template screens get explicit file-level suppressions (they die when the splash screen lands; i18n in step 6 provides the fix path).
  - **A11y props on touchables** — accessibility lint rules on touchable/pressable elements.
  - **No direct `@react-navigation/*` imports** — Expo Router is the only navigation API.
  - **Import boundaries for today's layout** — routes under `src/app/` are not importable as modules, `src/api/generated/` internals are codegen-owned (generated files exempt from hand-written-code rules, hand-written code constrained in what it may deep-import), no parent-relative imports (matching the server's `no-restricted-imports` on `../*`).
  - **No raw `fetch`** outside `src/api/mutator.ts` — pays down the R-1 debt named in the Architecture Book's data-layer section.
- **Pre-commit**: `mobile/` gets its own `lint-staged` block (eslint --fix on staged files), picked up by the existing root husky hook, matching the web/server pattern.
- **CI**: the existing `test-mobile` job gains a lint step that fails on any warning or error.
- **Architecture Book updated**: the data-layer prose caveat about un-gated `fetch` is replaced with a pointer to the enforcing rule; a lint/format section records the rule inventory and what each rule encodes.

## Capabilities

### New Capabilities

- `mobile-lint-format`: ESLint + Prettier for the mobile app — config baseline, the custom/architecture rules and their enforcement scope, format alignment with web/server, pre-commit integration, and the CI gate.

### Modified Capabilities

<!-- none — the mobile-architecture-book spec governs the book's location and seed content, which don't change; adding a lint section is normal book evolution. mobile-api-client requirements are unchanged (the regenerated client is a formatting-only refresh). -->

## Impact

- `mobile/`: new `eslint.config.js`, eslint devDependencies, `.prettierrc` change, `lint-staged` block, repo-wide reformat of `mobile/src/` + config files, regenerated `src/api/generated/`.
- `.github/workflows/build.yaml`: lint step added to `test-mobile`.
- `.claude/rules/mobile/architecture.md`: lint/format section added; raw-fetch caveat resolved.
- No runtime behavior changes; no server/web/app code touched.
