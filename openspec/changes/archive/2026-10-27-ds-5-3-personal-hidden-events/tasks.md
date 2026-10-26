# Tasks

Run commands in `mobile/` unless a task says otherwise. Decisions D1 to D7 are in `design.md`.
Before you change a symbol, run LSP `findReferences` on `ColorSwatchPicker`, `PersonalEventActions`
and `KeyboardSafeActionLayout`. Add a code comment only for a non-obvious why. Docs describe the
current state only. Do not touch `src/features/onboarding/**` (slice 5.1 runs in parallel). Never
build Android on the Mac. Land two commits, as described in design.md → Migration Plan.

**Files in scope**

| Role | Path |
| --- | --- |
| Routes (unchanged, verify only) | `src/app/hidden-events.tsx`, `src/app/personal-events.tsx`, `src/app/personal-event-form.tsx` |
| Hidden events | `src/features/hidden-events/ui/hidden-events-screen.tsx` (+ `.test.tsx`) |
| Personal events list | `src/features/personal-events/ui/personal-events-list.tsx` (+ `.test.tsx`) |
| Personal event form | `src/features/personal-events/ui/{personal-event-form-screen,personal-event-editor,personal-event-fields,personal-event-actions}.tsx`, `personal-event-form-screen.test.tsx`, `color-swatch-presets.ts` (data, unchanged) |
| Deleted | `src/features/personal-events/ui/color-swatch-picker.tsx`, `color-swatch-picker.test.tsx` |
| New primitive | `src/design/field/color-swatch-field.tsx`, `.test.tsx`, `.gallery.tsx`, `.gallery.test.tsx`; `src/design/index.ts`; `src/design/gallery/registry.ts`; `jest.config.js` |
| New lint rule | `tools/eslint-rules/no-raw-radio-group.js`, `.test.js`; `tools/eslint-rules/index.js`; `eslint.config.js` |
| Strings | `src/i18n/locales/en.json`, `src/i18n/locales/fr.json` |

**Allowlist rows to remove: none.** No in-scope path is on any allowlist under
`tools/eslint-rules/`. Every ceiling stays as it is:
`STYLE_LITERAL_ALLOWLIST_CEILING = { colorLiteral: 1, typographyLiteral: 7, legacyShadow: 0, spacingLiteral: 6, radiusLiteral: 3 }`,
`RAW_PRIMITIVE_ALLOWLIST_CEILING = { rawText: 1, rawModal: 0 }`, raw-button 5, ad-hoc-status 2,
raw-text-input 1, ad-hoc-separator 1, header-action 1, raw-event-color 1.
`color-swatch-presets.ts` stays in `styleLiteralIgnores` (`eslint.config.js:64`) because it is
color data. Task 0.1 proves this.

**Selectors that must stay stable:** `personal-event-title-input`, `personal-event-description-input`,
`personal-event-save`, `personal-event-delete` (Maestro flow 02 and `e2e/maestro-selectors.test.ts`);
`personal-event-start-picker`, `-end-picker`, `-end-picker-error`, `personal-event-location-input`,
`personal-event-form-layout-owner`, `personal-event-form-responsive-owner` and its `-content`,
`-actions` and `-window-owner`, `color-swatch-<hex>`, `personal-events-add`,
`personal-events-list`, `personal-events-responsive-owner`, `personal-events-empty`,
`personal-event-row-<uid>` and `-color`, `hidden-events-layout-owner`,
`hidden-events-responsive-content`, `hidden-events-empty`, `hidden-events-name-section`,
`hidden-events-uid-section`, `hidden-events-name-<name>`, `hidden-events-uid-<uid>`. These labels
must stay: "Edit this event", "Delete event…" alert title, the alert's "Delete" and "Cancel", and
"Un-hide <title>". Only `personal-event-actions` (an inner `View` used by no test or flow) goes.

## 0. Baseline

- [x] 0.1 Prove the ratchet status. Run
      `rtk proxy rg -n "hidden-events|personal-event|personal-events|color-swatch" tools/eslint-rules eslint.config.js scripts ../scripts`.
      Verify: the only match is `eslint.config.js:64` (`color-swatch-presets.ts` in
      `styleLiteralIgnores`). If an allowlist row matches, delete it in 4.4 and lower that test's
      ceiling by the rows removed.
