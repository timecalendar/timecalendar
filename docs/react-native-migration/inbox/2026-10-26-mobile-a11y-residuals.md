**For:** the planner of the next mobile accessibility change. No human action is needed.

# Accessibility residuals after `fix-mobile-a11y-device-findings`

## 1. Multi-word iOS settings labels still hyphenate at the largest sizes

At accessibility XXXL on an iPhone 17 (402pt), a multi-word row label whose longest word is
wider than the label column breaks mid-word: "Appear-ance & language" in Settings, "Naviga-tion
row" in the settings gallery, "Some-thing went wrong" in `NativeListAlert`. One-word labels
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
Windows PC (`ssh pc`) was unreachable. The EAS cloud `development` APK (build
`172f895d-41fc-4f91-bd0d-fd0ba38d1a4d`) works on the Pixel_10 emulator.

The blank screen after `pm clear` is a development-build artefact, not an app bug. Logcat on
`origin/main` JS shows that every gate settles and Home mounts. The wait is long: about 37 seconds
from `Running "main"` to the first app log (`01:09:17.7` → `01:09:54.7`). A warm relaunch without
clearing data takes the same time (`01:08:04` → `01:08:40`), and so does a run with no debugger
attached. During that time Hermes interprets the development bundle under the emulator, and the
root gates render nothing. On iOS, a newly created simulator with the app freshly installed
renders Home within 13 seconds of the bundle being served. Release builds with
`clearState: true` (`ci-mobile-e2e`) get past startup on both platforms. `mobile/EAS.md`
("Opening a development build on a fresh install") documents the launch commands and how long to
wait.

Next: run the Android checks above on the OnePlus (adb 86fa07cc) or the PC emulator at
`font_scale 2.0`. Give each cold launch about 40 seconds before the first screenshot.
