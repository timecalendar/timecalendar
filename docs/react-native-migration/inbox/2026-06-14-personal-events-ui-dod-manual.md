# Personal events CRUD UI — manual on-device Definition-of-Done items (Feature B DoD pass)

**Date:** 2026-06-14
**Change:** `add-mobile-personal-events-ui` (TIM-133 / B2 — Phase-2 pattern establishment, step 2)
**For:** whoever runs the device passes (the planner/CI cannot do these)

B2 is the **second feature taken through the full Definition of Done** (after Settings/A2) and the
**first with a multi-field form + a real write error path** (`docs/mobile/architecture-book/definition-of-done.md`).
The automatable axes are done and green in CI (types, lint incl. the a11y touchable rules on every
control, the Jest proof tests, the 90% logic gate + 70% floor, i18n FR/EN parity, theming light/dark,
**observability wired** — a failed write is recorded through `@/firebase`). The axes below are
**irreducibly human / on-device** — a static tool, Jest, or the planner cannot assert them. Each task
in `add-mobile-personal-events-ui/tasks.md` §10 is left `- [ ]` with
`(HUMAN: see inbox/2026-06-14-personal-events-ui-dod-manual.md)` so the implementer and reviewer
**skip-and-continue** rather than block.

Run the **dev variant** on both an iOS simulator/device and an Android emulator/device. Reach the list
on the **Home tab** ("Accueil"), open the form via **Add** or a list row, or deep-link the create form
`timecalendar-dev://personal-event-form` (cold-launch). The date/time controls are native `@expo/ui`
`DateTimePicker`s — SwiftUI `DatePicker` on iOS, Jetpack Compose date/time dialogs on Android.

## 1. Manual VoiceOver pass (iOS) — DoD: Accessibility
- **What:** With VoiceOver on, navigate the **list** (the title heading, each row, the Add control) and
  the **form** (title/location/description inputs, the start/end native pickers, the color-swatch group,
  Save, and Delete in edit mode). Confirm each announces a meaningful role + label, the swatch group
  announces single-select + which swatch is selected, the native pickers announce their value + change,
  focus order is sane, nothing is trapped.
