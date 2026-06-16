# Onboarding flow — manual on-device Definition-of-Done items (Phase-3 ship 1 DoD pass)

**Date:** 2026-06-15
**Change:** `add-mobile-onboarding-flow` (Phase-3 ship 1 of 5 — the welcome/brand surface over the existing school step)
**For:** whoever runs the device passes (the planner/CI cannot do these)

This ship is Phase 3 ship 1 taken through the full Definition of Done
(`docs/mobile/architecture-book/definition-of-done.md`). The automatable axes are done and green in CI
(types, lint incl. the a11y touchable rule on the CTA, the Jest proof test — render + heading role +
CTA navigation + accessible CTA, the 70% floor for the presentational welcome screen, i18n FR/EN
parity, theming light/dark; observability is ➖ N/A — the welcome surface performs no read/write and
has no throw path; analytics is deferred-with-owner — the cross-feature taxonomy step owns the event,
the CTA `onPress` is the recorded firing point). The axes below are **irreducibly human / on-device**.
Each task in `add-mobile-onboarding-flow/tasks.md` §9 is left `- [ ]` with
`(HUMAN: see inbox/2026-06-15-onboarding-flow-dod-manual.md)` so the implementer and reviewer
**skip-and-continue** rather than block.

Run the **dev variant** on both iOS and Android. Reach the flow from the **Profile tab** ("Get
started" link) or deep-link the welcome surface `timecalendar-dev://onboarding` (cold-launch). The
"Get started" CTA pushes the school step (`/onboarding/school`), which reads the live `GET /schools`
— so the harness server must be up (`ci/e2e-server.sh up`) for the school read.

## 1. Manual VoiceOver pass (iOS) — DoD: Accessibility
- **What:** With VoiceOver on, navigate the **welcome surface**: the brand title (announced as a
  heading), the tagline, the three value-prop lines, and the "Get started" CTA (announced as a button
  with its translated label). Confirm meaningful role + label, sane focus order, nothing trapped.
- **Why:** Focus order, grouping, and announcement quality are runtime behavior no static tool
  asserts (Architecture Book a11y "What lint can't encode → manual screen-reader passes"). The Jest
  test proves the heading role and the CTA role/label are set, not how VoiceOver actually reads them.
- **How to verify:** Settings → Accessibility → VoiceOver on; open Profile → "Get started", swipe
  through the welcome surface, activate the CTA.

## 2. Manual TalkBack pass (Android) — DoD: Accessibility
- **What:** Same as #1 with TalkBack on Android.
- **Why:** Same — platform-specific screen-reader behavior on the welcome surface + CTA.
- **How to verify:** Settings → Accessibility → TalkBack on; open the welcome surface.

## 3. On-device native-correctness feel — both platforms, light + dark — DoD: Native correctness
- **What:** Open the welcome surface and tap "Get started" → the school step push, then back, on iOS
  and Android, in light **and** dark. Confirm the Expo Router push/back animation, safe areas, and
  the scheme-appropriate `@/theme` tokens (the brand-tinted CTA border reads correctly in both
  schemes) feel native.
- **Why:** "The platform is the design reference" (R-3); native push/back feel is visual, not
  statically checkable. The Jest test proves the navigation wiring (the push), not the real transition.
- **How to verify:** Open the welcome surface, tap "Get started", observe the push; go back; toggle
  Dark Appearance and repeat on both platforms.

## 4. Touch-target by finger — DoD: Accessibility
- **What:** Confirm the "Get started" CTA (and the Profile entry link) are comfortably tappable by
  finger (≥ 44pt iOS / 48dp Android) — on a device, not by eye in a simulator.
- **Why:** Touch-target minimum is a runtime layout property, not statically checkable (Architecture
  Book a11y / DoD a11y axis). The CTA has `minHeight: 48` + `hitSlop`, but finger reachability is the
  real proof.
- **How to verify:** Tap the CTA at its edges; it should activate reliably.

## 5. Color-contrast eyeball — both schemes — DoD: Accessibility / Native correctness
- **What:** Confirm the welcome title, tagline (`textSecondary`), value-prop lines, and the CTA
  (token `text` label + brand-tinted border) on the `background` surface are comfortably legible in
  light and dark, against the documented WCAG-AA brand/token pairs in `mobile/src/theme/tokens.ts`.
  The CTA deliberately does **not** use white-on-bright-`#E91E63`; verify the chosen accent reads.
- **Why:** Contrast is a theme-token property; the documented pairs are the artifact, the rendered
  combination is verified by eye (Architecture Book theming/a11y contrast ownership).
- **How to verify:** View the welcome surface in both schemes against the documented pairs.

## 6. E2E — the onboarding welcome → school flow (+ settings/personal-events non-regression) — DoD: E2E
- **What:** Run the extended `mobile/.maestro/onboarding.yaml` (deep-link the **welcome** surface →
  assert the brand title → tap "Get started" → assert the school step + the seeded "My Gaming
  Academia" from the live `GET /schools`) on **iOS and Android**, and confirm
  `mobile/.maestro/settings.yaml` and `mobile/.maestro/personal-events.yaml` still pass (their
  deep-link targets are unaffected — only the onboarding entry changed).
- **Why:** CI proves the render + heading + CTA navigation wiring via Jest; the Maestro flow proves
  the full welcome → CTA → live read round-trip on the real stack (app → generated client →
  `customFetch` → NestJS → Postgres). The nested group step is intentionally NOT driven (group
  selectors vary by fixture — the Phase-2 rationale stands).
- **How to verify:** Run `ci-mobile-e2e.yml` (on-demand — PR with the `run-e2e` label, or on
  main/production when mobile/openapi changed). All three flows must pass on both platforms.

---

When all six pass on **both** platforms, **the onboarding flow (Phase-3 ship 1) has cleared every
on-device DoD axis** — the automatable axes (already green in CI) plus the a11y / native / contrast /
touch-target / e2e halves. Record the result wherever the Phase-3 ship-1 sign-off lives (roadmap
`03-onboarding-and-sources.md` step 1). The **designer onboarding polish** is a separate, additive
follow-up (`inbox/2026-06-15-onboarding-design-polish.md`) — it does **not** block this sign-off.

**Blocks:** the Phase-3 ship-1 DoD sign-off (the on-device axes). The ship itself is complete and
shippable with the native-default surface; these are the irreducibly-human verifications.
