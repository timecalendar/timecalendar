# Accessibility

The lint half is a set of `react-native-a11y` + `i18next` rules (see [Lint & format](./lint-format.md)); the runtime half is the heading-role contract in `ThemedText` and accessible async status. Each entry below is a live rule plus the caveats tooling can't carry — where a rule is encoded in a component or stays prose, it's because lint _cannot_ see the intent (R-1).

## What lint enforces

- Four `react-native-a11y` rules run as **error**: `has-accessibility-props`, `has-valid-accessibility-descriptors`, `has-valid-accessibility-role`, `no-nested-touchables`. Every touchable/pressable must declare a role or a label+hint, and touchables may not nest.
- `i18next/no-literal-string` covers `accessibilityLabel` / `accessibilityHint`, so a11y copy is translated too.
- **Font scaling (L8, `no-restricted-syntax`):** RN `Text` scales with the OS font size by default, and `allowFontScaling={false}` is a lint error in both the JSX-attribute and the object-property (spread props) form, in every file, tests included. See [Lint & format](./lint-format.md).
  - On iOS every `ThemedText` ramp step except `caption` / `captionSmall` names its UIKit text style through `dynamicTypeRamp`, so it scales on Apple's per-style Dynamic Type curve (large titles grow less than body at accessibility sizes). `caption` / `captionSmall` scale linearly under their callers' `maxFontSizeMultiplier` caps. Android scales every step linearly with the font scale.
  - `maxFontSizeMultiplier` caps are allowed for dense UI sized to a cell. They live in calendar chrome and the owned renderer: the calendar view menu (1.3), the calendar screen header (1.75), the owned canvas (1.2) and the owned header (1 and 1.2). Whether the `maxFontSizeMultiplier={1}` header numerals stay is owned by the accessibility workstream.
  - **Brand text cap.** "TimeCalendar" is one unbreakable word, so text that carries it caps at `WordmarkMaxFontScale` (1.5, `@/theme`): the Home app name (`title2`, one line, `features/home/ui/home-screen.test.tsx`) and the onboarding page titles (`features/onboarding/ui/welcome-screen.test.tsx`). Body copy beside them is uncapped.
  - **Accessibility text size seam.** A layout that changes shape at accessibility sizes reads `useIsAccessibilityTextSize()` / `isAccessibilityTextSize(fontScale)` from `@/theme`, true at `fontScale >= AccessibilityFontScale` (1.786, the UIKit `accessibilityMedium` multiplier; on Android it falls between system scales 1.5 and 1.8). It follows a live size change (`src/theme/text-scale.test.ts`). Users: iOS settings rows and the onboarding illustration.
