**For:** whoever runs screen-reader and device passes on iOS and Android (OpenSpec
`mobile-ds-list-row`). A real VoiceOver and TalkBack session, and eyes on the rendered geometry,
need a person on a device. Android runs on the Windows host, never the Mac.

# ListRow, ListSection, Separator and Android NativeListRow semantics: device pass

## What I need

A pass in French and English on a development build of `feat/mobile-ds-list-row`, in light and
dark, at the default text size and at the largest text size (iOS
`accessibility-extra-extra-extra-large`, Android font scale 2.0). Story ids open with
`timecalendar-dev://developer/gallery/<id>`.

1. **TalkBack on Android native list rows (Part A).** Open Settings, then the calendar list
   (`timecalendar-dev://user-calendars`), the About page and `native-list--rows`. Each navigation
   or action row is one stop and reads "name, value, hint, Button". For example, the calendar row
   reads "<calendar>, <school>, Shown, Opens this calendar's settings, Button". A value row reads
   "label, value" with no "Button". Double-tap still opens the row. Record whether any row's
   texts are spoken twice or a child text is a separate stop.
2. **Seam comparison.** `list-section--seam-comparison` on both platforms and in both schemes:
   the `ListSection` rows and the `NativeList` rows below them match in surface color (Android
   `surfaceContainer`), corner radii by position, 2 dp gaps (Android), side alignment, row height
   and text sizes. On iOS 26, compare the inset-grouped corner radius with the SwiftUI Form; the
   token is `ListGeometry.ios.groupedRadius.glass` (26). Record any difference in points.
3. **VoiceOver and TalkBack on `ListRow`.** `list-row--states`: the selected row reads its name,
   value and "selected". The disabled row reads "dimmed" (iOS) or "disabled" (Android) and does not
   activate. `list-row--static`: the text is one stop, then the "Unhide"-style button.
   `list-row--overline`: the status word is read first.
4. **Press feedback.** On iOS the whole row highlights gray, inside rounded corners for grouped
   rows. On Android the ripple is clipped to the segment shape. Disabled rows show neither.
5. **Large text.** `list-row--long-strings` and `list-section--long-strings`: every line wraps
   without clipping, the value and the check move under the label, and the single-word stress
   label shrinks on one line instead of breaking mid-word. The chevron does not outgrow the text.
6. **Migrated screens.** Timezone chooser (search "Kathmandu", the current zone shows a check),
   school picker (iOS inset separators aligned with the school name, none on Android), hidden
   events (two titled sections, "Unhide" works), Activity (a changed item reads its time and
   change lines), personal events list, export-guide provider selection.
7. **Contrast of status overlines on Android grouped rows.** In `list-row--overline` in both
   schemes, sample the overline text and the segment surface and record the ratio (AA body, 4.5:1).

## Why

Jest proves the declared semantics: the `timecalendarSemantics` modifier's description and role,
and the RN row's role, name, value, hint and state. It cannot prove what TalkBack speaks from the
Compose node, the SwiftUI Form's real corner radius, ripple clipping, or contrast against the
runtime-seeded Material surface. The planning agent cannot operate a screen reader or a device.

## How to verify

Record each numbered item here as pass or fail per platform, with the OS version.

- A Part A failure is fixed in `mobile/modules/compose-semantics/` (registration or
  modifier) or `mobile/src/components/chrome/native-list.tsx` (modifier order).
- A geometry difference is a `ListGeometry` token edit in `mobile/src/theme/tokens.ts`.
- A row failure is fixed in `mobile/src/design/list/`.
- An overline below 4.5:1 means switching the Android overline to the palette's `onSurface`
  with the tone kept in an icon. That needs a design follow-up.
