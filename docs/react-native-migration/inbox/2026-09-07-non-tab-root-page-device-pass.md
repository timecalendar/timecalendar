# (HUMAN: non-blocking) Non-tab root page device pass

This check is intentionally non-blocking and requires installed iOS and Android builds.

- Confirm every ordinary root and onboarding push shows its localized compact title and a
  chevron-only back affordance without exposing a route-group name.
- Exercise School search, Programme Skip, and calendar-management dismissal on both platforms.
- Confirm the changelog presentation remains an iOS form sheet and Android full-screen modal, and
  the QR camera remains full bleed below its visible header.
- Compare light and dark page rhythm across loading, empty, error, and populated states.
- With large Dynamic Type/font scaling and the keyboard open, confirm forms remain reachable.
- Check VoiceOver and TalkBack focus order from native title to caption, fields/actions, state, and
  rows; confirm interactive targets meet the platform minimums.
