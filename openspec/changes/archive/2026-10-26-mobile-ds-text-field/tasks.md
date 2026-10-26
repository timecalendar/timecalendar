# Tasks

All commands run in `mobile/` unless stated. Decisions are D1–D13 in `design.md`. Await every RNTL
14 helper (`render`, `fireEvent`); no fake timers; `usePlatform` from `@/test-support/platform` for
platform branches; mock the scheme through `@/hooks/use-color-scheme`; drive the font scale by
mocking `useWindowDimensions` (see `button-row.test.tsx`). Keep every Maestro `testID` on the
native input. Do not touch `src/components/chrome/` (another branch owns it). No code comments
except a non-obvious why. Docs describe the current state only.

## 1. Hook move and field-error hint

- [x] 1.1 Move `src/features/calendar/data/device-clock.ts` and its test to
      `src/hooks/use-uses-24-hour-clock.ts` / `.test.ts` (same export `useUses24HourClock`); make
      `src/features/calendar/data/index.ts` re-export it from `@/hooks/use-uses-24-hour-clock` so
      `calendar-screen.tsx` and `personal-events-list.tsx` are unchanged. Verify:
      `npx jest src/hooks src/features/calendar/data` and `npx tsc --noEmit`.
- [x] 1.2 Move `src/design/status/field-error-hint{,.test}.ts` to `src/design/field/`; remove
      `fieldErrorHint` from `src/design/index.ts`; update `error-surfaces.gallery.tsx` to import it
      by leaf path until §3.3 replaces that story; move the `jest.config.js` 90% key to
      `src/design/field/field-error-hint.ts` (update `jest.config.test.ts` if it pins keys).
      Verify: `npx tsc --noEmit` lists only the feature call sites §4 migrates.

## 2. `TextField` and `DateTimeField` primitives

- [x] 2.1 Create `src/design/field/text-field.tsx` exporting `TextField`, `TextFieldProps`,
      `TextFieldLayoutStyle`, `TextFieldRef` (type-only `TextInput`) and the leaf `FieldChrome`
      per D2–D7: required `label` (`ThemedText type="smallBold"`, `nativeID` from `useId()`,
      `${testID}-label`); input with `testID`, `accessibilityLabel ?? label`, Android
      `accessibilityLabelledBy`, `accessibilityHint = fieldErrorHint(error, helper/hint joined)`,
      `accessibilityState={{ disabled }}`, `editable={!disabled}`, `TypeRamp.body` font size (line
      height on multiline only), no fixed `height`, `minHeight: MinTouchTarget` (single-line) or 4
      body lines × `fontScale` + padding (multiline, `textAlignVertical="top"`,
      `submitBehavior="newline"`); platform box per D2 (iOS fill `backgroundElement` + hairline
      `outline`, `Radii.medium`, `clearButtonMode="while-editing"` single-line, `selectionColor`
      `primary`; Android transparent + constant 2dp border box drawing 1dp `outline` / 2dp
      `primary` focused / `error`, `Radii.small`, `cursorColor` + `selectionColor` `primary`,
      padding compensates so text never moves); focus state from composed `onFocus`/`onBlur`
      (caller handlers still called); helper `small` `textSecondary` hidden from assistive
      technology (`${testID}-helper`); `FieldError` (`${testID}-error`) when `error`; disabled =
      `StateOpacity.disabled` on the chrome; `ref` forwarded to the input; `style` layout-only,
      flattened onto the root and merged last. Imports by leaf path (ADR 068). Verify:
      `npx tsc --noEmit`.
