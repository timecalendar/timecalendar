# Design

## Context

See proposal.md → Why. Current state the approach builds on:

- Raw `TextInput`s outside `src/design/` (value imports from `react-native`):
  `onboarding/ui/institution-name-screen.tsx` (1), `onboarding/ui/programme-screen.tsx` (1),
  `feedback/ui/feedback-screen.tsx` (email, message), `calendar-sources/ui/ical-url-screen.tsx`
  (1), `personal-events/ui/personal-event-fields.tsx` (title, location, description),
  `event-checklists/ui/event-checklist.tsx` (one per checklist row). Inside `src/design/`: the
  `keyboard-safe-action-layout` and `error-surfaces` gallery fixtures. `src/components/chrome/` has
  none (`NativeTextEntryDialog` is SwiftUI/Compose).
- Each call site renders a `ThemedText type="smallBold"` label (some with a `nativeID` and Android
  `accessibilityLabelledBy`), the input with `accessibilityLabel` = label and
  `accessibilityHint={fieldErrorHint(error)}`, a hand-picked border (`backgroundSelected`, `error`
  on error, or none with a `backgroundElement` fill), `fontSize: 16`, `minHeight: 48`, and a
  `FieldError` below. Feedback chains email → message with `blurOnSubmit={false}`.
- Maestro selectors on inputs: `onboarding-programme-input` (tap, `inputText`, then
  `visible: { id, text: "E2E Programme" }`, so the id must sit on the native input whose text is
  the typed value), `ical-url-input` (flow 01 import path), `personal-event-title-input`,
  `personal-event-description-input` (flow 02). `e2e/maestro-selectors.test.ts` checks that each
  selector exists in `src/`.
- `DateTimeField` (`personal-events/ui/date-time-field.tsx`): iOS renders the chrome
  `DateTimePicker` `mode="datetime"` inline; Android renders a `Pressable` row with the formatted
  value and chains a date dialog then a time dialog. It converts instant ↔ display-zone wall clock
  with `toZonedTime`/`fromZonedTime`, formats with `formatShortDateTime` and reads
  `useUses24HourClock` (both from `@/features/calendar/data`), and builds its Android name with
  `personalEvents.form.dateTimeAccessibilityLabel` (`"{{label}}, {{value}}"` in EN and FR). The
  chrome picker takes and reports device-local Dates (ADR 066). `src/design/` may not import a
  feature (B-7, `import-graph.contract.test.ts`).
- The `fix/mobile-e2e-honesty` branch may change `src/components/chrome/` identifiers and the
  `DateTimePicker` `onValueChange` event shape.
- ADR 067: closed variants and a layout-only `style` merged last. ADR 068: family folders, the
  barrel exports primitives only, design modules import each other by leaf path. ADR 069:
  `fieldErrorHint`, `FieldError`'s announcement, `aria-describedby` banned, the
  `no-ad-hoc-status` ratchet shape. ADR 063: platform type ramp (`TypeRamp`). L10:
  every `src/design/**/*.tsx` module has a sibling fixture and test.
- `@expo/ui` 56.0.17 ships Compose `OutlinedTextField` and SwiftUI `TextField`; the app's only
  `@expo/ui` import site is `components/chrome/expo-ui.tsx`.

## Goals / Non-Goals

**Goals:**

- One field primitive whose type makes the common mistakes unrepresentable: no field without a
  visible label, no restyled input, no hand-wired error hint.
- Native-correct look per platform, OS text size honored without clipping, keyboard props intact.
- A product-free `DateTimeField` in the design layer with a gallery fixture, keeping the
  device-local picker contract and the display-zone conversion.
- A ratchet that keeps new screens off raw `TextInput`.

**Non-Goals:**

- A search field, secure-entry UX (show/hide password), a character counter, input masks,
  leading/trailing icon slots, a floating label animation.
- A date-only or time-only `DateTimeField` mode (no consumer).
- The checklist row editor (inline list-row editing belongs with `ListRow`, slices 3.6 / 5.8).
- Changing `src/components/chrome/` or the `DateTimePicker` contract.

## Decisions

### D1. React Native `TextInput` styled per platform, not `@expo/ui` native text fields

