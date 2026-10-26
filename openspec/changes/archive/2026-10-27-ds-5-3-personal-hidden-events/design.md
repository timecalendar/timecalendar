# Design

## Context

Slice 5.3 covers three routes. Each route is a one-line re-export and does not change:

| Route | Screen and private modules |
| --- | --- |
| `mobile/src/app/hidden-events.tsx` | `mobile/src/features/hidden-events/ui/hidden-events-screen.tsx` |
| `mobile/src/app/personal-events.tsx:1` | `mobile/src/features/personal-events/ui/personal-events-list.tsx` |
| `mobile/src/app/personal-event-form.tsx:7` | `personal-event-form-screen.tsx`, `personal-event-editor.tsx`, `personal-event-fields.tsx`, `personal-event-actions.tsx`, `color-swatch-picker.tsx`, `color-swatch-presets.ts`, `use-personal-event-delete-confirmation.ts` (all under `mobile/src/features/personal-events/ui/`) |

Earlier slices already did most of the roadmap row. `git log` on these folders shows 3.1
(`Button`), 3.3 (`StatusView`), 3.4 (`TextField`, `DateTimeField`), 3.6 (`ListRow`, `ListSection`)
and 3.7 (`ColorDot`). Hidden events renders `ListSection` + static `ListRow`s with a
`Button variant="text" size="small"` Un-hide accessory (`hidden-events-screen.tsx:105-146`,
`:156-173`). The list renders grouped `ListRow`s with a large `ColorDot` (`personal-events-list.tsx:98-121`).
The form uses `TextField`, `DateTimeField`, `Button variant="filled"` Save and
`Button variant="destructive"` Delete (`personal-event-fields.tsx:45-100`,
`personal-event-actions.tsx:40-56`). `screen-inventory.md:191-215` and `duplication-and-drift.md`
(B1, A2, A7, C1) describe the tree before those slices. The Android time-picking gap (C1) is
fixed: `DateTimeField` opens the date dialog and then the time dialog (features.md:131-133).

**Audit greps.** I ran the `duplication-and-drift.md` → Method greps on the eleven files at
`fc8d95fb`, plus `themeColor|type="(default|small|smallBold|subtitle)"|Pressable|Touchable|TextInput\b|PrimaryAction|useTheme|<Text\b`
and `\b(width|height)\s*:\s*[0-9]+`. Only these match:

| Grep | Hits |
| --- | --- |
| named color | `color-swatch-picker.tsx:62` `"transparent"` (allowed by the lint rule) |
| `StyleSheet.create(` | `hidden-events-screen.tsx:175`, `personal-event-actions.tsx:61`, `personal-event-editor.tsx:121`, `personal-events-list.tsx:125`, `personal-event-fields.tsx:105`, `color-swatch-picker.tsx:52` |
| style array | `hidden-events-screen.tsx:83`, `personal-events-list.tsx:50` (lane + one style), `color-swatch-picker.tsx:37` |
| border width | `color-swatch-picker.tsx:42,63` (`3`) |
| `hitSlop` | `color-swatch-picker.tsx:35` |
| `Platform.OS` | `color-swatch-picker.tsx:19`; `use-personal-event-delete-confirmation.ts:65,70` (Alert options, native-correct) |
| raw control / legacy text / `useTheme` | `personal-event-fields.tsx:76` `type="smallBold"`; `color-swatch-picker.tsx:2,4,18,26` (`Pressable`, `useTheme`) |
| literal size | `color-swatch-picker.tsx:59-60` (`48`) |

No hex, spacing, radius or typography literal, scheme read, `ActivityIndicator`, `Link`/`asChild`,
raw `Text`/`TextInput`, `themeColor` or `PrimaryAction` remains. `npx eslint src/features/hidden-events src/features/personal-events`
reports nothing.

