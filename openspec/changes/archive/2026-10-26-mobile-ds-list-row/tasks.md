# Tasks

Run commands in `mobile/` unless a task says otherwise. Decisions D1 to D15 are in `design.md`.
Await every RNTL 14 helper, use `usePlatform` for platform branches, and use no fake timers. Add
no code comment except a non-obvious why. Docs describe the current state only. Tests and specs
name no real person (the CI disclosure scan rejects it). Never build Android on the Mac: use the
Windows host (`ssh pc`) or a dispatched CI run. Land three commits (design → Migration Plan): Part
A, then primitives with lint, then call sites with docs.

## 0. Baseline

- [x] 0.1 Record the selectors the change must keep:
      `grep -rhoE 'id: *"?[A-Za-z0-9_${}.-]+' .maestro | sort -u > /tmp/maestro-ids.before`. Also
      record `grep -rn "onboarding-school-row-\|timezone-result-\|personal-event-row-\|export-guide-provider-\|activity-\(new\|changed\|cancelled\)-" src --include=*.tsx -l`
      into `/tmp/row-ids.before`. Re-check that 073 is the next free ADR number: from the repo
      root, run `git fetch origin main && git ls-tree --name-only origin/main docs/mobile/architecture-book/decisions/ | tail -3`,
      read the reservation note in `decisions/README.md`, and run `gh pr list --state open`
      followed by `gh pr diff <N> --name-only | grep decisions/` for each open PR. Verify: both
      files are non-empty, and the chosen ADR number is written down for group 7.

## 1. Part A: Android `NativeListRow` semantics (D1–D3)

- [x] 1.1 Create the local module `modules/compose-semantics/`:
      - `expo-module.config.json`: `"platforms": ["android"]`, `"android": { "modules": ["expo.modules.composesemantics.ComposeSemanticsModule"] }`.
      - `android/build.gradle`: model it on `modules/calendar-focus-observer/android/build.gradle`.
        Add the `org.jetbrains.kotlin.plugin.compose` plugin, `buildFeatures { compose true }`,
        `implementation project(':expo-ui')` and `implementation 'androidx.compose.ui:ui-android:1.10.6'`.
        Match the versions in `node_modules/@expo/ui/android/build.gradle`.
      - `android/src/main/java/expo/modules/composesemantics/ComposeSemanticsModule.kt`: `Name("ComposeSemantics")`;
        `OnCreate { ModifierRegistry.register("timecalendarSemantics") { map, _, _, _ -> … } }`;
        `OnDestroy { ModifierRegistry.unregister("timecalendarSemantics") }`. The factory reads
        `map["contentDescription"] as? String` and `map["role"] as? String`, and returns
        `Modifier.clearAndSetSemantics { description?.let { contentDescription = it }; if (role == "button") this.role = Role.Button }`.
      Verify: `npx expo prebuild --platform android --clean` on the Windows host lists the module
      in autolinking (`npx expo-modules-autolinking resolve --platform android | grep -i composesemantics`).
      Then `cd android && ./gradlew :app:compileDebugKotlin` succeeds. If no host is reachable,
      task 1.7's dispatched run is the compile proof.
- [x] 1.2 `src/components/chrome/compose-semantics.ts`: export
      `composeSemantics({ contentDescription, role }: { contentDescription: string; role?: "button" }): ModifierConfig`
      (the `ModifierConfig` type is imported from `@expo/ui/jetpack-compose/modifiers`). It returns
      `{ $type: "timecalendarSemantics", contentDescription, ...(role ? { role } : {}) }`. Export
      the type-string constant for the mock and the tests. Add
      `src/components/chrome/compose-semantics.test.ts` (shape with and without a role). Verify:
      `npx jest src/components/chrome/compose-semantics` passes.
- [x] 1.3 In `native-list.tsx` `ComposeListRow`, compose `contentDescription` from
      `[props.accessibilityLabel ?? defaultAccessibilityLabel(props), props.value, props.hint]`,
      dropping absent parts and joining with `", "`. Append
      `composeSemantics({ contentDescription, ...(interactive ? { role: "button" } : {}) })` as
      the **last** modifier, after `testID` and `clickable` (D1 ordering). iOS code is untouched.
      Verify: `git diff src/components/chrome/native-list.tsx` touches only `ComposeListRow` and
      imports.
