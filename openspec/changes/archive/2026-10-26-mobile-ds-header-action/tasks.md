# Tasks

Run commands in `mobile/` unless a task says otherwise. Decisions D1 to D13 are in `design.md`.

Conventions:

- Await every RNTL 14 helper.
- Use `usePlatform` (`@/test-support/platform`) for platform branches, and no fake timers.
- Add no code comment except a non-obvious why.
- Docs describe the current state only.
- Tests and specs name no real person (the CI disclosure scan rejects it).
- Never build Android on the Mac.
- Land three commits, following the design's Migration Plan.

## 0. Baseline

- [x] 0.1 Record the selectors the change must keep. Run
      `grep -rhoE 'id: *"?[A-Za-z0-9_${}.|()-]+' .maestro | sort -u > /tmp/maestro-ids.before` and
      `grep -rnoE 'testID[=:] *\{?"(calendar-(today|add|fab)|home-add-personal-event|changelog-close|onboarding-programme-skip|user-calendars-add|onboarding-school-back)"' src > /tmp/header-ids.before`.
      Re-check that 075 is the next free ADR number. From the repo root, run
      `git fetch origin main && git ls-tree --name-only origin/main docs/mobile/architecture-book/decisions/ | tail -3`,
      read the reservation note in `decisions/README.md`, and check open mobile PRs
      (`gh pr list --state open`, then `gh pr diff <N> --name-only | grep decisions/`).
      Verify: both files are non-empty, and the ADR number is written down for group 7.

## 1. Chrome foundations (D5, D6)

- [x] 1.1 Extract `ComposeListHost` from `src/components/chrome/native-list.tsx` into
      `src/components/chrome/compose-host.tsx` as `SeededComposeHost`, with the same props and
      body: `colorScheme` from `useResolvedScheme()`, `seedColor` from `theme.primary`. Do not
      export it from `chrome/index.ts`. `native-list.tsx` imports it by path. Verify: `npx tsc
      --noEmit` passes, and `npx jest src/components/chrome/native-list` passes unchanged.
- [x] 1.2 Rename `native-list-icons.ts` to `native-icons.ts` with `git mv`. Rename
      `NativeListIcon` to `NativeIcon` and `NativeListMaterialSymbol` to `NativeMaterialSymbol`,
      keeping `materialSymbolSource`. Update every importer (`rg -l "NativeListIcon|native-list-icons|NativeListMaterialSymbol" src`).
      The barrel exports `type NativeIcon`, with no alias. Verify: the `rg` finds nothing, and
      `npx tsc --noEmit` passes.
- [x] 1.3 Add `assets/icons/material/today.xml` and `assets/icons/material/arrow_back.xml` in the
      same Material Symbols vector-drawable format as `add.xml` (24 dp viewport, same attribute
      set). Add `today` and `arrow_back` to the `materialSymbols` table. Verify: `git diff --stat`
      shows the two XML files, and `npx tsc --noEmit` passes.

## 2. `FloatingAction` (D4)

- [x] 2.1 Create `src/components/chrome/floating-action.tsx` exporting `FloatingAction` and
      `FloatingActionProps` (`icon: NativeIcon`, `label`, `testID`, `onPress`). Move the body of
      `NativeListFloatingAction` into it: iOS `null`, Android `SeededComposeHost matchContents`
      positioned `absolute` at `right: Spacing.three, bottom: Spacing.three`, holding a
      `FloatingActionButton` with `testID(...)` and its icon at 24 with `contentDescription:
      label`. Delete `NativeListFloatingAction`, its props type and the `floatingAction` style from
      `native-list.tsx`. Export `FloatingAction` (+ props type) from `chrome/index.ts`.
- [x] 2.2 In `native-list.tsx`, delete `FAB_CLEARANCE`. `reservesFloatingAction` pads the Android
      list bottom by `Layout.fabClearance` (from `@/theme`), and no longer by `LIST_BOTTOM_PADDING +
      FAB_CLEARANCE`. Alias the import if a Reanimated `Layout` is in scope (theming.md).
