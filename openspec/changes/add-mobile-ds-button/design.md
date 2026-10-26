# Design

## Context

- `src/components/primary-action.tsx` is the only shared button: `primaryStrong` fill,
  `onPrimary` `smallBold` label, `minHeight` 44/48 by hand, iOS opacity 0.65, Android ripple
  (unclipped), disabled 0.55 by literal, busy spinner, and `style` merged **first**
  (`[style, styles.action, …]`), so its own `minHeight`/fill/opacity always beat the caller and a
  caller cannot even set `alignSelf` against `styles.action`. Its test pins those invariants
  against a hostile caller style.
- Eight product call sites import it: `error-surfaces.tsx` (`ErrorState.primaryAction`),
  `feedback-screen.tsx`, `ical-url-screen.tsx`, `calendar-import-result-screen.tsx`,
  `institution-name-screen.tsx`, `programme-screen.tsx`, `personal-event-actions.tsx`,
  `guide-page-screen.tsx`; plus the `keyboard-safe-action-layout` fixture and its own fixture and
  tests.
- Hand-rolled buttons in the slice 3.1 screens: `welcome-controls.tsx` (Skip, Next with a
  trailing arrow `Icon`, final CTA without press feedback), `connect-screen.tsx` (intranet link
  with `accessibilityRole="link"` and a trailing icon, Back outlined in 2px `primary`, Continue
  filled), `manual-import-screen.tsx` (QR filled with a leading icon and a hint, URL outlined with
  a leading icon and a hint), `step-styles.ts` (`cta`, unused), `changelog-sheet-screen.tsx`
  (Continue, pressed opacity 0.8, body-weight label), `personal-event-actions.tsx` (Delete:
  `backgroundElement` fill, `destructive` label, `disabled` while deleting),
  `personal-events-list.tsx` (Add: `Link asChild` around a neutral-fill `Pressable`, flattened
  style for the Slot shim), `hidden-events-screen.tsx` (Unhide text action inside a
  `backgroundElement` row), `guide-page-screen.tsx` (Back outlined).
- Tokens exist: `MinTouchTarget`, `StateOpacity`, `IconSize`, `Spacing.twoHalf`, `Radii`, the
  `outline` role, the `TypeRamp` (`label`, `headline`), `ThemedText` `tone`
  (`primary`/`action`/`destructive`/`onPrimary`). `Icon` (ADR 065) takes an `{ ios, android }`
  glyph pair, a color and a required `scaling`.
- `src/design/` holds only the gallery runtime today. Every shared primitive (`ThemedText`,
  `Icon`, `RootPage`, `EmptyState`, error surfaces, `PrimaryAction`) lives in `src/components/`.
  The `@/design` barrel exports the gallery runtime, whose `registry.ts` statically imports every
  fixture module, and those import their components.
- No file imports `Button` or any `Touchable*` from `react-native`. 34 non-test files render a
  `Pressable` with `accessibilityRole="button"`.

## Goals / Non-Goals

**Goals:**

- One `Button` that every in-content text button in the 3.1 screens uses, with intent, size and
  state as typed props and nothing else open to the caller.
- Remove `PrimaryAction` without leaving an alias to retire.
- A lint gate that stops new hand-rolled text buttons today and tracks the backlog as a shrinking
  list.

**Non-Goals:**

- Header bar actions, FABs, list rows, the date-time field trigger, status-view actions: each is
  its own primitive slice (3.3, 3.4, 3.6, 3.8) and stays on the allowlist.
- Moving primitives into `src/design/` (D1).
- A `selected`/toggle state, icon-only buttons, a `href` prop, a split or segmented button.

## Decisions

### D1. `Button` lives in `src/components/button.tsx`, not `src/design/button/`