- [x] 1.4 `jest/setup-expo-ui.ts`: in `selectableProps`, read the `timecalendarSemantics`
      modifier. Its `contentDescription` becomes `accessibilityLabel` and its `role` becomes
      `accessibilityRole`. A bare `clickable` no longer yields `"button"`; `selectable` (radio) and
      `toggleable` (switch) keep their roles. The Compose modifiers mock gains no entry: the config
      is a plain object. Verify: `npx jest src/components/chrome src/design/gallery
      src/features/calendar-sources src/features/about src/features/settings src/features/developer`
      passes, and `git diff main -- src/design/gallery/known-a11y-violations.ts` is empty.
- [x] 1.5 `native-list.test.tsx`, a new `describe("android row semantics")` with
      `usePlatform("android")`:
      - (a) an action row with `accessibilityLabel`, `value` and `hint` has `accessibilityRole`
        `"button"` and `accessibilityLabel` `"Name, Value, Hint"`;
      - (b) a navigation row with `label` and `subtitle` only reads `"Label, Subtitle"` with the
        role;
      - (c) a `kind="value"` row has the description and no role;
      - (d) a row without `hint` or `value` reads only its name;
      - (e) the `ListItem` element's raw `modifiers` (found through `UNSAFE_getByType` or the
        mock's passthrough) ends with the `timecalendarSemantics` entry, after the `testID` and
        `clickable` entries.

      Keep the existing assertions passing. Verify: `npx jest src/components/chrome/native-list`
      passes, and reverting task 1.3 makes (a) to (e) fail (inject-and-revert; record it for the PR).
- [x] 1.6 `.maestro/03-calendar-visibility.yaml`: after the first `extendedWaitUntil` on
      `user-calendar-row-e2e0e2e0-…0001`, add a `runFlow` with `when: platform: Android` whose
      command is `assertVisible: { id: "user-calendar-row-e2e0e2e0-0000-4000-8000-000000000001", text: ".*Opens this calendar.s settings.*" }`.
      Verify: `npx jest e2e` (including `maestro-selectors.test.ts`) passes, and the id set from
      0.1 is unchanged.
- [ ] 1.7 Native proof: after the branch is pushed, dispatch
      `gh workflow run ci-mobile-e2e.yml -f ref=feat/mobile-ds-list-row` (use
      switch to an account with write access if dispatch is refused). Record the run URL. Verify: the
      Android job builds and flow 03 passes, including the new assertion. A packageRelease infra
      flake is re-run once before it is treated as a failure. If the run cannot be dispatched, keep
      this box open and note it in the PR body; the inbox note covers the device check.

## 2. Tokens, palette and glyph (D5, D6)

- [x] 2.1 Add `ListGeometry` to `src/theme/tokens.ts`, after `Spacing`, exactly as in D5. Export it
      from `src/theme/index.ts`. In `theme.test.tsx`, pin every value and assert that
      `ListGeometry.ios.groupedRadius` is `{ glass: 26, legacy: 10 }`. Verify:
      `npx jest src/theme` passes.
- [x] 2.2 `native-list.tsx`: replace `OUTER_RADIUS`, `INNER_RADIUS`, `SEGMENT_GAP` and
      `LIST_INSET` with `ListGeometry.android.outerRadius`, `.innerRadius`, `.segmentGap` and
      `.listInset`, and delete the four constants. Verify: `npx jest src/components/chrome/native-list`
      passes with its corner and padding assertions unchanged.
- [x] 2.3 `src/components/chrome/list-palette.ts`: `useListPalette()` as specified in D6.
      - iOS returns `backgroundElement`, `text` and `textSecondary` from `useTheme()`.
      - Android calls `getMaterialColors({ scheme, seedColor: theme.primary })` from
        `@expo/ui/jetpack-compose`, with the scheme from `@/hooks/use-color-scheme`, through a
        module `Map` cache keyed `${scheme}:${seed}`. It returns `surfaceContainer`, `onSurface`
        and `onSurfaceVariant`.
      - Export it from `src/components/chrome/index.ts`.
      - Add `getMaterialColors` to the `@expo/ui/jetpack-compose` mock if it is missing. It
        returns the existing `palette`.
      - Write `list-palette.test.ts`: iOS values per scheme; on Android, the palette values and one
        `getMaterialColors` call across two renders with the same scheme and a second call after
        a scheme change; iOS never calls it.

      Verify: `npx jest src/components/chrome/list-palette` passes.