`TextField` wraps React Native's `TextInput`. `@expo/ui`'s `OutlinedTextField` (Compose) and
`TextField` (SwiftUI) would be pixel-native, but they are uncontrolled (observable state, not
`value`/`onChangeText`), need a `Host` with measured sizing inside React Native scroll views and
`KeyboardSafeActionLayout`, expose no `textContentType`/`autoComplete`/`returnKeyType` passthrough
of the same shape, map `testID` to Compose test tags that Maestro `inputText` + text matching has
not been proven against, and would be a second `@expo/ui` surface for every form. The React Native
input is the platform's own `UITextField`/`UITextView` and `EditText`, so keyboard, autofill,
selection, IME and accessibility are native; only the decoration is ours.

Rejected: `@expo/ui` text fields (above); react-native-paper's `TextInput` (a new dependency and a
Material look on iOS).

### D2. Platform look

| State    | iOS (rounded filled field)                                                            | Android (Material 3 outlined field)                                               |
| -------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Rest     | fill `backgroundElement`, `StyleSheet.hairlineWidth` `outline` border, `Radii.medium` | transparent fill, 1dp `outline` border, `Radii.small` (M3 extra-small shape, 4dp) |
| Focused  | unchanged border; the caret and selection carry focus (`selectionColor` = `primary`)  | 2dp `primary` border, `cursorColor` and `selectionColor` = `primary`              |
| Error    | 1pt `error` border                                                                    | 2dp `error` focused, 1dp `error` at rest                                          |
| Disabled | whole field (label, box, helper) at `StateOpacity.disabled`; not editable             | same                                                                              |

The label sits above the box on both platforms (`ThemedText type="smallBold"`, the call sites'
current step), helper below in `small` `textSecondary`, the error below as `FieldError`. iOS text
fields show focus through the caret, never a ring (UIKit and SwiftUI fields do the same); the
`outline` hairline keeps the boundary at ≥ 3:1 against `background` and `backgroundElement`
(documented pairs in `src/theme/contrast.ts`), which the fill alone does not reach. Android follows
the M3 outlined field's border states with the label outside the outline: a floating label that
collapses into the border needs a measured animation that breaks at font scale 2.0 and duplicates
the visible label for TalkBack. The border width change is drawn without shifting text: the box
keeps a constant 2dp border width and draws the 1dp state with an inset (implementation detail for
the implementer: padding compensates the width so text never moves on focus).

iOS single-line fields get `clearButtonMode="while-editing"` (the HIG clear button). Android gets
none: M3 makes the trailing clear icon optional and system Android forms do not show one, and a
custom icon button would add a focus stop and an i18n label.

Rejected: a filled M3 field on Android (the outlined field is the form default in Material forms
and matches the `outline` token added for it); a focus border on iOS (not native); a floating label.

### D3. Font scaling and size

Input text uses `TypeRamp.body` `fontSize` (17 pt iOS, 16 sp Android) and follows the OS text size
without a cap; single-line inputs set no `lineHeight` (it misplaces the iOS caret), multiline
inputs use the body `lineHeight`. No fixed `height` anywhere: single-line has
`minHeight: MinTouchTarget` and vertical padding, so it grows with the text; multiline has
`minHeight` = 4 body lines × `fontScale` + vertical padding (`useWindowDimensions().fontScale`),
`textAlignVertical="top"`, and grows with its content (the page scrolls; no inner max height).
Label, helper and error are `ThemedText` and wrap without a line cap. Feedback's 144pt message box
and the 96pt description box converge on the 4-line rule.

### D4. Props: closed visuals, passthrough behavior

```ts
export type TextFieldLayoutStyle = ButtonLayoutStyle; // same key set, ADR 067
export type TextFieldRef = TextInput; // type-only re-export
export type TextFieldProps = Omit<
  TextInputProps,
  | "style"
  | "editable"
  | "multiline"
  | "numberOfLines"
  | "placeholderTextColor"
  | "selectionColor"
  | "cursorColor"
  | "underlineColorAndroid"
  | "textAlignVertical"
  | "clearButtonMode"
  | "allowFontScaling"
  | "maxFontSizeMultiplier"
  | "blurOnSubmit"
  | "accessibilityLabelledBy"
  | "aria-label"
  | "aria-labelledby"
  | "accessibilityState"
  | "aria-disabled"
  | "accessibilityHint"
  | "aria-describedby"
> & {
  label: string;
  helper?: string;
  error?: string | null;
  hint?: string; // the field's own accessibility hint
  disabled?: boolean;
  multiline?: boolean;
  testID?: string;
  style?: StyleProp<TextFieldLayoutStyle>;
  ref?: Ref<TextFieldRef>;
};
```

