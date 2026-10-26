# 077 — Visual-style lint ratchet and design-system import bans

## Status

Accepted.

## Context

The token layer (`src/theme/tokens.ts`) and the type ramp (`src/theme/typography.ts`, ADR
[063](./063-platform-type-ramp.md)) exist, and the Phase 3 primitives are built on them, but
nothing stopped a screen from writing `color: "#fff"`, `fontSize: 17`, `padding: 12`,
`borderRadius: 7` or a legacy `shadowOpacity` beside them. The design-system audit counts these
escapes per screen, and Phase 5 migrates screens one slice at a time; without a gate the count can
grow behind each migration, and a slice has no measurable exit. Principle 1 requires the rule to
be a gate before it is prose. This is roadmap slice 4.1 (audit gates L5, L6, L7, roadmap ADR "E").

The audit's import gates L2–L4 were partly encoded: the deep `@/design/*` ban (ADR
[068](./068-design-layer-barrel-and-gallery-entry.md)), the `SymbolView` ban (ADR
[065](./065-icon-text-scaling.md)) and the raw-touchable, `TextInput` and `ActivityIndicator`
gates. A feature could still deep-import a chrome module, import the app shell, render React
Native `Text` or `Modal`, or load symbol glyphs through `expo-symbols`' other value export and
sub-paths. Raw `Text` and `Modal` have screens left to migrate, so they need the same per-file
exit as the style literals. This is roadmap slice 4.2.

## Decision

- **One rule, five categories.** `local/no-style-literals` reports color, typography,
  legacy-shadow, spacing and radius literals in styles, one boolean option and one message id per
  category (`colorLiteral`, `typographyLiteral`, `legacyShadow`, `spacingLiteral`,
  `radiusLiteral`). It matches style keys anywhere, not style positions, so `.ts` style helpers
  are covered, and sees through casts, branches, signs, literal-only arithmetic, template literals
  and `Platform.select` objects.
- **Scope.** All hand-written `src/**/*.{ts,tsx}`, the calendar renderer and galleries included.
  Exempt: `src/theme/**`, the personal-event swatch presets, `src/test-support/**`, tests and
  generated code. `src/components/chrome/**` is exempt from typography only (it mirrors
  SwiftUI/Compose type). `src/design/**` and chrome are clean, with no allowlist entry.
- **Per-file, per-category ratchet.** `tools/eslint-rules/style-literal-allowlist.js` lists each
  not-yet-migrated file with the categories it still violates and its migrating slice.
  `eslint.config.js` appends one block per entry that turns off only those categories for that
  file. `style-literal-allowlist.test.js` fails on a missing file, a duplicate, an unknown or stale
  category, or a per-category count that differs from its committed ceiling (exact, so the
  ceiling only moves down with the list).
- **Raw primitives, same ratchet.** `local/no-raw-primitive` reports a value import or re-export
  of `Text` (`rawText`, → `ThemedText`) or `Modal` (`rawModal`, → a Router sheet or modal route, or
  `MenuView` from `@/components/chrome`) from `react-native` in `src/features/*/ui/**`, tests out
  (the calendar renderer is outside `ui/`). `raw-primitive-allowlist.js` and its exact-ceiling test
  mirror the style-literal pair, one block per entry turning off only the listed primitives.
  `TextInput`, `ActivityIndicator`, `Button` and the touchables stay with their existing, wider
  gates (`local/no-raw-text-input`, `local/no-ad-hoc-status`, `rawTouchablesImportPath`): each
  name is gated once and has one allowlist.
- **Chrome barrel and app shell.** Two `restrictedImports` flags: `banChromeDeepImports`
  (`^@/components/chrome/`) and `banAppShellImports` (`^@/components/(?!chrome(/|$))`). The
  chrome barrel ban is lifted for `src/design/**` and `src/components/**`; the app-shell ban for
  `src/components/**` and routes (`src/app/**`), which compose the shell. Both have zero offenders
  and no allowlist; the design import-policy test pins them per file class.
- **`expo-symbols` completed.** The `banSymbolView` flag bans `SymbolView`,
  `unstable_getMaterialSymbolSourceAsync` and every `expo-symbols/*` sub-path. It is lifted for
  the `Icon` primitive and the native chrome seam (`src/components/chrome/**`), which wraps native
  symbol APIs at the same level and owns their text scaling. Type imports stay allowed.
- **Every migration slice deletes its files (or the categories it cleans) from both allowlists in
  the same PR** and lowers the matching ceilings.

Rejected:

- A big-bang migration: blocks the Phase 5 ordering and is one unreviewable diff.
- A warning-level rule: `--max-warnings 0` makes it an error anyway, and a warning gate is no gate.
- A whole-file allowlist spread into `ignores`, as the sibling rules do: a file listed for one
  category could regress in the other four.
- Five separate rules: one concept with five inventories and five allowlists.
- A permanent calendar-renderer exemption: it hides real drift; its entries stay visible as debt.
- An allow option read from `context.filename` inside the rule: puts config in the rule.
- One L3 rule for all seven React Native names with the older gates retired: narrows the
  `TextInput` and touchable bans to `ui/`, and splits `no-ad-hoc-status`' shared allowlist.
- Adding `Text`/`Modal` to `no-restricted-imports`: a per-file, per-name exemption would need a
  per-file block restating every seam flag of the file's directory, the silent-drop hazard.
- An allowlist entry for the tabs route's app-shell import: composition, not debt; it would never
  leave.
- Banning `SymbolView` in chrome: the seam wraps native APIs at that level.

## Consequences

- Phase 5 slices have a measurable exit: their allowlist rows disappear.
- A new screen cannot add a style literal; a token without a scale step is named next to its
  family (`ListGeometry.ios.leadingIconTileRadius`, `ListGeometry.headerIcon`,
  `ListGeometry.ios.headerIconRadius`).
- The `ErrorMessage` title moved onto the `sectionTitle` ramp step.
- The renderer's entries remain until a renderer slice (5.11) runs.
- A literal behind a variable, an imported constant or a spread stays a review item.
- The raw-primitive allowlist holds one entry, the calendar header title (5.10); a namespace
  import or `require` of `Text`/`Modal` stays a review item.
- A feature reaches chrome only through `@/components/chrome` and never imports `app-tabs`; a
  chrome wrapper that draws a raw `SymbolView` must declare its text scaling itself.

## Revisit if

- An allowlist reaches zero: drop its per-file block machinery and keep the base blocks.
- A chrome wrapper renders a symbol that does not follow the OS text size.
- `src/components/` gains a second shell module that features legitimately need.
- A category's false positives on data objects need style-context detection.
- A token family is added (extend the key table), or chrome type moves onto the RN ramp (turn
  `typography` on for chrome).
