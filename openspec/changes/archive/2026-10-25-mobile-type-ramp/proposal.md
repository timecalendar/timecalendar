# Platform type ramp in `@/theme`

## Why

The design-system audit ranks the missing type ramp as issue 1
(`docs/mobile/design-system-audit/assessment.md`): `ThemedText` jumps 16 → 32 → 48, its
`title` (48) and `subtitle` (32) sit far above the iOS `title1` (28) / M3 `headlineSmall` (24)
a content heading needs, and features invent five local heading scales or use the 32px
`subtitle` as a section header (`duplication-and-drift.md` §A9). The ramp also lives inside a
component instead of the token layer, so phase 3 primitives (`Button`, `ListRow`, `StatusView`)
have no typography tokens to build on. Roadmap slice 1.5 lands the ramp first; the owner
approved the proposal's numbers as the starting point, with the device check in this slice as
the final word.

## What Changes

- **New `mobile/src/theme/typography.ts`**, re-exported from `@/theme`: a platform-resolved
  `TypeRamp` keyed by the closed `TypeVariant` union `largeTitle`, `title`, `title2`,
  `sectionTitle`, `headline`, `body`, `callout`, `label`, `footnote`, `caption`,
  `captionSmall`. iOS values come from the HIG text styles (Large size) and each iOS step
  carries its UIKit `dynamicTypeRamp`, so text scales on Apple's per-style curve. Android values
  come from the Material 3 type scale, including its letter spacing. `caption` / `captionSmall`
  keep today's dense-tile values on both platforms.
- **`ThemedText`** renders every ramp step through `type`, reading styles from `TypeRamp`
  (the component no longer owns a type scale).
  - The existing names keep compiling as aliases: `default` → `body`, `small` → `callout`,
    `smallBold` → `label`, `subtitle` → `sectionTitle`. `title`, `caption` and `captionSmall`
    are ramp names already. **Rendered sizes change** for `default`, `small`, `smallBold`,
    `subtitle` and `title` (design D4 lists the deltas and the screens to check on device). No
    call site is migrated.
  - New `tone` prop: `"primary" | "secondary" | "action" | "destructive" | "onPrimary"`,
    resolved to `text` / `textSecondary` / `actionText` / `destructive` / `onPrimary`. It has no
    brand-pink member (L9). `tone` and `themeColor` are mutually exclusive at the type level;
    `themeColor` keeps working until phase 4.3.
  - The heading-role contract extends to `largeTitle`, `title`, `title2` and `sectionTitle`
    (and the `subtitle` alias). An exhaustive `Record` over every accepted `type` makes the role
    a compile-time decision for any variant added later.
- **Tests:** `src/theme/typography.test.ts` proves both platform ramps (exact values) under
  `jest.isolateModules`. `themed-text.test.tsx` proves, per accepted `type`, the header role,
  the rendered style and the iOS Dynamic Type ramp, plus tone colors, alias resolution and the
  type-level exclusions. `home-screen.test.tsx` asserts the ramp step instead of 32/44/600.
  `brand-small-text.test.ts` also rejects `type="label"` with `themeColor="primary"`.
- **ADR 063** (roadmap ADR B), `accessibility.md`, `theming.md` and a dated `CHANGELOG.md`
  entry.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-theming`: adds the platform-resolved type ramp requirement and the closed text `tone`
  requirement; the `ThemedText` heading-role contract covers the new heading variants and the
  aliases.
- `mobile-a11y`: the heading-semantics requirement names the ramp's heading steps instead of
  `title` / `subtitle` only.

## Impact

- Code: `mobile/src/theme/typography.ts` (new), `mobile/src/theme/typography.test.ts` (new),
  `mobile/src/theme/index.ts`, `mobile/src/components/themed-text.tsx`,
  `mobile/src/components/themed-text.test.tsx`, `mobile/src/theme/brand-small-text.test.ts`,
  `mobile/src/features/home/ui/home-screen.test.tsx`.
- Visual: every `ThemedText` without an explicit size override changes size or weight on at
  least one platform. Headings shrink sharply (48 → 28, 32 → 20/22). The device pass at default
  text size and at the largest accessibility size, both schemes, iOS and Android, is the
  acceptance gate (run by the conductor, not a task).
- No new dependency and no native change (`dynamicTypeRamp` is a React Native 0.85 `Text`
  prop).
- Docs: `docs/mobile/architecture-book/decisions/063-platform-type-ramp.md` (new),
  `decisions/README.md`, `accessibility.md`, `theming.md`, `CHANGELOG.md`.