`accessibilityLabel` stays optional (defaults to `label`, a caller may give a fuller name, the
`Button` rule). Keyboard and text props pass through unchanged: `returnKeyType`, `submitBehavior`,
`onSubmitEditing`, `keyboardType`, `inputMode`, `textContentType`, `autoComplete`,
`autoCapitalize`, `autoCorrect`, `secureTextEntry`, `maxLength`, `placeholder`. Defaults: multiline
`submitBehavior="newline"`; single-line uses React Native's default (`blurAndSubmit`); a field that
moves focus to the next one passes `submitBehavior="submit"`. `blurOnSubmit` (deprecated) is not in
the type. `onFocus`/`onBlur` are composed with the internal focus state, never replaced.

`style` is layout-only, applied to the root container and merged last. The `TextFieldLayoutStyle`
alias of `ButtonLayoutStyle` keeps one layout key set across primitives.

Rejected: forwarding `style` to the input (the drift this slice removes); a `variant` prop (one
field look per platform; nothing asks for a second).

### D5. Semantics and error ownership

- The input is the accessible element: `accessibilityLabel` = `accessibilityLabel ?? label`;
  Android also gets `accessibilityLabelledBy` the label's `nativeID` (from `useId()`), as the call
  sites do today. The visible label is a separate text element, as today, so the Feedback content
  order (caption → labels → fields → errors) is unchanged.
- `accessibilityHint = fieldErrorHint(error, joinHint(helper, hint))`: error first, then the
  helper, then the field's own hint. The helper text is hidden from assistive technology
  (`accessibilityElementsHidden` / `importantForAccessibility="no-hide-descendants"`) because the
  hint carries it, so it is not read twice.
- An error renders `FieldError` with `testID` `${testID}-error`; `FieldError` announces it when it
  appears (iOS queued announcement, Android polite live region) and again only when the message
  changes, so an error that stays while the user types is announced once.
- `disabled` sets `editable={false}` and `accessibilityState={{ disabled: true }}`.
- `fieldErrorHint` moves to `src/design/field/field-error-hint.ts` and leaves the `@/design` barrel:
  after this change only `TextField` and `DateTimeField` call it, so a feature cannot hand-wire a
  field error. `FieldError` stays exported (the group picker shows a selection error with no field).

Rejected: hiding the visible label from assistive technology (changes the Feedback spec's content
order for a marginal gain); folding the helper into the label (renames the field).

### D6. Test ids

`testID` goes on the native input (Maestro taps it, types into it and matches its text). Derived
ids: `${testID}-label`, `${testID}-helper`, `${testID}-error`, `${testID}-field` (the box). Call
sites keep their input ids. The two onboarding error ids (`onboarding-programme-error`,
`onboarding-institution-error`) become `onboarding-programme-input-error` and
`onboarding-institution-input-error`; neither is a Maestro selector, the unit tests update.

### D7. Shared chrome lives in `text-field.tsx`

`text-field.tsx` exports `TextField` and a leaf `FieldChrome` (`label`, `helper`, `error`,
`disabled`, `testID`, `labelNativeID`, `style`, `children`) that lays out label → control → helper
→ error and applies the disabled opacity. `DateTimeField` imports it by leaf path
(`@/design/field/text-field`, ADR 068). `FieldChrome` is not on the barrel. A separate
`field-chrome.tsx` module would need its own fixture and test (L10) for a part that is never used
alone.

### D8. Product-free `DateTimeField`

```ts
export type DateTimeFieldProps = {
  label: string;
  value: Date; // the stored instant
  zone: string; // IANA display zone, already resolved by the caller
  formatValue: (value: Date) => string; // the Android row text and accessible value
  onChange: (value: Date) => void; // the new instant
  error?: string | null;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<TextFieldLayoutStyle>;
};
```

