# Settings screen — manual on-device Definition-of-Done items (Feature A DoD pass)

**Date:** 2026-06-14
**Change:** `add-mobile-settings-screen` (TIM-131 / A2 — Phase-2 pattern establishment, step 1)
**For:** whoever runs the device passes (the planner/CI cannot do these)

A2 is the **first feature taken through the full Definition of Done with a real interactive
product control** (`docs/mobile/architecture-book/definition-of-done.md`). The automatable axes are done
and green in CI (types, lint incl. the a11y touchable rules on the Profile entry control, the Jest
proof test, i18n FR/EN parity, theming light/dark, observability non-regression). The axes below
are **irreducibly human / on-device** — a static tool, Jest, or the planner cannot assert them.
Each task in `add-mobile-settings-screen/tasks.md` §9 that depends on one of these is left `- [ ]`
with `(HUMAN: see inbox/2026-06-14-settings-screen-dod-manual.md)` so the implementer and reviewer
**skip-and-continue** rather than block.

Run the **dev variant** on both an iOS simulator/device and an Android emulator/device. Reach
Settings either from the **Profile tab → Settings** entry control, or by deep link
`timecalendar-dev://settings` (cold-launch). The two pickers (theme, language) are native
`@expo/ui` controls — SwiftUI menu on iOS, Compose dropdown on Android.

## 1. Manual VoiceOver pass (iOS) — DoD: Accessibility
- **What:** With VoiceOver on, navigate to the **Profile→Settings entry control** and confirm it
  announces a meaningful role + label ("Settings", link/button). Open Settings; confirm the title
  is a heading, each control's label reads, and the **native picker** announces its current value,
  its options, and the selection change. Confirm focus order is sane and nothing is trapped.
- **Why:** Focus order, grouping, and the native picker's announcement quality are runtime behavior
  no static tool asserts (Architecture Book a11y "What lint can't encode → manual screen-reader
  passes"). A2 is where the screen-reader obligation first bites for a real interactive control.
- **How to verify:** Settings → Accessibility → VoiceOver on; open Settings via the Profile entry;
  swipe through the title, both controls, and open a picker.

## 2. Manual TalkBack pass (Android) — DoD: Accessibility
- **What:** Same as #1 with TalkBack on Android (the Compose dropdown's announcement).
- **Why:** Same — platform-specific screen-reader behavior, especially the native picker.
- **How to verify:** Settings → Accessibility → TalkBack on; open Settings via the Profile entry.

## 3. On-device native-picker feel / native-correctness — iOS — DoD: Native correctness
- **What:** Eyeball the theme + language pickers on iOS (SwiftUI menu): opening/closing feels
  native, the selected option is marked, selecting **immediately** re-themes (theme) / switches
  language (language) with no apply step, light **and** dark mode both correct. Safe areas
  respected. Confirm the picker adopts the platform appearance (it is deliberately not theme-tinted
  — design D4 / R-3).
- **Why:** "The platform is the design reference" (R-3); native-control feel is visual, not
  statically checkable. The Jest mock proves wiring, not the real native render.
- **How to verify:** Open Settings, open each picker, change theme then language; toggle Dark
  Appearance and repeat.

## 4. On-device native-picker feel / native-correctness — Android — DoD: Native correctness
- **What:** Same as #3 on Android (Compose dropdown, Material feel, light + dark).
- **Why:** Same — both platforms reviewed against the *platform*, not the Flutter Settings page.
- **How to verify:** Open Settings on an Android device/emulator, exercise both pickers, light then dark.

## 5. Touch-target on-device check — Profile→Settings entry — DoD: Accessibility
- **What:** Confirm the Profile→Settings entry control is comfortably tappable by finger
  (≥ 44pt iOS / 48dp Android). The layout supplies padding + `hitSlop`; verify it on a device, not
  by eye in a simulator.
- **Why:** Touch-target minimum is a runtime layout property, not statically checkable; A2 is the
  first real consumer of the obligation (Architecture Book a11y / DoD a11y axis).
- **How to verify:** Tap the entry control repeatedly at its edges; it should activate reliably.

## 6. Color-contrast eyeball — both schemes — DoD: Accessibility / Native correctness
- **What:** Confirm the screen text (title, control labels) on the background is comfortably legible
  in light and dark. The token pairs are documented in `mobile/src/theme/tokens.ts` (WCAG-AA pairs)
  — confirm the rendered screen matches a documented AA pair. The native picker carries its own OS
  contrast.
- **Why:** Contrast is a theme-token property; the documented pairs are the artifact, the rendered
  combination is verified by eye (Architecture Book theming/a11y contrast ownership).
- **How to verify:** View Settings in both schemes against the documented pairs.

## 7. Performance / no-jank — low-end Android — DoD: Performance
- **What:** On a low-end Android device (or throttled emulator), open Settings and switch
  theme/language. Confirm no jank: the re-theme (whole-app re-render) and the language switch are
  smooth, the picker opens/closes without stutter.
- **Why:** Jank on low-end hardware is the DoD's performance bar; not assertable in CI. A theme
  change re-renders the whole tree, so it is the first real stress of that path.
- **How to verify:** Toggle theme and language a few times; transitions feel instant.

## 8. E2E — the Settings flow (+ schools non-regression) — DoD: E2E
- **What:** Run the new `mobile/.maestro/settings.yaml` (deep-link → assert the localized title +
  the two picker `testID`s render) on **iOS and Android**, and confirm `mobile/.maestro/schools.yaml`
  still passes. Optionally evaluate whether a native-picker toggle round-trip is reliable enough on
  **both** platforms to add as a bonus (design D5) — only add it if reliable; a flaky e2e is worse
  than none.
- **Why:** CI proves the screen + control→hook wiring via the Jest test; the Maestro flow proves
  render + reachability on the real native render (a native `@expo/ui` failure would blank/crash the
  screen). The control→hook wiring is intentionally NOT driven through the native picker (not
  deterministically addressable across platforms — D5).
- **How to verify:** Run `ci-mobile-e2e.yml` (on-demand — PR with the `run-e2e` label, or on
  main/production when mobile/openapi changed). Both flows must pass on both platforms.

---

When all eight pass on **both** platforms, **Feature A (Settings) has cleared every DoD axis** —
A1's data layer (already green) plus A2's screen/controls/a11y/native/perf/e2e. Record the result
wherever the Phase-2 Feature-A sign-off lives (roadmap `02-pattern-establishment.md` step 1).