- **Why:** Focus order, grouping, the native picker's + the swatch group's announcement quality are
  runtime behavior no static tool asserts (Architecture Book a11y "What lint can't encode → manual
  screen-reader passes"). B2 is the first multi-field form, so the form-a11y obligation first bites here.
- **How to verify:** Settings → Accessibility → VoiceOver on; open the list, swipe through it, open the
  form, swipe through every control, open a date picker.

## 2. Manual TalkBack pass (Android) — DoD: Accessibility
- **What:** Same as #1 with TalkBack on Android (the Compose date/time dialogs' announcement).
- **Why:** Same — platform-specific screen-reader behavior, especially the native pickers.
- **How to verify:** Settings → Accessibility → TalkBack on; open the list and the form.

## 3. On-device native date/time picker feel / native-correctness — iOS — DoD: Native correctness
- **What:** Eyeball the start + end pickers on iOS (SwiftUI `DatePicker`): opening/closing feels native,
  changing the value flows into the form, light **and** dark both correct, safe areas respected. Confirm
  the picker adopts the platform appearance (deliberately not theme-tinted — D1 / R-3).
- **Why:** "The platform is the design reference" (R-3); native-control feel is visual, not statically
  checkable. The Jest mock proves the `onValueChange`→state wiring, not the real native render.
- **How to verify:** Open the form, open each picker, change start then end; toggle Dark Appearance.

## 4. On-device native date/time picker feel / native-correctness — Android — DoD: Native correctness
- **What:** Same as #3 on Android (Compose date/time dialogs, Material feel, light + dark).
- **Why:** Same — both platforms reviewed against the *platform*, not the Flutter form.
- **How to verify:** Open the form on an Android device/emulator, exercise both pickers, light then dark.

## 5. Color-swatch + form native-correctness + touch-target by finger — DoD: Accessibility / Native
- **What:** Confirm the list rows, the Add control, the color swatches, Save, and Delete are comfortably
  tappable by finger (≥ 44pt iOS / 48dp Android), the selected swatch is clearly ringed, the form scrolls
  and the inputs behave natively (keyboard, multiline description). Verify on a device, not by eye in a
  simulator.
- **Why:** Touch-target minimum is a runtime layout property, not statically checkable; B2 adds several
  new interactive controls (the swatches especially) (Architecture Book a11y / DoD a11y axis).
- **How to verify:** Tap each control at its edges; it should activate reliably; the swatch selection is
  obvious.

## 6. Color-contrast eyeball — both schemes — DoD: Accessibility / Native correctness
- **What:** Confirm the list/form text on the background and the swatch selection ring are comfortably
  legible in light and dark, against the documented WCAG-AA pairs in `mobile/src/theme/tokens.ts`. The
  swatch fills are arbitrary event colors (data, ADR 011) — confirm the ring (a `@/theme` token) reads
  against each swatch.
- **Why:** Contrast is a theme-token property; the documented pairs are the artifact, the rendered
  combination is verified by eye (Architecture Book theming/a11y contrast ownership).
- **How to verify:** View the list + form in both schemes against the documented pairs.

## 7. Performance / no-jank — low-end Android — DoD: Performance
- **What:** On a low-end Android device (or throttled emulator), scroll a list with many events and
  create/edit/delete a few. Confirm no jank: the `FlatList` scrolls smoothly, the reactive list re-renders
  on create/delete without stutter, the form opens/closes smoothly.
- **Why:** Jank on low-end hardware is the DoD's performance bar; not assertable in CI. The reactive
  list (`useLiveQuery` re-render on every table change) is the first real stress of that path.
- **How to verify:** Create ~30+ events, scroll, create/edit/delete; transitions feel instant. Optionally
  capture a Reassure baseline for the list.

## 8. Observability arrival — forced write failure — DoD: Observability (the manual half)
- **What:** Force an `upsert`/`remove` rejection on-device (e.g. a temporary throw in the repository or a
  DB-locked condition) and confirm the recorded error **arrives** in Crashlytics (DebugView / dashboard),
  and that the form surfaces the localized failure message.
- **Why:** CI proves the `recordError` wiring (the forced-rejection unit test) but **cannot** assert the
  event reaches the console — that half is on-device (the firebase CI-vs-manual split). B2 is the first
  feature with a real write error path.
- **How to verify:** Trigger a failure, check Firebase Crashlytics DebugView/dashboard for the recorded
  error; confirm the in-app failure message shows.

## 9. E2E — the personal-events CRUD flow (+ schools/settings non-regression) — DoD: E2E
- **What:** Run the new `mobile/.maestro/personal-events.yaml` (deep-link create → type a title → accept
  default dates → Save → assert in the list → open → Delete → assert gone) on **iOS and Android**, and
  confirm `mobile/.maestro/schools.yaml` and `settings.yaml` still pass. Optionally evaluate whether a
  native-picker date-change step is reliable enough on **both** platforms to add as a bonus (D5) — only
  add it if reliable; a flaky e2e is worse than none.
- **Why:** CI proves the picker→state wiring + the logic via Jest; the Maestro flow proves the full
  create→list→delete round-trip on the real stack (migrations → SQLite → repository → live query). The
  native date/time picker is intentionally NOT driven (not deterministically addressable across platforms
  — D5).
- **How to verify:** Run `ci-mobile-e2e.yml` (on-demand — PR with the `run-e2e` label, or on
  main/production when mobile/openapi changed). All three flows must pass on both platforms.

---

When all nine pass on **both** platforms, **Feature B (Personal events, CRUD) has cleared every DoD
axis** — B1's data layer (already green) plus B2's UI / form / native pickers / a11y / native / perf /
observability / e2e. Record the result wherever the Phase-2 Feature-B sign-off lives (roadmap
`02-pattern-establishment.md` step 2).
