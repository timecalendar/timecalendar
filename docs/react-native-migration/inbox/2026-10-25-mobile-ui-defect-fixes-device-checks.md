**For:** the owner, holding an Android phone and (if the simulator pass was not possible) an iPhone.

# Mobile UI defect fixes (OpenSpec `mobile-ui-defect-fixes`): device checks

## What I need

Run these on a dev build of `feat/mobile-ui-defect-fixes` (or `main` after merge) and record pass or
fail per line in the PR or below.

**Android (no Android builds run on the Mac; use the Windows host):**

1. **Personal event date and time.** Open Home → + (or Calendar FAB) → tap Start.
   - The date dialog opens with the event's current day selected. Pick another day, then OK. The
     time dialog opens with the current time. Pick a time, then OK. The field shows the new day
     **and** time.
   - Cancel in the date dialog: the field is unchanged.
   - Pick a day, then Cancel in the time dialog: the field is unchanged (the day did **not** change).
   - Settings → Time zone → pick a zone far from the device (for example Pacific/Noumea). Repeat
     the commit. The field shows the picked day and time in that zone, and the saved event appears
     at that time in Calendar.
2. **School picker glyph.** Onboarding → school search, type a nonsense query: a search glyph
   shows above "no results". With an empty catalogue (offline first run), a school glyph shows.
   TalkBack does not focus the glyph and reads the message.
3. **Environment selector (development build).** Settings → Environment: a radio dialog lists
   Local, Preproduction and Production with the current one selected and a Cancel button. Cancel
   closes it with nothing happening. Choosing another shows the destructive confirmation.
4. **Calendar header tint.** Calendar tab, light and dark: the Today icon and the view-menu chevron
   are the normal text color, not pink. The + FAB stays pink.

**iOS (only if the simulator VoiceOver pass in task 5.3 did not run):**

5. **Back-button label.** Settings → Hidden events (also Settings → Activity, and an event's
   details opened from Calendar). Focus the back button with VoiceOver: it reads "Back" (EN) /
   "Retour" (FR), never "(tabs)". The chevron shows no text. A long press on the back button lists
   "Back" / "Retour".

## Why

- These behaviors run in native Compose dialogs or the native navigation bar. Jest mocks cover
  the JS contract, but not the real dialog lifecycle (date→time host swap), the Compose
  UTC-midnight date result, or the UIKit accessibility label.
- Android builds freeze the Mac, and native E2E is not merge proof here (ADR 055).

## How to verify

Each numbered line passes as written. Any failure: note the device, OS version, scheme and locale,
and file it here. Do not open a public issue.