- No `@/features/**` import, no translation key. The caller formats (personal events passes
  `(d) => formatShortDateTime(d, locale, zone, uses24HourClock)`), so the list and the field share
  one format and the design layer carries no date locale table.
- `useUses24HourClock` moves to `src/hooks/use-uses-24-hour-clock.ts` (its test moves with it);
  `@/features/calendar/data` re-exports it so the calendar screen and the list are unchanged. The
  field reads it for the Android time dialog's `is24Hour`.
- The Android accessible name is `` `${label}, ${formatValue(value)}` ``: the existing EN and FR
  template is `"{{label}}, {{value}}"`, so the comma join is the same in both languages and the
  `personalEvents.form.dateTimeAccessibilityLabel` key is removed. The name follows each commit.
- Android row: `FieldChrome` + a `Pressable` row with the same box geometry as an Android
  `TextField` at rest (1dp `outline`, `Radii.small`, `MinTouchTarget`), `accessibilityRole="button"`,
  `accessibilityHint={fieldErrorHint(error)}`, `accessibilityState={{ disabled }}`. iOS:
  `FieldChrome` + the inline compact picker with `disabled`; the SwiftUI picker takes no
  accessibility props, so on iOS the error reaches VoiceOver through `FieldError`'s announcement
  and its text stop (recorded in Risks and the screen-reader inbox note).
- The date-then-time dialog chain, `isPickedDate` (invalid/epoch = cancel), the keyed dialogs and
  `toZonedTime`/`fromZonedTime` move unchanged.
- **Picker isolation**: every picker callback goes through one local adapter,
  `const onPicked = (commit: (date: Date) => void) => (_event: unknown, date: Date) => commit(date)`,
  and `onDismiss` handlers are the only other picker surface. A changed `onValueChange` event shape
  on the chrome seam is an edit to `onPicked` only; the tests drive the picker through the
  suite-wide mock, not the event object.
- testIDs: `testID` on the iOS picker and the Android row (`personal-event-start-picker`,
  `personal-event-end-picker`), `${testID}-label`, `${testID}-error`.

Rejected: a design-level `design.*` i18n namespace (the design layer has no translation runtime
today and the only string is a language-neutral join); `accessibilityValue` for the Android value
(changes the spec'd "label, value" name for an unproven TalkBack reading); a `mode` prop (no
consumer).

### D9. Call-site mapping (testIDs kept)