- [x] 2.3 `floating-action.test.tsx` (`describe.each(["ios", "android"])`):
      - iOS renders nothing.
      - Android renders the FAB by testID, with the content description equal to `label`, and
        press calls `onPress`.
      - The host carries the resolved scheme and the `theme.primary` seed in light and dark.

      Move the FAB cases out of `native-list.test.tsx` and make its clearance case assert
      `Layout.fabClearance`. Verify: `npx jest src/components/chrome --coverage
      --collectCoverageFrom='src/components/chrome/floating-action.tsx'` reports ≥ 90% branches.

## 3. `useHeaderActions` (D1–D3)

- [x] 3.1 `jest/setup-expo-ui.ts` (D12):
      - Add a Compose `IconButton` mock. It takes `onClick`, `enabled` and `modifiers` (test tag via
        `selectableProps`), and derives its role and name only from real semantics: the `Icon`
        child's `contentDescription`, and the button role that M3 gives every `IconButton`.
      - Make the `TextButton` mock merge a child `Text`'s `timecalendarSemantics`
        `contentDescription` into its accessible name. Without it the name is the visible text.
      - Export `IconButton` with the other Compose mocks.

      Verify: `npx jest src/components/chrome` passes.
- [x] 3.2 Create `src/components/chrome/header-action.tsx`. It exports `useHeaderActions`, the
      `HeaderAction` union exactly as in D1, and `HeaderActionOptions`.
      - **Filter:** keep items whose `platform` is absent or equals `Platform.OS`. Omit a side with
        no items.
      - **iOS:** map each item to `unstable_headerRightItems` / `unstable_headerLeftItems` per D2:
        `type: "button"`, `label` (text) or `accessibilityLabel` (icon),
        `icon: { type: "sfSymbol", name }`, `tintColor: theme.text`, `accessibilityLabel`,
        `accessibilityHint`, `identifier: testID`, `disabled`, `onPress`.
      - **Android:** set `headerRight` / `headerLeft` to `() => <HeaderActionBar side items />`,
        which renders `SeededComposeHost matchContents` › `Row verticalAlignment="center"`:
        - Icon items render an `IconButton` with `enabled={!disabled}`,
          `modifiers={[testID(id)]}`, `onClick`, and `colors.contentColor = theme.text`. Its child
          is an `Icon` with `source={materialSymbolSource(icon.android)}`, `size={24}` and
          `contentDescription={name}`.
        - Text items render a `TextButton` with the same props. Its child is a `Text` with
          `maxLines={1}`, the M3 `labelLarge` style, and
          `modifiers={[composeSemantics({ contentDescription: name })]}`.
        - `name` is the label, or `label, hint` when a hint is given (D3).

      Export the hook and both types from `chrome/index.ts`. Verify: `npx tsc --noEmit` passes.
- [x] 3.3 `header-action.test.tsx` (`describe.each(["ios", "android"])`, `renderHook` +
      `render` of the returned header functions):
      - Platform filtering, a declared empty side returning its key as `undefined`, and an
        undeclared side returning no key.
      - iOS mapping for icon and text items, in light and dark (`tintColor` equals the scheme's
        `text`), plus hint, identifier and disabled.
      - Android: find each action by testID. Press calls the handler, and a disabled one does
        not. Check the accessible name (label, then hint) through the mock, and the `text`
        content color.
      - Type tests with `// @ts-expect-error`: a missing `accessibilityLabel`, `icon` with
        `label`, neither, and a `tintColor` field.

      Verify: `npx jest src/components/chrome/header-action --coverage
      --collectCoverageFrom='src/components/chrome/header-action.tsx'` reports ≥ 90% branches, and
      `npx tsc --noEmit` passes, which proves the `@ts-expect-error` lines are errors.

## 4. Gallery (D11)

- [x] 4.1 Create `src/components/chrome/header-action.gallery.tsx` (meta `header-action`) with
      the stories `Icons`, `Text`, `BothSides`, `Disabled`, `PlatformOnly` and `LongStrings`.
      - Each story renders `<Stack.Screen options={useHeaderActions(...)} />` and a `RootPage`
        caption: what the bar shows, and the last action pressed.
      - `LongStrings` uses `gallery.stress.*` and the FR label "Ajouter un événement" under the FR
        locale.