- **Icons on the seam (L9, `no-restricted-imports`):** importing `SymbolView` from `expo-symbols` is a lint error outside `src/design/icon/icon.tsx` and its test (block `timecalendar/icon-seam`); symbol name types stay importable. See [Icon scaling](#icon-scaling--encoded-in-icon) and [Lint & format](./lint-format.md).

These rules guard real product touchables (interactive controls declare `accessibilityRole` + a translated `accessibilityLabel`).

## The heading-role contract — encoded in `ThemedText`

- `ThemedText` maps the heading ramp steps `type="largeTitle"`, `"title"`, `"title2"` and `"sectionTitle"` (and the `subtitle` alias, which resolves to `sectionTitle`) to `accessibilityRole="header"`, so titles are exposed to VoiceOver/TalkBack as headings (rotor/heading navigation) without each call site declaring the role. `headline`, `body`, `callout`, `label`, `footnote`, `caption`, `captionSmall` and the `default` / `small` / `smallBold` aliases carry **no** role: `headline` is the row/card title style, and row titles exposed as headings would flood the rotor. A caller-supplied `accessibilityRole` **still wins** (the default applies only when unset; `{...rest}` spreads last).
- The role per step is the exhaustive `headingRole: Record<TypeVariant, boolean>` in `themed-text.tsx`, so a `TypeVariant` added without a role decision is a `tsc` error. See ADR [063](./decisions/063-platform-type-ramp.md).
- Home's "Up next" and "Today" titles use the `sectionTitle` step in both the populated and the
  empty state, so they are headers in every state (`features/home/ui/home-screen.test.tsx`).
- Encoded in the **component**, not a lint rule, because lint cannot know which `<Text>` is semantically a heading — that's authorial intent tied to the visual `type`, and the component already owns `type→style`, so it owns `type→role` too.

## Icon scaling — encoded in `Icon`

- Every icon renders through `Icon` (`src/design/icon/icon.tsx`, from `@/design`) and declares a required `scaling`. `"text"` icons sit beside or inside text: the glyph and its box grow with the font scale, optionally capped with the neighbor text's `maxFontSizeMultiplier` (a row chevron caps at `ChevronMaxFontScale`, 2, so a cue never rivals the row text), and their container uses `minWidth` / `minHeight` so it grows too. `"fixed"` icons are standalone chrome (header actions, FABs, status and error glyphs) and keep their design size at every font scale, above and below the default. No glyph clips its own box at any scale, including Android 2.0.
- `Icon` is always decorative (`accessible={false}`, hidden from VoiceOver and TalkBack); the control that contains it owns the label.
- Encoded by the type (`scaling` is required) and lint L9; proven by `src/design/icon/icon.test.tsx` (box and glyph sizes per scaling on Android, `SymbolView` size on iOS, decorative props, the Material codepoint pin). See ADR [065](./decisions/065-icon-text-scaling.md).

## Buttons — encoded in `Button`

- A `Button` is one accessible element: role `button` by default, `link` when it leaves the app.
  Its name defaults to the visible label; a caller may give a fuller `accessibilityLabel` and an
  `accessibilityHint`. `accessibilityState` is derived from `disabled` and `busy` and cannot be
  passed.
- Busy keeps the visible label and the accessible name, exposes `{ disabled: true, busy: true }`,
  and hides its progress indicator from VoiceOver and TalkBack. Disabled exposes
  `{ disabled: true, busy: false }`. Icons inside a button are decorative.
- Every size is at least `MinTouchTarget` (44 pt iOS / 48 dp Android) tall and wide, including a
  short `text` button.
- The label follows the OS text size without a cap and wraps to sixteen lines (N > 0, never
  `ellipsizeMode="clip"`).
- Two buttons side by side are a `ButtonRow`: at accessibility text sizes
  (`useIsAccessibilityTextSize()`, iOS AX1 and above, Android 1.8 and 2.0) the pair stacks full
  width with the primary first, the HIG/Material switch from horizontal to vertical, so no label
  breaks mid-word. Reading and focus order follow the visual order in both layouts. **Caveat lint
  can't carry:** no rule detects two `Button`s laid out in a hand-built `flexDirection: "row"`
  view; review and the gallery catch it.
- Proven by `src/design/button/button.test.tsx`, `src/design/button/button-row.test.tsx` and the
  gallery registry matrix; see ADR [067](./decisions/067-button-family.md) and
  [Theming](./theming.md) → Buttons.

## Fields — encoded in `TextField`

- A field is two stops: the visible label as text, then the input. The input's name is the label
  (or a fuller `accessibilityLabel` the caller passes), its value is the typed text, and on
  Android it is also labelled by the label's `nativeID`.
- The input's hint is the error, then the helper, then the field's own hint, joined as sentences.
  The helper text is hidden from assistive technology, so it is read once, in the hint.
- `FieldError` announces an error when it appears and again only when its message changes (iOS
  queued announcement, Android polite live region), so typing while the same error stays is
  silent.
- `disabled` sets `editable={false}` and `{ disabled: true }` and dims the whole field.
- The Android `DateTimeField` row is a `button` named "label, value" whose hint carries the
  error. The iOS SwiftUI picker takes no hint, so its error is announced on appearance and is the
  text stop directly after the picker.
- Feature code passes `error` to the field; `fieldErrorHint` is not on the `@/design` barrel.
  The screen-reader pass is owner-led
  (`docs/react-native-migration/inbox/2026-10-26-mobile-ds-text-field-screen-reader-pass.md`).

## Accessible async status

- Every loading, empty and error state is `StatusView` (ADR [069](./decisions/069-status-view.md)).
  Empty and error titles are `sectionTitle` (header role), followed by the caption as a separate
  text stop; the error glyph, symbol and artwork are hidden. The error title has no `alert` role:
  `alert` collapses the heading into one group and neither screen reader speaks a mounted alert
  by itself. Loading is one accessible element with role `progressbar`, label = the visible
  title and `{ busy: true }`; its spinner is hidden; the title is not a heading.
- `StatusView` announces once per appearance: `useErrorAnnouncement(spoken, { key })` with `key`
  = `announcementKey ?? kind` speaks on mount and when the key changes, never when the message
  changes under the same key, so a no-results title that embeds the query is not re-read per
  keystroke. iOS uses the queued announcer; Android uses a polite live region on the
  loading `progressbar` or the title and caption group, never the actions, so a Retry busy or
  disabled toggle does not re-read the state (shared React Native surfaces own one announcement channel). Without `key` the
  hook announces on every message change (chrome callers).
- Artwork is decorative and not rendered at accessibility text sizes; `screen` scrolls once the
  text outgrows the viewport, so title and actions stay reachable at AX5 and font scale 2.0.
- **Field errors live in the field's hint.** React Native forwards `aria-describedby` and
  `nativeID` relations to neither UIKit nor Android, so `TextField` and `DateTimeField` fold the
  error into the control's `accessibilityHint` (→ Fields). VoiceOver and TalkBack read it after
  the label and value on focus; `FieldError` keeps its alert text, Android live region and iOS
  announcement for the moment it appears. `aria-describedby` is a lint
  error ([lint-format.md](./lint-format.md) → Status). Folding the error into
  `accessibilityLabel` would rename the field; `accessibilityValue` would mask the typed text.
- A busy or disabled `Button` keeps one translated label, reports its state on that button, blocks
  repeat activation, and hides its progress indicator from focus. See ADR
  [054](./decisions/054-shared-root-page-semantics.md).
- Home's inline empty states keep title-before-caption source order and leading alignment. Feedback,
  Programme, and personal-event focused forms keep fields and errors in one scroll body followed by
  a sibling primary-action region, so keyboard avoidance does not reorder or cover the action.
- Ordinary pushed routes expose their localized name once through native compact chrome. Caption-
  only `PageIntro` content follows that navigation heading before fields, actions, status, or rows;
  content headings remain only when they identify domain content such as an event or release.
- The Android personal-event date/time field announces its label and its value ("Starts, <date
  time>"), and the name follows each commit (`src/design/field/date-time-field.test.tsx`).
- Personal-event date/time text follows the device 12/24-hour setting in the app language: the
  Android field, its accessible name and the personal-events list render 12-hour time on a 12-hour
  device (`personal-event-form-screen.test.tsx`, `personal-events-list.test.tsx`,
  `features/calendar/data/format.test.ts`); the Android time dialog follows the same setting
  (`src/design/field/date-time-field.test.tsx`). The device setting is read through
  `useUses24HourClock` (`src/hooks/use-uses-24-hour-clock.test.ts`). The iOS SwiftUI picker takes
  no `locale`: it follows the device language and clock, because `@expo/ui` applies only identifiers
  Foundation lists, so an app language paired with the device region or an `@hours=` cycle is
  dropped silently. The picker reading the device language rather than the in-app language is a
  known parity gap (`docs/react-native-migration/inbox/2026-10-25-mobile-ios-picker-device-language.md`).
- Personal-event color swatches announce a translated color name, never a hex code. Android
  exposes each as a `radio` with `checked` inside the `radiogroup`; iOS, which has no radio trait,
  exposes a `button` with `selected` (`features/personal-events/ui/color-swatch-picker.test.tsx`).
  Every preset has a name through the `SWATCH_NAME_KEYS` record.
- iOS settings rows that show a value (value, navigation and action rows) stack the label above
  the value at accessibility text sizes, with the navigation chevron kept trailing; the
  accessibility identifier, label, hint and value are the same in both layouts. The stacked value
  row drops `LabeledContent`, which gives its label under half the row: the label text carries the
  row's identifier, label and value, and the visible value text is hidden, so VoiceOver reads
  "label, value" once. A row passes its value as `value`, never folded into `accessibilityLabel`.
  At accessibility sizes a single-word row label is held to one line with `minimumScaleFactor`
  0.5, so SwiftUI shrinks it instead of hyphenating it mid-word; a multi-word label still wraps,
  and SwiftUI can still hyphenate a word in it that is wider than the row. Android Compose rows do
  not change (`src/components/chrome/native-settings.test.tsx`).
- The event-details color dot is decorative and centers on the first title line: it sits in a
  hidden strut sized by one `title`-step line (`features/calendar/ui/event-details-screen.test.tsx`).
- Controlled native text-entry dialogs isolate the background accessibility tree, keep native input
  and Cancel/Save actions present while pending, announce inline validation/write failure and
  persistence-gated success, and expose stable native identifiers on both platforms. On iOS the
  dialog is a native SwiftUI sheet (medium/large detents, drag indicator, Cancel · title · Save
  header in the brand tint); swiping it down is a cancel, disabled while a save is pending. On
  Android it is a Material 3 dialog: Back is an explicit cancel and outside taps are inert. Jest proves callbacks,
  identifiers, and structure; VoiceOver/TalkBack focus and announcement quality remain device proof.
- Native notification choices expose one selected checkmark/radio state, localized labels and
  plural values. The custom-days editor exposes stable field/action/error identifiers and an
  understandable validation message without treating its numeric keyboard as validation. Only a
  synchronization failure is shown and announced: it renders first on the page through
  `NativeSettingsAlert`, which uses the platform accessibility announcer because SwiftUI/Compose
  text cannot carry React Native live-region props, with a localized Retry action. Pending,
  waiting, and acknowledged states render and announce nothing; focused tests prove both. Host tests prove the remaining semantics and callbacks; large text,
  focus order, sheet/dialog feel, themes, and VoiceOver/TalkBack announcement quality remain
  owner-led device acceptance.

- The Settings brand header (`NativeSettingsHeader`) hosts React Native text inside the native
  list so the app name keeps the `ThemedText` heading role and all copy follows the OS font scale;
  the app icon is hidden from assistive technology.

## Device accessibility recipe

Every fixture state in the component gallery is one deep-linkable screen. To review one:

1. Open the story: `xcrun simctl openurl <udid> timecalendar-dev://developer/gallery/<id>` on iOS,
   `adb shell am start -a android.intent.action.VIEW -d timecalendar-dev://developer/gallery/<id>`
   on Android. Preview builds use `timecalendar://`. The index at `/developer/gallery` lists every
   id.
2. Set the conditions. iOS:
   `xcrun simctl ui <udid> content_size accessibility-extra-extra-extra-large` and
   `xcrun simctl ui <udid> appearance dark`. Android: `adb shell settings put system font_scale 2.0`
   and `adb shell cmd uimode night yes`.
3. Take a screenshot and read the accessibility tree; check that copy wraps instead of clipping and
   that every control exposes a role and a meaningful label.
4. Swipe through with VoiceOver and TalkBack: the header (Back, then the story title) comes first,
   then the fixture's own content, one focus stop per row.
5. Reset: `content_size large` and `appearance light` on iOS, `font_scale 1.0` and
   `cmd uimode night no` on Android.

Android emulators run on the Windows host, not the Mac.

## Proof in CI

- `src/design/text/themed-text.test.tsx` drives a typed `Record<ThemedTextType, { step; heading }>` table through `it.each`: per accepted `type` it renders through the real accessibility tree and asserts the `header` role is present or absent (a _resolved semantic_, not merely that a prop was passed), plus the rendered ramp style and iOS `dynamicTypeRamp`. It also covers explicit-role-wins. `src/theme/typography.test.ts` pins the ramp values on both platforms. Gated by the `test-mobile` job (tsc + lint + Jest), R-1.
- `src/design/gallery/registry.test.ts` renders every gallery story on the iOS and Android branches in light and dark, and fails when an interactive host element lacks an accessibility role or a non-empty accessible name (its label, else its merged descendant text or labels), or a text input lacks a label, naming the story, platform and element (its `testID`, else `<nearest ancestor testID> > <role>`). A control nested in another control is checked on its own: Compose stops merging at a child with its own click or toggle semantics, so TalkBack gives it a separate stop. A trailing indicator inside a row control therefore takes no handler (a Material `RadioButton` without `onClick`). An `accessible={false}` control is no accessibility node: it is skipped when a descendant control carries the semantics (role and name), checked on its own (Expo UI's Android `MenuView` anchor, whose child button carries them), and otherwise reported as `accessible={false} control has no accessible control inside`, since its activation is unreachable to VoiceOver and TalkBack. The check reads what the suite-wide native mocks in `jest/setup-expo-ui.ts` project, so a mock that drops a real modifier is fixed in the mock; it proves declared semantics, not announcement quality.
- **Known violations only shrink.** A violation the product really has and cannot fix yet goes in `src/design/gallery/known-a11y-violations.ts`: one typed entry per story id, platform and element, with the problem, the reason and a link to its `docs/react-native-migration/inbox/` note. The registry check fails on any violation not on the list and on any entry that no longer reproduces or names a story absent from its platform, so a fix must delete its entry and nothing is added silently. The list holds the Android switch row's inner Material `Switch` (`native-settings--switches`, `native-settings--long-strings`): Expo UI's `SwitchView` always passes Compose a non-null `onCheckedChange`, so the unlabeled thumb is a second TalkBack stop inside the toggleable row ([inbox](../../react-native-migration/inbox/2026-10-25-mobile-design-system-gallery-device-pass.md)).

- `src/design/status/status-view.test.tsx` proves the status roles, the hidden media, the
  `progressbar` busy state, the Android-only live region and the once-per-key announcement on both
  platforms; `src/hooks/use-error-announcement.test.ts` proves the keyed and unkeyed hook paths;
  `src/design/field/text-field.test.tsx` proves the field's name, hint order, hidden helper,
  once-per-message error announcement and disabled state on both platforms;
  `src/design/field/date-time-field.test.tsx` proves the Android "label, value" name, its error
  hint and the iOS error text; `src/design/field/field-error-hint.test.ts` proves the hint
  composition.

## What lint can't encode → prose, each with reason + owner

None of these is a sound lint rule; each is recorded so the owning step/feature inherits it:

- **Touch-target minimums (44pt iOS / 48dp Android)** — a runtime layout property, not statically checkable. Owned by interactive controls and the [Definition of Done](./definition-of-done.md) (Accessibility axis).
- **Meaningful labels** — lint guarantees a label _exists_ on a touchable, never that it's _meaningful_ or correctly translated; human review + the translated-copy rule cover semantics.
- **Manual screen-reader passes (VoiceOver / TalkBack)** — focus order, grouping, announcement quality: runtime behavior no static tool can assert. Owned by the [Definition of Done](./definition-of-done.md) (Accessibility axis).
- **Reduced motion** — **discharged by each animation owner**: Splash handles its own `AccessibilityInfo.isReduceMotionEnabled` branch ([features.md → Splash](./features.md#splash)). The shared `src/hooks/use-reduced-motion.ts` hook reads and subscribes to the live preference for onboarding and Calendar. Calendar pages directly under reduced motion; otherwise Today and deep links animate only the final page. Lint cannot know whether a runtime preference reaches every animation, so each animation owner retains this obligation.
- **Color contrast** — a theme-token property, not lint-encodable; **discharged by theming**: the AA token pairs are documented in `src/theme/tokens.ts`, listed in `documentedContrastPairs` (`src/theme/contrast.ts`), computed against their floors in `src/theme/theme.test.tsx` and drawn by the `design-tokens--contrast-pairs` gallery story (see [Theming & native-chrome](./theming.md)); the DoD's manual contrast review checks that rendered screens draw those pairs. A call-site checker stays deferred (its trigger is recorded there).

## Deferred (recorded debt — not built)

- **No touch-target or call-site contrast lint** — `MinTouchTarget` is a token, not a check. Calendar and onboarding share the live reduced-motion hook.
- **No manual screen-reader DoD checklist** beyond the [Definition of Done](./definition-of-done.md) (Accessibility axis).