The proposal places primitives under `src/design/<primitive>/` behind `@/design`. Today that barrel
is the gallery runtime: importing `@/design` from a screen evaluates `registry.ts`, which imports
every fixture, which imports `src/components/*` (including `error-surfaces.tsx`, a `Button`
consumer). A `Button` exported from `@/design` therefore puts the whole gallery on every screen's
module-init path and closes a runtime cycle `error-surfaces → @/design → registry →
error-surfaces.gallery → error-surfaces`, where a fixture `meta.component` can read an
uninitialized binding under Metro's CommonJS interop.

`Button` goes next to `Icon` (ADR 065 made the same call) and `ThemedText`, imported as
`@/components/button`. Moving all primitives into `src/design/` needs the barrel split
(primitives in `@/design`, gallery runtime behind its own developer-only entry with a lint rule)
and moves `ThemedText`, `Icon`, `RootPage`, `EmptyState`, error surfaces and `Button` in one
codemod; that is its own slice, recorded in ADR 067's "Revisit if".

Alternatives: put `Button` in `src/design/` and split the barrel now (two concerns in one slice, an
ADR 064 amendment, and one primitive in a different home from the five it sits beside); put it in
`src/design/` and have consumers deep-import (banned by the design-home rule).

### D2. Five variants, each a fixed token pairing

| Variant | Fill | Boundary | Label (`ThemedText` `tone`) | Use (iOS HIG / M3) | First consumers |
| --- | --- | --- | --- | --- | --- |
| `filled` | `primaryStrong` | none | `onPrimary` | `.borderedProminent` / Filled | every former `PrimaryAction`, welcome CTA, connect Continue, manual-import QR, changelog Continue, guide Next |
| `tonal` | `backgroundElement` | none | `primary` (= `text`) | `.bordered` gray / Filled tonal | personal events Add |
| `outlined` | none | 1 `outline` | `action` (= `actionText`) | (none on iOS) / Outlined | connect Back + intranet link, manual-import URL, guide Back |
| `text` | none | none | `action` | `.borderless` / Text | welcome Skip + Next, hidden events Unhide |
| `destructive` | `backgroundElement` | none | `destructive` | `.bordered` with `role: .destructive` / Tonal in error color | personal-event Delete |

- Brand pink never carries body text: label tones are `actionText` or `onPrimary` on
  `primaryStrong`, the AA pairs in `tokens.ts`. Outlined drops the 2px `primary` border for the M3
  1dp `outline` role, which clears 3:1 against `background`, `backgroundElement` and
  `backgroundSelected` in both schemes.
- New documented pairs (body floor): `actionText` on `backgroundElement` (light 5.16:1, dark
  4.78:1; `text` buttons inside element-filled rows such as Unhide) and `destructive` on
  `backgroundElement` at body floor (light 5.75:1, dark 9.37:1; today listed at the UI floor only).
  The existing `onPrimary`/`primaryStrong`, `text`/`backgroundElement`, `actionText`/`background`
  and `outline` pairs cover the rest. `contrast.ts` gets the rows; `theme.test.tsx` computes them.
- iOS has no outlined system style. `outlined` exists because the 3.1 screens pair a recommended
  and an alternative route side by side (QR vs URL, Continue vs Back) and the hierarchy must read
  without a second fill; rendering it as a gray `.bordered` on iOS would make it identical to
  `tonal`. Same geometry on both platforms.
- `variant` is required: intent is a decision at every call site, and a default would make
  `filled` the silent choice.

Alternatives: four variants with destructive as a `tone` flag (two props for one intent, and an
`outlined destructive` nobody needs); a brand-tinted `tonal` (`primarySoft` fill with `actionText`,
an unverified pair, and no consumer wants a pink wash).

### D3. Three sizes, all at least `MinTouchTarget`