- [x] 0.2 Run the audit greps from `docs/mobile/design-system-audit/duplication-and-drift.md` →
      Method on the eleven files in the table (under zsh use a bash array, e.g.
      `F=(…); rtk proxy rg -n --no-heading -e "$p" "${F[@]}"`), plus
      `themeColor|type="(default|small|smallBold|subtitle)"|Pressable|Touchable|TextInput\b|PrimaryAction|useTheme|<Text\b`
      and `\b(width|height)\s*:\s*[0-9]+`.
      Verify: the hits match the design.md → Context table. Record fresh counts for the PR.

## 1. `ColorSwatchField` primitive (D1) — commit 1

- [x] 1.1 Create `src/design/field/color-swatch-field.tsx` with the props in design.md D1. Compose
      `FieldChrome` from `./text-field` (label, error, disabled, `testID`, `style`). Inside it, put a
      `View` row (`flexDirection: "row"`, `flexWrap: "wrap"`, `gap: Spacing.two`,
      `accessibilityRole="radiogroup"`) of `Pressable` swatches. Each swatch has
      `width`/`height` `MinTouchTarget`, `borderRadius: Radii.pill`, `backgroundColor: option.color`,
      a design-local `SELECTED_RING_WIDTH = 3` border (`borderColor` is `theme.text` when selected,
      otherwise `"transparent"`), and no `hitSlop`. Roles: Android `radio` with
      `accessibilityState={{ checked, disabled }}`, iOS `button` with `{ selected, disabled }`, and
      keep the "UIKit has no radio trait" comment. Set `accessibilityLabel={option.label}` and
      `testID={`${testID}-${option.color}`}`. Press feedback follows `button.tsx:157-178`: Android
      `android_ripple={{ color: theme.ripple, foreground: true }}`, clipped to the circle
      (`overflow: "hidden"`); iOS opacity `StateOpacity.pressed` while pressed; neither when
      `disabled`, and `onPress` does nothing then. Use a style callback that returns one flattened
      object. Import only `@/theme`, `react-native` and `./text-field`. Use tokens only.
      Verify: `npx eslint src/design/field/color-swatch-field.tsx` passes and
      `rtk proxy rg -n "hitSlop|: 48|: 44" src/design/field/color-swatch-field.tsx` finds nothing.
- [x] 1.2 Export `ColorSwatchField`, `type ColorSwatchFieldProps` and `type ColorSwatchOption`
      from `src/design/index.ts` in the field block, after `DateTimeField`.
      Verify: `npx tsc --noEmit` passes and `src/design/import-graph.contract.test.ts` passes.
- [x] 1.3 Write `src/design/field/color-swatch-field.test.tsx` with `usePlatform` for `ios` and
      `android`. Cover: (a) Android: each swatch is a named `radio`, only the selected one is
      `checked`, and the row has role `radiogroup`; (b) iOS: named `button`s with `selected`;
      (c) a press reports the option color verbatim; (d) the flattened size is 44 on iOS and 48 on
      Android, with `borderRadius: Radii.pill` and no `hitSlop` prop; (e) the selected swatch has
      `borderColor: Colors.light.text` and `borderWidth` 3, an unselected one has `"transparent"`
      and 3; (f) Android `android_ripple` is set when enabled and `undefined` when disabled, iOS
      pressed opacity is `StateOpacity.pressed`; (g) disabled: no `onChange`, `disabled` in every
      `accessibilityState`, dimmed chrome; (h) `error` renders `${testID}-error` and the label
      renders `${testID}-label`; (i) `style` merges last.
      Verify:
      `npx jest src/design/field/color-swatch-field --coverage --collectCoverageFrom='src/design/field/color-swatch-field.tsx'`
      reports at least 90% lines and branches.
- [x] 1.4 Add `"src/design/field/color-swatch-field.tsx": { lines: 90, branches: 90 }` to
      `coverageThreshold` in `jest.config.js`, after `date-time-field.tsx`. Do not change any other
      entry. Verify: `git diff jest.config.js` shows one added line.
