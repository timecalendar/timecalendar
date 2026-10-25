**For:** whoever runs the device passes (TalkBack and VoiceOver quality needs a person listening,
and Android builds run on the Windows host, not the Mac).

# Component gallery (OpenSpec `add-mobile-design-system-gallery`): screen-reader and Android pass

## What I need

On a development build of `main` once the gallery is merged, follow the device accessibility
recipe in `docs/mobile/architecture-book/accessibility.md` (Device accessibility recipe) for these
stories, and record pass or fail per line:

- `native-settings--rows`, `native-settings--switches`, `native-settings--choices`,
  `native-settings--long-strings`, `native-text-entry-dialog--submit-disabled`.
- **Android (Windows host):** each story at `font_scale 2.0` and in night mode, app language
  French. Rows grow without clipping; the long-strings story wraps every label, footer and the
  unbreakable word; the dialog's Save is visibly disabled.
- **TalkBack (Android) and VoiceOver (iOS):** swipe through each story from the top. The first
  stops are the back button and the story title; each row is one stop with its label, value and
  role; switches and choices announce their state; decorative icons are not stops; the disabled
  Save announces as dimmed/disabled.
- **Preview build:** `/developer/gallery` opens from Settings → Developer → Component gallery on a
  TestFlight or Play internal preview build, and a story renders its real SwiftUI/Compose controls.

## Already found on the iOS simulator

The agent device pass (`openspec/changes/archive/2026-10-25-add-mobile-design-system-gallery/evidence.md`,
section 8.4) found three native-settings seam issues worth deciding on:

- At the largest accessibility text size, a row with a trailing value and badge keeps them beside
  the title, which then wraps two to three characters per line.
- Changing text size while a native-settings header is on screen keeps its old height and clips it.
- A story opened by deep link has no gallery index beneath it; Back returns to the previous tab.

## Why

Jest proves every control declares a role and a label under the native mocks; it cannot judge
announcement quality, focus order or rendered wrapping. The agent pipeline cannot listen to a
screen reader or build Android on the Mac.

## How to verify

Every line above passes, or each failure is filed as a follow-up against the fixture or the
native-settings seam (not as an exemption in the registry test).

## Blocks

Nothing; informational. Slice 2.3 (fixtures for existing primitives) should read the result
first.
