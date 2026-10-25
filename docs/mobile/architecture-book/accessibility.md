# Accessibility

The lint half is a set of `react-native-a11y` + `i18next` rules (see [Lint & format](./lint-format.md)); the runtime half is the heading-role contract in `ThemedText` and accessible async status. Each entry below is a live rule plus the caveats tooling can't carry — where a rule is encoded in a component or stays prose, it's because lint _cannot_ see the intent (R-1).

## What lint enforces

- Four `react-native-a11y` rules run as **error**: `has-accessibility-props`, `has-valid-accessibility-descriptors`, `has-valid-accessibility-role`, `no-nested-touchables`. Every touchable/pressable must declare a role or a label+hint, and touchables may not nest.
- `i18next/no-literal-string` covers `accessibilityLabel` / `accessibilityHint`, so a11y copy is translated too.
- **Font scaling (L8, `no-restricted-syntax`):** RN `Text` scales with the OS font size by default, and `allowFontScaling={false}` is a lint error in both the JSX-attribute and the object-property (spread props) form, in every file, tests included. See [Lint & format](./lint-format.md).
  - On iOS every `ThemedText` ramp step except `caption` / `captionSmall` names its UIKit text style through `dynamicTypeRamp`, so it scales on Apple's per-style Dynamic Type curve (large titles grow less than body at accessibility sizes). `caption` / `captionSmall` scale linearly under their callers' `maxFontSizeMultiplier` caps. Android scales every step linearly with the font scale.
  - `maxFontSizeMultiplier` caps are allowed for dense UI sized to a cell. They live in calendar chrome and the owned renderer: the calendar view menu (1.3), the calendar screen header (1.75), the owned canvas (1.2) and the owned header (1 and 1.2). Whether the `maxFontSizeMultiplier={1}` header numerals stay is owned by the accessibility workstream.

These rules guard real product touchables (interactive controls declare `accessibilityRole` + a translated `accessibilityLabel`).

## The heading-role contract — encoded in `ThemedText`

- `ThemedText` maps the heading ramp steps `type="largeTitle"`, `"title"`, `"title2"` and `"sectionTitle"` (and the `subtitle` alias, which resolves to `sectionTitle`) to `accessibilityRole="header"`, so titles are exposed to VoiceOver/TalkBack as headings (rotor/heading navigation) without each call site declaring the role. `headline`, `body`, `callout`, `label`, `footnote`, `caption`, `captionSmall` and the `default` / `small` / `smallBold` aliases carry **no** role: `headline` is the row/card title style, and row titles exposed as headings would flood the rotor. A caller-supplied `accessibilityRole` **still wins** (the default applies only when unset; `{...rest}` spreads last).
- The role per step is the exhaustive `headingRole: Record<TypeVariant, boolean>` in `themed-text.tsx`, so a `TypeVariant` added without a role decision is a `tsc` error. See ADR [063](./decisions/063-platform-type-ramp.md).
- Home's "Up next" and "Today" titles use the `sectionTitle` step in both the populated and the
  empty state, so they are headers in every state (`features/home/ui/home-screen.test.tsx`).
- Encoded in the **component**, not a lint rule, because lint cannot know which `<Text>` is semantically a heading — that's authorial intent tied to the visual `type`, and the component already owns `type→style`, so it owns `type→role` too.

## Accessible async status

- Loading/error text carries `accessibilityLiveRegion="polite"` (Android announces the change) and a status role (`text` / `alert`), so assistive tech conveys the state rather than reading a silent node.
- Shared empty states expose localized title then caption as the complete meaning and hide optional
  artwork from the accessibility tree. They add no motion. `PrimaryAction` keeps one translated
  button label, reports disabled/busy state on that button, blocks repeat activation, and hides its
  progress indicator from focus. See ADR [054](./decisions/054-shared-root-page-semantics.md).
- Home's section empty states keep title-before-caption source order and left alignment. Feedback,
  Programme, and personal-event focused forms keep fields and errors in one scroll body followed by
  a sibling primary-action region, so keyboard avoidance does not reorder or cover the action.
- Ordinary pushed routes expose their localized name once through native compact chrome. Caption-
  only `PageIntro` content follows that navigation heading before fields, actions, status, or rows;
  content headings remain only when they identify domain content such as an event or release.