**Ratchet status.** No in-scope path is on any allowlist in `mobile/tools/eslint-rules/`
(`style-literal`, `raw-primitive`, `raw-button`, `raw-text-input`, `ad-hoc-status`,
`ad-hoc-separator`, `header-action`, `raw-event-color`). In `eslint.config.js`, the only match is
`color-swatch-presets.ts` in `styleLiteralIgnores` (`eslint.config.js:64`). That file holds color
data, so it stays exempt. No ceiling moves:

| Allowlist test | Ceiling (unchanged) |
| --- | --- |
| `style-literal-allowlist.test.js` | `colorLiteral 1, typographyLiteral 7, legacyShadow 0, spacingLiteral 6, radiusLiteral 3` |
| `raw-primitive-allowlist.test.js` | `rawText 1, rawModal 0` |
| `raw-button-allowlist.test.js` | 5 |
| `ad-hoc-status-allowlist.test.js` | 2 |
| `raw-text-input`, `ad-hoc-separator`, `header-action`, `raw-event-color` | 1 each |

These lint gates pass for the swatch picker, but it is still the only hand-built control left on
these screens. `local/no-raw-button` inspects only text children (`no-raw-button.js:1-8`), and
border width and size keys are outside `local/no-style-literals` (lint-format.md → Style literals,
caveats).

**Form rhythm.** `KeyboardSafeActionLayout` defaults to content `paddingTop four, gap three` and
actions `gap two, paddingTop three, paddingBottom four` (`keyboard-safe-action-layout.tsx:158-164`).
The editor repeats `gap three` and the whole action style (`personal-event-editor.tsx:121-130`).
`PersonalEventActions` then wraps its buttons in a `View` with `paddingTop three, paddingBottom four, gap three`
(`personal-event-actions.tsx:29,61-67`), so the padding is doubled. The editor's
`paddingBottom: Spacing.five` on the content is the only value that is not a default.

**Selectors.** `.maestro/02-personal-event.yaml` uses `personal-event-title-input` (`:14,17`),
`personal-event-save` (`:20,40`), `personal-event-description-input` (`:32,37`) and
`personal-event-delete` (`:57,60,80`). It also uses the labels "Add an event" (`:11`, the calendar
action, not this list), "Edit this event" (`:29,54`), "Delete event.*" (`:64`) and the alert
"Delete" `above: id personal-event-delete` on iOS (`:77-80`). `e2e/maestro-selectors.test.ts:330-351`
pins these. No flow opens `/personal-events` or `/hidden-events`. The Jest suites reference
`personal-events-add`, `personal-events-list`, `personal-events-responsive-owner`,
`personal-events-empty`, `personal-event-row-<uid>`, `-color`, `personal-event-form-layout-owner`,
`personal-event-form-responsive-owner`, its `-content`, `-actions` and `-window-owner`,
`personal-event-start-picker`, `-end-picker`, `-end-picker-error`, `color-swatch-<hex>`,
`hidden-events-layout-owner`, `-responsive-content`, `-empty`, `-name-section`, `-uid-section`,
`hidden-events-name-<name>` and `hidden-events-uid-<uid>`. `personal-event-actions` (the inner
`View`) appears in no test and no flow.

## Goals / Non-Goals

**Goals:**

- Remove the last hand-built control (the swatch picker) and the last legacy text alias from
  these screens, and keep their selectors and announcements.
- Make the form's layout come only from `KeyboardSafeActionLayout`.
- Give the personal-events list the same create idiom as user calendars and the calendar.
- Encode the new rule in lint, not only in prose.

**Non-Goals:**

- `FieldChrome`'s own `type="smallBold"` label (`text-field.tsx:96`) and every other legacy-alias
  site: slice 4.3 removes the aliases repo-wide.
- Onboarding screens (slice 5.1, in flight in parallel). This change does not touch
  `src/features/onboarding/**`.
- The delete confirmation `Alert` and its platform options. These are the native dialog, and
  Maestro depends on the button order.
- A free-form color picker. The preset palette (ADR 011 storage, design D4 of the personal-events
  UI) stays.