- [x] 1.5 Write `src/design/field/color-swatch-field.gallery.tsx` with the stories `Default`,
      `Error`, `Disabled` and `LongStrings` (meta `stories` in that order). The default story holds
      its selection in state. The options are eight colors named through new
      `gallery.colorSwatchField.*` keys (title, the four story names, label, error, and eight color
      names). These are gallery strings, not `personalEvents.*` keys, and the hexes are local
      fixture data. `LongStrings` uses `gallery.stress.title` for the label and captions whether
      the accessibility text size is active, as `date-time-field.gallery.tsx:75-81,122` does. Add
      the keys to `en.json` and `fr.json`. Register the module in `src/design/gallery/registry.ts`
      after `dateTimeField`.
      Verify: `npx jest src/design/gallery` passes (registry a11y matrix on both platforms and
      schemes, stories, `fixture-coverage.contract.test.ts`), and `color-swatch-field` adds no
      entry to `known-a11y-violations.ts`.
- [x] 1.6 Write `src/design/field/color-swatch-field.gallery.test.tsx` on the
      `color-dot.gallery.test.tsx` pattern: every story export is listed, every story renders on
      both platforms, and pressing a swatch in `Default` moves the selection.
      Verify: `npx jest src/design/field/color-swatch-field.gallery` passes.

## 2. Lint gate `local/no-raw-radio-group` (D2) — commit 1

- [x] 2.1 Create `tools/eslint-rules/no-raw-radio-group.js`. Open it with a rationale comment that
      points to lint-format.md and the new ADR, like the other rules. Report a `JSXAttribute`
      named `accessibilityRole` or `role` whose value is the literal `"radiogroup"` or `"radio"`
      (a string literal, or inside an expression container), or a `ConditionalExpression` either
      branch of which is one of these literals. Use one message id, `rawRadioGroup`: "A single
      choice among options is ColorSwatchField from @/design or a NativeList choice row from
      @/components/chrome." Register it in `tools/eslint-rules/index.js`.
      Verify: `node -e "require('./tools/eslint-rules').rules['no-raw-radio-group']"` exits 0.
- [x] 2.2 Write `tools/eslint-rules/no-raw-radio-group.test.js` (RuleTester). Invalid cases:
      `accessibilityRole="radiogroup"`, `accessibilityRole={"radio"}`, `role="radiogroup"` and
      `accessibilityRole={isAndroid ? "radio" : "button"}`. Valid cases: `"button"`, a variable,
      `accessibilityRole={isAndroid ? "switch" : "button"}`.
      Verify: `npx jest tools/eslint-rules/no-raw-radio-group` passes.
- [x] 2.3 In `eslint.config.js`, add block `timecalendar/raw-radio-group` with
      `files: ["src/features/**/*.tsx", "src/app/**/*.tsx"]`, `ignores: ["**/*.test.tsx"]` and
      `"local/no-raw-radio-group": "error"`, next to `timecalendar/retired-list-names`. There is no
      allowlist.
      Verify: `npm run lint` fails on `color-swatch-picker.tsx:22,30` before task 3.1 deletes the
      file and passes after it. Inject-and-revert: `accessibilityRole="radiogroup"` on a `View` in
      `personal-event-fields.tsx` fails `npm run lint` naming the rule. The same attribute in
      `src/design/field/color-swatch-field.tsx` passes.

## 3. Personal event form (D1, D3, D4, D7) — commit 1

- [x] 3.1 In `personal-event-fields.tsx`, replace the `View` + `ThemedText type="smallBold"` +
      `ColorSwatchPicker` block (`:75-83`) with `<ColorSwatchField testID="color-swatch" label={t("personalEvents.form.colorLabel")} options={…} value={values.color} onChange={(color) => update("color", color)} />`.
      Build `options` from `SWATCH_PRESETS.map((hex) => ({ color: hex, label: t(SWATCH_NAME_KEYS[hex]) }))`.
      Remove the `StyleSheet`, `View`, `Spacing`, `ThemedText` and `ColorSwatchPicker` imports and
      `styles`. Delete `color-swatch-picker.tsx` and `color-swatch-picker.test.tsx`.
      Verify: `rtk proxy rg -n "StyleSheet|Spacing|ThemedText|ColorSwatchPicker|smallBold" src/features/personal-events`
      finds nothing outside tests, and `npx tsc --noEmit` passes.
