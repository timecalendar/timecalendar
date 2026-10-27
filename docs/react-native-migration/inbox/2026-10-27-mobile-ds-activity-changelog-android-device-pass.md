**For:** whoever runs the Android device pass (OpenSpec `mobile-ds-activity-changelog`). The
delivery pipeline runs the iOS simulator pass. Android builds never run on the Mac.

# Activity, changelog history and changelog sheet on the design system: Android device pass

## Status

Not done. The pipeline tried the Windows host on 2026-10-27: `ssh pc` timed out, so the host was
unreachable. The pass needs a person on an Android device, or a retry once the host is reachable.

## What I need

Run this pass on an Android development build of `main` once roadmap slice 5.4 has merged, in
light and dark, at font scale 1.0 and 2.0. Routes open with `timecalendar-dev://<route>`.

1. **Gallery.** `developer/gallery/list-section--header-detail`: the header title is the M3
   `label` style in the action color, with the detail line below it; the long case caps at 4 lines.
2. **Activity.** `activity`: cold-open loading (spinner and "Loading recent changes"), the empty
   state, the empty-failure state (offline, pull to refresh), a populated timeline with two or more
   groups (group headers spaced like list sections), the older-page footer while loading, and the
   cached-failure notice with a 16 dp gap above the first group header.
3. **Changelog.** `changelog` (history) and `changelog-sheet`: each release is an M3 grouped
   section, rows show a flat leading icon, rows wrap at 2.0 with no clipped text, and Close and
   Continue both dismiss the sheet.

## Why

Jest proves roles, names and flattened styles. It cannot prove M3 rendering, ripples or wrapping
at large font scales on a device.

## How to verify

Record pass or fail for each item in this file with a screenshot, then move the file to `done/`.
Fix a header failure in `mobile/src/design/list/list-section.tsx`, an Activity failure in
`mobile/src/features/activity/ui/activity-screen.tsx`, and a changelog failure in
`mobile/src/features/changelog/ui/changelog-content.tsx`.

## Blocks

Nothing. The PR merges on green CI and the iOS pass. This pass closes the Android device check for
roadmap slice 5.4.