| Size | `minHeight` | `paddingHorizontal` (`text`) | `paddingVertical` | Label step | Icon |
| --- | --- | --- | --- | --- | --- |
| `small` | `MinTouchTarget` | `Spacing.twoHalf` (`Spacing.two`) | `Spacing.one` | `label` | `IconSize.medium` |
| `medium` | `MinTouchTarget` | `Spacing.four` (`Spacing.twoHalf`) | `Spacing.two` | `label` | `IconSize.medium` |
| `large` | `MinTouchTarget + Spacing.two` (52 iOS / 56 Android) | `Spacing.five` (`Spacing.three`) | `Spacing.twoHalf` | `headline` | `IconSize.large` |

- `minWidth: MinTouchTarget` at every size, so a two-letter `text` button keeps the target.
- `small` does not shrink below the target: M3's 40dp small button reaches 48dp through an
  invisible touch area, and a visual box smaller than its pressable is a second geometry this
  slice does not need. `small` means compact horizontal padding and intrinsic width (inline and
  row actions).
- `large` is earned by the welcome final CTA (the first-run hero action); 56dp is the M3 medium
  button height, 52pt sits on the HIG large control size.
- Gap between icon and label `Spacing.two`. Radius `Radii.large` (16) at every size; on iOS with
  `borderCurve: "continuous"`. 16 is the M3 Expressive square shape for a medium button, and on a
  44–56 single-line button it reads close to the iOS 26 capsule while staying correct for a
  multi-line label at accessibility sizes (a `Radii.pill` stadium would cut into wrapped text, and
  Android clips content to the ripple shape).

No new token: `large` derives from `MinTouchTarget` and `Spacing`. If a second primitive needs the
large control height it becomes a token then.

### D4. States and accessibility

- `<Pressable accessibilityRole={role ?? "button"} accessibilityLabel={accessibilityLabel ?? label}
  accessibilityHint accessibilityState={{ disabled: blocked, busy }} disabled={blocked}
  onPress={blocked ? undefined : onPress}>` with `blocked = disabled || busy`. Callers cannot set
  `accessibilityState`.
- Busy: an `ActivityIndicator` (`size="small"`, label color, `accessible={false}`,
  `testID={`${testID}-progress`}`) inside a `View` carrying `accessibilityElementsHidden` and
  `importantForAccessibility="no-hide-descendants"` takes the leading slot (props on the indicator
  itself leave the native `UIActivityIndicatorView` exposed to VoiceOver as "In progress") and hides the icon; the label stays
  rendered and stays the accessible name. VoiceOver reads "Enregistrer, dimmed, button" plus the
  busy trait; TalkBack reads "Enregistrer, button, disabled, busy".
- Disabled and busy: whole-button opacity `StateOpacity.disabled`, no ripple, no pressed opacity.
- `accessibilityRole` accepts `"button" | "link"`; `link` is for controls that leave the app (the
  connect intranet link). In-app navigation is a `button`.

### D5. Press feedback per platform

- Android: `android_ripple={{ color: theme.ripple, foreground: true }}` when not blocked, and
  `overflow: "hidden"` so the ripple follows the radius. No opacity change.
- iOS: `opacity: StateOpacity.pressed` while pressed (the system highlight dim).
- The style callback returns `StyleSheet.flatten([...])`, so the host view always receives one
  object (safe under an `expo-router` `Slot`, see D8).

### D6. `style` is layout-only and merges last

```ts
type ButtonLayoutStyle = Pick<ViewStyle,
  | "alignSelf" | "flex" | "flexGrow" | "flexShrink" | "flexBasis"
  | "width" | "minWidth" | "maxWidth"
  | "margin" | "marginTop" | "marginBottom" | "marginStart" | "marginEnd"
  | "marginLeft" | "marginRight" | "marginHorizontal" | "marginVertical"
  | "position" | "top" | "bottom" | "start" | "end" | "left" | "right" | "zIndex">
style?: StyleProp<ButtonLayoutStyle>
```