- [x] 2.4 Add `check: 0xe5ca` to `MATERIAL_GLYPHS` (`src/design/icon/icon-glyphs.ts`). The pin
      test in `icon.test.tsx` covers it through its table loop; if that loop is not
      table-driven, add a case. Verify: `npx jest src/design/icon` passes.

## 3. Primitives (`src/design/list/`, D4, D7–D10)

- [x] 3.1 `separator.tsx`: `Separator` and `SeparatorProps` per D7. Use the `separator` color,
      `StyleSheet.hairlineWidth` on iOS and 1 on Android, and insets from `ListGeometry`. Hide it
      with `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`.
      `separator.test.tsx` covers both platforms, every inset (`leading` = 16;
      `{ leadingWidth: 40 }` = 16 + 40 + 16) and the hidden props. Verify:
      `npx jest src/design/list/separator` passes.
- [x] 3.2 `list-row.tsx`: `ListRow`, `ListRowProps`, `ListRowLeading`, `ListRowOverline`,
      `ListRowPosition`, `ListRowLayoutStyle` (an alias of `ButtonLayoutStyle`), `listRowPosition`,
      `ListRowSeparator` and a private `ListRowPositionContext` (exported by leaf path for
      `list-section.tsx` only). Implement D4 (props union), D7 (grouped vs plain, the per-row iOS
      separator in grouped mode), D8 (iOS `backgroundSelected` while pressed, Android foreground
      ripple with `overflow: "hidden"`, disabled at `StateOpacity.disabled`), D9 (line caps,
      accessibility-size stack, single-word `adjustsFontSizeToFit` + `minimumFontScale={0.5}`)
      and D10 (semantics). Return one flattened style object from the `Pressable` style callback.
      Colors come from `useListPalette()` for grouped rows and `useTheme()` for plain rows; there
      is no other color source. Import chrome through `@/components/chrome` and design leaves by
      path (`@/design/icon/icon`, `@/design/text/themed-text`, `@/design/button/button` for the
      layout style type). Verify: `npx tsc --noEmit` passes, and `npx jest src/design/import-graph`
      and `npx jest tools/eslint-rules` pass.
- [x] 3.3 `list-row.test.tsx` (`describe.each(["ios", "android"])`). It covers:
      - minimum height and padding from `ListGeometry`;
      - grouped corners and gap per position on Android (20/4/2), iOS radius per
        `Platform.Version` (mock 26 and 18), and the iOS separator on non-last rows only;
      - surface and text colors (Android `#surfaceContainer`/`#onSurface`, iOS theme tokens);
      - plain rows with no surface;
      - press: `onPress` called and `href` → `router.push` (mock `expo-router`), iOS pressed
        background, Android `android_ripple`;
      - disabled: no call, opacity, state;
      - the composed `accessibilityLabel` (overline, label, subtitle, details) and the explicit
        override, `accessibilityValue`, `accessibilityHint`, selected/disabled state, role
        `button`;
      - a static row: no role, one accessible text element, the accessory reachable;
      - the chevron only on iOS, the check on both after the value;
      - a hidden leading element;
      - `numberOfLines` on every text (8/8/4/2, never `ellipsizeMode="clip"`);
      - font scale 1.0 vs 3.571 (mock `useWindowDimensions`), where the value moves under the
        label;
      - a single-word label at an accessibility size gets `adjustsFontSizeToFit`;
      - `ListRowSeparator`: a `Separator` on iOS, `null` on Android;
      - `listRowPosition(0,1)`, `(0,3)`, `(1,3)` and `(2,3)`;
      - type tests: `@ts-expect-error` on `onPress` + `trailing={<Button …/>}`, on
        `onPress` + `href`, on `style={{ backgroundColor: "red" }}`, and on `hint` without
        activation;
      - no duplicate of `listRowPosition` in the seam: `native-list.tsx` imports it from the leaf
        `@/design/list/list-row-position`, so no agreement test is needed.

      Verify: `npx jest src/design/list/list-row --coverage --collectCoverageFrom=src/design/list/list-row.tsx`
      shows at least 90% lines and branches.