- [x] 3.2 In `personal-event-editor.tsx`, remove `contentContainerStyle`, `actionContainerStyle`,
      `styles`, and the `StyleSheet` and `Spacing` imports. In `personal-event-actions.tsx`, return
      a fragment (`ErrorNotice` when failed, Save, Delete when `canDelete`) and remove the `View`,
      the `personal-event-actions` testID, `styles`, and the `StyleSheet`/`View`/`Spacing` imports.
      Keep `variant="filled"` Save and `variant="destructive"` Delete stacked, Save first, with no
      `ButtonRow` (D4).
      Verify: `rtk proxy rg -n "personal-event-actions\"" src .maestro e2e` finds nothing, and
      `rtk proxy rg -n "StyleSheet" src/features/personal-events/ui/personal-event-{editor,actions}.tsx`
      finds nothing.
- [x] 3.3 Update `personal-event-form-screen.test.tsx`. Port the feature-level assertions from the
      deleted picker test. On both platforms, every preset swatch (`color-swatch-<hex>`) is named by
      its English color name, and after `i18n.changeLanguage("fr")` by its French name. The default
      swatch is selected on create. Pressing `color-swatch-#3F51B5` and saving passes `#3F51B5`
      verbatim to the save hook (the existing `:430` case). Add a per-platform rhythm assertion: the
      flattened `personal-event-form-responsive-owner-content` `contentContainerStyle` has
      `paddingTop: Spacing.four`, `gap: Spacing.three` and no `paddingBottom`. The
      `-actions` style has `gap: Spacing.two`, `paddingTop: Spacing.three` and
      `paddingBottom: Spacing.four`. Save and Delete are direct children of `-actions`, which
      `getAllByRole("button")` already orders. Keep the existing `:138-160` and `:322-360`
      assertions green.
      Verify: `npx jest src/features/personal-events` passes.

## 4. Personal events list and hidden events (D5, D6, D7) — commit 1

- [x] 4.1 In `personal-events-list.tsx`, declare
      `useHeaderActions({ right: [{ icon: addIcon, accessibilityLabel: t("personalEvents.list.add"), testID: "personal-events-add", platform: "ios", onPress: openCreate }] })`
      with `addIcon = { ios: "plus", android: "add" } as const`, and spread it into the existing
      `Stack.Screen` options. Render `<FloatingAction icon={addIcon} label={t("personalEvents.list.add")} testID="personal-events-add" onPress={openCreate} />`
      as a sibling after the `FlatList` (fragment in the `RootPage` render function). Delete
      `ListHeaderComponent` and `styles.header`. Give the `FlatList` content
      `Platform.OS === "android" && styles.fabClearance` (`paddingBottom: Layout.fabClearance`).
      Add `caption={t("personalEvents.list.emptyCaption")}` to the empty `StatusView`. Replace the
      `:24-29` header comment with nothing or one current-state line. Keep the `:117-118` comment.
      Verify: `npx eslint src/features/personal-events/ui/personal-events-list.tsx` passes, and
      `rtk proxy rg -n "ListHeaderComponent|variant=\"tonal\"" src/features/personal-events` finds
      nothing.
- [x] 4.2 Strings: set `personalEvents.list.empty` to "No personal events" / "Aucun événement
      personnel". Add `personalEvents.list.emptyCaption` "Events you add appear here." / "Les
      événements que vous ajoutez apparaissent ici." in `en.json` and `fr.json`. Keep the key order
      alphabetical within the block, as the files do.
      Verify: the i18n parity test passes (`npx jest src/i18n`), and
      `rtk proxy rg -n "Tap Add|Appuyez sur Ajouter" src` finds nothing.
- [x] 4.3 Update `personal-events-list.test.tsx` on the `user-calendars-screen.test.tsx:81,152-181`
      pattern. iOS: `unstable_headerRightItems()` yields one item with `identifier`
      `personal-events-add` and label "Add event", its `onPress` pushes `/personal-event-form`, and
      `queryByTestId("personal-events-add")` is null. Android: no header items, the FAB
      (`personal-events-add`, label "Add event") pushes `/personal-event-form` and is present on the
      empty state, and the list's flattened `contentContainerStyle.paddingBottom` is
      `Layout.fabClearance`. The empty state shows "No personal events" and the caption. Keep the
      lane-width loop and the row assertions.
      Verify: `npx jest src/features/personal-events/ui/personal-events-list` passes.
