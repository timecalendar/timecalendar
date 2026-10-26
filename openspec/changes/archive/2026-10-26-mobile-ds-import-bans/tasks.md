# Tasks

Run commands in `mobile/` unless a task says otherwise. Decisions D1 to D6 and the ADR text are in
`design.md`. Use LSP `findReferences` before renaming a symbol. Add no code comment except a
non-obvious why (the rule file's header rationale follows `no-raw-text-input.js:1-6`). Docs
describe the current state only. Tests, specs and the allowlist name no real person (the CI
disclosure scan rejects it); RuleTester fixtures use neutral names (`Row`, `Title`, `Sheet`).
Never build Android on the Mac. Migrate no screen. Land two commits per design → Migration Plan.

## 0. Baseline

- [x] 0.1 Re-run the offender census from design.md → Offender census against the branch head
      (a throwaway ESLint-API script outside the repo, or `npx eslint` with `--rule` overrides).
      Verify: the counts match the table (L2 0 outside routes, L3 `Text` 1, `Modal` 0, L4 0);
      if they differ, use the fresh counts everywhere the design's numbers appear.

## 1. `local/no-raw-primitive` and its RuleTester suite (D1, D2) — commit 1

- [x] 1.1 Create `tools/eslint-rules/no-raw-primitive.js`: header rationale (link lint-format.md
      → Raw primitives and ADR 077; say `TextInput`, `ActivityIndicator`, `Button` and the
      touchables are gated elsewhere; name the namespace-import/`require` blind spot), schema
      `{ text: boolean, modal: boolean }` with `additionalProperties: false`, both default `true`,
      message ids `rawText` and `rawModal` per D2. Visitors: `ImportDeclaration` from
      `"react-native"` (skip `importKind === "type"`; per `ImportSpecifier` skip
      `importKind === "type"`, match `imported.name`), and `ExportNamedDeclaration` with
      `source.value === "react-native"` (skip `exportKind === "type"`, match `local.name` of each
      non-type specifier). Register it in `tools/eslint-rules/index.js` in alphabetical order.
      Verify: `node -e "require('./tools/eslint-rules').rules['no-raw-primitive']"` exits 0.
- [x] 1.2 Create `tools/eslint-rules/no-raw-primitive.test.js` (pattern `no-raw-text-input.test.js`,
      `@typescript-eslint/parser`, JSX on) with the D5 valid and invalid cases. Verify:
      `npx jest tools/eslint-rules/no-raw-primitive` passes, and
      `npx jest tools/eslint-rules/no-raw-primitive --coverage --collectCoverageFrom='tools/eslint-rules/no-raw-primitive.js'`
      shows at least 90% branches.

## 2. Config wiring and the ratchet (D2–D4) — commit 1

- [x] 2.1 L3 wiring in `eslint.config.js`, right after `timecalendar/raw-text-input`: a
      `timecalendar/raw-primitive` block (`files: ["src/features/*/ui/**/*.{ts,tsx}"]`,
      `ignores: ["**/*.test.{ts,tsx}"]`, options `{ text: true, modal: true }`), then one
      `timecalendar/raw-primitive-allowlist` block per `rawPrimitiveAllowlist` entry, built by a
      `map` like `:984-1004`, setting the listed categories' options to `false`. One short
      comment naming ADR 077. Verify:
      `npx eslint --print-config src/features/calendar/ui/calendar-screen/calendar-screen-header.tsx | grep -A4 no-raw-primitive`
      shows `text: false, modal: true`.
- [x] 2.2 Create `tools/eslint-rules/raw-primitive-allowlist.js` from the census (header comment
      modelled on `style-literal-allowlist.js:1-7`): the single entry
      `src/features/calendar/ui/calendar-screen/calendar-screen-header.tsx`, `["rawText"]`,
      trailing comment `// 5.10 calendar header title`. Export `rawPrimitiveAllowlist` and
      `rawPrimitiveCategoryOption`. Verify: `npm run lint` passes with zero warnings and
      `rg -n "src/(design|components)/" tools/eslint-rules/raw-primitive-allowlist.js` finds
      nothing.
- [x] 2.3 Create `tools/eslint-rules/raw-primitive-allowlist.test.js` mirroring
      `style-literal-allowlist.test.js`: `RAW_PRIMITIVE_ALLOWLIST_CEILING = { rawText: 1, rawModal: 0 }`
      with the comment "Raising this needs a reason in review: the allowlist only shrinks.", an
      ESLint instance with only `local/no-raw-primitive` on and both options `true`, and the six
      tests (keys equal the category map, exact per-category count, unique paths, paths exist,
      known categories, no stale `path:category`). Verify:
      `npx jest tools/eslint-rules/raw-primitive-allowlist` passes.
- [x] 2.4 L2 wiring (D3): add `chromeDeepImportPattern` and `appShellImportPattern` beside
      `designDeepImportPattern`, and the flags `banChromeDeepImports` / `banAppShellImports`
      (default `true`) to `restrictedImports`. Set `banChromeDeepImports: false` in `design-home`,
      `design-tests`, `design-fixtures`, `icon-seam`, `chrome-seams` and `chrome-fixtures`. Add a
      `timecalendar/components-home` block (`files: ["src/components/**"]`, placed before
      `chrome-seams`, `restrictedImports([routeEntrypointImportPattern], { banChromeDeepImports: false, banAppShellImports: false })`)
      and a `timecalendar/routes-shell` block (`files: ["src/app/**"]`, after `architecture`,
      `restrictedImports([], { banAppShellImports: false })`). Verify: `npm run lint` passes with
      zero warnings.
- [x] 2.5 L4 wiring (D4): add `unstable_getMaterialSymbolSourceAsync` to
      `symbolViewImportPath.importNames` and a `symbolsDeepImportPattern` (`^expo-symbols/`, same
      message) appended to `patterns` under `banSymbolView`. Lift `banSymbolView` in
      `chrome-seams` and `chrome-fixtures` (D4). Update the `// L9` comment above it if its wording no longer fits. Verify:
      `npm run lint` passes (only `icon.tsx` imports `expo-symbols/androidWeights/regular`).
- [x] 2.6 Extend `tools/eslint-rules/design-import-policy.test.js` (D5): constants for the two L2
      regexes and the deep-symbols regex; per class `chromeDeep` and `appShell` (allowed or not,
      per the D3 table) and assert the deep-symbols pattern and both `expo-symbols` import names
      follow `symbolView`; add the classes `src/app/(tabs)/_layout.tsx` (chromeDeep banned,
      appShell allowed), `src/components/app-tabs.tsx` and `src/components/app-tabs.test.tsx`
      (both allowed), `src/components/chrome/native-list.test.tsx` (chromeDeep allowed, appShell
      banned), one file under `src/features/calendar-sources/ui/` and
      `src/features/developer/ui/gallery-story-screen.tsx` (both banned; gallery allowed for the
      developer file). Verify: `npx jest tools/eslint-rules/design-import-policy` passes.
- [x] 2.7 Commit 1. Verify: `npx tsc --noEmit`, `npm run lint` and `npx jest tools/eslint-rules`
      pass.

## 3. Inject-and-revert proof

- [x] 3.1 Record the output of each for the PR, then revert all:
      (a) `import { Text } from "react-native"` in `src/features/feedback/ui/feedback-screen.tsx`:
      lint fails with `local/no-raw-primitive` `rawText`;
      (b) `import { Modal } from "react-native"` there: `rawModal`;
      (c) `import { Modal } from "react-native"` in `calendar-screen-header.tsx` (listed for
      `rawText` only): lint fails with `rawModal`;
      (d) `import { TextInput } from "react-native"` in `feedback-screen.tsx`: exactly one error,
      from `local/no-raw-text-input`;
      (e) `import { NativeList } from "@/components/chrome/native-list"` in a settings screen and
      in a calendar-sources screen: `no-restricted-imports` names the chrome barrel in both;
      (f) `import AppTabs from "@/components/app-tabs"` in a feature screen: lint fails;
      the existing import in `src/app/(tabs)/_layout.tsx` stays green;
      (g) `import { SymbolView } from "expo-symbols"` in a feature file and in
      `src/design/badge/badge.tsx`, and `import x from "expo-symbols/androidWeights/regular"` in a
      feature file: all fail; the same `SymbolView` import in
      `src/components/chrome/floating-action.tsx` stays green;
      (h) add `{ path: "src/features/feedback/ui/feedback-screen.tsx", categories: ["rawText"] }`
      to the allowlist: `raw-primitive-allowlist.test.js` fails (stale and over the ceiling);
      (i) drop `banChromeDeepImports` from the `chrome-fixtures` block: the policy test fails
      naming a chrome fixture (and lint fails on `registry.ts` if run).
      Verify: `git status` shows no change in those files afterwards.

## 4. CI proof

- [x] 4.1 This change adds no runtime behavior. Its CI proof is `lint-mobile` (`npm run lint`
      through the wired blocks) and `test-mobile` running `no-raw-primitive.test.js`,
      `raw-primitive-allowlist.test.js` and the extended `design-import-policy.test.js`. Verify:
      after push, the PR's mobile jobs in `.github/workflows/ci-mobile.yml` are green and the
      `test-mobile` log lists the three files.

## 5. Local verification

- [x] 5.1 `npx tsc --noEmit` passes.
- [x] 5.2 `npm run lint` passes with zero warnings.
- [x] 5.3 `npm test -- --coverage` passes, including the 90% per-file branch tiers,
      `tools/eslint-rules`, the design import-policy and import-graph contracts, the shell
      contract and FR/EN parity. Record suite and test counts for the PR.
- [x] 5.4 From the repo root, `openspec validate mobile-ds-import-bans` passes; grep the change
      folder, the new rule, its tests and the allowlist for developer or account names. Verify:
      none found.

## 6. Architecture Book (`docs/mobile/architecture-book/`) — commit 2

- [x] 6.1 `lint-format.md`: add `timecalendar/components-home`, `timecalendar/routes-shell`,
      `timecalendar/raw-primitive` and `timecalendar/raw-primitive-allowlist` to the block list at
      the top. In **Design layer**, add the two patterns and flags and extend the table with
      `@/components/chrome/…` and app-shell columns plus rows for routes and `src/components/`
      (D3), and mention the policy test's new columns. In **L9 — icons**, name both import names,
      the `expo-symbols/*` sub-path ban, and the chrome exemption (D4). Add a
      **Raw primitives — `local/no-raw-primitive`** entry after **Fields**: names, messages,
      scope (`src/features/*/ui/**`, tests out, renderer outside `ui/`), which gate owns
      `TextInput`, `ActivityIndicator`, `Button` and the touchables (D1), the per-category
      allowlist and its exact-ceiling test, the caveats, and the 3.1 inject-and-revert proof.
      Restate that every migration slice deletes its files from the allowlist in the same PR.
      Verify: `rg -n "no-raw-primitive|raw-primitive-allowlist|banChromeDeepImports|banAppShellImports|expo-symbols/" docs/mobile/architecture-book/lint-format.md`
      shows each.
- [x] 6.2 `decisions/077-visual-style-lint-ratchet.md`: write the 4.2 decisions into Context,
      Decision, Rejected, Consequences and Revisit if, from design.md → Decision (current state,
      no "amended" narration). Widen the `decisions/README.md` row 077 text to cover the import
      bans. Verify: `rg -n "no-raw-primitive" docs/mobile/architecture-book/decisions/077-visual-style-lint-ratchet.md`
      matches and the README table still renders (column count unchanged).
- [x] 6.3 `CHANGELOG.md`: add `## 2026-10-26 — Design-system import bans` above the current first
      entry, with bullets for the chrome barrel and app-shell bans (lint-format.md → Design layer),
      `local/no-raw-primitive` and its one-entry allowlist (lint-format.md → Raw primitives), the
      completed `expo-symbols` ban (lint-format.md → L9), each linking ADR 077. Verify: the entry
      is first and every link resolves.
- [x] 6.4 `docs/mobile/design-system-audit/migration-roadmap.md`: leave it unchanged unless it
      tracks slice status (it does not at 0242ab41). Verify: no diff, or a diff that follows the
      file's existing convention.
- [x] 6.5 Commit 2. Verify: `npm run lint`, `npm test -- --coverage` and
      `openspec validate mobile-ds-import-bans` still pass.
