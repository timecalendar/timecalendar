# Design-system import bans (L2–L4) with a per-file ratchet

## Why

Phase 5 migrates screens onto the design system one slice at a time, and each slice needs a
measurable exit. Slice 4.1 gave style literals that exit (`local/no-style-literals`, ADR 077).
The audit's import gates L2–L4 (design-system-proposal §4) are only partly encoded: the deep
`@/design/*` ban, the `SymbolView` ban and the raw-touchable, `TextInput` and `ActivityIndicator`
bans exist, but a feature can still deep-import a chrome module, import the app shell, render raw
React Native `Text` or `Modal`, or reach `expo-symbols` through its other value exports and
sub-paths. Principle 1 requires each of these to be a gate. This is roadmap slice 4.2.

## What Changes

- **L2, chrome half.** Two new `no-restricted-imports` patterns behind `restrictedImports` flags:
  `^@/components/chrome/` (deep chrome paths; only the `@/components/chrome` barrel is public) and
  `^@/components/(?!chrome(/|$))` (the app shell, `app-tabs`). The chrome-deep ban is lifted for
  `src/design/**` and `src/components/**`; the app-shell ban is lifted for `src/components/**`
  and for routes (`src/app/**`), which compose the shell. The design half
  (`^@/design/(?!gallery(/|$))`, ADR 068) is unchanged, and `@/design/gallery` stays legal for the
  developer feature and fixtures.
- **L3, new primitives only.** New local rule `local/no-raw-primitive` reports value imports
  (aliases and re-exports included, type-only passes) of `Text` and `Modal` from `react-native`,
  one option and one message id per primitive (`rawText` → `ThemedText` from `@/design`,
  `rawModal` → a Router sheet/modal route or `MenuView` from `@/components/chrome`). Scope:
  `src/features/*/ui/**`, tests ignored; the calendar renderer is outside `ui/` and therefore out
  of scope. `TextInput`, `ActivityIndicator`, `Button` and the touchables keep their existing,
  wider gates (`local/no-raw-text-input`, `local/no-ad-hoc-status`, `rawTouchablesImportPath`);
  nothing is reported twice and no name has two allowlists.
- **L3 ratchet.** `tools/eslint-rules/raw-primitive-allowlist.js` lists not-yet-migrated files
  as `{ path, categories }` with their migrating slice; `eslint.config.js` appends one block per
  entry that turns off only the listed categories, as 4.1 does.
  `raw-primitive-allowlist.test.js` pins an exact per-category ceiling and fails on a missing
  file, duplicate, unknown or stale category. Generated from the current tree: one entry,
  `src/features/calendar/ui/calendar-screen/calendar-screen-header.tsx` (`rawText`, slice 5.10).
- **L4 completed.** The `banSymbolView` flag also bans `unstable_getMaterialSymbolSourceAsync`
  from `expo-symbols` and every `expo-symbols/*` sub-path; the `Icon` primitive (`icon-seam`
  block) stays the only exemption. Chrome is not exempted. Type imports stay allowed.
- **Proof.** `design-import-policy.test.js` gains chrome-deep, app-shell and `expo-symbols`
  sub-path assertions per file class (routes, app shell, chrome, design, features, fixtures);
  `no-raw-primitive.test.js` is the RuleTester suite; inject-and-revert for each new ban.
- **Architecture Book.** ADR 077 extended to cover the import bans (no new ADR); `lint-format.md`
  gains the `local/no-raw-primitive` entry and an updated design-layer table and icon entry;
  dated `CHANGELOG.md` entry 2026-10-26.

Offender census (ESLint, current tree): L2 0 in features (the one shell import is a route, which
is exempt); L3 1 new (`Text`), plus the 3 already allowlisted by the existing `TextInput` and
`ActivityIndicator` gates; L4 0. `src/design/**` and `src/components/chrome/**` carry no entry.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-lint-format`: adds the ratcheted `Text`/`Modal` ban for feature screens and widens the
  symbol-icon requirement to every `expo-symbols` value export and sub-path.
- `mobile-design-system-layer`: adds the requirement that the native chrome seam is reached only
  through its barrel and the app shell only from routes.

## Impact

- Code: `mobile/tools/eslint-rules/{no-raw-primitive,raw-primitive-allowlist}{,.test}.js`,
  `mobile/tools/eslint-rules/index.js`, `mobile/tools/eslint-rules/design-import-policy.test.js`,
  `mobile/eslint.config.js`.
- No runtime, dependency or native change; no screen is migrated.
- Docs: `docs/mobile/architecture-book/{lint-format.md,CHANGELOG.md}`,
  `decisions/077-visual-style-lint-ratchet.md`, `decisions/README.md` (row text).
- Out of scope: slice 4.3 (deprecated `ThemedText` variants), Phase 5 screen migrations, folding
  the existing `TextInput`/`ActivityIndicator`/touchable gates into the new rule.
