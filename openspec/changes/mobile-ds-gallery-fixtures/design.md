# Design

## Context

See proposal.md for motivation. The state this change builds on:

- **Gallery core** (ADR 064, `src/design/gallery/`): `types.ts` (`GalleryMeta<P>` with `id`,
  `title`, `component`, `stories`; `GalleryStory<P>` with `name`, `args?`, `render?`,
  `platforms?`), `registry.ts` (explicit `import * as x from "@/…gallery"` list, the regex in
  `registry.test.ts` reads it), `stories.ts` (`toStoryId`), `story-content.tsx`
  (`GalleryStoryContent` renders `render(args)` inside a `flex: 1` View), and
  `known-a11y-violations.ts` (must-not-grow list, each entry linked to an inbox note).
  `registry.test.ts` renders every story light/dark × iOS/Android under the suite-wide native
  mocks and fails on a React error, an interactive host element without role and label, or a text
  input without label.
- **Routes**: `src/app/developer/gallery.tsx` and `src/app/developer/gallery/[story].tsx` are
  layout-less root Stack siblings of `developer.tsx` (the `user-calendars` shape).
  `settings-route-structure.test.ts` asserts no `_layout.tsx` under `src/app/developer/` or
  `src/app/developer/gallery/`; `navigation.md` states "never add `developer/_layout.tsx` or
  `developer/gallery/index.tsx`". The root Stack's `unstable_settings.initialRouteName` is
  `(tabs)`, so a cold deep link to a story gives the stack `[(tabs), story]`, and a warm one gives
  `[(tabs), …, story]`. Back from the story therefore leaves the gallery (device-pass finding 3).
- **Boundaries**: B-7 (`eslint.config.js`) forbids `src/design/**` from importing features or
  routes, so the registry cannot import a fixture that lives under `src/features/`. The registry
  already deep-imports fixtures from `src/components/chrome/` (the `timecalendar/design-home`
  opt-out). `no-multi-component-file` is off for `src/**/*.gallery.tsx` (lint-format.md).
- **Coverage**: `src/theme/**` is in the 90% lines + branches tier; `src/components/**` sits in
  the 70% global pool. CI runs `npm test -- --coverage`.
- **Contrast data**: the WCAG `contrastRatio` helper and the documented pair table live inside
  `src/theme/theme.test.tsx`, so app code cannot read them.
- **Device-pass finding 2**: changing the content size while `native-settings--long-strings` is
  on screen clips the header title and intro to their old heights; a cold launch at the same size
  lays out correctly. That header is `NativeSettingsHeader`
  (`src/components/chrome/native-settings-header.tsx`): React Native content inside
  `RNHostView matchContents` inside a SwiftUI `List` row on iOS (`ComposeRNHostView` in a Compose
  `Row` on Android). The live device check (D7) shows the same clip on plain React Native screens,
  so the cause is not this header.
- **Concurrent work**: `fix/mobile-a11y-device-findings` changes shared rows, onboarding, the date
  field, color swatches and Android dialogs. This change does not edit any component.

## Goals / Non-Goals

**Goals:**

- One fixture per shared primitive the roadmap lists, each with a default story, a longest-French
  story where the component shows copy, and one story per state the component exposes.
- A typography page and a token page that read the live `TypeRamp`, `Colors`, contrast table and
  scales, so they never drift from the code.
- Back from any story returns to the gallery index.
- A finding about the header clip, with evidence, in the inbox.
- L10 armed for `src/design/**`.

**Non-Goals:**

- Editing a component to make a fixture pass. A violation goes to `known-a11y-violations.ts` with
  an inbox link; a rendering defect goes to the inbox note.
- A fixture for the personal-events `DateTimeField` (D2).
- Any gallery feature beyond the index and story route (ADR 064 frozen scope): no controls, no
  story switcher, no scheme toggle inside a story.
- Device and screen-reader passes on the new fixtures (the conductor runs them separately with
  the accessibility.md recipe).

## Decisions

### D1. Fixture inventory and story ids

Meta ids are the component file's base name. Story export names are PascalCase; ids follow
`toStoryId`. Copy keys live under `gallery.<camelCase meta>.*`; the meta title is
`gallery.<camelCase meta>.title` and each story name `gallery.<camelCase meta>.story.<camelCase
export>`. Every fixture component holds its own state (the `native-settings.gallery.tsx`
pattern), so `render: () => <XFixture />`; `args` is not used.