- A swipe-to-un-hide or swipe-to-delete gesture.

## Decisions

### D1. The color picker becomes a design primitive, `ColorSwatchField`

**Decision.** Add `src/design/field/color-swatch-field.tsx`, exported from `@/design`, as the
third member of the field family (ADR 070):

```ts
type ColorSwatchOption = { color: string; label: string }
type ColorSwatchFieldProps = {
  label: string
  options: readonly ColorSwatchOption[]
  value: string
  onChange: (color: string) => void
  testID: string
  error?: string | null
  disabled?: boolean
  style?: StyleProp<TextFieldLayoutStyle>
}
```

- `FieldChrome` (`text-field.tsx:82`) draws the label, error and disabled dimming, so the color
  label matches Title, Starts and Ends, and the field gets `${testID}-label` and `${testID}-error`.
- Swatches are circles (`Radii.pill`) with a `MinTouchTarget` diameter (44 iOS, 48 Android). They
  sit in a wrapping row with `Spacing.two` gaps and no `hitSlop`. Each swatch is its own target,
  so neighbouring targets no longer overlap.
- The selected swatch draws a ring of a named design-local width (3, today's value) in `text`. An
  unselected swatch keeps the same transparent border, so selecting one does not shift layout. The
  ring's shape is the non-color cue (WCAG 1.4.1).
- Press feedback follows `Button` (`button.tsx:157-178`): Android draws a foreground `ripple`
  clipped to the circle, iOS dims to `StateOpacity.pressed`. When disabled, neither shows.
- Semantics stay as they are (accessibility.md:211-214). The row is a `radiogroup`. On Android each
  swatch is a `radio` with `checked`. On iOS, which has no radio trait, each swatch is a `button`
  with `selected`. Every swatch carries `disabled` in `accessibilityState` when the field is
  disabled. Its accessible name is the option `label`.
- Swatch testIDs are `${testID}-${color}`. The form passes `testID="color-swatch"`, so
  `color-swatch-#3F51B5` (`personal-event-form-screen.test.tsx:430`) keeps working.
- The primitive imports no feature and no translation key. Colors are drawn verbatim, as
  `ColorDot` draws them.

The feature keeps `SWATCH_PRESETS`, `DEFAULT_SWATCH` and `SWATCH_NAME_KEYS` in
`color-swatch-presets.ts` and maps them to options with `t()`. theming.md already says "color
names belong to the control" (`theming.md:378-380`). Here the control's caller supplies them, and
the type requires a `label` for every option.

**Alternatives.**

- *Keep the picker feature-local and only tokenize it* (`MinTouchTarget`, no `hitSlop`). This is
  the smallest diff. But it leaves a hand-built input control with its own label composition and
  `Platform` switch in a feature, which the roadmap row and the theming.md deferral both point at.
  The deprecated `smallBold` label would still need a hand-written replacement in the feature.
- *Build swatches from `ColorDot`.* `ColorDot` is decorative by contract: it is hidden from
  assistive technology, has no label, and its size is capped at 16 (`color-dot.tsx:44-48`,
  ADR 074). A swatch is an input control. Making the dot interactive would break ADR 074.
- *Native pickers.* SwiftUI `ColorPicker` is free-form with no Android twin, and it would drop the
  named presets. A `NativeList` choice list of named colors (the Google Calendar Android pattern)
  hides the colors behind a second screen for an eight-item choice. Flutter uses a
  `MaterialPicker` dialog (`app/lib/modules/personal_event/widgets/event_color_picker_dialog.dart:31-37`).
  Parity covers the outcome (a Material color stored as hex), not the dialog. The inline palette
  was already decided (personal-events UI design D4).
- *Circles vs. the current rounded squares.* Reminders' list colors and Material's color choices
  are circles, and the app's dot vocabulary is circular (theming.md → How event color appears),
  so a circle reads as the same color the list row shows.

**ADR.** Every earlier `@/design` primitive has its own ADR (067, 069, 070, 073, 074, 076). This
one gets `decisions/078-color-swatch-field.md`, or the next free number if another slice takes 078
first, with this decision, the alternatives and the lint gate in D2.

### D2. Enforcement: `local/no-raw-radio-group`, no allowlist

A hand-built choice control has no reliable static signature in general, but its role does. After
D1, `radiogroup` and `radio` appear only inside `src/design/` (the new field) and chrome (Compose
`RadioButton`, which carries no RN role). The new rule `tools/eslint-rules/no-raw-radio-group.js`
reports a JSX `accessibilityRole` or `role` attribute in `src/features/**` and `src/app/**`
(tests ignored) whose value is the literal `"radiogroup"` or `"radio"`, or a conditional either
branch of which is one of these literals. It applies to `color-swatch-picker.tsx:30`'s
`isAndroid ? "radio" : "button"` shape. The message points to `ColorSwatchField` from `@/design`
and to `NativeList` choice rows from `@/components/chrome`. No file violates it after this change,
so there is no allowlist and no ceiling, as with `local/no-retired-list-names`. RuleTester covers
literal, conditional, `role=` and the passing cases (`"button"`, a variable, design paths).
Inject-and-revert: `accessibilityRole="radiogroup"` in `personal-event-fields.tsx` fails
`npm run lint`.

*Alternative:* a `no-restricted-syntax` selector. The `restrictedSyntax` list is replaced by any
later block that sets the rule (`eslint.config.js:395-396`), which makes it fragile, and a
selector cannot see conditionals as clearly. The house pattern is a local rule.

### D3. The editor passes no layout style; actions are a fragment

`PersonalEventEditor` drops `contentContainerStyle`, `actionContainerStyle` and its `StyleSheet`.
`PersonalEventActions` returns `<>{error}{Save}{Delete}</>` and drops its `View`, `StyleSheet` and
`Spacing`. The `personal-event-actions` testID goes with the `View`, since no test or flow uses it.
The action region is then exactly the shared rhythm: 12 above, 16 below, 8 between the notice,
Save and Delete. This matches Feedback and iCal URL.

The content's `paddingBottom: Spacing.five` goes too. Institution name, Programme and iCal URL pass
no content style. The 12 pt `paddingTop` of the action region already separates the last field
from Save. Feedback's `paddingBottom: four` is its own composition and stays (5.2 D3).

*Alternative:* keep `paddingBottom: five` as a one-off. The DS 5.2 reviewer asked for this editor
to stop restating layout, and no other top-placed form adds it. If the iOS pass shows the
multiline description sitting too tight above Save when scrolled to the end, the fix is a layout
default in `KeyboardSafeActionLayout`, not a caller style. That is out of scope here, and the
device check in tasks 6.1 records it.

### D4. Save and Delete stay stacked; no `ButtonRow`

`ButtonRow` places a secondary next to a primary (theming.md → Buttons). Putting a destructive
action next to Save invites a mis-tap, and the HIG keeps destructive actions apart from the primary
one. On iOS, Maestro finds the alert's "Delete" `above: id personal-event-delete`
(`02-personal-event.yaml:77-80`), which assumes Delete is the bottom element. Save and Delete stay
full width, Save first, in the pinned footer. The existing spec scenario "Save and Delete remain in
the sticky footer" holds.

*Alternative:* Save as an iOS header "Done" item. This is HIG-typical for modal edit sheets, but
this route is a pushed Stack screen. Header items expose no `identifier` to XCUITest (ADR 075
Consequences), so flow 02's `id: personal-event-save` taps would break on iOS. Not worth it for
this slice.

### D5. The personal-events list uses the create idiom (ADR 075)

`useHeaderActions({ right: [{ icon: { ios: "plus", android: "add" }, accessibilityLabel: t("personalEvents.list.add"), testID: "personal-events-add", platform: "ios", onPress }] })`
is spread into the one `Stack.Screen` options. A `FloatingAction` with the same icon, label and
testID is a sibling after the `FlatList` inside the `RootPage` render function. On Android the
`FlatList` content pads its bottom by `Layout.fabClearance` (`Platform.OS === "android"`, as
`agenda-list.tsx:87`). This is the user-calendars pattern (`user-calendars-screen.tsx:31-41`,
`:105-110`), which uses one testID for both platforms. The `ListHeaderComponent`, its `View` and
`styles.header` are deleted. `styles.list` keeps `flexGrow: 1, paddingVertical: Spacing.four`.

The empty copy "No events yet. Tap Add to create one." names a control that no longer has a
visible "Add" text: on iOS it is a "+" glyph. Following the hidden-events pattern, the empty
`StatusView` gets a title and a caption: `personalEvents.list.empty` becomes "No personal events" /
"Aucun événement personnel", and a new `personalEvents.list.emptyCaption` reads "Events you add
appear here." / "Les événements que vous ajoutez apparaissent ici.". No artwork, which keeps the
change small; hidden events' artwork belongs to its own spec.

*Alternative:* an iOS text header item "Add". User calendars and the calendar use the `plus`
glyph, and Calendar, Contacts and Reminders do the same. Consistency wins.

### D6. Hidden events: delete the redundant wrapper, keep the structure

`StatusView`'s `section` presentation sets `flexGrow: 1` itself (`status-view.tsx:317-318`), and
the `ScrollView` content already has `flexGrow: 1`. The `View style={styles.stateLane}` wrapper
(`:93`, `:176`) does nothing, so it goes. `styles.content` and `styles.error` stay: tokens only,
screen-specific composition. The `ScrollView` + `ListSection` structure stays. A row with a caller
accessory is the case `ListRow` exists for (theming.md → Lists), and `NativeList` cannot host the
Un-hide `Button`. The header comment (`:25-33`) is cut to the current why: un-hide must be
reachable here because hide-by-name has no per-event surface, and stale uids are omitted for
Flutter parity. It loses the slice and decision labels.

### D7. Comments state the current why only

`personal-events-list.tsx:24-29` (B2/TIM-133 history, "Home-tab") is deleted or cut to one current
line. The row's Maestro comment (`:117-118`) stays, because it is a non-obvious why. The new
primitive gets a comment only where the iOS `button`/`selected` choice needs one ("UIKit has no
radio trait", carried over).

## Risks / Trade-offs

- [iOS swatches shrink from 48 to 44 pt] → They match the platform target. Eight 44 pt swatches
  with 8 pt gaps take 408 pt, so the row wraps to two lines on a 390 pt readable lane, as it does
  today with 48 pt swatches (440 pt). The device pass checks the wrap at default and AX5.
- [The ring color `text` on a dark swatch in dark mode] → The ring is drawn on the swatch edge,
  where it contrasts with the page background, not with the swatch fill. That is today's behavior.
  The gallery `--default` story in both schemes is the visual check, and the registry a11y matrix
  checks names and roles.
- [Removing the content `paddingBottom: five` tightens the scrolled-to-end gap] → D3 explains the
  choice. The iOS device check records the result, and any fix goes in the layout, not the caller.
- [Copy change on the list empty state] → FR/EN parity is enforced by the i18n parity test. The
  list test asserts the new title and caption.
- [ADR number collision with the parallel 5.1 slice] → Use the next free number at commit time and
  fix the links in the same commit.
- [Android FAB and TalkBack on the list] → Not verifiable on the Mac. HUMAN inbox note.

## Migration Plan

Two commits on `feat/mobile-ds-5-3-personal-hidden-events`, as in 5.2:

1. Code: primitive + gallery + tests, lint rule, the three screens, i18n, jest tier.
2. Book: theming.md, accessibility.md, lint-format.md, features.md, ADR, CHANGELOG.md.

Rollback: revert the PR. There is no data, route or native change. The RN app is not in
production, so no binary compatibility applies.
