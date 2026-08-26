# Feedback device pass

(HUMAN: verify the Feedback experience on representative iOS and Android devices.)

This evidence is non-blocking for merge; automated tests cover deterministic behavior,
while the following native interactions require real devices:

- Verify E-mail Return/Next focuses Message and Return inserts new lines in Message.
- Verify keyboard avoidance keeps both fields, errors, and Send reachable.
- Check large Dynamic Type/font scaling, dark mode, and minimum touch targets.
- Check VoiceOver/TalkBack heading, label, field-error, pending, and failure announcement
  order without duplicate or missing labels.
- Submit a valid non-production test message and verify the localized native success
  Alert has one Close action that returns to the previous screen.
- Force a contact rejection and verify both inputs remain populated, the inline error is
  announced, and Send is enabled for retry.
- Force a recorded iCal import failure and verify Report carries the trimmed URL and
  available school ID/name; confirm an invalid-URL prefilter never shows Report.