- [x] 2.2 Create `src/design/field/text-field.test.tsx`, `describe.each` over iOS and Android:
      label visible and `${testID}-label`; input name = label, fuller `accessibilityLabel` wins;
      the `testID` node is the host `TextInput` (Maestro contract); hint = error, error + helper,
      error + helper + hint, helper alone, `undefined`; helper hidden from assistive technology
      (`includeHiddenElements`); error announced once on appearance (iOS
      `announceForAccessibilityWithOptions` once), not again while typing with the same error,
      again on a new message; Android live region on the error; error border token per platform;
      Android focus border `primary` 2dp and equal content offset focused/unfocused; iOS
      `clearButtonMode` on single-line only; disabled → `editable` false, `{ disabled: true }`,
      opacity; multiline `submitBehavior` `newline`, `textAlignVertical` top, minHeight larger at
      font scale 2.0 than 1.0; no `height` style at 1.0 and 2.0; passthrough of `returnKeyType`,
      `submitBehavior`, `textContentType`, `autoComplete`, `keyboardType`, `maxLength`; caller
      `onFocus`/`onBlur` called; `ref.focus()` reaches the input; `style={{ marginTop: 99 }}` wins
      over the root default (merge order); `// @ts-expect-error` on a missing `label`,
      `style={{ backgroundColor: "red" }}`, `placeholderTextColor`, `blurOnSubmit`, `editable`.
      Verify:
      `npx jest src/design/field/text-field.test.tsx --coverage --collectCoverageFrom=src/design/field/text-field.tsx`
      ≥ 90% lines and branches.
- [x] 2.3 Create `src/design/field/date-time-field.tsx` per D8 from
      `src/features/personal-events/ui/date-time-field.tsx`: props `label`, `value`, `zone`,
      `formatValue`, `onChange`, `error`, `disabled`, `testID`, `style`; `FieldChrome` around the
      control; no `@/features/**` import, no `t()`; `useUses24HourClock` from
      `@/hooks/use-uses-24-hour-clock`; Android row `accessibilityLabel` =
      `` `${label}, ${formatValue(value)}` ``, `accessibilityHint={fieldErrorHint(error)}`,
      `accessibilityState={{ disabled }}`, Android `TextField` rest geometry; iOS picker with
      `disabled`; every picker callback through the single `onPicked` adapter; date→time chain,
      keyed dialogs, `isPickedDate` and `toZonedTime`/`fromZonedTime` unchanged. Verify:
      `npx tsc --noEmit`.
- [x] 2.4 Move `src/features/personal-events/ui/date-time-field.test.tsx` to
      `src/design/field/date-time-field.test.tsx` (keep its `@expo/ui` mock), replacing
      `formatShortDateTime` with a test-local `formatValue` built with `formatInTimeZone`; keep
      every existing case (two-step commit, cancel at either step, invalid/epoch confirm,
      display-zone round trip ahead of and behind UTC, 12/24-hour `is24Hour`, name follows
      commit) and add: label visible, name = "label, value", error text + Android hint, iOS error
      text with no hint prop on the picker, disabled row ignores presses and exposes
      `{ disabled: true }`, iOS picker receives `disabled`, layout `style` merges last, no import
      of `@/features` (assert by reading the module source, as `import-graph.contract.test.ts`
      does). Verify:
      `npx jest src/design/field/date-time-field.test.tsx --coverage --collectCoverageFrom=src/design/field/date-time-field.tsx`
      ≥ 90% lines and branches, then `npm run test:timezones -- src/design/field` passes in all
      three zones.
- [x] 2.5 Export `TextField`, `TextFieldProps`, `TextFieldLayoutStyle`, `TextFieldRef`,
      `DateTimeField`, `DateTimeFieldProps` from `src/design/index.ts` (not `FieldChrome`, not
      `fieldErrorHint`). Add `src/design/field/text-field.tsx` and
      `src/design/field/date-time-field.tsx` at `{ lines: 90, branches: 90 }` in `jest.config.js`.
      Verify: `npx jest jest.config.test.ts src/design/import-graph.contract.test.ts`.

## 3. Gallery fixtures and strings

- [x] 3.1 Add `gallery.textField.*` and `gallery.dateTimeField.*` to `src/i18n/locales/en.json`
      and `fr.json` (meta titles, one name per story, labels, helpers, errors, placeholder, the
      error toggle label, the accessibility-size captions). Remove
      `personalEvents.form.dateTimeAccessibilityLabel` from both. Verify: `npx jest src/i18n`
      (FR/EN parity).
