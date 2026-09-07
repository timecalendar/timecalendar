# First-launch gate and first-iCal reminder device pass

> (HUMAN: verify on physical iOS and Android development/preview builds after the first-launch
> change reaches a device-capable build. These irreducibly on-device checks are non-blocking for
> repository merge; exact-head Android and iOS Maestro jobs remain the automated native gate.)

## VoiceOver and TalkBack

- [ ] Fresh install: focus stays on the splash until onboarding is eligible, then enters the welcome
      screen without announcing Home or Calendar first.
- [ ] Skip confirmation: focus moves to the localized heading; background onboarding content is
      excluded; order is explanation → Continue setup → Continue without an iCal.
- [ ] Reminder: heading, Import action, and dismiss affordance are announced once in logical order;
      the decorative close symbol creates no focus stop.
- [ ] Platform back and backdrop dismiss the dialog without changing either durable decision.

## Dynamic Type, layout, and controls

- [ ] Largest iOS Dynamic Type and Android font scale: confirmation and reminder copy wraps without
      clipping, both dialog actions remain reachable, and the bottom card grows in normal flow.
- [ ] Home scroll content, Calendar timeline/agenda, native tab chrome, and Android add FAB remain
      unobscured while the reminder is visible.
- [ ] Controls retain at least 44pt on iOS and 48dp on Android; light/dark contrast uses the documented
      `primaryStrong`/`onPrimary` and themed surface pairs.
- [ ] No modal or reminder animation runs; reduced-motion users see the same immediate transitions.

## Supported-device behavior

- [ ] On supported iOS and Android versions, confirm Skip, create a personal event with zero imported
      calendars, relaunch, and verify both Home and Calendar remain usable with the reminder visible.
- [ ] Confirm reminder dismissal, relaunch, and verify it stays hidden without changing onboarding.
- [ ] Import a calendar, verify the reminder hides reactively, delete the final calendar, and verify
      onboarding never reopens; dismissal alone controls whether the reminder returns.
