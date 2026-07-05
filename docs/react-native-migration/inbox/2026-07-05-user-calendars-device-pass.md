# HUMAN — User calendars ("Mes calendriers") device + a11y pass

**Change:** `add-mobile-user-calendars` · **Screen:** `mobile/src/features/calendar-sources/ui/user-calendars-screen.tsx`

These checks cannot be run in CI (jest-expo cannot simulate a real screen-reader, a pan
gesture, contrast, or Dynamic Type). The machine-verifiable axes ship green; skip-and-continue
on these — they do not block the merge, they gate the DoD "device pass" tick.

## What I need verified (both platforms, both color schemes)

1. **Row semantics under VoiceOver / TalkBack.** The leading control reads as a **checkbox**
   with the calendar name + school as its label and the checked/unchecked state announced from
   `accessibilityState` (NOT from the label). Toggling announces the new checked state without a
   double announcement. The trailing delete reads as a **button** "Supprimer le calendrier
   {name}" (never a bare "Supprimer").
2. **The two-target row (checkbox + delete).** Focus order is sensible, both targets are
   ≥44pt (iOS) / 48dp (Android) and independently reachable, and neither nests inside the other.
3. **iOS swipe-to-delete (device-only — jest-expo can't drive the pan).** The swipe reveals the
   red trash action; a full-swipe/open **opens the confirm `Alert`** (it must NOT instant-commit —
   delete is non-undoable); it composes cleanly with vertical scroll and with the leading
   checkbox; and VoiceOver reaches "Supprimer" via the row's `accessibilityActions` **without** the
   gesture. Android must have **no** swipe.
4. **Post-delete focus landing.** After a confirmed delete, confirm the screen-reader focus does
   not strand or disorient. **If it does:** the fix is
   `AccessibilityInfo.setAccessibilityFocus` on the list header (apply then re-verify — this is
   the sanctioned remedy, not pre-implemented to avoid guessing the target).
5. **The delete announce** (`AccessibilityInfo.announceForAccessibility("{name} supprimé")`) is
   actually spoken on both platforms.
6. **Visual pass:** contrast of the destructive delete affordance (iOS SF Symbol trash /
   Android themed text label), the checkbox states, and the empty state; Dynamic Type / font
   scaling does not clip the row; both light and dark schemes.

## How to verify

- Add a couple of calendars (Profile → Commencer / the screen's "+" → school selection), open
  Profile → Calendriers.
- iOS: VoiceOver on; toggle a checkbox, swipe a row, use the rotor "Actions" → delete, confirm +
  cancel. Android: TalkBack on; toggle, use the actions menu → delete (no swipe expected).
- Optionally run `mobile/e2e/run_e2e.sh` (`.maestro/user-calendars.yaml`) for render +
  reachability confidence (the populated toggle/delete round-trip is seeded-data-limited).

## If the native reviewer, once swipe is proven, judges the visible iOS trailing button redundant

Hiding the visible delete button on **iOS only** (Android keeps it) is a legitimate device-pass
decision — but keep it until the swipe + `accessibilityActions` path is device-confirmed
non-exclusionary.