- The Android personal-event date/time field announces its label and its value ("Starts, <date
  time>"), and the name follows each commit (`features/personal-events/ui/date-time-field.test.tsx`).
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

- `src/components/themed-text.test.tsx` drives a typed `Record<ThemedTextType, { step; heading }>` table through `it.each`: per accepted `type` it renders through the real accessibility tree and asserts the `header` role is present or absent (a _resolved semantic_, not merely that a prop was passed), plus the rendered ramp style and iOS `dynamicTypeRamp`. It also covers explicit-role-wins. `src/theme/typography.test.ts` pins the ramp values on both platforms. Gated by the `test-mobile` job (tsc + lint + Jest), R-1.
- `src/design/gallery/registry.test.ts` renders every gallery story on the iOS and Android branches in light and dark, and fails when an interactive host element lacks an accessibility role or a non-empty accessible name (its label, else its merged descendant text or labels), or a text input lacks a label, naming the story, platform and element (its `testID`, else `<nearest ancestor testID> > <role>`). A control nested in another control is checked on its own: Compose stops merging at a child with its own click or toggle semantics, so TalkBack gives it a separate stop. A trailing indicator inside a row control therefore takes no handler (a Material `RadioButton` without `onClick`). The check reads what the suite-wide native mocks in `jest/setup-expo-ui.ts` project, so a mock that drops a real modifier is fixed in the mock; it proves declared semantics, not announcement quality.
- **Known violations only shrink.** A violation the product really has and cannot fix yet goes in `src/design/gallery/known-a11y-violations.ts`: one typed entry per story id, platform and element, with the problem, the reason and a link to its `docs/react-native-migration/inbox/` note. The registry check fails on any violation not on the list and on any entry that no longer reproduces or names a story absent from its platform, so a fix must delete its entry and nothing is added silently. The list holds the Android switch row's inner Material `Switch` (`native-settings--switches`, `native-settings--long-strings`): Expo UI's `SwitchView` always passes Compose a non-null `onCheckedChange`, so the unlabeled thumb is a second TalkBack stop inside the toggleable row ([inbox](../../react-native-migration/inbox/2026-10-25-mobile-design-system-gallery-device-pass.md)).

## What lint can't encode → prose, each with reason + owner

None of these is a sound lint rule; each is recorded so the owning step/feature inherits it:

- **Touch-target minimums (44pt iOS / 48dp Android)** — a runtime layout property, not statically checkable. Owned by interactive controls and the [Definition of Done](./definition-of-done.md) (Accessibility axis).
- **Meaningful labels** — lint guarantees a label _exists_ on a touchable, never that it's _meaningful_ or correctly translated; human review + the translated-copy rule cover semantics.
- **Manual screen-reader passes (VoiceOver / TalkBack)** — focus order, grouping, announcement quality: runtime behavior no static tool can assert. Owned by the [Definition of Done](./definition-of-done.md) (Accessibility axis).
- **Reduced motion** — **discharged by each animation owner**: Splash handles its own `AccessibilityInfo.isReduceMotionEnabled` branch ([features.md → Splash](./features.md#splash)). The shared `src/hooks/use-reduced-motion.ts` hook reads and subscribes to the live preference for onboarding and Calendar. Calendar pages directly under reduced motion; otherwise Today and deep links animate only the final page. Lint cannot know whether a runtime preference reaches every animation, so each animation owner retains this obligation.
- **Color contrast** — a theme-token property, not lint-encodable; **discharged by theming**: the AA token pairs are documented in `src/theme/tokens.ts` and computed against their floors in `src/theme/theme.test.tsx` (see [Theming & native-chrome](./theming.md)); the DoD's manual contrast review checks that rendered screens draw those pairs. A call-site checker stays deferred (its trigger is recorded there).

## Deferred (recorded debt — not built)

- **No touch-target or call-site contrast lint** — `MinTouchTarget` is a token, not a check. Calendar and onboarding share the live reduced-motion hook.
- **No manual screen-reader DoD checklist** beyond the [Definition of Done](./definition-of-done.md) (Accessibility axis).
