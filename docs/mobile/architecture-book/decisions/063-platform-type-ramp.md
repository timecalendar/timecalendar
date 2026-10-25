# 063 — Resolve the type ramp per platform in the theme layer

## Status

Accepted.

## Context

The theme layer had no typography tokens: `ThemedText` owned a cross-platform scale of 16, 32
and 48 points, far above the iOS `title1` (28) and Material 3 `headlineSmall` (24) a content
heading needs, and features compensated with local heading sizes. The phase 3 primitives
(`Button`, `ListRow`, `StatusView`) need a typed ramp to build on, and iOS text scales best when
each style names its Dynamic Type text style. The audit is in
`docs/mobile/design-system-audit/assessment.md` (issue 1).

## Decision

- `src/theme/typography.ts` defines `TypeRamp`, exported from `@/theme`, keyed by the closed
  `TypeVariant` union `largeTitle`, `title`, `title2`, `sectionTitle`, `headline`, `body`,
  `callout`, `label`, `footnote`, `caption`, `captionSmall`, resolved by `Platform.select` at
  module load.
- iOS follows the HIG text styles at the Large content size, sets `dynamicTypeRamp` on every step
  and no `letterSpacing`. Android follows the Material 3 type scale with its letter spacing. The
  dense calendar steps `caption` / `captionSmall` are identical on both platforms and name no
  Dynamic Type ramp, so the renderer's `maxFontSizeMultiplier` caps keep linear scaling.
- `ThemedText` renders ramp steps through `type`. The heading role per step is an exhaustive
  `Record<TypeVariant, boolean>`: `largeTitle`, `title`, `title2`, `sectionTitle` are headings.
- Text color has a closed `tone` (`primary`, `secondary`, `action`, `destructive`, `onPrimary`)
  with no brand or tertiary member, exclusive with `themeColor` at the type level.
- The names `default`, `small`, `smallBold`, `subtitle` resolve to `body`, `callout`, `label`,
  `sectionTitle`; they and `themeColor` stay until the phase 4.3 codemod.

Rejected: one cross-platform ramp (wrong on at least one platform, and no Dynamic Type curve);
`subtitle → title2` (most `subtitle` sites are section headers); renaming `type` to `variant` now
(two props for one concept until the codemod); a `tertiary` tone on `textTertiary` (a 30%-alpha
decorative tint, about 1.6:1 as text).

## Consequences

Every `ThemedText` without a local size override changes size or weight on at least one
platform; headings shrink sharply. The device pass at the default text size and at the largest
accessibility size, both schemes, both platforms, is the acceptance gate. A rejected size is a
one-row change in `typography.ts` and `typography.test.ts`. A tertiary text tone needs a
contrast-verified token first.

## Revisit if

- The device pass or the accessibility workstream rejects a step.
- React Native or Expo ships platform text styles natively.
- The app adopts a custom font family.