The order is `[base, size, variant, state, style]`. Because the type admits no color, height,
padding, radius, border or opacity key, merging last cannot break an invariant, and a caller's
`alignSelf`/`width` wins over the defaults. This replaces `PrimaryAction`'s hostile-style test with
a type test (`@ts-expect-error` on `backgroundColor`, `minHeight`, `opacity`) plus a runtime test
that a caller's `alignSelf: "flex-end"` survives. The default is no `alignSelf`: a button stretches
in a column parent like `PrimaryAction` did, and sizes to content in a row.

### D7. Label and icon

- Label: `ThemedText type={size === "large" ? "headline" : "label"} tone={…}
  numberOfLines={16} style={{ textAlign: "center", flexShrink: 1 }}`. No `maxFontSizeMultiplier`:
  a button label is content and follows Dynamic Type and Android font scale fully. The cap of sixteen
  lines (N > 0) prevents the iOS uncapped-`Text` trailing-word clip; the default tail ellipsis is
  the overflow, never `ellipsizeMode="clip"`. The longest-strings story at AX XXXL is the gate, including
  its row fixture: the French sentence beside "Continuer" takes fourteen lines there.
- Icon: `icon?: { ios: SFSymbol; android: MaterialGlyph }`, rendered by `Icon` with
  `scaling="text"`, the label color, and the size from D3. `iconPosition?: "leading" |
  "trailing"` (default `leading`); `trailing` is earned by welcome Next (forward arrow) and the
  connect intranet link (open in browser). Glyphs not yet in `MATERIAL_GLYPHS` get a row there
  (the codepoint test proves it).

### D8. `PrimaryAction` is migrated outright, not aliased

Eight call sites, each a mechanical `PrimaryAction` → `Button variant="filled"` with the same
`label`, `accessibilityLabel`, `onPress`, `testID`, `disabled`, `busy`. An alias would be a second
name for one component, would need a deprecation rule and a later deletion slice, and saves eight
one-line edits. `primary-action.tsx`, its test, fixture and fixture test are deleted; their
assertions move into `button.test.tsx` and `button.gallery.test.tsx`. `ErrorState`'s
`primaryAction?: ErrorAction` keeps its name (it names a role in the error state, not the
component) and renders `<Button variant="filled" {...primaryAction} />`; `ErrorAction` stays
assignable.

The personal events Add button drops `Link asChild` for `onPress={() =>
router.push("/personal-event-form")}`. Native `Link` is a pressable that pushes; `Button` does not
forward a `Slot`'s injected props, and a `href` prop is a navigation API the primitive does not
need for one site. The list test asserts the push instead of the link.

Personal-event Delete passes `busy={isDeleting}` instead of `disabled`: the delete is an
in-flight mutation like Save, and busy is a superset of the disabled semantics the existing test
checks.

### D9. Call-site mapping (slice 3.1)

| File | Control (`testID`) | Variant / size / extras |
| --- | --- | --- |
| `onboarding/ui/welcome-controls.tsx` | Skip (`onboarding-skip`) | `text` `small`, `accessibilityLabel` kept |
| | Next (`onboarding-next`) | `text` `small`, trailing `arrow.forward` / `arrow_forward` |
| | final CTA (`onboarding-welcome-cta`) | `filled` `large` |
| `onboarding/ui/connect-screen.tsx` | intranet (`onboarding-connect-intranet`) | `outlined`, `accessibilityRole="link"`, trailing `arrow.up.right` / `open_in_new`, `style={{ alignSelf: "stretch" }}` |
| | Back (`onboarding-connect-back`) | `outlined` |
| | Continue (`onboarding-connect-continue`) | `filled`, `style={{ flex: 1 }}` |
| `onboarding/ui/manual-import-screen.tsx` | QR (`onboarding-import-qr`) | `filled`, leading `qrcode.viewfinder` / `qr_code_scanner`, hint kept |
| | URL (`onboarding-import-url`) | `outlined`, leading `link` / `link`, hint kept |
| `onboarding/ui/step-styles.ts` | unused `cta` | deleted |
| `onboarding/ui/institution-name-screen.tsx`, `programme-screen.tsx` | Continue | `filled` |
| `changelog/ui/changelog-sheet-screen.tsx` | Continue (`changelog-continue`) | `filled`, hint kept |
| `personal-events/ui/personal-event-actions.tsx` | Save (`personal-event-save`) | `filled`, `busy={isSaving}` |
| | Delete (`personal-event-delete`) | `destructive`, `busy={isDeleting}` |
| `personal-events/ui/personal-events-list.tsx` | Add (`personal-events-add`) | `tonal` `small`, `router.push` (D8) |
| `hidden-events/ui/hidden-events-screen.tsx` | Unhide | `text` `small`, `accessibilityLabel={unhideLabel}` |
| `export-guides/ui/guide-page-screen.tsx` | Next (`export-guide-next`) | `filled` |
| | Back (`export-guide-visible-back`) | `outlined` |
| `feedback/ui/feedback-screen.tsx`, `calendar-sources/ui/ical-url-screen.tsx`, `calendar-sources/ui/calendar-import-result-screen.tsx`, `components/error-surfaces.tsx`, `components/keyboard-safe-action-layout.gallery.tsx` | former `PrimaryAction` | `filled` |

