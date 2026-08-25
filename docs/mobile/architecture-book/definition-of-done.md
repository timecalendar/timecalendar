# Definition of Done

A feature is done when every applicable item is complete. Record a short reason for
anything that does not apply.

- `npx tsc --noEmit`, lint, formatting, and tests pass.
- Logic meets the 90% coverage threshold and the project meets the 70% global floor.
- A Maestro happy path covers user-facing behavior on iOS and Android when practical.
- User-facing text is localized in French and English with typed key parity.
- VoiceOver and TalkBack behavior, focus order, labels, large text, contrast, reduced
  motion, and 44pt iOS / 48dp Android targets are checked on-device.
- Platform behavior is reviewed on supported iOS and Android versions.
- Interaction-heavy screens are checked on a representative low-end Android device.
- Recoverable failures have useful UI; unexpected failures reach Crashlytics without
  personal data. Analytics are verified in Firebase DebugView when applicable.
- Reusable current-state guidance is updated. Add an ADR only for a costly-to-reverse
  decision, following [the ADR policy](./decisions/README.md).

Automation is authoritative for machine-checkable items. Device-only checks should be
recorded in the relevant review ticket or migration inbox item, not expanded here.
