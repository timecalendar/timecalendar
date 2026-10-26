# 077 — Visual-style lint ratchet

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
- **Every migration slice deletes its files (or the categories it cleans) from the allowlist in
  the same PR** and lowers the matching ceilings.

Rejected:

- A big-bang migration: blocks the Phase 5 ordering and is one unreviewable diff.
- A warning-level rule: `--max-warnings 0` makes it an error anyway, and a warning gate is no gate.
- A whole-file allowlist spread into `ignores`, as the sibling rules do: a file listed for one
  category could regress in the other four.
- Five separate rules: one concept with five inventories and five allowlists.
- A permanent calendar-renderer exemption: it hides real drift; its entries stay visible as debt.
- An allow option read from `context.filename` inside the rule: puts config in the rule.

## Consequences

- Phase 5 slices have a measurable exit: their allowlist rows disappear.
- A new screen cannot add a style literal; a token without a scale step is named next to its
  family (`ListGeometry.ios.leadingIconTileRadius`, `ListGeometry.headerIcon`,
  `ListGeometry.ios.headerIconRadius`).
- The `ErrorMessage` title moved onto the `sectionTitle` ramp step.
- The renderer's entries remain until a renderer slice (5.11) runs.
- A literal behind a variable, an imported constant or a spread stays a review item.

## Revisit if

- The allowlist reaches zero: drop the per-file block machinery and keep the base blocks.
- A category's false positives on data objects need style-context detection.
- A token family is added (extend the key table), or chrome type moves onto the RN ramp (turn
  `typography` on for chrome).
