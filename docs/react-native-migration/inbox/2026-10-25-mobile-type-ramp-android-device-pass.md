**For:** whoever runs the device passes (an Android build has to run on the Windows host, and the
check needs eyes on a real screen).

# Platform type ramp (OpenSpec `mobile-type-ramp`): Android device pass

## What I need

On an Android dev build of `main` (the ramp is merged), check these screens at the default font
size and at the largest font size, in light and dark, and record pass or fail per line below:

- Home: the greeting in the welcome card (30pt local override, now with 0.5 body letter spacing)
  and the "Up next" / "Today" section titles.
- Onboarding welcome: the `title` step is 28/36 at weight 400 on Android (was 48/52 at 600).
- Event details: the title (`title`, 28/36/400) and the checklist header (`sectionTitle`, 22/28/400).
- Any `EmptyState` (Hidden events with nothing hidden): the title is `sectionTitle`, 22/28/400.
- Calendar tab: the date header (weekday label and day numbers now carry 0.5 letter spacing).
- Any `PrimaryAction` label: `label` step, 14/20 at weight 500 (was 700).

Specific question: do the M3 400-weight headings read as headings next to the 500-weight labels?
If not, raise the Android weights in `mobile/src/theme/typography.ts` and update ADR 063.

## Why

Android builds do not run on the Mac, and this pass ran on the iOS simulator only.

## How to verify

Every line above passes, or the failing step's values are adjusted in `typography.ts` with the
ADR 063 table updated to match.

## Blocks

Nothing; informational. Phase 5 (screen migration to ramp names) should read the result first.

## iOS findings, for context

The iOS 26 simulator pass covered Home, Settings, onboarding welcome and Event details at the
default size and at AX5, in light and dark. Nothing broke at the default size. At AX5, these
layout issues are outside the ramp and belong to phase 5:

- The Home app name (a local 21pt override) breaks mid-word ("TimeCalen-dar").
- On onboarding welcome, the subtitle is clipped by the pager's fixed height, and the title
  breaks off a single character ("TimeCalenda / r!").
- Settings rows (not `ThemedText`) hyphenate labels beside their values instead of stacking.
