**For:** whoever runs the manual screen-reader passes (OpenSpec `mobile-ds-activity-changelog`,
roadmap slice 5.4). The delivery pipeline runs the iOS simulator and Android visual passes. A
VoiceOver and TalkBack pass needs a person on a device.

# Activity and the changelog on the design system: screen-reader pass

## Status

Not done.

## What I need

On a development build of `feat/mobile-ds-activity-changelog` (or `main` once merged), in English
and French, with VoiceOver on an iPhone and TalkBack on an Android phone:

1. **Gallery.** Open `timecalendar-dev://developer/gallery/list-section--header-detail`. Swipe
   through the story: the header with a detail line is **one** heading stop that reads the title,
   then the detail. The rotor (VoiceOver) or heading navigation (TalkBack) lands on it once.
2. **Activity.** Settings → Activity, with at least two cached groups:
   - On a cold open, the loading state reads "Loading recent changes" as busy/in progress, once.
   - Each group header is one heading stop: "<calendar>, changed <time>". Heading navigation moves
     group to group.
   - Scroll to the end with an older page pending: "Loading older changes" is announced once and
     is not re-announced on every scroll.
3. **Changelog.** About → What's new, then force the sheet (developer page, or reset the seen
   version):
   - "Version 4.0" is a heading. Each item is one stop that reads its title, then its description.
     The icon is never a stop.
   - Close reads "Close" with the hint "Closes what's new and marks this version as seen" on both
     platforms. Continue reads its label and hint.

## Why

Jest proves the roles, names and busy state in the React Native tree. It cannot prove what UIKit
and TalkBack do with a two-line `header` element, or whether the inline loading footer re-announces
inside a virtualized list. No agent can drive a screen reader by ear.

## How to verify

Record pass or fail per item in this file with the spoken transcript, then move it to `done/`. Fix a
header failure in `mobile/src/design/list/list-section.tsx`, an Activity failure in
`mobile/src/features/activity/ui/activity-screen.tsx`, a changelog failure in
`mobile/src/features/changelog/ui/changelog-content.tsx`.

## Blocks

Nothing. The PR merges on green CI and the conductor's device passes. This pass closes the
screen-reader check for slice 5.4.
