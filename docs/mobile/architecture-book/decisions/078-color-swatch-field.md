# 078 — `ColorSwatchField` for single-color choice

## Status

Accepted.

## Context

The personal-event form chose its color through a feature-local picker: a raw `Pressable` per
preset, drawn as a 48 × 48 rounded square with a literal 3-unit border, a `hitSlop` of
`Spacing.two` that overlapped the neighbouring swatch across the same gap, no press feedback, its
own `Platform.OS` role switch, and a label hand-composed from a `View` and a legacy `smallBold`
`ThemedText`. It was the last hand-built input control on the personal-event screens, and the
existing lint gates could not see it: `local/no-raw-button` inspects only text children, and
sizes and border widths are outside `local/no-style-literals`. Every other input in the form was
already a field-family primitive (ADR [070](./070-text-field.md)). This is roadmap slice 5.3.

## Decision

- `src/design/field/color-swatch-field.tsx` exports `ColorSwatchField`, the third member of the
  field family. It takes `label`, `options: { color, label }[]`, `value`, `onChange`, `testID`,
  and optional `error`, `disabled` and `style`, and composes `FieldChrome` for the label, error and
  disabled dimming.
- Swatches are `Radii.pill` circles of `MinTouchTarget` diameter with `Spacing.two` gaps and no
  `hitSlop`. The selected swatch draws a 3-unit `text` ring; unselected swatches keep a transparent
  border of the same width. Press feedback follows `Button`: an Android foreground ripple clipped
  to the circle, an iOS dim to `StateOpacity.pressed`.
- The row is a `radiogroup`. Android swatches are `radio` with `checked`; iOS swatches are
  `button` with `selected`, because UIKit has no radio trait. The name is the option label, and the
  testID is `${testID}-${color}`.
- The primitive imports no feature data and no translation key. The personal-events form keeps
  `SWATCH_PRESETS` and `SWATCH_NAME_KEYS` and maps them to translated options.
- `local/no-raw-radio-group` reports an `accessibilityRole` or `role` of `"radiogroup"` or
  `"radio"` (literal, or either branch of a conditional) in `src/features/**` and `src/app/**`
  ([lint-format.md](../lint-format.md) → Radio groups). No file violates it, so it has no
  allowlist.

Rejected:

- Keeping the picker feature-local and only tokenizing it. It would leave a hand-built input with
  its own label composition and platform switch in a feature.
- Building swatches from `ColorDot`. A dot is decorative by contract, hidden from assistive
  technology and capped at 16 (ADR [074](./074-badge-and-color-dot.md)).
- Native pickers. SwiftUI `ColorPicker` is free-form with no Android twin and drops the named
  presets; a `NativeList` choice screen hides eight colors behind a second screen. Flutter's
  dialog is not the parity bar: the outcome (a stored hex) is.
- Rounded squares. Circles match the app's dot vocabulary, so a swatch reads as the color the list
  row shows.
- A `no-restricted-syntax` selector instead of a local rule. Any later block that sets
  `no-restricted-syntax` replaces the list, and a selector reads conditionals poorly.

## Consequences

- iOS swatches shrink from 48 to 44 pt; eight of them wrap to two lines on a phone lane, as before.
- The color label matches Title, Starts and Ends, and gains `${testID}-label` and `-error`.
- `color-swatch-field.test.tsx` is on a 90% per-file coverage tier; the gallery fixture
  (`color-swatch-field--default`, `--error`, `--disabled`, `--long-strings`) runs under the
  registry accessibility matrix.
- A role passed through a variable or spread escapes the lint rule.
- What TalkBack announces and the Android ripple on a device are device evidence
  ([inbox note](../../../react-native-migration/inbox/2026-10-26-mobile-ds-personal-hidden-events-device-pass.md)).

## Revisit if

- A feature needs a free-form color or a palette larger than one wrapping row can hold.
- React Native or UIKit gains a radio trait that VoiceOver announces.
