# Splash — manual on-device Definition-of-Done items (Phase 0 exit)

**Date:** 2026-06-13
**Change:** `add-mobile-splash` (foundation roadmap step 13 — the Phase-0 capstone)
**For:** whoever runs the device passes (the planner/CI cannot do these)

The splash is the first feature taken through the **entire** Definition of Done
(`.claude/rules/mobile/definition-of-done.md`). The automatable axes are done and green in CI
(types, lint, Jest proof, i18n, a11y lint + reduced-motion branch, theming light/dark,
observability non-regression). The axes below are **irreducibly human / on-device** — a static
tool, Jest, or the planner cannot assert them. Each task in `add-mobile-splash/tasks.md` that
depends on one of these is marked `- [ ]` with `(HUMAN: see inbox/2026-06-13-splash-dod-manual.md)`
so the implementer and reviewer **skip-and-continue** rather than block.

Run the **dev variant** on both an iOS simulator/device and an Android emulator/device. The
splash shows on cold launch; force-quit and relaunch to re-trigger.

## 1. Manual VoiceOver pass (iOS) — DoD: Accessibility
- **What:** Cold-launch with VoiceOver on. Confirm the splash announces a meaningful status
  (not a silent or junk node), focus order is sane, and nothing is trapped when the splash
  dismisses into the app.
- **Why:** Focus order, grouping, and announcement quality are runtime behavior no static tool
  asserts (Architecture Book a11y "What lint can't encode → manual screen-reader passes").
- **How to verify:** Settings → Accessibility → VoiceOver on; launch the dev app; listen on the
  splash and through the dismiss.

## 2. Manual TalkBack pass (Android) — DoD: Accessibility
- **What:** Same as #1 with TalkBack on Android.
- **Why:** Same — platform-specific screen-reader behavior.
- **How to verify:** Settings → Accessibility → TalkBack on; cold-launch the dev app.

## 3. On-device pixel / native-correctness review — iOS — DoD: Native correctness
- **What:** Eyeball the splash on a real/simulated iPhone: brand centered and correctly sized,
  no flash of empty/unstyled content during the native→JS handoff, fade-out feels native, safe
  areas / notch respected, light **and** dark mode both correct.
- **Why:** "The platform is the design reference" (R-3); pixel correctness and the handoff feel
  are visual, not statically checkable.
- **How to verify:** Cold-launch in light mode, then toggle Dark Appearance and relaunch.

## 4. On-device pixel / native-correctness review — Android — DoD: Native correctness
- **What:** Same as #3 on Android (Material feel, status/navigation bar handling, light + dark).
- **Why:** Same — both platforms are reviewed against the *platform*, not the Flutter app.
- **How to verify:** Cold-launch on an Android device/emulator, light then dark.

## 5. Real-device reduced-motion check — both platforms — DoD: Accessibility (reduced motion)
- **What:** Enable Reduce Motion (iOS: Accessibility → Motion → Reduce Motion; Android:
  Accessibility → Remove animations) and cold-launch. Confirm the splash shows the final frame
  and dismisses **with no fade/animation**, and the same content as the animated path. Then
  disable it and confirm the fade plays.
- **Why:** The splash is the app's first animation and owns the reduced-motion obligation
  (Architecture Book a11y section). The Jest proof mocks `AccessibilityInfo`; only a device
  proves the real OS setting is honored.
- **How to verify:** Toggle the OS setting, relaunch, observe both states.

## 6. Color-contrast eyeball — both schemes — DoD: Accessibility / Native correctness
- **What:** Confirm the brand text on the splash background is comfortably legible in light and
  dark. The token pair is documented in `mobile/src/theme/tokens.ts` (WCAG-AA pairs) — confirm
  the rendered splash matches a documented AA pair.
- **Why:** Contrast is a theme-token property; the documented pairs are the artifact, but the
  rendered combination is verified by eye (Architecture Book theming/a11y contrast ownership).
- **How to verify:** View the splash in both schemes against the documented pair.

## 7. Performance / no-jank on a low-end Android — DoD: Performance
- **What:** Cold-launch on a low-end Android device (or a throttled emulator). Confirm the
  splash → first-content transition has no jank, stutter, or a frozen splash. Confirm the
  readiness gate never leaves the splash hung (the watchdog never has to fire in the happy path).
- **Why:** Jank on low-end hardware is the DoD's performance bar; not assertable in CI.
- **How to verify:** Time-to-interactive feels instant; the fade is smooth.

## 8. Observability arrival (non-regression) — DoD: Observability / Product analytics
- **What:** Confirm the splash change did not break Firebase: the app still launches, Crashlytics
  still initializes (a forced crash via the dev panel still arrives), and no new startup error is
  reported. **Product analytics for the splash is ➖ N/A** (a splash is not a user action — see
  design D6); there is intentionally no splash analytics event to verify.
- **Why:** CI proves the `@/firebase` wiring but not console arrival (Architecture Book Firebase
  "What CI proves vs. manual"); the splash must not regress launch/observability.
- **How to verify:** Dev variant, force a test crash from the `FirebaseDebugPanel`, confirm it
  arrives in the Crashlytics dashboard on next launch; confirm normal launches report no error.

## 9. E2E through the splash (non-regression) — DoD: E2E
- **What:** Confirm the existing Maestro flow (`mobile/.maestro/schools.yaml`) still passes with
  the splash in place: the app launches past the splash to the seeded school, the round-trip
  (app → generated client → customFetch → NestJS → Postgres) is unbroken.
- **Why:** The splash sits above the navigation Stack at startup; it must not block the launch
  the e2e flow depends on. CI proves wiring, not that the splash dismisses to live content.
- **How to verify:** Run `ci-mobile-e2e.yml` (on-demand — PR with the `run-e2e` label, or on
  main/production when mobile/openapi changed). The flow asserts a seeded school renders.

---

When all nine pass on **both** platforms, the splash has cleared every DoD axis and **Phase 0
is complete** (roadmap `01-foundation.md` exit criteria). Record the result wherever Phase-0
sign-off lives.
