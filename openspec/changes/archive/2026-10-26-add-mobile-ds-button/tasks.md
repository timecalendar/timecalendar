# Tasks

All commands run in `mobile/` unless stated. Decisions are D1–D12 in `design.md`. Await every RNTL
14 helper (`render`, `fireEvent`); no fake timers; `usePlatform` from `@/test-support/platform` for
platform branches; mock the scheme through `@/hooks/use-color-scheme`. Keep every existing
`testID` on a migrated control. No code comments except a non-obvious why. Docs describe the
current state only.

## 1. Contrast pairs

- [x] 1.1 In `src/theme/contrast.ts` add `["actionText", "backgroundElement", "body"]` and
      `["destructive", "backgroundElement", "body"]` (D2), and the matching lines with their
      ratios (light 5.16 / dark 4.78; light 5.75 / dark 9.37) in the `tokens.ts` contrast comment
      (BRAND and DESTRUCTIVE blocks). Verify: `npx jest src/theme` passes and the new pairs appear
      as computed cases; `design-tokens--contrast-pairs` lists them.

## 2. `Button` primitive

- [x] 2.1 Create `src/components/button.tsx` exporting `Button`, `ButtonProps`, `ButtonVariant`,
      `ButtonSize`, `ButtonIcon`, `ButtonLayoutStyle` per D2–D7: required `variant`, `size`
      (default `medium`), `label`, `onPress`, optional `accessibilityLabel` (default `label`),
      `accessibilityHint`, `accessibilityRole` (`"button" | "link"`, default `button`), `icon`,
      `iconPosition`, `disabled`, `busy`, `testID`, `style?: StyleProp<ButtonLayoutStyle>`.
      Tokens only (`MinTouchTarget`, `Spacing`, `Radii.large`, `StateOpacity`, `IconSize`,
      `useTheme`); label through `ThemedText` `type`/`tone`, `numberOfLines={16}`; icon through
      `Icon` with `scaling="text"`; Android `android_ripple` `{ color: theme.ripple, foreground:
      true }` + `overflow: "hidden"`, iOS pressed opacity + `borderCurve: "continuous"`; the style
      callback returns `StyleSheet.flatten([base, size, variant, state, style])`. Add any missing
      glyph to `src/components/icon-glyphs.ts`. Verify: `npx tsc --noEmit`.
- [x] 2.2 Create `src/components/button.test.tsx`, `describe.each` over iOS and Android, both
      schemes where colors are asserted:
      - every variant's fill / border / label color equals its D2 tokens (`Colors.light` and
        `Colors.dark`);
      - every size: `minHeight` and `minWidth` ≥ `MinTouchTarget` (equal for small/medium,
        `MinTouchTarget + Spacing.two` for large), label `type` per D3;
      - role `button` by default, `link` when declared; `accessibilityLabel` defaults to the label,
        overrides when given; hint passes through;
      - disabled: `onPress` not called, `toBeDisabled()`, `accessibilityState`
        `{ disabled: true, busy: false }`, opacity `StateOpacity.disabled`, no `android_ripple`;
      - busy: `onPress` not called, `accessibilityState` `{ disabled: true, busy: true }`,
        `accessibilityLabel` still the label, the label text still rendered, `${testID}-progress`
        sits in a wrapper hidden from assistive technology (`accessibilityElementsHidden`, `no-hide-descendants`) and is hidden (`includeHiddenElements`), the icon is not rendered;
      - pressed on iOS → opacity `StateOpacity.pressed` (call the style function with
        `{ pressed: true }`); on Android → opacity 1 and `android_ripple.color === theme.ripple`;
      - style merges last: `style={{ alignSelf: "flex-end", width: 120 }}` survives in the
        flattened style; the host `style` is a plain object (not an array);
      - icon: leading renders before the label, `trailing` after, color equals the label color;
      - type test: `// @ts-expect-error` for `style={{ backgroundColor: "red" }}`,
        `{ minHeight: 1 }`, `{ opacity: 1 }`, and a missing `variant` (checked by `tsc`).
      Verify: `npx jest src/components/button.test.tsx --coverage --collectCoverageFrom=src/components/button.tsx`
      reports ≥ 90% lines and branches.