- [x] 4.4 In `hidden-events-screen.tsx`, render the empty `StatusView` directly (drop the
      `View style={styles.stateLane}` wrapper and `stateLane`). Drop `View` from the import if it is
      unused. Cut the `:25-33` comment to the current why (un-hide must be reachable here because
      hide-by-name has no per-event surface; stale uids are omitted for Flutter parity). Keep
      `styles.content` and `styles.error`. Allowlists: only if 0.1 found a row, delete it and lower
      the matching ceiling.
      Verify: `npx jest src/features/hidden-events tools/eslint-rules` passes. In
      `hidden-events-screen.test.tsx`, add an assertion that `hidden-events-empty` is a direct
      child of the `hidden-events-responsive-content` content container.
- [x] 4.5 Selectors. Verify: `git diff --stat -- .maestro e2e` is empty,
      `npx jest e2e/maestro-selectors` passes, and every selector in the "must stay stable" list
      above still appears in source (`rtk proxy rg -n "<id>" src`).
- [x] 4.6 Re-run the 0.2 greps on the remaining in-scope feature files. Verify: the only hits are
      `StyleSheet.create` in `hidden-events-screen.tsx` and `personal-events-list.tsx`, their
      lane-plus-style arrays, their `Spacing.` tokens, the `Platform.OS` FAB clearance in the list,
      and `use-personal-event-delete-confirmation.ts:65,70`. Nothing matches in
      `personal-event-{editor,actions,fields,form-screen}.tsx`. Record the output for the PR.
- [x] 4.7 Commit 1.

## 5. CI proof

- [ ] 5.1 The runtime changes are a new primitive, a lint rule and screen composition. CI proves
      them through `color-swatch-field.test.tsx` (90% tier), the gallery registry a11y matrix and
      fixture contract, `no-raw-radio-group.test.js`, the three screen suites, the allowlist suites
      (unchanged ceilings) and `lint-mobile` at zero warnings.
      Verify: after push, the PR's mobile jobs in `.github/workflows/ci-mobile.yml` are green, and
      the `test-mobile` log lists `color-swatch-field.test.tsx`,
      `color-swatch-field.gallery.test.tsx`, `no-raw-radio-group.test.js`,
      `personal-events-list.test.tsx`, `personal-event-form-screen.test.tsx` and
      `hidden-events-screen.test.tsx`.

## 6. Local verification

- [x] 6.1 `npx tsc --noEmit` passes.
- [x] 6.2 `npm run lint` passes with zero warnings.
- [x] 6.3 `npm test -- --coverage` passes. This includes the 90% per-file branch tiers (the new
      `color-swatch-field.tsx` among them), the allowlist suites, the design import-graph and
      fixture contracts, and FR/EN parity. Record the suite and test counts for the PR.
- [x] 6.4 `npm run react-doctor:changed` reports no new warning on the changed files.
- [x] 6.5 From the repo root, `openspec validate ds-5-3-personal-hidden-events` passes.

## 7. Architecture Book (`docs/mobile/architecture-book/`) — commit 2

- [x] 7.1 `theming.md` → Fields (`:226-279`): add a `ColorSwatchField` bullet covering the props,
      the `FieldChrome` label and error, `MinTouchTarget` circles with no hit slop, the selected
      ring, press feedback, the platform roles, `${testID}-${color}`, and caller-supplied names. Add
      it to the Gates line (`color-swatch-field.test.tsx` at 90%; stories
      `color-swatch-field--default`, `--error`, `--disabled`, `--long-strings`;
      `local/no-raw-radio-group`). In Badges and color dots → Deferred (`:393-398`), remove "the
      swatch picker's 48 pt swatches (an input control, 5.3)". In → "Color names belong to the
      control" (`:378-380`), name `ColorSwatchField`, with the personal-events form passing
      `SWATCH_NAME_KEYS` names. In Header and floating actions → Create action (`:678-680`), add
      the personal-events list. In the `KeyboardSafeActionLayout` paragraph (`:513-519`), say that
      the personal-event editor passes no layout style.
      Verify: `rtk proxy rg -n "48 pt swatches|5\.3\)" docs/mobile/architecture-book/theming.md`
      finds nothing, and `rtk proxy rg -n "ColorSwatchField" docs/mobile/architecture-book/theming.md`
      matches.
- [x] 7.2 `accessibility.md:211-214` and `:116-117`: the swatches are `ColorSwatchField`, and the
      gate is `src/design/field/color-swatch-field.test.tsx` plus the form-screen name test. Add
      `local/no-raw-radio-group` as the encoded part.
      Verify: `rtk proxy rg -n "color-swatch-picker" docs/mobile/architecture-book` finds nothing.