- [x] 3.4 `list-section.tsx`: `ListSection` and `ListSectionProps` (`title?`, `footer?`,
      `testID?`, `style?` layout-only, children). It filters non-element children, provides each
      row's position through `ListRowPositionContext`, and renders the title (`accessibilityRole="header"`,
      iOS `footnote` secondary, Android `label` `action` tone, `${testID}-title`) and the footer
      (`footnote` secondary, `${testID}-footer`). It adds no horizontal margin.
      `list-section.test.tsx` covers positions for 1 to 3 rows with `null` children skipped, the
      title role and styles per platform, the footer, the absent title, and that a row's explicit
      `position` loses to the section context. Verify: `npx jest src/design/list/list-section`
      passes at 90%.
- [x] 3.5 Export from `src/design/index.ts`: `ListRow`, `ListRowSeparator`, `listRowPosition`, the
      types `ListRowProps`, `ListRowLeading`, `ListRowOverline`, `ListRowPosition` and
      `ListRowLayoutStyle`, then `ListSection`, `ListSectionProps`, `Separator` and
      `SeparatorProps`. In `jest.config.js`, add 90% lines/branches tiers for
      `src/design/list/list-row.tsx`, `list-section.tsx` and `separator.tsx`, and for
      `src/components/chrome/compose-semantics.ts` and `list-palette.ts`. Verify:
      `npx jest src/design/gallery/fixture-coverage` fails until group 4 lands, then passes.

## 4. Gallery (D13)

- [x] 4.1 Create `list-row.gallery.tsx` (meta `list-row`, stories `Plain`, `Grouped`, `States`,
      `Leading`, `Static`, `Overline`, `LongStrings`), `list-section.gallery.tsx` (meta
      `list-section`, stories `Titled`, `Single`, `SeamComparison`, `LongStrings`) and
      `separator.gallery.tsx` (meta `separator`, story `Insets`). Every fixture testID starts with
      `gallery-list-row-`, `gallery-list-section-` or `gallery-separator-`. Interactive stories show
      `gallery.pressCount`. `LongStrings` uses `gallery.stress.title`, `.body`, `.word` and
      `.action` in every slot and a caption from `useIsAccessibilityTextSize()`.
      `SeamComparison` puts the `ListSection` in a `View` above a `flex: 1` `NativeList` with
      `NativeListSection`/`NativeListRow` carrying the same labels, subtitle, value and hint.
      Fixtures import primitives from `@/design`, chrome from `@/components/chrome`, and types from
      `@/design/gallery` with `import type`. Add `gallery.listRow.*`, `gallery.listSection.*`
      and `gallery.separator.*` keys to `src/i18n/locales/en.json` and `fr.json` (FR strings in
      French, no placeholder English). Verify: `npx tsc --noEmit` passes (typed key parity).
- [x] 4.2 Register `listRow`, `listSection` and `separator` in `src/design/gallery/registry.ts`
      after `dateTimeField`. Add colocated `list-row.gallery.test.tsx` (the press count
      increments, and the `Static` accessory press is counted without activating the row) and
      `list-section.gallery.test.tsx` (`SeamComparison` renders both lists on both platforms).
      Verify: `npx jest src/design` passes, including the `registry.test.ts` render and a11y matrix
      (light/dark × iOS/Android), `stories.test.ts`, the orphan and id checks and
      `fixture-coverage.contract.test.ts`; and `git diff main -- src/design/gallery/known-a11y-violations.ts`
      is empty.

## 5. Call sites (D11)

- [x] 5.1 Timezone chooser (`settings/ui/timezone-chooser-screen.tsx`): render `ListRow` per the
      D11 row, with `ItemSeparatorComponent={ListRowSeparator}`. Delete the `row`, `labelColumn`,
      `valueColumn`, `pressed` and `disabled` styles and the `borderColor` read. Remove
      `settings.timezone.selected` from both locale files. Update
      `timezone-chooser-screen.test.tsx`: the name `"City, Territory"`, the offset as
      `accessibilityValue`, the selected state and check on the active zone (no "Selected" text),
      and the disabled state on an unavailable zone. Verify:
      `npx jest src/features/settings` passes, and `rg -n "timezone.selected" src` is empty.
