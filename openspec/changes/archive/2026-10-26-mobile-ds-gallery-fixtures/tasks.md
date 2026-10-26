# Tasks

All commands run in `mobile/` unless stated. Decisions are D1–D11 in `design.md`. Await every
RNTL 14 helper (`render`, `fireEvent`); no fake timers; `usePlatform` for platform branches; no
`jest.restoreAllMocks()`. Do not edit any component file (`src/components/**/*.tsx` other than new
`*.gallery.tsx` / `*.gallery.test.tsx`, `src/features/**` other than the developer gallery
screens): a fixture that exposes a component defect goes to `known-a11y-violations.ts` or the
findings inbox note (§7). Fixture testIDs start with `gallery-`. Import shared components from
their public modules (`@/components/chrome`, `@/components/<file>`, `@/theme`), gallery types with
`import type … from "@/design"`.

## 1. Strings

- [x] 1.1 In `src/i18n/locales/en.json` and `fr.json` (D1, D10) add, for each of the eleven
      fixtures, `gallery.<meta>.title` and `gallery.<meta>.story.<story>` for every story in the
      D1 table (`<meta>` camelCase: `rootPage`, `emptyState`, `errorSurfaces`, `primaryAction`,
      `keyboardSafeActionLayout`, `themedText`, `numericEditor`, `glassSurface`, `menuView`,
      `dateTimePicker`, `designTokens`), the copy each fixture shows, the shared
      `gallery.stress.{title,body,action,word}` set (French lengths per D10) and the
      `gallery.designTokens.*Row` label templates. Verify: `npx tsc --noEmit` passes once §3–§4
      use the keys; the FR/EN parity check in the suite passes.

## 2. Contrast table as theme data

- [x] 2.1 Create `src/theme/contrast.ts` (D5): move `relativeLuminance`, `contrastRatio`, the
      `Floor`/`Pair` types and the `bothSchemes` / `perScheme` tables out of
      `src/theme/theme.test.tsx` unchanged, and export `contrastRatio`, `ContrastFloor`,
      `ContrastPair` and `documentedContrastPairs` (scheme-tagged rows). Make `theme.test.tsx`
      import them; keep every existing assertion. Update the `tokens.ts` doc comment's pointer to
      the table. Verify: `npx jest src/theme --coverage --collectCoverageFrom='src/theme/**'`
      passes the 90% tier and reports the same number of contrast-pair tests as before.

## 3. Fixtures for `src/components/`

- [x] 3.1 `src/components/root-page.gallery.tsx` per D1: `Default`, `CaptionOnly`,
      `ScrollsUnderHeader`, `ReadableLane`, `LongStrings`. Verify: `npx tsc --noEmit`.
- [x] 3.2 `src/components/empty-state.gallery.tsx` per D1: `Screen`, `ScreenWithArtwork`
      (`noDataArtwork` from `@/components/empty-state-artwork`), `Section`, `LongStrings`.
      Verify: `npx tsc --noEmit`.
- [x] 3.3 `src/components/error-surfaces.gallery.tsx` per D1 (meta `component: ErrorState`):
      `State`, `StateBusy`, `Notice`, `NoticeCompact`, `FieldError` (a `TextInput` with
      `accessibilityLabel` and `accessibilityDescribedBy`/`aria-describedby` pointing at the
      `FieldError` `nativeID`), `LongStrings`. Actions update a visible counter so presses are
      observable on device. Verify: `npx tsc --noEmit`.
- [x] 3.4 `src/components/primary-action.gallery.tsx` per D1: `Default` (press count text),
      `Disabled`, `Busy`, `LongStrings`; add `primary-action.gallery.test.tsx` (count increments on
      `Default`; `Disabled` and `Busy` ignore presses and expose `accessibilityState`). Verify:
      `npx jest src/components/primary-action.gallery.test.tsx`.
- [x] 3.5 `src/components/keyboard-safe-action-layout.gallery.tsx` per D1: `Default`,
      `FillsViewport`, `LongStrings`, composed as `RootPage` (function child) around
      `KeyboardSafeActionLayout` like `ical-url-screen.tsx`; every `TextInput` has an
      `accessibilityLabel`. Verify: `npx tsc --noEmit`.
- [x] 3.6 `src/components/themed-text.gallery.tsx` per D4: `Ramp` (exhaustive typed step list,
      size/lineHeight from `TypeRamp`), `Tones`, `LongStrings`. Verify: `npx tsc --noEmit`; adding
      a scratch step to `TypeVariant` makes the fixture fail to compile (revert).

## 4. Fixtures for `src/components/chrome/` and `src/theme/`

