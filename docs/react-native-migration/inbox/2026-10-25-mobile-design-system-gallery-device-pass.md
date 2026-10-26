**For:** whoever runs the device passes (TalkBack and VoiceOver quality needs a person listening,
and Android builds run on the Windows host, not the Mac).

# Component gallery (OpenSpec `add-mobile-design-system-gallery`): screen-reader and Android pass

## What I need

On a development build of `main` once the gallery is merged, follow the device accessibility
recipe in `docs/mobile/architecture-book/accessibility.md` (Device accessibility recipe) for these
stories, and record pass or fail per line:

- `native-list--rows`, `native-list--switches`, `native-list--choices`,
  `native-list--long-strings`, `native-text-entry-dialog--submit-disabled`.
- **Android (Windows host):** each story at `font_scale 2.0` and in night mode, app language
  French. Rows grow without clipping; the long-strings story wraps every label, footer and the
  unbreakable word; the dialog's Save is visibly disabled.
- **TalkBack (Android) and VoiceOver (iOS):** swipe through each story from the top. The first
  stops are the back button and the story title; each row is one stop with its label, value and
  role; switches and choices announce their state; decorative icons are not stops; the disabled
  Save announces as dimmed/disabled.
- **Dialog stories:** Cancel, Back and Save close the text-entry dialog and "Open the dialog"
  reopens it; on `native-text-entry-dialog--pending`, Cancel works after about three seconds.
- **Preview build:** `/developer/gallery` opens from Settings → Developer → Component gallery on a
  TestFlight or Play internal preview build, and a story renders its real SwiftUI/Compose controls.

## Android switch row: two TalkBack stops (known violation)

Every Android `NativeListSwitchRow` (the gallery's `native-list--switches` and
`native-list--long-strings`, and every product switch row such as the calendar-visibility and
show-weekends rows) gives TalkBack two stops: the toggleable `ListItem` ("<label>, Switch, On/Off")
and then an unlabeled "Switch" on the trailing thumb. Compose merges a row's descendants into its
node but stops at a child with its own toggle semantics, and Expo UI's `SwitchView` always passes
the Material `Switch` a non-null `onCheckedChange`, so the thumb keeps its own node whatever the row
does.

The registry check lists these as known violations in
`mobile/src/design/gallery/known-a11y-violations.ts` (Android, elements
`gallery-native-list-switch-on > switch`, `gallery-native-list-switch-off > switch`,
`gallery-native-list-long-switch > switch`).

Proposed fix, needing an Android build and a TalkBack check before it lands:

- A local Android-only Expo module under `mobile/modules/` registers a `clearAndSetSemantics`
  Compose modifier into Expo UI's `ModifierRegistry` (the documented extension path for custom
  modifiers) and exports a `clearAndSetSemantics()` modifier config.
- The switch row's trailing `Switch` carries `clearAndSetSemantics()` (it keeps its touch target),
  and the row `ListItem` carries `switchTestID ?? testID`, the id the iOS Toggle carries; Maestro
  `03-calendar-visibility` then still finds `user-calendar-visibility-<id>` on Android, and the jest
  Compose `Switch` mock renders a non-control when its semantics are cleared.
- On the build: the module compiles, TalkBack meets each switch row once with no unlabeled
  "Switch" stop, tapping the row or the thumb toggles once, and the Android Maestro suite passes.

Acceptance: the three entries are deleted from `known-a11y-violations.ts` and the registry test
stays green.

## Already found on the iOS simulator

The agent device pass (`openspec/changes/archive/2026-10-25-add-mobile-design-system-gallery/evidence.md`,
section 8.4) found three native-list seam issues worth deciding on:

- At the largest accessibility text size, a row with a trailing value and badge keeps them beside
  the title, which then wraps two to three characters per line.
- Changing text size while a native-list header is on screen keeps its old height and clips it.
- A story opened by deep link has no gallery index beneath it; Back returns to the previous tab.

## Why

Jest proves every control declares a role and a label under the native mocks; it cannot judge
announcement quality, focus order or rendered wrapping. The agent pipeline cannot listen to a
screen reader or build Android on the Mac.

## How to verify

Every line above passes, or each failure is filed as a follow-up against the fixture or the
native-list seam. A failure the registry check also sees goes in `known-a11y-violations.ts`
with a link to its note, never as a looser check.

## Blocks

Nothing blocks the gallery. The switch-row fix above waits on an Android build. Slice 2.3 (fixtures for existing primitives) should read the result
first.
