# Page and focused-form semantics device pass

> (HUMAN: run on supported physical iOS and Android devices. This checklist is non-blocking on
> the device-less development host and does not gate this change.)

- [ ] With the keyboard shown in Feedback, Programme, New event, and Edit event, the primary action
      remains immediately above it while every field stays reachable by scrolling. Repeat after
      focus, blur, and a portrait rotation or other supported-width remeasurement; no jump, overlap,
      or stale gutter remains.
- [ ] At the largest supported Dynamic Type/font size, fields, validation and retry copy, busy state,
      Save/Delete order, and actions wrap or scroll without clipping on both platforms.
- [ ] VoiceOver and TalkBack traverse each form's intro, fields, validation/status, then sibling
      actions in source order. Disabled and busy action state is announced once, and progress is not
      a separate focus target.
- [ ] Primary actions meet 44pt on iOS and 48dp on Android and use readable
      `primaryStrong`/`onPrimary` contrast in light and dark schemes. Programme Skip remains a native
      trailing header action on iOS and a 48dp header control on Android.
- [ ] Settings section labels retain their localized normal casing while staying visually distinct
      from grouped rows on phone and tablet widths, in light and dark schemes.
- [ ] About intro and link-error prose use one visible outer gutter on a phone and remain centered at
      a readable cap on a tablet, while grouped actions keep the wider standard lane.
- [ ] Home's true-empty Up next and Today title/caption pairs have matching hierarchy and spacing,
      stay left-aligned with their sections, and leave See all reachable at the platform minimum.

Focused component suites prove structural ownership, semantic styles, state, and selectors on both
platform branches. Native keyboard geometry, assistive-technology order, physical touch targets,
rotation, large text, and rendered contrast remain the device-only evidence requested here.
