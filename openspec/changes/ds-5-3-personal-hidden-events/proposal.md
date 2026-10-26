# Hidden events, personal events list and personal event form on the design system (roadmap slice 5.3)

## Why

Roadmap slice 5.3 (`docs/mobile/design-system-audit/migration-roadmap.md:76`, "Card rows →
`ListRow`; destructive button; settings-adjacent") moves the hidden-events screen, the
personal-events list and the personal-event form fully onto `@/design`. Slices 3.1, 3.3, 3.4, 3.6
and 3.7 already swapped the card rows for `ListRow`/`ListSection`, the buttons for `Button`
(Delete is `variant="destructive"`), the inputs for `TextField`/`DateTimeField`, the empty states
for `StatusView` and the list swatch for `ColorDot`. What is left is the part no primitive covered
yet, plus layout the screens still restate:

- The color picker (`personal-events/ui/color-swatch-picker.tsx`) is the last hand-built control in
  the form: a raw `Pressable` per swatch with a literal 48 × 48 size and 3-unit border
  (`:59-63`), a `hitSlop` of `Spacing.two` that overlaps the neighbouring swatch across the
  `Spacing.two` gap (`:35`, `:56`), no press feedback, and its own `Platform.OS` role switch. Its
  label is a hand-composed `View` + `ThemedText type="smallBold"` (`personal-event-fields.tsx:75-83`),
  a deprecated alias that slice 4.3 removes once unused. theming.md defers "the swatch picker's
  48 pt swatches (an input control, 5.3)" to this slice (`theming.md:395`).
- The personal-event editor restates the form rhythm `KeyboardSafeActionLayout` already owns
  (`personal-event-editor.tsx:93-94`, `:121-130`), and `PersonalEventActions` wraps Save/Delete in
  a second padded `View` (`personal-event-actions.tsx:29`, `:61-67`), so the action region gets
  24 pt above and 32 pt below instead of the shared 12/16. The DS 5.2 review flagged this.
- The personal-events list's Add is an in-content tonal button in a list header row
  (`personal-events-list.tsx:51-61`, `:126-132`). ADR 075 makes a primary create action a
  trailing iOS header item and an Android `FloatingAction`, as user calendars and the calendar do.
- The hidden-events screen wraps its empty `StatusView` in a redundant `flex: 1` `View`
  (`hidden-events-screen.tsx:93`, `:176`); `StatusView`'s `section` presentation already grows
  (`status-view.tsx:317-318`). Its header comment narrates slice history.

## What Changes

- **New design primitive `ColorSwatchField`** (`src/design/field/color-swatch-field.tsx`), a
  single-choice color field in the field family: `FieldChrome` label/error/disabled, a wrapping
  row of circular swatches, each `MinTouchTarget` in diameter (44 pt iOS, 48 dp Android) with no
  `hitSlop`, a ring on the selected swatch, platform press feedback (iOS dim, Android ripple),
  Android `radio`/`checked` inside a `radiogroup`, iOS `button`/`selected`. It is product-free:
  the caller passes `options: { color, label }[]` with translated names. Gallery fixture,
  story test, unit test at a 90% per-file tier, registry entry.
- **Personal-event form** renders color through `ColorSwatchField` (swatch testIDs stay
  `color-swatch-<hex>`); `color-swatch-picker.tsx` and its test are deleted; the palette and names
  stay feature data in `color-swatch-presets.ts`. `personal-event-fields.tsx` drops its
  `StyleSheet`, `View`, `Spacing` and `ThemedText` imports.
- **Personal-event editor** passes no layout style to `KeyboardSafeActionLayout`;
  `PersonalEventActions` returns its error notice, Save and Delete without a wrapping `View`.
  Save and Delete stay stacked full width in the footer (no `ButtonRow`).
- **Personal-events list** adds through the ADR 075 create idiom: a trailing iOS header item
  (`plus`) and an Android `FloatingAction` (`add`), one label "Add event" and one testID
  `personal-events-add`; the Android list pads its bottom by `Layout.fabClearance`. The in-content
  button, its header `View` and style are removed. The empty state gains a caption and drops the
  "Tap Add" instruction, which no longer names a visible control.
- **Hidden events** drops the redundant empty-state wrapper and rewrites its header comment to
  the current why.
- **New lint gate `local/no-raw-radio-group`**: an `accessibilityRole`/`role` of `"radiogroup"` or
  `"radio"` (a literal, or either branch of a conditional) in `src/features/**` or `src/app/**`
  is an error pointing to `ColorSwatchField` or a `NativeList` choice. Zero sites after this
  change, so no allowlist.
- **No ratchet row to remove.** None of the in-scope files is on any allowlist under
  `mobile/tools/eslint-rules/`; every ceiling stays as it is (design.md → Context proves it).
- **Architecture Book:** theming.md (Fields, Badges and color dots deferral, Header and floating
  actions, KeyboardSafeActionLayout consumers), accessibility.md (swatches), lint-format.md (new
  rule), features.md, a new ADR for the color swatch field, and a CHANGELOG.md entry dated
  2026-10-26.

Maestro flow `02-personal-event.yaml` and `e2e/maestro-selectors.test.ts` do not change: every
selector they use (`personal-event-title-input`, `-description-input`, `-save`, `-delete`, the
"Add an event" calendar action, the delete alert order) is untouched. Data, validation, CRUD,
hide/un-hide behaviour and Flutter parity do not change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-personal-events-ui`: the list's Add follows the platform create idiom and its empty
  state has a title and caption; the form's color choice renders through the shared color field
  while the palette and names stay feature data; the editor uses the shared form rhythm.
- `mobile-design-system-text-field`: adds the color swatch field to the field family and its
  gallery fixture.
- `mobile-design-system-header-action`: the personal-events list joins the screens that follow
  the create idiom.
- `mobile-root-page-primitives`: the personal-events empty-state scenario names the create
  action through the header/FAB instead of an unchanged in-content Add.
- `mobile-lint-format`: hand-built radio groups in feature and route code are a lint error.

## Impact

- Code (`mobile/`): new `src/design/field/color-swatch-field.tsx` (+ `.test.tsx`,
  `.gallery.tsx`, `.gallery.test.tsx`), `src/design/index.ts`, `src/design/gallery/registry.ts`,
  `jest.config.js` (90% tier); `src/features/personal-events/ui/{personal-event-fields,personal-event-editor,personal-event-actions,personal-events-list}.tsx`
  and their tests; deleted `color-swatch-picker.tsx` and `.test.tsx`;
  `src/features/hidden-events/ui/hidden-events-screen.tsx`; `src/i18n/locales/{en,fr}.json`
  (gallery strings, list empty caption); new `tools/eslint-rules/no-raw-radio-group.js` (+ test),
  `tools/eslint-rules/index.js`, `eslint.config.js`.
- Visual: swatches become circles of the platform touch size (iOS 44 pt instead of 48); the form
  action region loses its doubled padding; Save and Delete sit 8 pt apart; the personal-events
  list gains a header "+" (iOS) or FAB (Android) and loses the in-content Add.
- No dependency, native module, route, data or E2E selector change.
- Out of scope: onboarding (slice 5.1, in flight in parallel), `FieldChrome`'s own `smallBold`
  label and the other legacy-alias sites (slice 4.3), the confirmation hook's `Alert` (native,
  correct as is).
