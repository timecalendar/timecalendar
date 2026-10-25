**For:** whoever runs the device passes and owns the native-settings seam (the text-size clip and
the deep-link Back need an iOS simulator or device and an Android build, which the implementing
agent did not run).

# Gallery fixtures for shared components (OpenSpec `mobile-ds-gallery-fixtures`): device findings

## What I need

1. **Back from a deep-linked story (task 6.3).** On a development build of this branch, open
   `timecalendar-dev://developer/gallery/primary-action--busy` cold (app killed) and warm (app on
   the Calendar tab), on iOS and Android. Back shows the gallery index with no visible transition
   when the story opened, and a second Back shows the tab. Opening a story from the index and
   going Back leaves one index (a second Back reaches Developer). If the reset under the top screen
   glitches during the warm-link push animation, defer it to the story's first `transitionEnd`
   inside `useGalleryIndexAnchor` (`mobile/src/features/developer/ui/gallery-anchor.ts`).
2. **Text-size change while a story is open (task 7.1).** On the iOS simulator at `content_size
large`, open `native-settings--header-and-alert`, `native-settings--long-strings`,
   `themed-text--long-strings` and `root-page--long-strings`, switch live to
   `accessibility-extra-extra-extra-large` (`xcrun simctl ui <udid> content_size
accessibility-extra-extra-extra-large`), and take a screenshot and the accessibility tree of
   each. Record which surface clips: the native navigation bar, `NativeSettingsHeader`, or React
   Native content. Reset to `large` and `light` afterwards.
3. **Screen-reader and large-text pass on the new stories**, per the device accessibility recipe in
   `docs/mobile/architecture-book/accessibility.md`, in French at the largest text size, both
   schemes. The story ids are listed in `docs/mobile/architecture-book/features.md` → Design system
   gallery.

## Expected result for item 2, and the proposed fix

The gallery device pass found that changing the content size with a native-settings header on
screen keeps the header at its old height and clips it, while a cold launch at the same size lays
out correctly. `GalleryStoryContent` is a plain `flex: 1` View and React Native text re-lays out
on a content-size change, so the pure React Native stories (`themed-text--long-strings`,
`root-page--long-strings`) are expected to adapt, and the clip is expected only in
`NativeSettingsHeader` (`mobile/src/components/chrome/native-settings-header.tsx`).

Suspected cause: the header is React Native content inside `RNHostView matchContents` inside a
SwiftUI `List` row. `matchContents` sizes the row from the React Native content once, and the row
does not re-measure when the content grows after a Dynamic Type change.

Proposed fix for the seam owner, needing a simulator check before it lands: re-key the
`RNHostView` (or the header's row) on `useWindowDimensions().fontScale`, so a content-size change
remounts the hosted content and SwiftUI measures it again. If re-keying does not resize the row,
reduce it to a minimal `List` + `RNHostView matchContents` reproduction and record it here as an
Expo UI defect. The gallery does not re-key `GalleryStoryContent`: that would hide in the gallery
a clip that ships in About and Settings.

If the screenshots show the gallery screen itself clipping (a pure React Native story clips), the
fix belongs in `mobile/src/features/developer/ui/gallery-story-screen.tsx` with a test.

## Observations from the fixtures (no device needed)

- **`FieldError` is not a field description on device.** The `error-surfaces--field-error` story
  links its `TextInput` to the `FieldError` through `aria-describedby` and the error's `nativeID`,
  as the web pattern does. React Native forwards no described-by relation to UIKit or Android
  views, so VoiceOver and TalkBack do not read the error when the field gains focus; they hear it
  only through `FieldError`'s alert role, its Android live region and the iOS announcement. Check
  on device whether the error is reachable from the field; if not, the error-surfaces owner can
  fold the message into the field's `accessibilityHint` while it is shown.
- **The registry check found no new violation.** Every new story renders light and dark on both
  platform branches with a role and a label on every control, so `known-a11y-violations.ts` is
  unchanged.
- **The `MenuView` mock now projects each platform's trigger.** iOS wraps the children in a button
  (the SwiftUI `Menu` label); Android wraps them in a non-accessible view and the children open the
  menu through `ref.show()`, as Expo UI's `MenuView.android.tsx` does. On iOS, `show()` is a no-op
  natively, so a trigger's own `onPress` does nothing there; the SwiftUI `Menu` label opens it.
  Check on device that `menu-view--default` opens from the trigger on both platforms and that
  VoiceOver meets the trigger once.

## Why

The implementing agent does not build native apps or drive simulators for this change; Jest proves
declared semantics, not wrapping, clipping, focus order or announcements.

## How to verify

Each item above passes on device or is recorded here with a screenshot description. A clip in
`NativeSettingsHeader` is fixed in the seam with the re-key above (or reported as an Expo UI
reproduction in this inbox) and the header story re-checked live.

## Blocks

Nothing blocks the fixtures. Slice 2.3 is complete once items 1 and 2 are recorded.
