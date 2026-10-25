# Design-system token additions and color-scheme / font-scaling lint

## Why

The design-system audit (`docs/mobile/design-system-audit/`) found that the token layer stops
short of what screens need: there is no 12 or 48 spacing step, no touch-target, icon-size,
state-opacity, elevation, motion or FAB-clearance token, and no `outline` or `scrim` color, so
features hand-write `44`/`48` branches, five drifting opacities, `#000000` shadows and an
unverified ≈1.3:1 input stroke. Phase 3 primitives (`Button`, `TextField`, `FloatingAction`,
`Icon`) are built on these tokens, so they land first (roadmap slice 1.4). Two rules the book
already states are still prose only: the single color-scheme seam (C1) and "never disable font
scaling" (accessibility.md lists its guard as deferred debt). Principle 1 requires each to be a
gate (roadmap slice 1.6, proposal gates L1 and L8).

## What Changes

- **Tokens (slice 1.4), additive only, no screen migrated** (`mobile/src/theme/tokens.ts`,
  re-exported from `@/theme`):
  - `Spacing.twoHalf` (12) and `Spacing.fiveHalf` (48), keys inserted in numeric order.
  - `MinTouchTarget` (44 on iOS, 48 elsewhere), `IconSize` (14/17/22/28), `StateOpacity`
    (`pressed` 0.65, `disabled` 0.55), `Elevation.raised` as light/dark CSS `boxShadow` strings,
    `Motion` (150/250/400 ms), `Layout.fabClearance` (96).
  - Color roles `outline` and `scrim`, each with a light and a dark value. `outline` clears the
    WCAG 1.4.11 3:1 non-text bar against `background`, `backgroundElement` and
    `backgroundSelected` in both schemes; `scrim` is a non-text overlay with no contrast
    obligation.
  - The contrast block in `tokens.ts` documents the new pairs, and every documented ratio is the
    value the test computes.
- **Contrast becomes a CI gate:** `src/theme/theme.test.tsx` computes the WCAG relative-luminance
  ratio for every opaque documented pair and fails when a pair drops below its floor (4.5:1 body
  text, 3:1 large text / UI component). This replaces "no runtime/CI contrast checker" for the
  documented pairs. Which token a call site draws on which surface still cannot be checked
  statically.
- **Lint L1:** `no-restricted-imports` bans `useColorScheme` and `Appearance` from
  `react-native` everywhere except `src/hooks/use-color-scheme.ts`. The tree has no violations
  outside the seam. The seam's own test switches to a factory-held mock, so it no longer imports
  the banned binding and no test exemption is needed.
- **Lint L8:** `no-restricted-syntax` bans `allowFontScaling={false}` and the
  `allowFontScaling: false` object-property form (spread props), with no exemption. The tree has
  no hits. `maxFontSizeMultiplier` is not banned (the proposal does not ask for it); the existing
  caps are recorded as calendar-owned exceptions.
- **Inject-and-revert evidence** for both rules goes in
  `openspec/changes/mobile-ds-tokens-lint/evidence.md`.
- **Test hygiene (separate commit):** `calendar-screen.test.tsx`'s accessibility-fixture test
  pins its display zone to `UTC` (the fixture is UTC-anchored) and its calendar clock to the
  probe anchor. With both pinned it passes in any machine zone, on any date (including DST change
  days), with no fake timers.
- **Architecture Book:** `theming.md`, `lint-format.md` and `accessibility.md` updated to the new
  state, plus a dated `CHANGELOG.md` entry for 2026-10-25.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-theming`: adds the interaction/elevation/motion/layout token requirement and the
  `outline`/`scrim` color-role requirement. Contrast pairs move from "documented, not checked"
  to "documented and computed in CI". The single color-scheme source becomes lint-enforced.
- `mobile-lint-format`: adds the color-scheme seam ban (L1) and the font-scaling ban (L8).
- `mobile-a11y`: font scaling leaves the "cannot be encoded" list because it is now a lint gate.

## Impact

- Code: `mobile/src/theme/tokens.ts`, `mobile/src/theme/index.ts`,
  `mobile/src/theme/theme.test.tsx`, `mobile/eslint.config.js`,
  `mobile/src/hooks/use-color-scheme.test.ts`,
  `mobile/src/features/calendar/ui/calendar-screen.test.tsx`.
- No new dependency, no native change, no visual change (nothing consumes the new tokens yet).
- Docs: `docs/mobile/architecture-book/{theming,lint-format,accessibility}.md`, `CHANGELOG.md`.
- No ADR. Roadmap ADRs A–F do not cover slices 1.4 or 1.6, and both slices extend existing seams
  and posture without reversing a decision.