- [x] 2.3 In `jest.config.js` add `"src/components/button.tsx": { lines: 90, branches: 90 }` to
      `coverageThreshold` (with the other per-path keys); update `jest.config.test.ts` if it pins
      the threshold keys. Verify: `npx jest jest.config.test.ts`.

## 3. Gallery fixture and strings

- [x] 3.1 In `src/i18n/locales/en.json` and `fr.json` add the D11 `gallery.button.*` keys and
      remove `gallery.primaryAction.*`. Verify: FR/EN parity test passes (`npx jest src/i18n`).
- [x] 3.2 Create `src/components/button.gallery.tsx` per D11 (meta `button`; stories `Filled`,
      `Tonal`, `Outlined`, `Text`, `Destructive`, `Icons`, `LongStrings`) inside `RootPage` with a
      scroll body; testIDs `gallery-button-*`; every label translated, duplicates disambiguated by
      `gallery.button.a11y`. Create `button.gallery.test.tsx` (enabled press increments the
      counter; disabled and busy do not; busy exposes busy+disabled and keeps its label). Verify:
      `npx jest src/components/button.gallery.test.tsx`.
- [x] 3.3 In `src/design/gallery/registry.ts` replace the `primaryAction` module with `button`
      (same position). Update `src/features/developer/ui/gallery-index-screen.test.tsx` story ids
      (`primary-action--*` → `button--*`) and any `known-a11y-violations.ts` entry naming
      `primary-action`. Verify: `npx jest src/design src/features/developer` (the registry matrix
      renders every button story light/dark × iOS/Android with role and label on every button).

## 4. Migrate `PrimaryAction` and delete it

- [x] 4.1 Replace `PrimaryAction` with `Button variant="filled"` (same props, D8) in
      `src/components/error-surfaces.tsx`, `src/components/keyboard-safe-action-layout.gallery.tsx`,
      `src/features/feedback/ui/feedback-screen.tsx`,
      `src/features/calendar-sources/ui/ical-url-screen.tsx`,
      `src/features/calendar-sources/ui/calendar-import-result-screen.tsx`,
      `src/features/onboarding/ui/institution-name-screen.tsx`,
      `src/features/onboarding/ui/programme-screen.tsx`,
      `src/features/export-guides/ui/guide-page-screen.tsx`. A caller `style` that is not
      layout-only is a type error: move layout keys into `style`, drop the rest. Verify:
      `npx tsc --noEmit`; `npx jest src/components src/features/feedback src/features/calendar-sources src/features/onboarding src/features/export-guides`.
- [x] 4.2 Delete `src/components/primary-action.tsx`, `primary-action.test.tsx`,
      `primary-action.gallery.tsx`, `primary-action.gallery.test.tsx`. Verify:
      `grep -rn "primary-action\|PrimaryAction" src` returns nothing except the `ErrorState`
      `primaryAction` prop; `npx tsc --noEmit`.

## 5. Migrate the slice 3.1 hand-rolled buttons (D9)

- [x] 5.1 Onboarding: `welcome-controls.tsx` (Skip `text small`, Next `text small` trailing arrow,
      final CTA `filled large`; drop `CONTROL_MIN_HEIGHT`, `textButton`, `nextButton`, `cta`
      styles), `connect-screen.tsx` (intranet `outlined` + `link` role + trailing icon, Back
      `outlined`, Continue `filled` with `style={{ flex: 1 }}`; drop `hitSlop`, `intranetLink`,
      `secondary`, `primary` styles), `manual-import-screen.tsx` (QR `filled` leading icon, URL
      `outlined` leading icon, hints kept), delete `stepStyles.cta`. Update the colocated tests to
      assert variant tokens (`Colors.light.actionText` on Skip/Next, `primaryStrong` fill on the
      CTA) and roles. Verify: `npx jest src/features/onboarding`.
- [x] 5.2 Changelog: `changelog-sheet-screen.tsx` Continue → `filled` with the hint; header Close
      stays (3.8). Verify: `npx jest src/features/changelog`.
