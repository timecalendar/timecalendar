**For:** whoever runs the Android device and screen-reader passes (OpenSpec
`ds-5-5-school-group-provider-guide`). The delivery pipeline runs the iOS simulator pass. Android
rendering, TalkBack and VoiceOver judgement need a person on a device or on the Windows host. Android
never builds on the Mac.

# School picker, group picker, provider selection and guide page: device and screen-reader pass

## What I need

On an Android device (and VoiceOver on an iPhone or the simulator), light and dark, default text and
the largest text size:

1. **School picker** (the onboarding welcome CTA):
   - Each row leads with a 40 dp rounded logo chip with a thin ring; a school without a logo shows
     its first letter on a pink wash. Separators start after the logo.
   - TalkBack/VoiceOver read the school name and the hint only, nothing from the logo.
2. **Group picker** (developer deep link `timecalendar-dev://onboarding/groups?schoolId=<id>` with
   a school that has nested groups):
   - A branch row shows `expand_more`, then `expand_less` once opened (iOS: chevron right, then
     down); its children appear in a section titled by the branch.
   - TalkBack reads a branch as "Expand <name>, button, collapsed/expanded"; a leaf as
     "Toggle <name>, button" with "selected" once toggled.
   - Confirm with nothing selected shows "Select at least one group."; Confirm is a full-width filled
     button.
3. **Provider selection** (the unlisted-institution path: "I can't find my school", then the
   institution name):
   - The app bar reads "Export guide"; the content starts with the instructions caption, no second
     title. Thumbnails are 56 dp chips.
4. **Guide page** (a listed school against a local server with the guide enabled):
   - The app bar shows the page's own title ("Select your groups", …), and it fits or truncates
     cleanly at the largest text size.
   - On each Next, focus lands on the progress line and the screen reader reads
     "<page title>, Page n of N".
5. **Blocked guide** (local server with `export-guides-v1` off): the status view shows the error,
   Retry and Back; Retry shows its busy state once.

## Why

Jest proves roles, names, states, glyph names and options. It cannot prove how TalkBack and
VoiceOver announce disclosure state and programmatic focus, or how a long page title fits the
compact bar on a device. Android builds freeze the Mac.

## How to verify

Record pass or fail for each item here, with a screenshot, and a screen-reader transcript for items
1, 2 and 4. Then move the file to `done/`. Disclosure failures go to
`mobile/src/design/list/list-row.tsx`; thumbnail failures to
`mobile/src/design/thumbnail/thumbnail.tsx`; guide focus failures to
`mobile/src/features/export-guides/ui/guide-page-screen.tsx`.

## Blocks

Nothing. The PR merges on green CI and the iOS simulator pass. This pass closes the Android and
screen-reader check for roadmap slice 5.5.