| File | Meta id / `component` | Stories (export → id suffix) |
| --- | --- | --- |
| `src/components/root-page.gallery.tsx` | `root-page` / `RootPage` | `Default` (PageIntro title + caption + body, `standard` lane), `CaptionOnly` (caption-only intro, the native header is the heading), `ScrollsUnderHeader` (`RootPage scrollsUnderHeader` around a `ScrollView` with `contentInsetAdjustmentBehavior="automatic"` and enough paragraphs to scroll), `ReadableLane` (`lane="readable"`), `LongStrings` |
| `src/components/empty-state.gallery.tsx` | `empty-state` / `EmptyState` | `Screen`, `ScreenWithArtwork` (`noDataArtwork`), `Section` (inside a `RootPage` under a section heading), `LongStrings` (screen variant with artwork) |
| `src/components/error-surfaces.gallery.tsx` | `error-surfaces` / `ErrorState` | `State` (title, message, primary Retry, secondary text action), `StateBusy` (primary `busy`, secondary `disabled`), `Notice` (`ErrorNotice` with title and a button action), `NoticeCompact` (`compact`, no title, `role: "link"` action), `FieldError` (a labelled `TextInput` described by a `FieldError`), `LongStrings` (state + notice) |
| `src/components/primary-action.gallery.tsx` | `primary-action` / `PrimaryAction` | `Default` (press count shown below), `Disabled`, `Busy`, `LongStrings` |
| `src/components/keyboard-safe-action-layout.gallery.tsx` | `keyboard-safe-action-layout` / `KeyboardSafeActionLayout` | `Default` (one labelled field + `PrimaryAction`), `FillsViewport` (`scrollsUnderHeader={false}` in a `RootPage` without it, the iCal URL composition), `LongStrings` (several fields and long paragraphs so the content scrolls behind pinned actions) |
| `src/components/themed-text.gallery.tsx` | `themed-text` / `ThemedText` | `Ramp`, `Tones`, `LongStrings` (D4) |
| `src/components/chrome/native-settings-numeric-editor.gallery.tsx` | `native-settings-numeric-editor` / `NativeSettingsNumericEditor` | `Default`, `ValidationError` (`validationMessage` set, exercises `NativeErrorNotice`), `LongStrings` (title, label, buttons, message) |
| `src/components/chrome/glass-surface.gallery.tsx` | `glass-surface` / `GlassSurface` | `Regular` (non-interactive surface with text over a `primarySoft`/`homeHero` backdrop so the material has something to sample), `Clear` (`glassEffectStyle="clear"`), `InteractiveButton` (`isInteractive` around a labelled icon `Pressable`, the Home header composition), `LongStrings` |
| `src/components/chrome/menu-view.gallery.tsx` | `menu-view` / `MenuView` | `Default` (three actions; the trigger shows the selected one), `States` (an `on` action, a disabled action, a destructive action, an inline section of subactions), `LongStrings` |
| `src/components/chrome/date-time-picker.gallery.tsx` | `date-time-picker` / `DateTimePicker` | `Date`, `Time` (both platforms), `DateTime` (iOS only), `Bounded` (`minimumDate`/`maximumDate`, both platforms), `Disabled` (iOS only) |
| `src/theme/tokens.gallery.tsx` | `design-tokens` / the fixture's own `TokenSwatch` | `Colors`, `ContrastPairs`, `Spacing`, `Radii`, `IconSizes`, `Elevation` (D5) |

Planned story ids (46): `root-page--{default,caption-only,scrolls-under-header,readable-lane,long-strings}`,
`empty-state--{screen,screen-with-artwork,section,long-strings}`,
`error-surfaces--{state,state-busy,notice,notice-compact,field-error,long-strings}`,
`primary-action--{default,disabled,busy,long-strings}`,
`keyboard-safe-action-layout--{default,fills-viewport,long-strings}`,
`themed-text--{ramp,tones,long-strings}`,
`native-settings-numeric-editor--{default,validation-error,long-strings}`,
`glass-surface--{regular,clear,interactive-button,long-strings}`,
`menu-view--{default,states,long-strings}`,
`date-time-picker--{date,time,date-time,bounded,disabled}`,
`design-tokens--{colors,contrast-pairs,spacing,radii,icon-sizes,elevation}`.