- [x] 3.2 Create `src/design/field/text-field.gallery.tsx` (meta `text-field`; stories `Default`,
      `Helper`, `Error`, `Disabled`, `Multiline`, `Keyboard`, `LongStrings` per D11; testIDs
      `gallery-text-field-*`; each story holds its value; `LongStrings` uses `gallery.stress.*` and
      captions `useIsAccessibilityTextSize()`) and `text-field.gallery.test.tsx` (error toggle
      shows/clears the error and the hint; Keyboard Next focuses the second field; long-strings
      caption flips at font scale 2.0). Create `src/design/field/date-time-field.gallery.tsx` (meta
      `date-time-field`; `Default`, `Error`, `Disabled`, `LongStrings`; fixed device-local
      2030-01-02 09:30, device zone, `Intl.DateTimeFormat` formatter) and
      `date-time-field.gallery.test.tsx` (Android row commit through both dialogs updates the row;
      disabled ignores presses). Verify: `npx jest src/design/field`.
- [x] 3.3 `error-surfaces.gallery.tsx`: the `FieldError` story renders a `TextField` with `error`
      (no raw `TextInput`, no `fieldErrorHint` import); update `error-surfaces.gallery.test.tsx`.
      `keyboard-safe-action-layout.gallery.tsx`: render `TextField` instead of raw `TextInput`
      (labels from its existing keys). Verify: `npx jest src/design/status src/design/layout`.
- [x] 3.4 Register `text-field` and `date-time-field` in `src/design/gallery/registry.ts` after
      `buttonRow`; add their story ids to `src/features/developer/ui/gallery-index-screen.test.tsx`.
      Verify: `npx jest src/design src/features/developer` (registry matrix light/dark ×
      iOS/Android with a name on every control, `known-a11y-violations.ts` unchanged, L10
      fixture-coverage contract passes).

## 4. Migrate call sites (D9, testIDs kept)

- [x] 4.1 Onboarding: `institution-name-screen.tsx` and `programme-screen.tsx` render `TextField`
      (`onboarding-institution-input` / `onboarding-programme-input`, label, placeholder,
      `error={errorKey && t(errorKey)}`, `autoCapitalize`, `autoCorrect={false}`,
      `returnKeyType="next"`, `onSubmitEditing={submit}`); delete the label `ThemedText`, the
      `FieldError`, `fieldErrorHint` and `stepStyles.input`. Update both tests (error id
      `onboarding-*-input-error`, hint carries the error and loses it on typing). Verify:
      `npx jest src/features/onboarding`.
- [x] 4.2 Feedback: email and message → `TextField` (`feedback-email-input`: `keyboardType`,
      `inputMode`, `textContentType="emailAddress"`, `autoComplete="email"`,
      `returnKeyType="next"`, `submitBehavior="submit"`, Next focuses the message through
      `useRef<TextFieldRef>`; `feedback-message-input`: `multiline`; both `error`,
      `disabled={isPending}`); delete the input styles and `FieldError`/`fieldErrorHint` imports.
      Update `feedback-screen.test.tsx` (Next focuses message; disabled while pending; hints).
      Verify: `npx jest src/features/feedback`.
- [x] 4.3 iCal URL: `ical-url-screen.tsx` → `TextField` (`ical-url-input`, `keyboardType="url"`,
      `inputMode="url"`, `textContentType="URL"`, `autoCapitalize="none"`, `autoCorrect={false}`,
      `disabled={isPending}`, `error`); delete the label, input style and `FieldError`. Update its
      test. Verify: `npx jest src/features/calendar-sources`.