- [x] 4.1 `src/components/chrome/native-settings-numeric-editor.gallery.tsx` per D1/D3:
      `Default`, `ValidationError`, `LongStrings`, ids `gallery-numeric-editor-*`; add
      `native-settings-numeric-editor.gallery.test.tsx` (both platforms: Cancel and Submit close,
      the "open the editor" row reopens with the initial value; `ValidationError` shows the
      message). Verify: `npx jest src/components/chrome/native-settings-numeric-editor.gallery.test.tsx`.
- [x] 4.2 `src/components/chrome/glass-surface.gallery.tsx` per D1/D3: `Regular`, `Clear`,
      `InteractiveButton` (labelled `Pressable` with `accessibilityRole="button"`, press count),
      `LongStrings`. Verify: `npx tsc --noEmit`.
- [x] 4.3 Read `node_modules/@expo/ui/src/community/menu/MenuView.ios.tsx` and
      `MenuView.android.tsx`; align the `@expo/ui/community/menu` mock in
      `jest/setup-expo-ui.ts` with what each platform exposes (D8), changing only the wrapper's
      semantics. Verify: `npx jest src/features/calendar` and the full suite stay green.
- [x] 4.4 `src/components/chrome/menu-view.gallery.tsx` per D1/D3: `Default`, `States`,
      `LongStrings`; add `menu-view.gallery.test.tsx` (selecting an action updates the trigger's
      label and text). Verify: `npx jest src/components/chrome/menu-view.gallery.test.tsx`.
- [x] 4.5 `src/components/chrome/date-time-picker.gallery.tsx` per D1/D3: `Date`, `Time`,
      `Bounded` (both platforms), `DateTime` and `Disabled` (`platforms: ["ios"]`); fixed
      wall-clock value; Android row + dialog with translated button labels; add
      `date-time-picker.gallery.test.tsx` (Android: a pick updates the row value, the row reopens
      the dialog; iOS: the inline control changes the value). Verify:
      `npx jest src/components/chrome/date-time-picker.gallery.test.tsx`.
- [x] 4.6 `src/theme/tokens.gallery.tsx` per D5: meta `design-tokens` with its own `TokenSwatch`
      component; `Colors`, `ContrastPairs` (from `documentedContrastPairs`), `Spacing`, `Radii`,
      `IconSizes`, `Elevation`; every row one accessible element with a translated label; no
      color literal (values come from `Colors` / `Elevation`). Verify: `npx tsc --noEmit`.

## 5. Registry and matrix

- [x] 5.1 Register the eleven modules in `src/design/gallery/registry.ts` in the D1 order. Verify:
      `npx jest src/design/gallery/registry.test.ts` passes; every new story renders light/dark ×
      iOS/Android with no React error and no unlisted violation.
- [x] 5.2 For any violation 5.1 reports that is a real component gap (not a fixture or mock
      mistake), add a typed entry to `src/design/gallery/known-a11y-violations.ts` linking
      `docs/react-native-migration/inbox/2026-10-25-mobile-gallery-fixtures-findings.md` and
      describe it in that note (§7). Fix fixture mistakes in the fixture. Verify: registry test
      green; `git diff src/components src/features` shows no component change.
- [x] 5.3 Update `src/features/developer/ui/gallery-index-screen.test.tsx`: section ids and story
      ids in registry order, with iOS-only stories (`date-time-picker--date-time`,
      `date-time-picker--disabled`) absent on Android and the Android-only native-settings
      stories absent on iOS. Verify: `npx jest src/features/developer`.
- [x] 5.4 Create `src/design/gallery/fixture-coverage.contract.test.ts` (D9, L10): every `.tsx`
      under `src/design/` outside `galleryInfrastructure = ["gallery/story-content.tsx"]` needs a
      sibling `.gallery.tsx` and `.test.tsx`; every helper entry must exist. Inject-and-revert:
      add a scratch `src/design/scratch.tsx` and confirm the test fails naming it; rename the
      helper entry and confirm it fails; revert both. Verify:
      `npx jest src/design/gallery/fixture-coverage.contract.test.ts`.

## 6. Back from a deep-linked story

- [x] 6.1 Create `src/features/developer/ui/gallery-anchor.ts` (D6): pure
      `withGalleryIndexBeneath(state)` returning the reset payload (index route inserted beneath
      the focused story, existing route keys kept, `index + 1`) or `undefined` when the route
      beneath is already `developer/gallery`; and `useGalleryIndexAnchor(enabled)` using
      `useNavigation()` from `expo-router` that applies it once on mount. Add
      `gallery-anchor.test.ts` (cold `[(tabs), story]`, warm `[(tabs), about, story]`, already
      anchored, disabled). Verify: `npx jest src/features/developer/ui/gallery-anchor.test.ts`
      with 100% branches on `gallery-anchor.ts`.