Registry order follows the roadmap: page layout first (`root-page`, `keyboard-safe-action-layout`),
then text (`themed-text`), states (`empty-state`, `error-surfaces`), actions (`primary-action`),
the existing native-settings and text-entry fixtures, the remaining chrome (`native-settings-numeric-editor`,
`menu-view`, `date-time-picker`, `glass-surface`), and `design-tokens` last.

Why no `LongStrings` for `date-time-picker` and `design-tokens`: neither shows app copy (the
picker formats dates in the OS locale; token names are code identifiers). Glass has one because
its content is app copy at large text sizes.

Alternative rejected: one big "primitives" fixture with many stories. A fixture per component
keeps the colocation rule of ADR 064, gives each phase 3 slice its own section to diff against,
and keeps meta titles unique.

### D2. `DateTimeField` gets no fixture here

`DateTimeField` lives in `src/features/personal-events/ui/`. B-7 forbids the registry
(`src/design/**`) from importing it, and a fixture must be registered. Moving it is a component
refactor and part of design-system proposal §2 (`DateTimeField` promoted to `design/`), which also
owns the concurrent date-field accessibility fix. The `DateTimePicker` fixture covers the native
control the field wraps; the roadmap lists `DateTimePicker`, not the field.

Alternatives rejected: loosening B-7 for one fixture (a boundary exemption for a gallery
convenience); a copy of the field inside the fixture (a second implementation that drifts).

### D3. Platform-specific presentation inside fixtures

- **Numeric editor.** On iOS it is a full-height SwiftUI Form (the product presents it in a form
  sheet route); on Android it is a Compose `AlertDialog`. The fixture renders, on iOS, the editor
  while open and a `NativeSettingsHost` with an "Open the editor" row while closed; on Android,
  the host with the row always and the dialog on top while open (the text-entry fixture pattern).
  Cancel, Back and Submit close it; the row reopens it with the initial value. The editor asserts
  it is outside a native settings host, which this layout satisfies.