- [x] 5.3 Personal events: `personal-event-actions.tsx` Save `filled busy={isSaving}`, Delete
      `destructive busy={isDeleting}`; `personal-events-list.tsx` Add → `tonal small` with
      `onPress={() => router.push("/personal-event-form")}` and no `Link` (D8). Update the list
      test (assert `router.push` instead of the `Link` stub) and the actions test (Delete exposes
      busy while deleting). Verify: `npx jest src/features/personal-events`.
- [x] 5.4 Hidden events: Unhide → `text small` with `accessibilityLabel={unhideLabel}`; drop the
      `unhide` style. Verify: `npx jest src/features/hidden-events`.
- [x] 5.5 Export guides: `guide-page-screen.tsx` Back → `outlined`; drop the `back` style.
      Verify: `npx jest src/features/export-guides`.
- [x] 5.6 Maestro selectors: `grep -rn` each migrated `testID` under `.maestro/` and confirm none
      changed; no flow edit expected (`.maestro/02-personal-event.yaml` uses
      `personal-event-delete`). Verify: `npx jest e2e/maestro-selectors.test.ts`.

## 6. Lint (Principle 1)

- [x] 6.1 In `eslint.config.js` add `rawTouchablesImportPath` (D10.1) to the `paths` built by
      `restrictedImports`, message pointing to `Button` in `@/components/button`. Inject-and-revert:
      add `import { TouchableOpacity } from "react-native"` to a feature file and to
      `src/hooks/use-color-scheme.ts`, confirm `npm run lint` fails on both, and that
      `import { useColorScheme } from "react-native"` in a feature file still fails (L1 intact);
      revert. Record the evidence in the PR.
- [x] 6.2 Create `tools/eslint-rules/no-raw-button.js` (D10.2), register it in
      `tools/eslint-rules/index.js`, and `no-raw-button.test.js` with RuleTester (TSX parser):
      invalid: `accessibilityRole="button"` + `ThemedText` child; `role="link"`; aliased
      `Pressable as P`; text child inside `{cond && <ThemedText/>}`; Icon + text children. Valid:
      text wrapped in `View`; function child; `Pressable` from another module; no role; role
      `"switch"`. Verify: `npx jest tools/eslint-rules/no-raw-button.test.js`.
- [x] 6.3 Add block `timecalendar/raw-button` (D10.3) and create
      `tools/eslint-rules/raw-button-allowlist.js` exporting `rawButtonAllowlist`: run lint with an
      empty list after §4–§5, collect every reported file, sort, and annotate each entry with the
      slice that removes it (3.3, 3.4, 3.6, 3.8, 5.x per proposal Out of scope). None of the §5
      files may appear. Verify: `npm run lint` passes.
- [x] 6.4 Create `tools/eslint-rules/raw-button-allowlist.test.js` (D10.3): each entry exists;
      linting each entry with only `local/no-raw-button` reports ≥ 1 problem;
      `rawButtonAllowlist.length <= RAW_BUTTON_ALLOWLIST_CEILING` (constant in the test, equal to
      the generated length). Inject-and-revert: add a migrated file (e.g.
      `src/features/hidden-events/ui/hidden-events-screen.tsx`) to the list and confirm the test
      fails naming it as stale; add a raw text button to a non-listed feature file and confirm
      `npm run lint` fails; revert both. Verify: `npx jest tools/eslint-rules`.

## 7. ADR and Architecture Book

- [x] 7.1 Write `docs/mobile/architecture-book/decisions/067-button-family.md` from
      `TEMPLATE.md` per D12 (re-check open PRs for a reserved number first, README note); add its
      row to `decisions/README.md`.
- [x] 7.2 `theming.md`: new section "Buttons — `Button` (`src/components/button.tsx`)" after the
      token layer: variant table (fill, boundary, label tone, platform reference), sizes,
      states, platform press feedback, layout-only `style` merged last, label wrap cap, icon slot,
      links to ADR 067, `button.test.tsx`, the lint rules and the gallery stories. Rewrite the
      `PrimaryAction` sentences in the root-page section (filled body/footer actions are
      `Button variant="filled"`).