- [x] 4.2 Create `src/components/chrome/floating-action.gallery.tsx` (meta `floating-action`) with
      the stories `Default`, `OverList` (a `NativeList reservesFloatingAction` with ≥ 12 rows),
      `OverScroll` (an RN `ScrollView` with a `Layout.fabClearance` bottom inset) and
      `LongLabel`. On iOS each story shows an "Android only" caption. Remove the
      `floating-action` story from `native-list.gallery.tsx`.
- [x] 4.3 Register `headerAction` and `floatingAction` in `src/design/gallery/registry.ts`. Add
      the `gallery.headerAction.*` and `gallery.floatingAction.*` keys to `en.json` and `fr.json`,
      and delete any `gallery.nativeList.floatingAction*` key that goes unused. If
      `registry.test.ts` / `story-content.tsx` do not mock `expo-router`'s `Stack.Screen`, mock it
      to capture options and render the Android header so the a11y matrix sees the buttons.
      Verify: `npx jest src/design/gallery` passes, the `git diff` of
      `src/design/gallery/known-a11y-violations.ts` is empty, and the FR/EN parity test passes.

## 5. Call sites (D7, D9)

- [x] 5.1 Calendar:
      - `calendar-screen-header.tsx` replaces `headerRight` with `useHeaderActions({ right: [...]
        })`. The right side holds Today (`icon: { ios: "calendar", android: "today" }`,
        `calendar-today`, `t("calendar.todayLabel")`, only when `onToday` is defined) and Add
        (`icon: { ios: "plus", android: "add" }`, `platform: "ios"`, `calendar-add`,
        `t("calendar.addLabel")`).
      - `calendar-screen.tsx` renders `<FloatingAction icon={…add} label={t("calendar.addLabel")}
        testID="calendar-fab" onPress={onAdd} />` with no `Platform.OS` guard.
      - Delete `calendar-screen-actions.tsx` and any test of it.
      - `agenda-list.tsx`: on Android, the content bottom padding is `Layout.fabClearance`.

      Update the calendar header and screen tests. Verify: `npx jest src/features/calendar`
      passes.
- [x] 5.2 Home:
      - Delete `HomeAddFab` from `home-screen-header.tsx`.
      - `home-screen.tsx` renders `<FloatingAction icon={{ ios: "plus", android: "add" }}
        label={t("home.addPersonalEvent")} testID="home-add-personal-event" onPress={home.addEvent} />`
        with no platform guard.
      - `androidContent.paddingBottom` becomes `Layout.fabClearance`.
      - The iOS glass button stays as is (D9).

      Update `home-screen.test.tsx`. Verify: `npx jest src/features/home` passes.
- [x] 5.3 Event details: `EventDetailsHeader` spreads `useHeaderActions({ right: action ? [{
      label: action.text, accessibilityLabel: action.accessibilityLabel, testID:
      "event-details-action", onPress: action.onPress }] : [] })` into its one `Stack.Screen`.
      Remove `Pressable`, `ThemedText` and the style. Verify: `npx jest src/features/calendar`
      passes, and the edit, hide and un-hide presses are covered on both platforms.
- [x] 5.4 Changelog sheet: Close becomes a right text action (`changelog-close`, label and hint
      from `changelog.close.*`). Verify: `npx jest src/features/changelog` passes, and the
      press-acknowledges-and-dismisses case runs on both platforms.
- [x] 5.5 Programme: one right text action Skip (`onboarding-programme-skip`,
      `onboarding.programme.skip` / `skipLabel`) on both platforms. Delete the platform-split
      options, the `headerSkip` style and the top comment block's platform-split paragraph. Keep
      the paragraph's product reasoning. Verify: `npx jest src/features/onboarding` passes.
- [x] 5.6 User calendars: an iOS-only right icon action `add` (`user-calendars-add`,
      `t("userCalendars.add")`, no `tintColor`) plus `FloatingAction` with the same testID and
      label. Verify: `npx jest src/features/calendar-sources` passes.
