**For:** whoever runs the device passes, and the owner of `MenuView`'s glass
trigger (the items below need an iOS simulator or device and an Android build).

# Gallery fixtures for shared components (OpenSpec `mobile-ds-gallery-fixtures`): device findings

## What I need

1. **Back from a deep-linked story (task 6.3).** On a development build of this branch, open
   `timecalendar-dev://developer/gallery/design-tokens--colors` cold (app killed) and warm (app on
   the Home tab), on iOS and Android. Back shows the gallery index, a second Back shows the tab.
   Opening a story from the index and going Back leaves one index (a second Back reaches
   Developer).
   - iOS 26.5 simulator: warm passes. Cold passes with `useGalleryIndexAnchor` re-applying the
     anchor on the root Stack's `state` events: on a cold link the container commits its initial
     state about 6 ms after the story's first effect and reverts the mount-time reset to
     `[(tabs), story]` with the same route keys, which sent Back straight to Home. Android is
     unchecked.
2. **Live text-size change (task 7.1, done on iOS).** On the iOS 26.5 simulator (iPhone 17 Pro
   Max) at content size `large`, switching live to `accessibility-extra-extra-extra-large`
   (`xcrun simctl ui <udid> content_size accessibility-extra-extra-extra-large`):
   - `themed-text--ramp` keeps its old row heights; every line is clipped top and bottom and rows
     overlap.
   - The Home tab, a plain React Native screen outside the gallery, clips the same way (the "Take
     care" hero and the section titles are cut).
   - The SwiftUI Settings screen re-lays out correctly, and the native navigation bar title in the
     gallery does not clip (it stays at its capped size).
   - Reopening the story, or a cold launch at the same size, renders correctly.

   React Native text measurement is not invalidated by a live Dynamic Type change, app-wide. It is
   neither a gallery nor a `NativeSettingsHeader` defect, and the gallery adds no re-key
   workaround: one would hide in the gallery a clip every React Native screen ships. Open: whether
   Android shows the same on a live font-scale change, and a minimal React Native reproduction
   (one `Text` in a `View`, live content-size switch) to decide whether this is a React Native
   Fabric text-cache issue for the runtime owner.

3. **Screen-reader and large-text pass on the new stories**, per the device accessibility recipe in
   `docs/mobile/architecture-book/accessibility.md`, in French at the largest text size, both
   schemes, on Android. The story ids are listed in `docs/mobile/architecture-book/features.md` →
   Design system gallery. iOS light default size and dark AX5 rendered every story without
   clipping except the component findings below.

## Component findings (not fixed by the gallery)

- **`MenuView` glass trigger at AX5.** `menu-view--long-strings` at AX5 (iOS): the trigger's glass
  capsule becomes a circle and the wrapped label overflows its background shape. Minor.

## Observations from the fixtures

- **iOS compact date picker width.** Expo UI's iOS `DateTimePicker` hosts SwiftUI in a `Host` that
  matches its content vertically only, so its width comes from React Native layout. In a column
  with `alignItems: "flex-start"` the host collapses and the pill overflows the left screen edge;
  the `date-time-picker` fixture lets the picker stretch to the lane, as the personal-event form
  does, and the pill centers in it. Any new caller must give the picker a width.
- **The registry check found no new violation.** Every new story renders light and dark on both
  platform branches with a role and a label on every control, so `known-a11y-violations.ts` is
  unchanged.
- **The `MenuView` mock projects each platform's trigger.** iOS wraps the children in a button
  (the SwiftUI `Menu` label). Android wraps them in a `Pressable` with `accessible={false}` whose
  press opens the menu, as Expo UI's `MenuView.android.tsx` does; the children carry their own
  role. On iOS, `show()` is a no-op natively, so a trigger's own `onPress` does nothing there; the
  SwiftUI `Menu` label opens it. Check on Android that `menu-view--default` opens from the trigger
  and that TalkBack meets the trigger once.

## Why

The implementing agent does not build native apps; Jest proves declared semantics, not wrapping,
clipping, focus order or announcements.

## How to verify

Item 1 passes on Android cold and warm. Item 3 is recorded here per story. Each component finding
is fixed in its component with a gallery story re-checked at AX5, or stays listed here.

## Blocks

Nothing blocks the fixtures. Task 6.3 closes once item 1 passes on Android.