- [x] 7.3 `accessibility.md`: a "Buttons — encoded in `Button`" entry (role/label/hint, busy keeps
      the label, `accessibilityState` derived from props, target ≥ `MinTouchTarget`, label scales
      uncapped and wraps to sixteen lines); rewrite the `PrimaryAction` sentence in "Accessible async
      status".
- [x] 7.4 `lint-format.md` rule inventory: the touchables ban and `local/no-raw-button` with its
      allowlist, ceiling test and the inject-and-revert caveat; `testing.md`: the per-file
      `button.tsx` threshold and the allowlist contract test; `features.md` → Design system gallery:
      `button` fixture replaces `primary-action`; `architecture.md` only if its structure bullets
      name `PrimaryAction` (they do not today).
- [x] 7.5 `CHANGELOG.md`: `## 2026-10-26 — Button family` at the top (primitive and variants,
      `PrimaryAction` removed, contrast pairs, lint ban + ratchet, gallery fixture, ADR 067).
      Verify: `npx prettier --check` on the changed docs; relative links resolve.

## 8. Local verification

- [x] 8.1 `npx tsc --noEmit` passes.
- [x] 8.2 `npm run lint` passes with zero warnings.
- [x] 8.3 `npm test -- --coverage` passes, including the `button.tsx` 90% tier, the theme tier,
      the registry matrix, the L10 fixture contract and the route-structure tests.
- [x] 8.4 `npm run test:timezones` passes (or the CI `test-mobile-timezones` job is green).
- [x] 8.5 `git diff --stat origin/main`: no `package.json`, `app.config.ts`, `eas.json`, native or
      route file change.

## 9. Device pass and CI

Device evidence (iPhone 17 Pro simulator, iOS 26.5, Metro dev build; Pixel_10 emulator, existing
dev APK): gallery stories filled, outlined, destructive, icons (covers tonal and text) in light;
long-strings in dark at `accessibility-extra-extra-extra-large`. The pass found the busy spinner
exposed to VoiceOver as a separate "In progress" element and the 3-line cap truncating labels at
AX XXXL; both fixed (hidden wrapper View, 16-line cap) and re-verified in the AX tree. Migrated
screens seen: personal-event list (Add) and form (Save, Delete), changelog sheet (Continue), hidden
events (empty state only, no Unhide row). Onboarding screens (welcome, connect, manual import,
programme, export guide) were not reachable: every route waits on the school list, and no backend
was reachable from the simulator. Android: filled story in dark, states and busy/disabled exposed
correctly, spinner hidden; ripple, 2.0 font scale and the migrated screens were not checked.

- [x] 9.1 iOS simulator (partial, see evidence above) (conductor device pass): development build of this branch; open
      `timecalendar-dev://developer/gallery/button--filled`, `button--tonal`, `button--outlined`,
      `button--text`, `button--destructive`, `button--icons`, `button--long-strings` in light and
      dark, at the default size and at `accessibility-extra-extra-extra-large`
      (`xcrun simctl ui booted content_size accessibility-extra-extra-extra-large`, then reopen the
      story). Check: no clipped or mid-glyph-cut label, wrapped labels inside the shape, targets
      ≥ 44pt, pressed dim, Accessibility Inspector shows label + "button"/"link" + dimmed/busy on
      disabled and busy buttons, icons not separate elements. Then the migrated screens: welcome,
      connect (listed school), manual import, programme, changelog sheet, personal-event form and
      list, hidden events, export guide page. Record findings in the PR; fix defects in this branch.
- [ ] 9.2 Android device pass (conductor, on the Windows host via `ssh pc`, never on the Mac): the
      same stories and screens in light and dark at font scale 1.0 and 2.0; ripple clipped to the
      shape, no opacity change on press, targets ≥ 48dp. Record findings in the PR.
- [ ] 9.3 CI green on the PR (`test-mobile` with coverage, `test-mobile-timezones`, lint).
- [ ] 9.4 Real VoiceOver and TalkBack pass on busy/disabled buttons and the migrated screens
      (HUMAN: see inbox/2026-10-26-mobile-ds-button-screen-reader-pass.md)