- **Date/time picker.** iOS renders the compact inline SwiftUI control (`DateTime` and `Disabled`
  are iOS-only because Android's dialog mode cannot pick both and has no disabled field). Android
  renders a `NativeSettingsHost` with one action row showing the formatted value and the dialog
  (`presentation="dialog"`) mounted while open, opened on mount like the product, with
  `positiveButton`/`negativeButton` labels from `gallery.dateTimePicker.*`. A pick updates the row
  value; a dismiss leaves it. The value is a fixed wall clock (`2030-01-02 09:30` local) so
  screenshots are stable.
- **Glass.** Every story renders on both platforms: Android and iOS < 26 show the documented
  fallback View, which is what ships there.
- **Menu.** The trigger is a `Pressable` with `accessibilityRole="button"`, a label naming the
  menu and its current value, `onPress={() => ref.current?.show()}` and an `activate` accessibility
  action, matching `calendar-view-menu.tsx`.

### D4. Typography page reads the ramp

`Ramp` maps over the `TypeVariant` steps in ramp order (`largeTitle` → `captionSmall`), one
`ThemedText type={step}` per step whose text is the step name followed by `size/lineHeight` read
from `TypeRamp[step].style`, so the iOS and Android branches each show their own numbers. Heading
steps keep the `header` role (the accessibility contract), which is also what VoiceOver's rotor
should list on device. `Tones` renders one line per `TextTone` on `background` and again on a
`backgroundElement` block. `LongStrings` renders each step with `gallery.stress.title` (headings)
or `gallery.stress.body` (others). The step list is a typed `readonly TypeVariant[]` in the
fixture with a `satisfies`-style exhaustiveness check so a new step is a compile error until it is
listed; deprecated aliases (`default`, `small`, `smallBold`, `subtitle`) are not shown.

### D5. Token page reads the tokens and one contrast table

- **`src/theme/contrast.ts`** (new) exports `contrastRatio(foreground, background)`,
  `ContrastFloor`, `ContrastPair`, and `documentedContrastPairs` (the `[scheme, foreground,
  background, floor]` rows built from today's `bothSchemes` + `perScheme` tables, unchanged).
  `theme.test.tsx` imports them and keeps its `contrastRatio` calibration and per-pair floor
  assertions. Not re-exported from `@/theme` (no product consumer).
- **`Colors`**: one row per role from `Object.keys(Colors.light)`: role name, a light swatch with
  its hex, a dark swatch with its hex. Swatches use the token values directly so both schemes
  show regardless of the app scheme; translucent roles (`textTertiary`, `primarySoft`, `ripple`,
  `scrim`) sit on a light/dark `background` tile so their alpha is visible.
- **`ContrastPairs`**: grouped by scheme; each row draws "Aa" in the foreground on a background
  tile of that scheme's values, then `foreground on background`, the ratio to two decimals and the
  floor (`4.5:1` body, `3:1` UI). No pass/fail branch: the gate already fails CI on a broken pair.
- **`Spacing`**, **`Radii`**, **`IconSizes`**, **`Elevation`**: one row per key with its value and
  a bar, rounded square, `SymbolView` at that size, or raised tile (`boxShadow` from
  `Elevation.raised[scheme]` in the app's scheme).
- Every row is one accessibility element (`accessible` plus a translated label such as
  "primary, light #E91E63, dark #FF4081"), so a screen reader steps row by row.
- The meta `component` is the fixture's own `TokenSwatch` row component (tokens have no
  component; `GalleryMeta` requires one).

Alternative rejected: keeping the pair table in the test and duplicating it in the fixture (two
tables drift; the spec requires one).

### D6. Back from a deep-linked story (device-pass finding 3)

**Decision:** keep the layout-less route shape. `GalleryStoryScreen` calls a
`useGalleryIndexAnchor(enabled)` hook (new `src/features/developer/ui/gallery-anchor.ts`) that,
on mount and on every Stack `state` event, reads the root Stack state through expo-router's
`useNavigation()`; if the story is focused and the route directly beneath it is not
`developer/gallery`, it calls `navigation.reset` with the same routes plus
`{ name: "developer/gallery" }` inserted beneath the story and `index + 1`. The `state` listener
exists because on a cold link the container commits its initial state just after the story's
first effect and reverts the mount-time reset (observed on the iOS simulator). Existing
routes keep their keys, so the story screen is not remounted and nothing animates. The state
transform is a pure exported function `withGalleryIndexBeneath(state)` that returns `undefined`
when the index is already beneath the story. `enabled` is false when the gate redirects, the id is
unknown, or the story is unavailable on the platform.

Alternatives considered:

- **Nested `developer/gallery/_layout.tsx` Stack with `unstable_settings.initialRouteName =
  "index"`**: the framework's anchor mechanism, and expo-router's `getStateFromPath` /
  `getActionFromState` honour it on cold and warm links. Rejected: it reverses the explicit
  layout-less rule in navigation.md and the route-structure test from the last change; the gallery
  index becomes the first screen of a nested native stack, whose back button and iOS swipe-back to
  the parent Stack are unproven in this app (the onboarding stack's first screen is headerless);
  it needs `gallery.tsx` → `gallery/index.tsx` and a non-thin layout file in the developer subtree
  contract.
- **`withAnchor` on pushes**: covers only in-app pushes, which already have the index beneath.
- **A custom header back button**: replaces the native back affordance (R-3) and does not fix the
  hardware/gesture back.

The rule change lands in navigation.md ("A deep-linked story puts the gallery index beneath
itself, so Back returns to the index, then to where the app was") and the CHANGELOG; ADR 064 is
unaffected (no new gallery feature).

### D7. Text-size change while a story is open (device-pass finding 2)

The clip is app-wide React Native behavior, not a gallery or `NativeSettingsHeader` defect. On the
iOS 26.5 simulator, switching live from `large` to `accessibility-extra-extra-extra-large` leaves
`themed-text--ramp` and the Home tab (a plain React Native screen outside the gallery) at their old
row heights with every line clipped, while the SwiftUI Settings screen and the native navigation
bar title re-lay out. Reopening the story or a cold launch at the same size renders correctly. React
Native text measurement is not invalidated by a live Dynamic Type change; the evidence is recorded
in `docs/react-native-migration/inbox/2026-10-25-mobile-gallery-fixtures-findings.md`. The gallery
adds no workaround.

Alternative rejected: re-keying `GalleryStoryContent` on `fontScale`. It would hide in the
gallery a defect that ships on every React Native screen, which defeats the gallery's purpose ("focus
order and Back are what ships").

### D8. Native mocks mirror native semantics

The `@expo/ui/community/menu` mock in `jest/setup-expo-ui.ts` wraps children in a bare `Pressable`
with `onPress` and no role. Natively, iOS wraps the children in a SwiftUI `Menu` label (a button);
the implementer reads `node_modules/@expo/ui/src/community/menu/MenuView.{ios,android}.tsx` and
makes the mock's wrapper project what each platform does (a button role on iOS if the Menu label
is the control; no press handler if the Android anchor is not clickable). The full suite must
stay green, including the calendar view-menu tests. If a fixture exposes a real gap (the native
control itself lacks a role or label), it goes to `known-a11y-violations.ts` with the findings
inbox note, never to a looser check.

### D9. L10 fixture-coverage contract

`src/design/gallery/fixture-coverage.contract.test.ts` lists every `.tsx` under `src/design/`
(not `*.test.tsx`, not `*.gallery.tsx`), minus an explicit `galleryInfrastructure` list
(`gallery/story-content.tsx`), and asserts a sibling `<name>.gallery.tsx` and `<name>.test.tsx`
exist. It also asserts every helper-list entry exists, so the test is not vacuous today, when
`src/design/` holds no primitive yet. It does not reach `src/components/` (those primitives move
to `src/design/` in phase 3 and then fall under it).

### D10. Strings

- Per fixture: `gallery.<meta>.title`, `gallery.<meta>.story.<story>`, and the copy each fixture
  shows. French copy is native French, not a translation of the English length.
- Shared stress set `gallery.stress.title` (French ≥ 70 characters), `gallery.stress.body`
  (≥ 200), `gallery.stress.action` (≥ 40), `gallery.stress.word` (one word ≥ 25 characters), used
  by every new `LongStrings` story. The native-settings fixture keeps its own long keys.
- Token row labels are interpolated templates (`gallery.designTokens.colorRow`:
  `"{{name}}, light {{light}}, dark {{dark}}"` and its French counterpart).

### D11. Tests

- `registry.test.ts` covers render + accessibility of every story with no change; its count grows.
- `gallery-index-screen.test.tsx` lists the new sections and story ids in registry order (the
  index-order gate).
- A `*.gallery.test.tsx` for each stateful fixture: `primary-action` (press count; disabled/busy
  ignore presses), `native-settings-numeric-editor` (Cancel and Submit close, the row reopens, on
  both platforms), `menu-view` (selecting an action updates the trigger label), `date-time-picker`
  (Android: pick updates the row, dismiss leaves it, the row reopens; iOS: the inline control
  changes the value). Pattern: `native-text-entry-dialog.gallery.test.tsx`.
- `tokens.gallery.tsx` is in the 90% tier through `registry.test.ts`; it has no branches beyond
  the scheme lookup, which the light/dark matrix covers. `contrast.ts` is covered by
  `theme.test.tsx`.
- `gallery-anchor.test.ts` covers `withGalleryIndexBeneath` (cold `[(tabs), story]`, warm
  `[(tabs), about, story]`, already anchored, story not on top) and
  `gallery-story-screen.test.tsx` asserts `reset` is called for a deep-linked story and not for one
  opened from the index, not when redirecting.

## Risks / Trade-offs

- [`navigation.reset` under the top screen glitches on device during a warm-link push animation]
  → existing route keys are preserved so react-native-screens keeps the top screen; the conductor's
  device pass checks a warm and a cold link on both platforms. If it glitches, defer the reset to
  the screen's first `transitionEnd` event (same hook, one listener), not a nested layout.
- [Fixtures for components the concurrent a11y change edits (date picker neighbours, Android
  dialogs, numeric editor)] → fixtures use only public props and testIDs prefixed `gallery-`;
  whichever change lands second rebases. A violation the other change fixes leaves the known list
  in that change (the stale-entry check forces it).
- [A fixture exposes a real violation] → a known-violations entry with the findings inbox link,
  never a component edit here.
- [46 more stories make `registry.test.ts` slower] → each story renders four times under the
  existing 30 s per-test budget; the matrix is `it.each`, so the cost is per test, not per suite.
- [The swatch page shows hex strings and token names untranslated] → they are code identifiers,
  not copy; the row labels around them are translated.

## Migration Plan

One PR on `feat/mobile-ds-gallery-fixtures`. No data, route or native change; rollback is a
revert. The conductor's device pass follows `accessibility.md` on the new story ids.