- [x] 5.2 School picker: `school-row.tsx` renders `ListRow` with
      `leading={{ element: <SchoolLogo …/>, width: LogoSize }}`, `trailing="chevron"`, the same
      `hint`, `onPress` and `testID`, and `label={school.name}` with no `accessibilityLabel`, so
      the name stays exact. Delete its `Pressable`, styles and the `Platform` branch. In
      `school-picker-screen.tsx`, set `ItemSeparatorComponent` to a module-level
      `SchoolRowSeparator = () => <ListRowSeparator leadingWidth={LogoSize} />` and drop the
      `Platform.OS` ternary. `git rm src/features/school-selection/ui/row-separator.tsx`. Remove
      `school-row.tsx` from `tools/eslint-rules/raw-button-allowlist.js` and set
      `RAW_BUTTON_ALLOWLIST_CEILING` to 13. Update `school-picker-screen.test.tsx`: the accessible
      name equals the school name, and the separator is present on iOS and absent on Android.
      Verify: `npx jest src/features/school-selection tools/eslint-rules` passes.
- [x] 5.3 Hidden events (`hidden-events/ui/hidden-events-screen.tsx`): each group is a
      `ListSection` (`hidden-events-name-section` / `hidden-events-uid-section`) whose `title` is
      the existing section key, and the rows are static `ListRow`s (`hidden-events-name-${name}` /
      `hidden-events-uid-${uid}`) with the existing "Unhide" `Button` as `trailing`. Delete
      `HiddenRow`, the `row`/`rowText` styles and the `Radii` import. Update its test: the title
      has the header role, the row text is one element, and Unhide still un-hides by name and by
      uid. Verify: `npx jest src/features/hidden-events` passes.
- [x] 5.4 Activity (`activity/ui/activity-screen.tsx`): `ActivityItemRow` renders `ListRow` per
      D11. `position` = `listRowPosition(index, section.data.length)` from `renderItem`'s
      `{ index, section }`. `href` = `/event-details/${uid}` for new and changed; cancelled is
      static. `accessibilityLabel` joins the existing kind label (`activity.item.<kind>.accessibilityLabel`
      for new/changed; for cancelled, the kind word and title), the time and each
      `activity.change.spoken` line with `", "`. Drop the content-container `gap` and the `item`
      style. Update `activity-screen.test.tsx`: the testIDs are unchanged, a changed item's name
      contains the spoken change, a cancelled item has no button role, and activation pushes the
      details route. Verify: `npx jest src/features/activity` passes.
- [x] 5.5 Personal events list: `EventRow` renders `ListRow` per D11 (`href`, chevron, swatch
      element width 24, `position` from `renderItem`'s `index` and `events.length`, unchanged
      `accessibilityLabel` and `hint`). Remove `Link asChild` and its flatten workaround. Drop
      `gap` from the list style. Update `personal-events-list.test.tsx` for navigation through
      `router.push` and the unchanged name and hint. Verify:
      `npx jest src/features/personal-events` passes.
- [x] 5.6 Provider selection: rows render `ListRow` per D11 (thumbnail element width 56 with its
      `onError` handler kept, the image-unavailable `subtitle`, chevron, the same name and hint,
      `position`). Drop the content-container `gap`, set a bottom margin on the `PageIntro` header,
      and delete the `provider`, `thumbnail` border and `label` styles. Update
      `guide-screens.test.tsx` selectors and assertions. Verify:
      `npx jest src/features/export-guides` passes.
- [x] 5.7 Leave `school-group-picker-screen.tsx`, `home/**` and `calendar/**` untouched. Verify:
      `git diff --stat main -- src/features/school-selection/ui/school-group-picker-screen.tsx src/features/home src/features/calendar`
      is empty.

## 6. Lint: `local/no-ad-hoc-separator` (D12)

- [x] 6.1 Create `tools/eslint-rules/no-ad-hoc-separator.js`. The header comment holds the
      rationale and links lint-format.md → Lists and ADR 073. Use `meta.type: "problem"`, message
      id `adHocSeparator` and the D12 message. Visit `Property` nodes whose key name (identifier
      or string literal) is `borderBottomWidth`, `borderTopWidth` or `height` and whose value is
      the `MemberExpression` `StyleSheet.hairlineWidth`. Register it in `tools/eslint-rules/index.js`.
      Write `no-ad-hoc-separator.test.js` (RuleTester with `tsParser` and JSX, in the style of
      `no-raw-text-input.test.js`).
      - valid: `borderWidth: StyleSheet.hairlineWidth`, `height: 1`, `width: StyleSheet.hairlineWidth`
        and `Math.max(h, StyleSheet.hairlineWidth)`.
      - invalid: each of the three keys, a quoted key (`"height"`), and the property inside
        `StyleSheet.create({ a: { … } })` and inside an inline style object.

      Verify: `npx jest tools/eslint-rules/no-ad-hoc-separator` passes.
