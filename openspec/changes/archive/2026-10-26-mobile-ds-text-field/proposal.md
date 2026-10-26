# Proposal

## Why

Every text field in the app is a raw React Native `TextInput` with its own label, border, fill,
font size and error wiring (`duplication-and-drift.md` §A12): nine inputs in six feature files,
three border colors (`backgroundSelected`, `error`, none), two fills, a fixed `fontSize: 16` that
ignores the platform type ramp, and `fieldErrorHint` wired by hand at each call site (ADR 069).
The personal-events `DateTimeField` cannot join the design system or the gallery because it
imports `@/features/calendar/data` and a `personalEvents.*` key (B-7). Roadmap slice 3.4
(`docs/mobile/design-system-audit/migration-roadmap.md`) gives fields one primitive; the phase 5
form slices (5.2, 5.3) need it.

## What Changes

- **New `TextField` primitive** in `mobile/src/design/field/text-field.tsx`, exported from
  `@/design`:
  - required visible `label` (a placeholder never replaces it), optional `helper`, `error`,
    `disabled`, `multiline`; `ref` forwards to the native input; the remaining `TextInput` props
    (keyboard, `returnKeyType`, `submitBehavior`, `textContentType`, `autoComplete`,
    `autoCapitalize`, `maxLength`, `placeholder`, `onSubmitEditing`, …) pass through.
  - The field owns its error: it renders `FieldError` below the input and folds the error (and
    the helper) into the input's `accessibilityHint` through `fieldErrorHint`, so the error is
    announced once when it appears and read on every focus.
  - Platform look: iOS is a filled rounded field (`backgroundElement` fill, hairline `outline`
    border, the system caret tint as focus, a native clear button while editing on single-line
    fields); Android is a Material 3 outlined field (1dp `outline` at rest, 2dp `primary` focused,
    `error` on error). Text follows the platform body step and the OS font size; the field grows,
    never clips. Disabled dims the whole field and exposes `{ disabled: true }`.
  - `style` is layout-only and merges last (the `Button` rule, ADR 067). Visual props
    (`placeholderTextColor`, `selectionColor`, `editable`, `blurOnSubmit`, `allowFontScaling`, …)
    are not in the type.
- **`DateTimeField` moves to `mobile/src/design/field/date-time-field.tsx`**, product-free: it
  takes `label`, `value` (instant), `zone`, `formatValue`, `onChange`, `error`, `disabled`,
  `testID`, imports nothing from `@/features/**` and no translation key. It shares `TextField`'s
  label, error and disabled chrome. The picker callback is read in one adapter function, so a
  changed `DateTimePicker` event shape is a one-line change. `useUses24HourClock` moves to
  `src/hooks/` so the design layer can read the device clock; `@/features/calendar/data` keeps
  re-exporting it. The `personalEvents.form.dateTimeAccessibilityLabel` key is removed.
- **Call sites migrate** (every Maestro `testID` stays on the native input): onboarding
  institution name and programme, feedback email and message, iCal URL, personal-event title,
  location, description, start and end. `stepStyles.input` and each screen's input styles are
  deleted. `fieldErrorHint` leaves the `@/design` barrel (only fields use it). **BREAKING** for
  in-repo imports of `DateTimeField` from the personal-events feature.
- **Deferred**: the event-checklist row input (an inline list-row editor with no visible label,
  migrated with `ListRow` in slice 5.8); it stays on the lint allowlist.
- **Lint (Principle 1)**: new repo-local rule `local/no-raw-text-input` reports a value import of
  `TextInput` from `react-native` outside `src/design/` and tests; type-only imports pass. The
  one unmigrated file sits in `tools/eslint-rules/raw-text-input-allowlist.js` with a
  pinned-ceiling contract test (ceiling 1). `src/design/field/*.tsx` and
  `src/design/field/field-error-hint.ts` get the 90% lines/branches coverage tier.
- **Gallery**: `text-field.gallery.tsx` (meta `text-field`) and `date-time-field.gallery.tsx`
  (meta `date-time-field`) with a story per state, longest French strings and a caption that names
  the text-size branch; `gallery.textField.*` and `gallery.dateTimeField.*` FR/EN strings. The
  `error-surfaces--field-error` story and the `keyboard-safe-action-layout` raw inputs use
  `TextField`.
- **ADR 070** records the field contract (platform look, label/hint/error ownership, layout-only
  style, rejected `@expo/ui` native text fields, product-free `DateTimeField`, the ratchet).
- **Architecture Book**: `theming.md` (Fields section), `accessibility.md` (field semantics),
  `lint-format.md`, `testing.md`, `features.md` (gallery table, the `DateTimeField` note, migrated
  features), ADR index, dated `CHANGELOG.md` entry.

## Capabilities

### New Capabilities

- `mobile-design-system-text-field`: the shared text-field and date-time-field contract (label,
  helper, error ownership, disabled, multiline, platform look, font scaling, keyboard
  passthrough, layout-only style, product-free date field) and their gallery fixtures.

### Modified Capabilities

- `mobile-personal-events-ui`: the date/time field is the design-layer `DateTimeField`, not a
  feature-owned component; its Android accessible name is composed without a feature key.
- `mobile-a11y`: a field's error is owned by the field primitive and announced once per distinct
  error.
- `mobile-lint-format`: a raw `TextInput` outside the design layer is a ratcheted lint error.

## Impact

- Code (`mobile/`): new `src/design/field/{text-field,date-time-field}{,.test}.tsx` (the shared label/error/disabled
  chrome is a leaf export of `text-field.tsx`),
  `text-field.gallery{,.test}.tsx`, `date-time-field.gallery{,.test}.tsx`; `field-error-hint`
  moves from `src/design/status/` to `src/design/field/`; `src/hooks/use-uses-24-hour-clock{,.test}.ts`
  (moved from `features/calendar/data/device-clock`); deleted
  `src/features/personal-events/ui/date-time-field{,.test}.tsx`; changed `src/design/index.ts`,
  `src/design/gallery/registry.ts`, `src/design/status/error-surfaces.gallery{,.test}.tsx`,
  `src/design/layout/keyboard-safe-action-layout.gallery.tsx`, feature UI under `onboarding`,
  `feedback`, `calendar-sources`, `personal-events`, `calendar/data/index.ts` and their tests;
  `src/i18n/locales/{en,fr}.json`; `eslint.config.js`; new
  `tools/eslint-rules/no-raw-text-input{,.test}.js`, `raw-text-input-allowlist{,.test}.js`;
  `tools/eslint-rules/index.js`; `jest.config.js`.
- Visual: migrated fields change on device (platform body size instead of 16, iOS fill + hairline,
  Android outlined with a focus border, unified multiline height, error border). Copy, routes and
  Maestro selectors stay.
- No new dependency, no native module, no route, no `app.config.ts` or `eas.json` change. Does not
  touch `src/components/chrome/` (another branch owns it).
- Docs: Architecture Book files above, new `decisions/070-text-field.md`, inbox note
  `docs/react-native-migration/inbox/2026-10-26-mobile-ds-text-field-screen-reader-pass.md`.