- [x] 6.2 Call `useGalleryIndexAnchor` from `gallery-story-screen.tsx` before the early returns,
      enabled only when the gate passes and the entry resolves. Add `useNavigation` to the
      `expo-router` mocks in `gallery-story-screen.test.tsx`, `gallery-index-screen.test.tsx` (if
      it renders the hook) and `developer-routes.contract.test.tsx`; assert `reset` is called for
      a deep-linked state, not for an index-opened state, and not on redirect or production.
      Verify: `npx jest src/features/developer`.
- [ ] 6.3 (HUMAN: conductor device pass, see inbox/2026-10-25-mobile-gallery-fixtures-findings.md item 1) iOS simulator (Mac): on a development build of this branch, open
      `timecalendar-dev://developer/gallery/primary-action--busy` cold (app killed) and warm (app on
      the Calendar tab); Back shows the gallery index, Back again shows the tab; opening a story
      from the index and going Back leaves one index (a second Back reaches Developer). Record the
      result in the PR description. Android is part of the conductor's device pass.

## 7. Text-size change investigation

- [x] 7.1 iOS simulator per D7 (conductor device pass, iOS 26.5): a live switch from `large` to
      `accessibility-extra-extra-extra-large` clips `themed-text--ramp` and the Home tab alike
      (React Native rows keep their old heights); the SwiftUI Settings screen and the native
      navigation bar title re-lay out; reopening or a cold launch renders correctly. App-wide
      React Native behavior, not the gallery screen or `NativeSettingsHeader`: no code change
      here, evidence in inbox/2026-10-25-mobile-gallery-fixtures-findings.md item 2.
- [x] 7.2 Write `docs/react-native-migration/inbox/2026-10-25-mobile-gallery-fixtures-findings.md`
      (`For:` the device-pass owner): the 7.1 evidence (live Dynamic Type change not re-measuring
      React Native text app-wide) and how to verify it on device; plus every violation added in 5.2 and anything the new fixtures show
      on the simulator (clipping, wrapping, missing labels). Never file outside the inbox. Verify:
      the note exists and every `known-a11y-violations.ts` entry added here links it.

## 8. Architecture Book

- [x] 8.1 `docs/mobile/architecture-book/features.md` → Design system gallery: list the fixture
      inventory (file, meta id, stories), the platform-scoped stories, the token page reading
      `documentedContrastPairs`, and that `DateTimeField` has no fixture until it moves to
      `src/design/` (B-7). Current state only.
- [x] 8.2 `navigation.md` → Component gallery: replace "A cold deep link puts `(tabs)` beneath the
      story, so Back returns to the tabs" with the D6 behavior and its test
      (`gallery-anchor.test.ts`); keep the layout-less rule.
- [x] 8.3 `theming.md` (contrast gate bullet and proof list) and `accessibility.md` (color
      contrast line): the table and helper live in `src/theme/contrast.ts`, asserted by
      `theme.test.tsx`, and drawn by `design-tokens--contrast-pairs`. `testing.md` → gallery
      bullets: the L10 `fixture-coverage.contract.test.ts` and the per-fixture
      `*.gallery.test.tsx` convention for stateful fixtures. `accessibility.md` known-violations
      paragraph if 5.2 added entries.
- [x] 8.4 `docs/mobile/architecture-book/CHANGELOG.md`: dated `## 2026-10-25 — Gallery fixtures
      for shared components` entry at the top (fixtures, contrast table location, Back-to-index,
      L10 gate, mock alignment). Verify: `npx prettier --check` on the changed docs if the repo
      formats Markdown; links resolve.

## 9. Verification

- [x] 9.1 `npx tsc --noEmit` passes.
- [x] 9.2 `npm run lint` passes with zero warnings (`--max-warnings 0`), including the boundaries
      rules for the new fixtures and `src/theme/tokens.gallery.tsx`.
- [x] 9.3 `npm test -- --coverage` passes, including the 90% tiers for `src/theme/**` and
      `src/design/gallery/*.ts`, the registry matrix, the L10 contract and the route-structure
      tests.
- [x] 9.4 `git diff --stat origin/main` shows no change under `src/components/**` except new
      `*.gallery.tsx` / `*.gallery.test.tsx` files, and none under `src/features/**` except the
      developer gallery files; no `package.json`, `app.config.ts` or `eas.json` change.
- [ ] 9.5 CI green on the PR (`test-mobile` and the E2E lanes).