Local `hitSlop` on migrated buttons is dropped: the target is the button's own minimum size.
Local style entries that only set fill, border, height, padding or radius are deleted; layout-only
entries become the `style` prop.

### D10. Lint: a ban plus a ratcheted local rule

1. **Touchables ban** (L3 subset). `rawTouchablesImportPath = { name: "react-native", importNames:
   ["Button", "TouchableOpacity", "TouchableHighlight", "TouchableWithoutFeedback",
   "TouchableNativeFeedback"], message }` appended to `paths` in `restrictedImports` with no flag:
   zero users, no exemption, so every block that builds through `restrictedImports` carries it.
   The L1 `react-native` entry stays separate; ESLint reports each entry's `importNames`
   independently (verified by inject-and-revert for both).
2. **`local/no-raw-button`** in `tools/eslint-rules/no-raw-button.js`. Reports a JSX element whose
   name is a local binding of `Pressable` imported from `react-native` (aliases followed), that has
   an `accessibilityRole` or `role` attribute equal to the string `"button"` or `"link"` (literal
   or literal in an expression container), and that has a **direct** JSX child named in the
   `textComponents` option (default `["ThemedText", "Text"]`), including a child inside a
   top-level `&&` or conditional expression. A function child (`{({ pressed }) => …}`) and a child
   wrapped in another element are not inspected: rows wrap their text in layout views, and the rule
   targets text buttons, not every pressable. RuleTester cases in `no-raw-button.test.js`.
3. **Ratchet.** Block `timecalendar/raw-button`: `files: ["src/**/*.tsx"]`, `ignores`:
   `src/components/button.tsx`, `src/components/chrome/**`, `src/features/calendar/renderer/**`
   (the owned renderer, ADR 033), `**/*.test.tsx`, and `...rawButtonAllowlist` from
   `tools/eslint-rules/raw-button-allowlist.js`. The allowlist is generated once after the
   migrations (lint with an empty list, collect the reported files, sort), committed with a comment
   per entry naming the slice that removes it. `raw-button-allowlist.test.js` fails when an entry's
   file is missing, when linting that file with only `local/no-raw-button` reports nothing (stale:
   remove it), or when `rawButtonAllowlist.length` exceeds `RAW_BUTTON_ALLOWLIST_CEILING`, a
   constant in the test set to the generated length. Growth needs a visible edit to the test.
   The test lints with `ESLint` (`overrideConfigFile: true`, `@typescript-eslint/parser`, the
   local plugin, one rule) so it does not depend on the project config's resolver settings.