| File                                           | Fields                                                 | Notes                                                                                                                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onboarding/ui/institution-name-screen.tsx`    | `onboarding-institution-input`                         | `error`, `returnKeyType="next"`, `autoCapitalize="words"`, placeholder kept; `stepStyles.input` deleted                                                                                         |
| `onboarding/ui/programme-screen.tsx`           | `onboarding-programme-input`                           | as above with `autoCapitalize="sentences"`                                                                                                                                                      |
| `feedback/ui/feedback-screen.tsx`              | `feedback-email-input`, `feedback-message-input`       | email: `textContentType="emailAddress"`, `autoComplete="email"`, `submitBehavior="submit"`, Next focuses message through the forwarded `ref`; message: `multiline`; both `disabled={isPending}` |
| `calendar-sources/ui/ical-url-screen.tsx`      | `ical-url-input`                                       | `keyboardType="url"`, `textContentType="URL"`, `disabled={isPending}`, `error`                                                                                                                  |
| `personal-events/ui/personal-event-fields.tsx` | title, location, description inputs; start/end pickers | title `error`; description `multiline`; start/end → design `DateTimeField` with `formatValue`; the range error moves into the end field's `error`                                               |

`event-checklists/ui/event-checklist.tsx` is deferred (allowlist, slice 5.8): each row's input is
an inline list-row editor with no visible label, auto-focus on add and a draft/echo guard; a
labeled form field is the wrong primitive, and the row becomes a `ListRow` composition.

### D10. Lint: `local/no-raw-text-input`, ratcheted

`tools/eslint-rules/no-raw-text-input.js` (registered in `index.js`) reports an `ImportSpecifier`
whose imported name is `TextInput` from `react-native` (aliases included), unless the declaration
is `import type` or the specifier is `type TextInput`. Block `timecalendar/raw-text-input`:
`files: ["src/**/*.tsx"]`, ignores `src/design/**`, `**/*.test.tsx`, and `rawTextInputAllowlist`.
`src/components/chrome/**` is not ignored (it has no `TextInput`; a future native seam that needs
one adds a reviewed ignore). Allowlist after migration:

- `src/features/event-checklists/ui/event-checklist.tsx` — 5.8 (inline checklist row editor)

`raw-text-input-allowlist.test.js` mirrors `ad-hoc-status-allowlist.test.js` (ceiling 1, each entry
exists, each still violates, no duplicates).

Rejected: `no-restricted-imports` `importNames` (core ESLint flags `import type` too, and every
block that re-sets the rule would have to spread the ban, the ADR 069 argument); banning
`TextInput` by JSX name (misses aliased imports).

### D11. Gallery

`src/design/field/text-field.gallery.tsx`, meta `text-field`, title `gallery.textField.title`.
Stories (`text-field--<kebab>`): `Default` (label + placeholder), `Helper`, `Error` (a field whose
error toggles from a `Button`, so the announcement and hint are checkable), `Disabled`,
`Multiline`, `Keyboard` (email field, Next → second field, `submitBehavior="submit"`),
`LongStrings` (`gallery.stress.*` label, helper and error; a caption names whether the accessibility
text size is active through `useIsAccessibilityTextSize()`). Each story holds its own value state.

`src/design/field/date-time-field.gallery.tsx`, meta `date-time-field`: `Default`, `Error`,
`Disabled`, `LongStrings`, all with a fixed 2030-01-02 09:30 device-local value, the device zone,
and an `Intl.DateTimeFormat` `formatValue` (the fixture is product-free too).

The `error-surfaces--field-error` story renders a `TextField` with `error`;
`keyboard-safe-action-layout` fixtures render `TextField`. Colocated `*.gallery.test.tsx` cover the
error toggle and the Android date row commit. New `gallery.textField.*`, `gallery.dateTimeField.*`
FR/EN keys; the `gallery.errorSurfaces.field*` keys stay if the story still uses them. Story order
in the registry: `text-field`, `date-time-field` after `button-row`.

### D12. Coverage and tests

`src/design/field/text-field.tsx`, `src/design/field/date-time-field.tsx` and
`src/design/field/field-error-hint.ts` get the 90% lines/branches tier (the
`status/field-error-hint.ts` key moves). Tests run `describe.each` over iOS and Android with
`usePlatform`; font scale is driven by mocking `useWindowDimensions` (`button-row.test.tsx`); the
date field tests build fixtures in the display zone so they pass under `TZ=Pacific/Kiritimati`,
`Pacific/Pago_Pago` and `America/St_Johns` (`npm run test:timezones`, CI `test-mobile-timezones`).

### D13. ADR 070

`docs/mobile/architecture-book/decisions/070-text-field.md`: D1 (RN input, not `@expo/ui`), D2–D3
(platform look, scaling), D4–D5 (closed visuals, error ownership, `fieldErrorHint` off the barrel),
D8 (product-free date field, caller-supplied format), D10 (ratchet). Re-check open PRs and
`decisions/` for a reserved 070 before writing; take the next free number if taken.

## Risks / Trade-offs

- [The 1dp↔2dp Android border change shifts text] → constant border box with compensating padding;
  a test asserts the content padding + border width sum is equal in both states.
- [iOS date picker cannot carry the error hint] → `FieldError` announces and stays a text stop
  directly after the picker; recorded in the screen-reader inbox note.
- [Visual drift on migrated forms (body size, iOS hairline, Android outline, 4-line multiline)] →
  intended convergence; gallery and the conductor device pass cover each state; copy and selectors
  stay.
- [Maestro `inputText` lands on a wrapper instead of the input] → `testID` is on the native input
  (test asserts the host component type of the `testID` node is `TextInput`), and
  `e2e/maestro-selectors.test.ts` runs.
- [The other branch changes the picker event shape before this merges] → `onPicked` is the single
  edit point; rebase conflict is confined to `date-time-field.tsx`.
- [TalkBack hint delivery on `EditText` varies by Android version] → `FieldError`'s live region
  still announces on appearance; the inbox note asks for a TalkBack check.

## Migration Plan

One PR: primitive + date field + hook move, gallery, call-site migration, lint ratchet, docs.
Rollback is a revert; nothing persists and the app is not in production.
