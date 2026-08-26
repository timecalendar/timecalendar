# Changelog device pass

> (HUMAN: run on supported physical iOS and Android devices after PR #271 reaches a
> simulator/device-capable build. This checklist is non-blocking on the no-KVM agent host.)

- [ ] iOS presents `/changelog-sheet` as a form sheet with a large scrollable detent,
      visible grabber and native header; Android presents it as a full-screen native modal.
- [ ] History opens from About, renders Version 4.0 newest-first, and native back returns to
      About on both platforms.
- [ ] Light and dark schemes keep all copy, symbols, surfaces, and the primary Continue action
      readable with no clipping.
- [ ] Close and Continue persist 4 before dismissal; iOS swipe and Android back also persist
      4, and reopening tabs does not present the sheet again.
- [ ] A fresh install with no preference seeds 4 without showing the sheet. A migrated value
      of 3 shows the sheet exactly once and ends at 4.
- [ ] VoiceOver/TalkBack announce the localized header, Version 4.0 as a heading, each title
      then subtitle, and one Close/Continue target; decorative symbols receive no focus.
- [ ] Largest supported text sizes wrap rather than clip, scrolling reaches every item and
      Continue, and targets meet 44pt iOS / 48dp Android minimums.

The committed shared-platform Maestro flow covers About → history. Automatic-sheet Maestro
is N/A because the existing harness has no supported cross-platform MMKV seeding seam; Jest
owns absent/older/current/future and dismissal state transitions without adding a debug route.
