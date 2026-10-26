# 070 — One `TextField` and a product-free `DateTimeField`

## Status

Accepted.

## Context

Text fields were raw React Native `TextInput`s in six feature files, each with its own label,
border color (`backgroundSelected`, `error`, none), fill, a fixed `fontSize: 16` and a
hand-wired `fieldErrorHint`. The personal-events `DateTimeField` imported
`@/features/calendar/data` and a `personalEvents.*` translation key, so it could not live in the
design layer or the gallery (B-7). The phase 5 form slices need one field primitive.

## Decision

- `TextField` lives in `src/design/field/text-field.tsx`, exported from `@/design`. It wraps React
  Native's `TextInput` (the platform's own `UITextField`/`UITextView` and `EditText`): keyboard,
  autofill, selection, IME and accessibility stay native, only the decoration is ours.
- Platform look:

  | State    | iOS (rounded filled field)                                          | Android (Material 3 outlined field)                         |
  | -------- | ------------------------------------------------------------------- | ----------------------------------------------------------- |
  | Rest     | `backgroundElement` fill, hairline `outline` border, `Radii.medium` | transparent, 1dp `outline`, `Radii.small`                   |
  | Focused  | unchanged; the caret and selection (`primary`) carry focus          | 2dp `primary`; padding gives back the width, text stays put |
  | Error    | 1pt `error` border                                                  | `error` border, 2dp when focused                            |
  | Disabled | label, box and helper at `StateOpacity.disabled`, not editable      | same                                                        |

  The label sits above the box on both platforms; there is no floating label. iOS single-line
  fields show the system clear button while editing; Android shows none.

- Input text is the platform body step, follows the OS text size with no cap, and has no fixed
  height: single-line is at least `MinTouchTarget` tall, multiline at least four body lines at the
  current font scale, top-aligned, and Return inserts a newline.
- Props: required `label`; optional `helper`, `error`, `hint`, `disabled`, `multiline`; `ref`
  reaches the native input; keyboard and autofill props pass through. Visual props
  (`placeholderTextColor`, `selectionColor`, `editable`, `blurOnSubmit`, `allowFontScaling`, …)
  are not in the type. `style` is layout-only (`TextFieldLayoutStyle`, the `ButtonLayoutStyle` key
  set) and merges last (ADR 067).
- The field owns its error: it renders `FieldError` below the box and sets the input's hint to
  error, then helper, then its own hint. The helper is hidden from assistive technology. `testID`
  sits on the native input; `-label`, `-helper`, `-error` and `-field` are derived.
  `fieldErrorHint` is not on the `@/design` barrel, so feature code cannot hand-wire a field error.
- `DateTimeField` lives in `src/design/field/date-time-field.tsx` and imports no feature and no
  translation key. The caller passes `label`, the stored instant, the display `zone`, a
  `formatValue` function and `onChange`. It keeps the device-local picker contract (ADR 066) and
  the display-zone conversion; every picker callback goes through one `onPicked` adapter. The
  Android row is named `` `${label}, ${formatValue(value)}` `` and its hint carries the error.
  `useUses24HourClock` lives in `src/hooks/`.
- Lint: `local/no-raw-text-input` reports a value import of `TextInput` from `react-native`
  outside `src/design/` and tests; type-only imports pass. Unmigrated files sit in
  `tools/eslint-rules/raw-text-input-allowlist.js`, pinned by a ceiling test.

Rejected: `@expo/ui` `OutlinedTextField` / SwiftUI `TextField` (uncontrolled, need a measured
`Host` inside scroll views, no `textContentType`/`returnKeyType` passthrough of the same shape,
unproven with Maestro `inputText`); react-native-paper's `TextInput` (a dependency and a Material
look on iOS); a focus border on iOS; a filled M3 field on Android; a floating label (breaks at
font scale 2.0 and duplicates the label for TalkBack); forwarding `style` to the input; a
`variant` prop; a design-layer translation namespace for the date field's name (the only string is
a language-neutral comma join); `no-restricted-imports` for the ratchet (flags `import type`).

## Consequences

Every migrated form changes on device: body-size text, the iOS fill and hairline, the Android
outline and focus border, one multiline height. The iOS SwiftUI date picker takes no hint, so its
error reaches VoiceOver through `FieldError`'s announcement and the text stop after it. TalkBack's
delivery of an `EditText` hint varies by Android version; `FieldError`'s live region still
announces. The inline checklist row editor stays on the allowlist until it becomes a `ListRow`
composition (slice 5.8).

## Revisit if

- A form needs a search field, secure-entry toggle, character counter, input mask or icon slots.
- `@expo/ui` text fields become controlled and work inside React Native scroll views with Maestro.
- The allowlist reaches zero: drop the ignore and delete the allowlist test.
