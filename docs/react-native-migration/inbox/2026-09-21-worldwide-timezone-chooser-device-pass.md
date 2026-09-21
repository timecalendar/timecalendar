# Worldwide time-zone chooser device pass

Owner: **(HUMAN: project owner)**

This is release-owner device evidence under D05. It is not a repository merge gate and it is
not a separate implementation ticket.

## Early native integration check

- iPhone: confirm the chooser is a tall native form sheet with a grabber, native swipe
  dismissal, localized Close action, and iOS 26 bottom-toolbar search.
- Older supported iOS and iPad: confirm Router's native header-search/form-sheet adaptation,
  readable detent sizing, keyboard transitions, and one inset/scroll owner.
- Android: confirm full-screen native presentation, header search, system back, keyboard
  dismissal, and one lazy-list scroll owner.

Stop and escalate if these installed SDK 56 primitives cannot meet D01; do not substitute a
custom overlay.

## Final visual acceptance

- Check light/dark appearance, large text, VoiceOver/TalkBack selected and unavailable states,
  touch targets, empty/no-results states, current offsets, search clear, and cancellation.
- Confirm selection saves once and every Close/back/swipe path without selection is
  non-mutating.
- Confirm representative English and French searches and current-offset refresh after resume.