- [x] 6.2 Create `tools/eslint-rules/ad-hoc-separator-allowlist.js` (`adHocSeparatorAllowlist =
      ["src/features/home/ui/today-timeline.tsx", // 5.9 Home timeline divider]`) and
      `ad-hoc-separator-allowlist.test.js`, a copy of `raw-text-input-allowlist.test.js` with
      `AD_HOC_SEPARATOR_ALLOWLIST_CEILING = 1` and the new rule. In `eslint.config.js`, add the
      block `timecalendar/ad-hoc-separator` (`files: ["src/**/*.{ts,tsx}"]`; `ignores`:
      `src/design/**`, `src/theme/**`, `src/features/calendar/renderer/**`, `**/*.test.{ts,tsx}`,
      `...adHocSeparatorAllowlist`; `plugins: { local: localRules }`;
      `rules: { "local/no-ad-hoc-separator": "error" }`) with a one-line why comment. Add the name
      to the block list in lint-format.md (task 7.4). Verify: `npm run lint` passes with zero
      warnings, and `npx jest tools/eslint-rules` passes.
- [x] 6.3 Inject and revert, and record each result for the PR body:
      - (a) add `borderBottomWidth: StyleSheet.hairlineWidth` to a style in
        `src/features/settings/ui/timezone-chooser-screen.tsx`, and `npm run lint` fails naming the
        file and `local/no-ad-hoc-separator`;
      - (b) add `src/features/school-selection/ui/school-row.tsx` to the separator allowlist, and
        the allowlist test fails naming the stale entry;
      - (c) re-add `school-row.tsx` to `raw-button-allowlist.js`, and its test fails (stale, and
        over the ceiling of 13).

      Revert all three and confirm `git status` shows only intended changes.

## 7. Architecture Book, ADR and docs (`docs/mobile/architecture-book/`)

- [x] 7.1 Create `decisions/073-list-row-family.md` from `TEMPLATE.md` (use the number from 0.1),
      with status Accepted.
      - Context: the Compose semantics gap (installed `@expo/ui` modifier inventory) and the eight
        hand-built lists.
      - Decision: D1–D2 (local module and custom modifier, description order, button role), D4–D7
        (row contract, `ListGeometry` as the single geometry source, seeded palette on Android,
        grouped/plain split), D12 (separator ratchet, no row lint).
      - Rejected: patch-package, `onClick` label, `stateDescription`, non-clearing semantics,
        the `listSurface` sampled token, `title` naming, a raw-number separator inset, and a row
        heuristic lint.
      - Consequences: the Maestro Android assertion, the mock honesty, the group-picker
        deferral, and the inbox device pass.
      - Revisit if: Expo UI ships a role, content-description or click-label modifier (then delete
        the local module); or the seam's row and `ListRow` converge.

      Add the row to `decisions/README.md`, and add a one-line "Related: 073 (Android row
      semantics, shared geometry)" to ADR 072's Consequences in present tense. Verify:
      `rg -n "073" docs/mobile/architecture-book` (from the repo root) shows the index row and every
      link.
- [x] 7.2 `theming.md`:
      - Add `## Lists — ListRow, ListSection, Separator (src/design/list/)` after the Fields
        section. It covers the anatomy and props (D4), the geometry table from `ListGeometry` (D5),
        colors (D6), grouped vs plain and separators (D7), states (D8), scaling (D9), the gates
        (tests at 90% tiers, `local/no-ad-hoc-separator`, the gallery story ids) and the "no lint
        for rows" caveat.
      - In the native-list Android bullet, state that every row's Compose node carries one
        description (name, value, hint) and the button role on navigation/action rows through
        the `timecalendarSemantics` modifier from `modules/compose-semantics`, placed last.
        Geometry comes from `ListGeometry.android`.
      - Add `compose-semantics.ts` and `list-palette.ts` to the chrome bullets and the barrel
        bullet (`useListPalette`).
      - Add the Android semantics block of `native-list.test.tsx` to "What CI proves".

      Verify: `rg -n "ListRow|ListGeometry|timecalendarSemantics" docs/mobile/architecture-book/theming.md`
      shows each.