- [x] 4.4 Personal events: `personal-event-fields.tsx` → `TextField` for title (`error`,
      `returnKeyType="done"`, `onSubmitEditing`), location, description (`multiline`), and the
      design `DateTimeField` for start/end (`formatValue={(d) => formatShortDateTime(d, locale,
    displayZone, uses24HourClock)}` with `useUses24HourClock()` from
      `@/features/calendar/data`; the end field takes `error={errors.range && t(errors.range)}`);
      delete `src/features/personal-events/ui/date-time-field.tsx`, the label `ThemedText`s
      around migrated fields and the input styles. Update `personal-event-form-screen.test.tsx`
      and `personal-event-fields` tests (range error under Ends; `personal-event-start-picker` row
      text). Verify: `npx jest src/features/personal-events`.
- [x] 4.5 `grep -rn "fieldErrorHint\|dateTimeAccessibilityLabel\|personal-events/ui/date-time-field" src`
      returns only `src/design/field/`; `grep -rn "from \"react-native\"" src/features | grep TextInput`
      lists only `event-checklist.tsx`; run `npx jest e2e/maestro-selectors.test.ts`. Verify: all
      three clean.

## 5. Lint (Principle 1)

- [x] 5.1 Create `tools/eslint-rules/no-raw-text-input.js` (D10, message pointing to `TextField`
      from `@/design`, ADR 070, `lint-format.md` → Fields), register it in
      `tools/eslint-rules/index.js`, and `no-raw-text-input.test.js` (RuleTester, TSX parser).
      Invalid: `import { TextInput } from "react-native"`; `import { TextInput as Input }`;
      `import { View, TextInput }`. Valid: `import type { TextInput } from "react-native"`;
      `import { type TextInput } from "react-native"`; `TextInput` from another module. Verify:
      `npx jest tools/eslint-rules/no-raw-text-input.test.js`.
- [x] 5.2 Add block `timecalendar/raw-text-input` to `eslint.config.js` (D10 files/ignores) and
      create `tools/eslint-rules/raw-text-input-allowlist.js` by running lint with an empty list
      after §4 (expected: only `src/features/event-checklists/ui/event-checklist.tsx`, slice 5.8;
      any other hit means §4 is incomplete). Create `raw-text-input-allowlist.test.js` mirroring
      `ad-hoc-status-allowlist.test.js` with `RAW_TEXT_INPUT_ALLOWLIST_CEILING = 1`.
      Inject-and-revert: add a migrated file to the list (test names it stale); add a
      `TextInput` value import to `src/features/feedback/ui/feedback-screen.tsx`
      (`npm run lint` fails); revert both. Verify: `npx jest tools/eslint-rules` and
      `npm run lint`.

## 6. ADR, Architecture Book, inbox

- [x] 6.1 Write `docs/mobile/architecture-book/decisions/070-text-field.md` from `TEMPLATE.md` per
      D13 (re-check open PRs and `decisions/` for a reserved 070 first; use the next free number
      and update every reference if taken); add its row to `decisions/README.md`.
- [x] 6.2 `theming.md`: new section "Fields — `TextField` and `DateTimeField` (`src/design/field/`)"
      after Status: the platform look table (D2), font scaling (D3), closed visual props and
      layout-only style, helper/error placement, the product-free date field and its caller
      formatter, the gates (tests, coverage tiers, `local/no-raw-text-input`, gallery stories),
      link to ADR 070.
- [x] 6.3 `accessibility.md`: a "Fields — encoded in `TextField`" section (label stop then field,
      name = label, hint = error → helper → own hint, helper hidden, error announced once,
      disabled state, iOS picker limitation); rewrite the Accessible async status field-error
      bullet to point at the field primitives; rewrite the Android date/time bullets to name
      `src/design/field/date-time-field.test.tsx` and the `src/hooks/use-uses-24-hour-clock.test.ts`
      path. Proof in CI names `text-field.test.tsx`, `date-time-field.test.tsx`,
      `field-error-hint.test.ts`.