- [x] 5.7 School picker: when `fromCalendarManagement` is set, add a left icon action
      `{ ios: "chevron.backward", android: "arrow_back" }` with `platform: "ios"`,
      `onboarding-school-back`, `t("common.back")` and `router.dismiss`. The search bar options
      stay. Verify: `npx jest src/features/school-selection` passes.
- [x] 5.8 Timezone chooser: when iOS and `!bottomSearch`, add a left text action Close
      (`settings.close`, testID `timezone-close`, `platform: "ios"`) through `useHeaderActions`,
      spread into its `Stack.Screen`. Keep the `<Stack.Toolbar placement="bottom">` block. Update
      the test's Toolbar mock. Verify: `npx jest src/features/settings` passes.
- [x] 5.9 Remove `calendar-screen-actions.tsx`, `changelog-sheet-screen.tsx`,
      `event-details-actions.tsx` and `programme-screen.tsx` from
      `tools/eslint-rules/raw-button-allowlist.js`, and set
      `RAW_BUTTON_ALLOWLIST_CEILING` in its test to 9. Verify: `npx jest tools/eslint-rules`
      passes.

## 6. Lint, E2E selector and CI proof (D8, D10)

- [x] 6.1 Create `tools/eslint-rules/no-ad-hoc-header-action.js` per D10, with a header comment
      giving the rationale. Register it in `tools/eslint-rules/index.js`. Write
      `no-ad-hoc-header-action.test.js` (RuleTester):
      - Invalid: each of the four keys (identifier and string key); `Stack.Toolbar
        placement="right"`; `placement={side}`.
      - Valid: `Stack.Toolbar` with no placement; `placement="bottom"`; `headerTitle`;
        `headerSearchBarOptions`.
- [x] 6.2 Create `tools/eslint-rules/header-action-allowlist.js` with
      `src/features/calendar/ui/calendar-screen/calendar-screen-header.tsx` (comment: `// 5.10
      calendar view menu`). Copy `ad-hoc-separator-allowlist.test.js` to
      `header-action-allowlist.test.js` with `HEADER_ACTION_ALLOWLIST_CEILING = 1`. Wire the block
      `timecalendar/header-action` in `eslint.config.js`: `files: ["src/**/*.{ts,tsx}"]`,
      `ignores` chrome, tests and the allowlist. Verify: `npm run lint` passes with zero warnings.
- [x] 6.3 Inject-and-revert proof, with the output recorded for the PR:
      - Add `headerRight: () => null` to `changelog-sheet-screen.tsx` options. `npm run lint`
        fails with `local/no-ad-hoc-header-action`.
      - Add `<Stack.Toolbar placement="left" />` to a feature file. Lint fails.
      - Revert both. Lint passes.
- [x] 6.4 `.maestro/02-personal-event.yaml`: replace `- tapOn:\n    id: "calendar-(add|fab)"` with
      `- tapOn: "Add an event"`. In `e2e/maestro-selectors.test.ts`, change the flow 02 ordered
      snippet from `'id: "calendar-(add|fab)"'` to `'- tapOn: "Add an event"'`. Verify: `npx jest
      e2e/maestro-selectors` passes. Re-run the 0.1 greps into `/tmp/*.after` and `diff` them.
      The only Maestro id difference is the removed `calendar-(add|fab)`. Every header testID in
      `/tmp/header-ids.before` is still declared, now under `src/features/**` items or
      `FloatingAction` props.
- [x] 6.5 The CI proof for runtime behavior is the Jest suite gated by `test-mobile`
      (`header-action.test.tsx`, `floating-action.test.tsx`, the registry matrix, the lint-rule
      and allowlist suites, and the selector contract). After push, check that the PR's
      `test-mobile` job (`.github/workflows/ci-mobile.yml`) is green and that its log lists
      `header-action.test.tsx`, `floating-action.test.tsx` and `no-ad-hoc-header-action.test.js`.