Why a local rule rather than `no-restricted-syntax`: the selector needs binding resolution
(`Pressable` from `react-native`, aliases), and L8's caveat already makes `no-restricted-syntax` a
shared slot that every block setting it must spread; a ratchet block re-setting it for an
allowlist would be the replacement hazard lint-format.md warns about. A dedicated rule has its own
`files`/`ignores` and a RuleTester.

Why not ban `Pressable` outright: rows, tiles, calendar cells and chrome legitimately use it; the
L3 proposal's full ban waits for `ListRow` (3.6). This rule is ratchet-ready for that: the same
allowlist mechanism carries the later bans.

### D11. Gallery fixture

`src/components/button.gallery.tsx`, meta `{ id: "button", title: "gallery.button.title",
component: Button }`, registered in place of `primaryAction` in `registry.ts`.

| Story | Content |
| --- | --- |
| `Filled`, `Tonal`, `Outlined`, `Text`, `Destructive` | for that variant: `small`, `medium`, `large` × enabled, disabled, busy (nine buttons), and a press counter |
| `Icons` | leading icon on each variant, trailing icon on `text` and `outlined`, an icon button busy |
| `LongStrings` | `gallery.stress.action` and `gallery.stress.word` on `filled`, `outlined` and `text`, one with a leading icon, one in a row beside a short button |

Each button has a `testID` starting with `gallery-button-`, a translated label and, where several
share a label, a translated `accessibilityLabel` naming size and state, so a screen-reader pass can
tell them apart. Strings: `gallery.button.title`, `gallery.button.story.{filled,tonal,outlined,text,
destructive,icons,longStrings}`, `gallery.button.label`, `gallery.button.size.{small,medium,large}`,
`gallery.button.state.{enabled,disabled,busy}`, `gallery.button.a11y` (template `{{size}}, {{state}}`
appended to the label). The `gallery.primaryAction.*` keys go. `button.gallery.test.tsx`: the
counter increments on an enabled button and not on disabled/busy ones; busy buttons expose
`{ disabled: true, busy: true }` and keep their label.

### D12. ADR 067

Load-bearing (Principle 4): every later primitive and every phase 5 slice depends on the variant
set, the layout-only style type, the component home, and the ratchet mechanism. `decisions/067-button-family.md`
records D1, D2, D3 (sizes), D6, D8 and D10 with the rejected alternatives above, and "Revisit if":
the primitives move into `src/design/` (D1), a consumer needs a toggle/selected state or an
icon-only button, iOS adoption makes capsule shapes the only native look, or the allowlist reaches
zero (then the rule's ignores drop and the allowlist test is deleted). The ADR index gets the row;
check open PRs for a reserved number first (README note).

## Risks / Trade-offs

- [Visual change on every migrated screen: radius 8 → 16, outlined border pink 2px → neutral 1dp,
  text labels from `primary` to `actionText`, Android ripple added where there was none] → device
  pass in both schemes on iOS and Android (tasks §9); a rejected value is one row in D2/D3.
- [A narrower device or longer translation can still pass sixteen lines at AX XXXL] → the
  `LongStrings` story on device is the gate; the cap is one constant.
- [`overflow: "hidden"` on Android clips a descendant that overflows (a shadow, a badge)] → buttons
  carry neither; the gallery shows every variant.
- [The rule misses text buttons whose text is wrapped in a `View`, or built from `Animated`
  pressables] → by design (D10); review and the phase 4 bans cover them. The ratchet guards
  accident, not evasion, like every other seam rule.
- [The allowlist test's lint run differs from `npm run lint` config] → both use the same rule
  module; the test only decides "does this file still violate", which depends on the rule alone.
- [Removing `Link asChild` from personal events Add loses link prefetch] → native `Link` does not
  prefetch; the route stays the same.

## Migration Plan

Single PR on `feat/mobile-ds-button-family`. Order: contrast rows → `Button` + tests → fixture →
call-site migrations → delete `PrimaryAction` → lint rule + allowlist → docs. Rollback is a revert;
there are no data, route, or native changes.
