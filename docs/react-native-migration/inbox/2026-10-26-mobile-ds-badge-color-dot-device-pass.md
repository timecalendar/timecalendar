**For:** whoever runs screen-reader and device passes on Android (OpenSpec
`add-mobile-ds-badge-color-dot`). The iOS simulator pass runs in the delivery pipeline; a real
TalkBack session and Android rendering need a person on a device or the Windows host, never the Mac.

# Badge and ColorDot: Android device pass

## What I need

A pass in French and English on an Android development build of `feat/mobile-ds-badge`, in light
and dark, at the default font scale and at 2.0. Story ids open with
`timecalendar-dev://developer/gallery/<id>`.

1. **TalkBack on badges.** `badge--accessibility`: the labelled count is one stop and reads
   "2 of 5 checklist items completed", never "2/5". The hidden badge adds no stop; the container
   reads its own label once.
2. **About header caption.** Settings → About: the version caption is one stop reading the version
   text, inside the hosted header. Record whether TalkBack reaches it from the header or skips it.
3. **Checklist pill on Home.** An event with a partial checklist and one with a complete checklist
   (Today and Upcoming cards): the pill shows the pending and checked glyphs with `completed/total`,
   in informational and positive, and TalkBack reads the card's progress phrase once, with no
   separate "2/5".
4. **Large text.** `badge--long-strings` at font scale 2.0: the label wraps onto two lines, nothing
   clips, the icon grows with the text. The About caption at 2.0 wraps without clipping.
5. **Dots.** `color-dot--rings` and `color-dot--stack` in both schemes: the ring matches the surface
   so overlapping dots read as cut out. On Home, the welcome card dots read the same way, with no
   white ring in dark. The personal-events list shows a 16 dp circle in each row's color, and
   TalkBack reads the row as its title only.
6. **Contrast.** Sample the brand caption label on its wash over the About page background and
   record the ratio (expected at least 4.5:1; CI computes 5.10:1 light, 5.90:1 dark over the
   element background).

## Why

Jest proves props, tokens and the accessibility tree the mocks expose. It cannot prove what
TalkBack announces from a hosted RN view inside Compose, or how the wrapped badge and ringed dots
render on a device.

## How to verify

Record each numbered item here as pass or fail, with the Android version and a screenshot or a
short TalkBack transcript.

- A tone or contrast failure is a token edit in `mobile/src/theme/tokens.ts` with its pair in
  `mobile/src/theme/contrast.ts`.
- A badge or dot failure is fixed in `mobile/src/design/badge/` or `mobile/src/design/color-dot/`.
- A hosted-header announcement failure is fixed in `mobile/src/components/chrome/native-list-header.tsx`.
