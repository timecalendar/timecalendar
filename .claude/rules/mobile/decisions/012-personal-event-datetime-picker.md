# 012 — Date/time picker: `@expo/ui`'s own `DateTimePicker` behind the chrome wrapper (not `@react-native-community/datetimepicker`)

> Origin: the `add-mobile-personal-events-ui` change (TIM-133 / B2), design D1.
> The full wiring lives in the Architecture Book "Theming & native-chrome" + "Storage →
> First feature schema — personal events → Personal events — CRUD UI"; this is the
> load-bearing decision. Builds on ADR [010](./010-expo-ui-chrome-wrapper.md) (the
> `@expo/ui` chrome wrapper + universal-entry posture), which already governs the seam.

## Status

Accepted.

## Context

B2 (the Personal-events CRUD UI) is the **first feature needing native date/time input** — the
form picks an event's start and end. The control choice is load-bearing: every later feature with a
divergent native surface (B/C controls, the calendar) inherits the posture, and swapping a
date-picker library after the fact ripples through every form. The trade space, all verified against
SDK 56 (`docs.expo.dev/versions/v56.0.0/` + `node_modules/@expo/ui@56.0.17`):

1. **`@expo/ui`'s own `DateTimePicker`** — the `@expo/ui/community/datetime-picker` subpath.
   **Critically, inspecting the package shows it is NOT `@react-native-community/datetimepicker`:**
   the iOS variant renders SwiftUI's `DatePicker`, the Android variant Jetpack Compose date/time
   dialogs, the web variant a plain fallback — it only *mirrors the RNC public prop types*
   (`value`, `mode`, `onValueChange`, `minimumDate`, `maximumDate`, `display`) for API familiarity,
   pulling in no extra package. It is part of `@expo/ui` — **already installed**, **autolinks**
   (`expo-module.config.json`, no `app.plugin.js`), and **already behind our chrome wrapper** (ADR
   010), under the universal-entry posture.
2. **`@expo/ui/swift-ui` + `@expo/ui/jetpack-compose` `DatePicker` directly** — a deliberate
   platform split, exactly the ADR-010 revisit trigger and the speculative divergence R-2 forbids
   when the universal/community control already works on both platforms.
3. **`@react-native-community/datetimepicker` directly** — the stable, Expo-blessed standalone
   module, but a **new dependency** (not installed), **not** an alpha native-chrome API (so it would
   not naturally sit in the alpha-chrome seam), and a **second** date-picker code path alongside the
   equivalent control `@expo/ui` already ships behind our existing seam.

## Decision

**Use `@expo/ui`'s own `DateTimePicker`** (the `@expo/ui/community/datetime-picker` subpath),
re-exported from the **existing** `src/components/chrome/expo-ui.tsx` wrapper — option (1). Rationale:
it is the most idiomatic SDK-56 native date/time control (SwiftUI / Compose, the platform's own UI —
R-3), adds **no dependency**, rides the **same `@expo/ui` chrome seam and ADR-010 universal posture**
as the Settings `Picker` (one library, one seam, one blast radius), and stays in the Expo upgrade
lane. The wrapper is **mandatory, not optional**: the `@expo/ui` subpath is already
`no-restricted-imports`-banned (`^@expo/ui($|/)`) outside `src/components/chrome/**`, so the control
must live in the wrapper; feature/form code imports `@/components/chrome`. The wrapper stays **thin**
(no higher-level composed date-field, no forced theming of the OS-chromed control — R-3).

This needs no *new chrome* ADR (ADR 010 governs the wrapper + universal posture); what earns ADR 012
is the **control-choice** decision — which date/time control among (1)/(2)/(3), and the load-bearing
finding that `@expo/ui`'s control is *not* the RNC module despite mirroring its types — because it is
reused by every later native control with a platform-divergent surface.

*Rejected:* (2) `@expo/ui` platform-specific entries — a speculative split with no diverging need
(R-2, ADR-010 revisit); (3) `@react-native-community/datetimepicker` directly — a new dependency and
a parallel native surface for no gain over the equivalent control already behind our seam (R-2).

## Consequences

- Every later native control with a platform-divergent surface copies this seam + choice
  (`@expo/ui`'s universal/community control behind `chrome/expo-ui.tsx`); the blast radius of
  date/time-picker churn is one file.
- The native picker's appearance is the platform's (reviewed on-device, R-3) — not theme-tinted.
- `@expo/ui`'s native module has no off-device JS, so Jest needs the subpath mocked (the existing
  `jest/setup-expo-ui.ts` is extended to mock `@expo/ui/community/datetime-picker`).
- Maestro cannot deterministically drive the native date/time popup across both platforms; the
  picker→state wiring is proven by the Jest test, the e2e proves the create→list→delete round-trip
  via a typed title + default dates (the change's D5).
- No `app.config.ts` / babel / dependency change (the control is `@expo/ui`'s own, autolinks).

## Revisit if

- `@expo/ui`'s `DateTimePicker` proves unstable enough on a platform that it must be swapped for
  `@react-native-community/datetimepicker` — the swap lives **behind the same `chrome/expo-ui.tsx`
  (or a sibling `chrome/datetime-picker.tsx`) API**, exactly what the seam is for (this is option (3)
  re-entered through the wrapper, not at the call sites).
- A control genuinely needs a platform-specific `@expo/ui` entry or diverges enough to split — that
  reopens the ADR-010 universal default for that control (with its own ADR).
