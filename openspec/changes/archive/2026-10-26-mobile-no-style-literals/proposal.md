# Visual-style lint ratchet: `local/no-style-literals`

## Why

The token layer (`src/theme/`) and the type ramp (`src/theme/typography.ts`) exist, and Phase 3
built the primitives on them, but nothing stops a screen from writing `color: "#fff"`,
`fontSize: 17`, `padding: 12`, `borderRadius: 7` or a legacy `shadowOpacity` next to them. The
design-system audit counts these escapes per screen and Phase 5 migrates the screens one by one;
without a gate the count can grow behind each migration. Principle 1 requires the rule to be a
gate before it is prose. This is roadmap slice 4.1 (proposal gates L5, L6, L7), with ADR "E".

## What Changes

- **New local rule `local/no-style-literals`** (`mobile/tools/eslint-rules/no-style-literals.js`)
  with a RuleTester suite. Five categories, each with its own message id and option:
  - `colors` (L5): a hex, `rgb()`/`rgba()`, `hsl()`/`hsla()` or CSS named color string in a
    `color`, `tintColor` or `*Color` style key or JSX prop. `transparent` passes. `themeColor`
    (a typed token name) is not a color prop.
  - `typography` (L6): a literal `fontSize`, `lineHeight` or `fontWeight`.
  - `shadows` (L7): any `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius` or
    `elevation` style key, and a literal `boxShadow` string.
  - `spacing` (L7): a numeric literal other than 0 or 1 in `padding*`, `margin*`, `gap`,
    `rowGap` or `columnGap`, every per-side and logical key included.
  - `radius` (L7): a numeric literal other than 0 or 1 in `borderRadius` or any per-corner
    radius key.
  The value check sees through `as`/`satisfies`/`!` casts, conditional and logical branches,
  negative numbers, literal-only arithmetic, template literals and `Platform.select` objects.
  Inline style objects, `StyleSheet.create`, style arrays and `.ts` style helpers are all
  covered, because the rule matches keys, not JSX positions.
- **Scope** (`timecalendar/style-literals` block, `src/**/*.{ts,tsx}`): ignored are
  `src/theme/**` (tokens, the ramp and the event fallback color), `color-swatch-presets.ts`,
  `src/test-support/**`, tests and generated code. `src/components/chrome/**` runs with
  `typography` off. The calendar renderer is in scope.
- **Ratchet:** `tools/eslint-rules/style-literal-allowlist.js` lists each not-yet-migrated file
  with the categories it still violates and the slice that migrates it, generated once from the
  rule's own output. `eslint.config.js` turns off only the listed categories for that file.
  `style-literal-allowlist.test.js` fails on a missing file, a duplicate, an unknown category, a
  stale category (the file no longer violates it) or a per-category count above its pinned
  ceiling, so the list only shrinks.
- **Design layer clean:** the two primitive escapes are fixed rather than listed:
  `ErrorMessage`'s title uses the `sectionTitle` ramp step, and the list icon tile and the
  native list header's iOS icon take named radius tokens. The badge gallery's sample event color
  moves into a data constant.
- **Architecture Book:** ADR 077 "Visual-style lint ratchet"; `lint-format.md` gains the rule
  entry and the standing rule that every migration slice deletes its files from the allowlist in
  the same PR; `theming.md` points its token rules at the gate; dated `CHANGELOG.md` entry
  2026-10-26.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-lint-format`: adds the requirement that color, typography, legacy-shadow, spacing and
  radius literals in styles are a ratcheted lint error with a shrink-only per-category allowlist.

## Impact

- Code: `mobile/tools/eslint-rules/{no-style-literals,style-literal-allowlist}{,.test}.js`,
  `mobile/tools/eslint-rules/index.js`, `mobile/eslint.config.js`,
  `mobile/src/theme/tokens.ts`, `mobile/src/design/status/error-surfaces.tsx`,
  `mobile/src/design/list/list-row.tsx`, `mobile/src/components/chrome/native-list-header.tsx`,
  `mobile/src/design/badge/badge.gallery.tsx`.
- No dependency, no native change. Visible change limited to the error title moving onto the
  platform ramp.
- Docs: `docs/mobile/architecture-book/{lint-format,theming}.md`,
  `decisions/077-visual-style-lint-ratchet.md`, `decisions/README.md`, `CHANGELOG.md`,
  `docs/mobile/design-system-audit/migration-roadmap.md` (4.1 status, if the file tracks it).
- Out of scope: slice 4.2 (L2–L4 import bans), slice 4.3 (deprecated `ThemedText` variants),
  screen migrations.