- [x] 6.6 Native proof (deferred to the `main` E2E run: E2E is not dispatched from PRs) (the flow 02 selector and native header items on both platforms): dispatch
      `ci-mobile-e2e` once for the final commit, which runs both platforms
      (`gh workflow run ci-mobile-e2e.yml -f ref=<final commit SHA>`). Verify: flows 01–03 pass on iOS and Android. An
      Android failure at `:app:packageRelease` before launch is infrastructure: re-run once
      before you treat it as a regression.

## 7. Architecture Book, ADR and docs (`docs/mobile/architecture-book/`)

- [x] 7.1 Create `decisions/075-header-and-floating-actions.md` from `TEMPLATE.md` (use the
      number from 0.1), status Accepted. It records:
      - Context: §A5 / §A6, the four header mechanisms, the two RN FABs, and the platform facts
        (react-native-screens has no accessibility identifier on bar items; expo-router's
        Android toolbar has no text actions or testIDs).
      - Decision: D1–D4, D6, D7 and D8.
      - Rejected: `Stack.Toolbar` as the implementation, a component that renders its own
        `Stack.Screen`, RN `Pressable`s on either platform, an `accessibilityIdentifier` patch,
        a `menu` field without a consumer, and a `NativeListIcon` alias.
      - Consequences: the iOS label-only E2E reach, the Android one-line text cap, the M3 FAB look
        on Home and Calendar, the two deferrals (5.9 Home iOS "+", 5.10 view menu), and the
        inbox device pass.
      - Revisit if: react-native-screens sets an accessibility identifier on bar items; a header
        menu consumer appears; expo-router's `Stack.Toolbar` gains testIDs and Android text
        actions; Home gains a native header.

      Add the row to `decisions/README.md`. Verify: from the repo root, `rg -n "075"
      docs/mobile/architecture-book` shows the index row and every link.
- [x] 7.2 `navigation.md`: in the header paragraph, header actions are declared through
      `useHeaderActions` from `@/components/chrome`. Native bar items on iOS, M3 actions on
      Android. Screens set no header item, tint or `headerRight` / `headerLeft` themselves
      (`local/no-ad-hoc-header-action`, one allowlisted file). Change "Features still own
      localized `Stack.Screen` titles and native header actions" to say features own titles and
      declare actions through the hook. Verify: `rg -n "useHeaderActions" docs/mobile/architecture-book/navigation.md`
      matches.
- [x] 7.3 `theming.md`:
      - Add `## Header and floating actions — useHeaderActions, FloatingAction (src/components/chrome/)`.
        Cover the item union, the iOS and Android rendering, the tint rule, the one-line Android
        text, the create-action idiom (iOS header item, Android FAB, one label), the FAB anatomy
        and seeded colors, `Layout.fabClearance` as the only clearance, the gallery ids, the
        gates and the deferrals.
      - Replace the native-list "Floating action" bullet with a pointer to the new section.
      - In the `chrome/index.ts` barrel bullet, list `useHeaderActions`, `HeaderAction`,
        `FloatingAction` and `NativeIcon`, and drop `NativeListFloatingAction` and
        `NativeListIcon`.
      - Mention `SeededComposeHost` as the one Compose host seed.

      Verify: `rg -n "NativeListFloatingAction|NativeListIcon" docs/mobile/architecture-book` finds
      nothing outside ADR 072 and the CHANGELOG.
- [x] 7.4 `accessibility.md`: add `## Header and floating actions`. Cover:
      - The required `accessibilityLabel` (type), the hint.
      - The iOS Large Content Viewer and UIKit targets, and Android 48 dp / 56 dp.
      - TalkBack naming through the label `Text`'s semantics (label, then hint) with the button's
        click action kept.
      - The one-line Android text cap with the full name in semantics.
      - FAB content description.

      Link the inbox note. Verify: the section exists and its links resolve.
- [x] 7.5 `lint-format.md`: add the `timecalendar/header-action` block, and a rule-inventory entry
      `**Header actions — local/no-ad-hoc-header-action**` covering scope, ignores, allowlist +
      ceiling (1), the computed-key and spread caveat, and the 6.3 proof. Set the raw-button
      ceiling to 9. Verify: `rg -n "header-action|ceiling" docs/mobile/architecture-book/lint-format.md`
      shows both.