- [x] 7.3 `lint-format.md` rule inventory: add a **Radio groups — `local/no-raw-radio-group`**
      bullet after Fields, with the same shape as the others: block, `files`, what it reports,
      ignored paths, no allowlist, RuleTester suite, caveats (a role through a variable or spread
      is not seen; Compose `RadioButton` in chrome carries no RN role) and the inject-and-revert
      proof from 2.3. Link the ADR.
      Verify: `rtk proxy rg -n "no-raw-radio-group" docs/mobile/architecture-book/lint-format.md`
      matches.
- [x] 7.4 `features.md`: in the personal-events paragraphs (`:24`, `:128-147`), the color is
      `ColorSwatchField` and the editor passes no layout style (Save and Delete stacked in the shared
      rhythm). Update the swatch sentence at `:145-147` to point to the new tests. In Header and
      floating actions (`:211-221`), add a "Personal events: on iOS a right Add (`plus`,
      `personal-events-add`); Android adds through a `FloatingAction` with the same testID, and the
      list pads by `Layout.fabClearance`" bullet. In the ListRow paragraph (`:162-170`), keep
      hidden events and personal events true.
      Verify: `rtk proxy rg -n "color-swatch-picker|in-content Add" docs/mobile/architecture-book/features.md`
      finds nothing.
- [x] 7.5 ADR: write `decisions/078-color-swatch-field.md` from `TEMPLATE.md` (use the next free
      number if 078 is taken on `origin/main`; fix every link). Include Context (the hand-built
      picker, `color-swatch-picker.tsx` facts in design.md → Context), Decision (D1 and D2),
      Rejected (D1 and D2 alternatives) and Consequences (iOS 44 pt circles, the lint gate, Android
      device evidence in the inbox note). Add it to `decisions/README.md`.
      Verify: the README index lists it, and every relative link in the ADR resolves.
- [x] 7.6 `CHANGELOG.md`: add `## 2026-10-26 — Personal events and hidden events on the design system`
      above the current first entry. Add bullets for: `ColorSwatchField` (theming.md → Fields, ADR);
      `local/no-raw-radio-group` (lint-format.md); the personal-events create idiom (theming.md →
      Header and floating actions, features.md); the editor passing no layout style and Save/Delete
      in the shared rhythm (theming.md, features.md); the three screens composing only `@/design`
      with no allowlist entry. Verify: the entry is first and every link resolves.
- [x] 7.7 Outside the Book: `docs/react-native-migration/inbox/2026-10-26-mobile-ds-personal-hidden-events-device-pass.md`
      exists (written at planning). Update it if a story id or label changed. Verify: the four
      story ids come from `src/design/gallery/stories.ts` for the new fixture.
- [x] 7.8 Commit 2. Verify: `npm run lint`, `npm test -- --coverage` and the openspec validate
      still pass.

## 8. Device verification

- [x] 8.1 iOS simulator pass (conductor-owned; iOS build on the Mac with Xcode 26.6), in light and
      dark, at the default text size and at AX5:
      - **Gallery:** `timecalendar-dev://developer/gallery/color-swatch-field--default`,
        `--error`, `--disabled`, `--long-strings`.
      - **Personal events:** Settings → Personal events (empty: title and caption, "+" in the bar,
        no FAB) → "+" → create an event, choose a color, Save → the row shows the color dot → open
        the row → edit the description → Save → open again → Delete → confirm in the alert.
      - **Hidden events:** hide a synced event from event details → Settings → Hidden events → it is
        listed → Un-hide → the empty state is vertically centred.
      Check: swatches are 44 pt circles that wrap without clipping; the selected ring is visible
      in both schemes; the Color label matches the other field labels; Save and Delete sit 8 pt
      apart with the shared padding above the keyboard; the description, scrolled to the end, is
      not cramped against Save (D3); VoiceOver reads "<color>, selected, button".
      Verify: record screenshots for the PR, and list by name anything not checked.
- [ ] 8.2 Android device and TalkBack pass (HUMAN: see inbox/2026-10-26-mobile-ds-personal-hidden-events-device-pass.md).
      Skip and continue. This does not block the PR.
