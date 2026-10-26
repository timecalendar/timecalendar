# iOS: text frames keep their old size after a runtime Dynamic Type change

**For:** the human owner (a cross-cutting framework decision, outside one screen's slice).

## What I need

Decide how the app handles a Dynamic Type change made while it is running on iOS: track or report
it upstream in React Native, or adopt an app-level workaround (for example remounting the
navigator content when `useWindowDimensions().fontScale` changes, which resets navigation state).

## Why

Found during the slice 5.1 (onboarding welcome) device pass, iPhone 17 Pro simulator, iOS 26.5,
React Native 0.85.3 (Fabric), Expo SDK 56:

- Cold launch at `accessibility-extra-extra-extra-large`: the welcome pages wrap and grow
  correctly (title on two lines, body on three, Skip and Next whole).
- Changing the size with `xcrun simctl ui <udid> content_size …` while the app runs: every React
  Native `Text` keeps the frame measured at the previous size and draws at the new size. Going
  up, the welcome title is cut to "Welcome to TimeC", the body to its top pixels, Skip and Next
  to fragments. Going down, the boxes stay AX-sized around default-size glyphs. Home shows the
  same stale frames, so it is app-wide, not onboarding layout.
- Views whose props change with `fontScale` (the welcome illustration height) do resize, so React
  re-renders; only the text measurements stay stale.
- `SurfaceHandler::constraintLayout` dirties measurable nodes on a `fontSizeMultiplier` change
  behind `enableFontScaleChangesUpdatingLayout` (default `true` in 0.85.3), and
  `RCTFabricSurface` listens to `UIContentSizeCategoryDidChangeNotification`. Text that sets
  `dynamicTypeRamp` (every `ThemedText`) derives its scale from `UIFontMetrics` at attributed-string
  build time, which is a candidate for why the re-measure does not take. Not confirmed.

## How to verify

On the simulator: open `timecalendar-dev://onboarding` at the default size, run
`xcrun simctl ui <udid> content_size accessibility-extra-extra-extra-large`, and screenshot. Fixed
when the title wraps to two lines without relaunching.

## Blocks

Nothing. Slice 5.1 ships with cold-launch AX5 verified; this note tracks the runtime-change case.