- [x] 7.3 `accessibility.md`:
      - Add `## Lists — encoded in ListRow`: one element per activatable row, the composed name,
        value, hint and derived state, the static row and accessory stops, the section header,
        the decorative separators, the 44/56 minimum, the line caps and AX-size stack.
      - Under Proof in CI, add the Android `NativeListRow` semantics and its Maestro assertion,
        and state that the Expo UI mock derives a role only from `selectable`, `toggleable` and
        `timecalendarSemantics`.
      - Link the inbox note `2026-10-26-mobile-ds-list-row-device-pass.md` in the screen-reader
        item.

      Verify: the new section exists and every link resolves.
- [x] 7.4 `lint-format.md`: add `timecalendar/ad-hoc-separator` to the block list at the top, and
      a rule-inventory entry `**Lists — local/no-ad-hoc-separator**` next to Fields. It covers the
      scope, ignores, allowlist and ceiling (1), the `borderWidth` exclusion, the variable caveat,
      the no-row-rule caveat and the 6.3 inject-and-revert proof. Change the raw-button entry's
      ceiling to 13. Verify: `rg -n "ad-hoc-separator|\(13\)" docs/mobile/architecture-book/lint-format.md`
      shows both.
- [x] 7.5 Update the rest:
      - `testing.md`: the Expo UI mock's role derivation, the 90% tiers for `src/design/list/*`
        and the two chrome modules, and the Android-only Maestro assertion in flow 03.
      - `features.md`: the gallery registry table gets the `list-row`, `list-section` and
        `separator` rows. The feature notes for Timezone, School selection, Hidden events,
        Activity, Personal events and Export guides render `ListRow`, and the group picker is
        unchanged.
      - `runtime.md`: the local Expo modules under `mobile/modules/` include `compose-semantics`
        (Android only, autolinked, depends on the `expo-ui` Gradle project; re-check its modifier
        registration on an `@expo/ui` bump).
      - `architecture.md`: add `list/` to the design family list.

      Verify: `rg -n "list-row|compose-semantics" docs/mobile/architecture-book` covers each file.
- [x] 7.6 `CHANGELOG.md`: add `## 2026-10-26 — List row family and Android row semantics` at the
      top. Bullets:
      - Android `NativeListRow` exposes name, value, hint and button role (theming.md, ADR 073).
      - `ListRow`/`ListSection`/`Separator` in `src/design/list/` with `ListGeometry` and
        `useListPalette` (theming.md → Lists).
      - The list a11y contract (accessibility.md → Lists).
      - `local/no-ad-hoc-separator`, and the raw-button ceiling at 13 (lint-format.md).
      - The migrated screens (features.md).

      Leave earlier entries as they are. Verify: the entry is first and every link resolves.
- [x] 7.7 Outside the Book: `docs/react-native-migration/inbox/2026-10-26-mobile-ds-list-row-device-pass.md`
      exists (written at planning). Update its story ids if any changed during implementation.
      Verify: every story id it names exists in `src/design/gallery/stories.ts` output
      (`npx jest src/design/gallery/stories` passes, and a grep of each id in the fixtures matches).

## 8. Verification

- [x] 8.1 `npx tsc --noEmit` passes.
- [x] 8.2 `npm run lint` passes with `--max-warnings 0`.
- [x] 8.3 `npm test -- --coverage` passes. That includes the 90% per-file tiers (the new list
      modules and chrome modules), the registry matrix with an unchanged known-violation list,
      `tools/eslint-rules` (new suites), the design import-policy and import-graph contracts, and
      `e2e/maestro-selectors.test.ts`. Record suite and test counts for the PR.
- [x] 8.4 `npm run react-compiler:check` and `npm run react-doctor:changed` pass (CI runs both).
- [x] 8.5 Selectors are unchanged:
      `grep -rhoE 'id: *"?[A-Za-z0-9_${}.-]+' .maestro | sort -u | diff /tmp/maestro-ids.before -`
      is empty (flow 03's new step reuses an existing id). Every file in `/tmp/row-ids.before`
      still contains its row testID prefix (`rg -n` for each prefix), except the deleted
      `row-separator.tsx`, which had none.
- [x] 8.6 From the repo root, `openspec validate mobile-ds-list-row` passes.
- [ ] 8.7 Android native compile and flow 03: covered by 1.1 (Windows host) or 1.7 (dispatched run).
      Record the evidence in the PR body.

## 9. Human device pass

- [ ] 9.1 VoiceOver and TalkBack pass, seam-comparison geometry, press feedback, large text, the
      migrated screens and Android overline contrast (HUMAN: see inbox/2026-10-26-mobile-ds-list-row-device-pass.md)
