**For:** the planner of the next mobile accessibility change. No human action is needed.

# Accessibility residuals after `fix-mobile-a11y-device-findings`

## 1. Multi-word iOS settings labels still hyphenate at the largest sizes

At accessibility XXXL on an iPhone 17 (402pt), a multi-word row label whose longest word is
wider than the label column breaks mid-word: "Appear-ance & language" in Settings, "Naviga-tion
row" in the settings gallery, "Some-thing went wrong" in `NativeSettingsAlert`. One-word labels
stay on one line and shrink (`minimumScaleFactor(0.5)`), which `accessibility.md` records.

`@expo/ui` 56 exposes no SwiftUI lever that stops hyphenation for multi-word text, and a
`lineLimit` + `minimumScaleFactor` pair still accepts the hyphenated layout because it fits.
Candidates: cap row labels with a `dynamicTypeSize` range if `@expo/ui` gains the modifier, or
move the leading icon tile above the label at accessibility sizes so the label gets the full row
width. Verify on the simulator; neither is proven.

## 2. Device 12/24-hour setting applies to some time formats only

`formatShortDateTime` (personal-events list, Android date field) and the iOS picker follow the
device clock. Time ranges and event details keep 24-hour `HH:mm` (rule R-3 in `calendar.md`). A
12-hour device sees both formats. Decide whether every time format follows the device clock, and
compare with the Flutter app.

## 3. Dense checklist glyph at AX5

`checklist-progress-indicator.tsx` scales its dense glyph with text inside bounded calendar tiles
(7pt to about 25pt at AX5). It matches its count text, but nobody has looked at it on a device at
AX5 or font scale 2.0.

## 4. Android device pass still owed (PR #485)

None of the Android parts of #485 were checked on a device: the 2.0 icon boxes, the Android
date field following 12h, TalkBack radio/checked swatches and the event-details dot at 2x. The
Windows PC (`ssh pc`) was unreachable. An EAS cloud `development` APK (build
`172f895d-41fc-4f91-bd0d-fd0ba38d1a4d`) was installed on the Pixel_10 emulator. After
`pm clear` it stays on a blank screen: the root layout's bootstrap gates render `null` and
nothing mounts. `origin/main` JS does the same, so the cause is the build or emulator setup, not
#485. Before clearing data, the app rendered Home at font scale 1.0. Next: run the Android checks
above on the OnePlus (adb 86fa07cc) or the PC emulator at `font_scale 2.0`, and find out which gate
blocks a fresh install of the EAS development APK.