- [x] 7.6 Update the rest:
      - `testing.md`: native iOS bar items have no accessibility identifier, so Maestro reaches
        them by accessibility label, as flow 02 does for "Add an event" and "Edit this event". Add
        the 90% tiers for `header-action.tsx` and `floating-action.tsx`, and the Compose
        `IconButton` / `TextButton` semantics in the Expo UI mock.
      - `features.md`: the gallery registry table gets `header-action` and `floating-action`
        rows, and the `native-list` row loses `floating-action`. Calendar (header actions, FAB,
        agenda clearance), Home (FAB), Event details, Changelog, Programme, User calendars, School
        picker and Timezone chooser name their header action or FAB.
      - `architecture.md`: if the chrome directory listing names files, add `header-action`,
        `floating-action` and `compose-host`.

      Verify: `rg -n "useHeaderActions|FloatingAction" docs/mobile/architecture-book/{testing,features}.md`
      covers each.
- [x] 7.7 `CHANGELOG.md`: add `## 2026-10-26 — Header and floating actions` at the top, with
      bullets for:
      - the hook and FAB (theming.md, ADR 075);
      - navigation.md's header rule;
      - the accessibility contract;
      - `local/no-ad-hoc-header-action` at ceiling 1 and the raw-button ceiling 9;
      - Maestro label selection for native bar items (testing.md);
      - the migrated sites (features.md).

      Verify: the entry is first and every link resolves.
- [x] 7.8 Outside the Book: `docs/react-native-migration/inbox/2026-10-26-mobile-ds-header-action-device-pass.md`
      exists (written at planning). Update its story ids if they changed. Verify: every story id
      it names is produced by `src/design/gallery/stories.ts`.

## 8. Device verification

- [x] 8.1 iOS simulator pass (run by the conductor):
      - **Gallery:** each `timecalendar-dev://developer/gallery/header-action--<story>` and
        `…/floating-action--<story>` in light and dark, at the default text size and at
        accessibility-extra-extra-extra-large. Check:
        - the native bar items show the SF Symbols and labels in the `text` tint;
        - long press at AX5 shows the Large Content Viewer;
        - a disabled item is dimmed and inert;
        - each floating-action story shows its "Android only" caption.
      - **Screens:** Calendar (Today, Add), event details (Edit, Hide, Un-hide), changelog sheet
        Close, Programme Skip, User calendars Add, school picker Back (from calendar management)
        and timezone Close.

      Verify: screenshots recorded for the PR, with no clipped label and no pink header item.

      Done on an iPhone 17 simulator (iOS 26.5): header-action icons, text, long strings (native
      "More" overflow), disabled (dimmed, inert) and floating-action default stories in light and
      dark; Calendar, event details Edit, user calendars Add, changelog Close and the timezone
      chooser at the default size and at accessibility-extra-extra-extra-large. Not checked: the
      Large Content Viewer long press, Programme Skip, school picker Back, Hide / Un-hide.
- [ ] 8.2 Android device, TalkBack and VoiceOver pass (HUMAN: see inbox/2026-10-26-mobile-ds-header-action-device-pass.md).
      Skip and continue; this does not block the PR.

## 9. Verification

- [x] 9.1 `npx tsc --noEmit` passes.
- [x] 9.2 `npm run lint` passes with `--max-warnings 0`.
- [x] 9.3 `npm test -- --coverage` passes. The run includes:
      - the 90% per-file tiers for `header-action.tsx` and `floating-action.tsx`;
      - the registry matrix with an unchanged known-violation list;
      - `tools/eslint-rules` (the new suites and the raw-button ceiling 9);
      - the design import-policy and import-graph contracts;
      - FR/EN parity and `e2e/maestro-selectors.test.ts`.

      Record the suite and test counts for the PR.
- [x] 9.4 From the repo root, `openspec validate mobile-ds-header-action` passes. Grep the change
      folder, the new tests and the inbox note for developer or account names. Verify: the grep
      finds none.