- [x] 6.4 `lint-format.md` rule inventory: `local/no-raw-text-input` with its allowlist, ceiling
      test and what it allows (type imports, `src/design/**`, tests). `testing.md`: the field
      coverage tiers, the allowlist contract test, the date field under the time-zone matrix.
      `features.md` → Design system gallery: `text-field` and `date-time-field` rows, the
      `error-surfaces` field-error story, and the `DateTimeField` bullet rewritten to the current
      state (design layer, caller formatter, fixture); feature entries for Onboarding, Feedback,
      Calendar sources (iCal URL) and Personal events name `TextField`/`DateTimeField`.
      `architecture.md` only if its structure bullets list the design folders.
- [x] 6.5 `CHANGELOG.md`: `## 2026-10-26 — TextField` at the top (primitive, platform look,
      error ownership and `fieldErrorHint` off the barrel, `DateTimeField` in the design layer,
      `useUses24HourClock` in `src/hooks/`, `local/no-raw-text-input` ratchet, gallery, ADR 070).
      Verify: `npx prettier --check` on the changed docs; relative links resolve.
- [x] 6.6 Keep `docs/react-native-migration/inbox/2026-10-26-mobile-ds-text-field-screen-reader-pass.md`
      (written by the planner) accurate to the final story ids. In
      `docs/react-native-migration/inbox/2026-10-26-mobile-ds-status-view-screen-reader-pass.md`
      item 4 still names `error-surfaces--field-error`; keep the id valid. Verify: every story id
      named in both notes exists in the registry test.

## 7. Local verification

- [x] 7.1 `npx tsc --noEmit` passes.
- [x] 7.2 `npm run lint` passes with zero warnings.
- [x] 7.3 `npm test -- --coverage` passes, including the `text-field.tsx`, `date-time-field.tsx`
      and `field-error-hint.ts` 90% tiers, `src/hooks/**` 90%, the registry matrix, the L10
      fixture contract, the import-graph contract and all three allowlist tests.
- [x] 7.4 `npm run test:timezones` passes (`Pacific/Kiritimati`, `Pacific/Pago_Pago`,
      `America/St_Johns`).
- [x] 7.5 `git diff --stat origin/main`: no `package.json`, `app.config.ts`, `eas.json`, native,
      route or `src/components/chrome/` change.

## 8. Device pass and CI

Gallery story ids for the conductor (`timecalendar-dev://developer/gallery/<id>`):
`text-field--default`, `text-field--helper`, `text-field--error`, `text-field--disabled`,
`text-field--multiline`, `text-field--keyboard`, `text-field--long-strings`,
`date-time-field--default`, `date-time-field--error`, `date-time-field--disabled`,
`date-time-field--long-strings`, `error-surfaces--field-error`,
`keyboard-safe-action-layout--default`. Check every `long-strings` story at
`accessibility-extra-extra-extra-large` (iOS) and font scale 2.0 (Android): nothing clips, the
field grows.

- [x] 8.1 iOS simulator pass (conductor): the stories above in light and dark at the default size
      and AX5 (reopen after a size change); migrated screens: institution name and programme
      (error state), feedback (Next, disabled while sending), iCal URL (error, pending), personal
      event form (title error, range error under Ends, start/end pickers). Record findings in the
      PR; fix defects in this branch.
- [ ] 8.2 Android pass (conductor, Windows host via `ssh pc`, never on the Mac): same stories and
      screens, light/dark, font scale 1.0 and 2.0, focus border and no text shift on focus, the
      date then time dialogs. Record findings in the PR.
- [ ] 8.3 Maestro flows 01 and 02 green (CI nightly lane or a local run): flow 01's programme
      input and iCal URL import path, flow 02's title and description inputs.
- [ ] 8.4 CI green on the PR (`test-mobile` with coverage, `test-mobile-timezones`, lint).
- [ ] 8.5 Real VoiceOver and TalkBack pass on field labels, hints, error announcement, disabled
      and the date-time field (HUMAN: see inbox/2026-10-26-mobile-ds-text-field-screen-reader-pass.md)
