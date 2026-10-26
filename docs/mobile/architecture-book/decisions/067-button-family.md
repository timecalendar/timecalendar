# 067 — One `Button` family with closed variants and a layout-only style

## Status

Accepted.

## Context

Buttons were local `Pressable`s, each with its own fill, border, label tone, height and press
feedback (`duplication-and-drift.md` §A1–A4). The one shared button, `PrimaryAction`, merged the
caller's `style` first, so a caller could not lay it out. Every later design-system primitive and
every phase 5 screen migration needs a fixed answer to: which visual intents exist, what a caller
may style, where primitives live, and how the backlog of hand-rolled buttons shrinks.

## Decision

- `Button` lives in `src/components/button.tsx` beside `ThemedText` and `Icon`, imported as
  `@/components/button`. The `@/design` barrel is the gallery runtime, which imports every fixture;
  exporting a primitive from it would put the gallery on every screen's module-init path and close
  a cycle through `error-surfaces`.
- `variant` is required and closed. Each variant is a fixed token pairing:

  | Variant       | Fill                | Boundary    | Label         |
  | ------------- | ------------------- | ----------- | ------------- |
  | `filled`      | `primaryStrong`     | none        | `onPrimary`   |
  | `tonal`       | `backgroundElement` | none        | `text`        |
  | `outlined`    | none                | 1 `outline` | `actionText`  |
  | `text`        | none                | none        | `actionText`  |
  | `destructive` | `backgroundElement` | none        | `destructive` |

- `size` is `small`, `medium` (default) or `large`. Every size is at least `MinTouchTarget` tall
  and wide; `large` is `MinTouchTarget + Spacing.two`. Radius `Radii.large` at every size.
- `style` is typed `StyleProp<ButtonLayoutStyle>` (margins, flex, alignment, width, position) and
  merges last. Color, height, padding, radius, border and opacity are not in the type.
- `PrimaryAction` is removed, not aliased: its call sites are `Button variant="filled"`.
- Lint: `react-native`'s `Button` and `Touchable*` are banned imports everywhere.
  `local/no-raw-button` reports a `react-native` `Pressable` with a `button`/`link` role and a
  direct text child. Files not yet migrated sit in `tools/eslint-rules/raw-button-allowlist.js`;
  `raw-button-allowlist.test.js` fails on a stale entry, a missing file, or a list longer than its
  pinned ceiling.

Rejected: `Button` in `src/design/` with a barrel split in the same slice; four variants with a
destructive `tone` flag; a brand-tinted `tonal`; a `PrimaryAction` alias; `no-restricted-syntax`
for the ratchet (it needs binding resolution, and that rule's options are a shared slot every
block must spread); banning `Pressable` outright (rows, tiles and chrome use it).

## Consequences

A screen picks an intent and a size; it cannot recolor or resize a button. Every migrated button
changes on device (radius 16, a neutral 1dp outline, `actionText` labels, the Android ripple).
The rule misses text wrapped in a view and `Animated` pressables by design: it guards accident,
review covers the rest. Each phase 5 slice removes its allowlist entries and lowers the ceiling.

## Revisit if

- The primitives move into `src/design/` behind a split barrel.
- A consumer needs a toggle/selected state or an icon-only button.
- iOS adoption makes the capsule shape the only native-looking button.
- The allowlist reaches zero: drop the rule's ignores and delete the allowlist test.
