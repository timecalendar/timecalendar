# School selection (read path) — manual on-device Definition-of-Done items (Feature C DoD pass)

**Date:** 2026-06-14
**Change:** `add-mobile-school-selection` (TIM-134 / C1 — Phase-2 pattern establishment, step 3)
**For:** whoever runs the device passes (the planner/CI cannot do these)

C1 is the **third feature taken through the full Definition of Done** (after Settings/A2 and Personal
events/B2) and the **first real server-data read flow** — server state + offline read + nested
navigation (`docs/mobile/architecture-book/definition-of-done.md`). The automatable axes are done and green in
CI (types, lint incl. the a11y touchable rules on every control, the Jest proof tests, the 90% logic
gate on `src/features/school-selection/**` + the 70% floor on the onboarding screens, i18n FR/EN
parity, theming light/dark; observability is ➖ N/A — a failed read is a recoverable `isError` UI
state, not a throw path). The axes below are **irreducibly human / on-device** — a static tool, Jest,
or the planner cannot assert them. Each task in `add-mobile-school-selection/tasks.md` §13 is left
`- [ ]` with `(HUMAN: see inbox/2026-06-14-school-selection-dod-manual.md)` so the implementer and
reviewer **skip-and-continue** rather than block.

Run the **dev variant** on both iOS and Android. Reach the flow from the **Profile tab** ("Choose your
school" link) or deep-link the school step `timecalendar-dev://onboarding` (cold-launch) and the nested
group step `timecalendar-dev://onboarding/groups?schoolId=<id>`. The school list reads the live
`GET /schools`; selecting a school reads the live `GET /schools/<id>/school-group` — so the harness
server must be up (`ci/e2e-server.sh up`) for the read paths.

## 1. Manual VoiceOver pass (iOS) — DoD: Accessibility
- **What:** With VoiceOver on, navigate the **school step** (the title heading, the search/filter
  input, each school row, the retry control in the error state) and the **nested group step** (the
  group tree — selectable leaf nodes and expandable branch nodes, the retry). Confirm each announces a
  meaningful role + label, a branch announces its expanded/collapsed state, focus order is sane,
  loading/error status is announced (the polite live region), nothing is trapped. Also the Profile
  entry link.
- **Why:** Focus order, grouping, the tree's expand/collapse + status-announcement quality are runtime
  behavior no static tool asserts (Architecture Book a11y "What lint can't encode → manual
  screen-reader passes"). The first nested-tree read UI, so this obligation first bites here.
- **How to verify:** Settings → Accessibility → VoiceOver on; open Profile → the school step, swipe
  through it, select a school, swipe through the group tree, expand a branch.

## 2. Manual TalkBack pass (Android) — DoD: Accessibility
- **What:** Same as #1 with TalkBack on Android.
- **Why:** Same — platform-specific screen-reader behavior on the list + tree.
- **How to verify:** Settings → Accessibility → TalkBack on; open the school step and the group step.

## 3. On-device nested-navigation feel / native-correctness — both platforms, light + dark — DoD: Native correctness
- **What:** Push school → group and back, on iOS and Android, in light **and** dark. Confirm the
  Expo Router nested-stack push/back animation, the header/back affordance, and the screen transitions
  feel native; safe areas respected; the screens render scheme-appropriate `@/theme` tokens.
- **Why:** "The platform is the design reference" (R-3); native push/back feel is visual, not
  statically checkable. The Jest tests prove the navigation wiring (the push, the back-on-select), not
  the real native transition.
- **How to verify:** Open the flow, select a school, observe the push; go back; toggle Dark Appearance
  and repeat on both platforms.

## 4. Offline behavior on a real device — DoD: Performance / the persister's real proof
- **What:** With the network on, load the school list (and open a school to load its groups). Then
  **kill the network** (airplane mode), **cold-launch** the app, and reopen the onboarding flow.
  Confirm the persisted query cache is restored and the last-fetched schools/groups render rather than
  only an error.
- **Why:** This is the whole point of the offline persister (ADR 013) — and the one thing CI cannot
  assert (the sync persister round-trips through real MMKV on-device; Jest only proves the dehydrate
  predicate + the adapter). A blank/error onboarding offline would mean the persister isn't working.
- **How to verify:** Load online → airplane mode → fully quit the app → relaunch → open onboarding;
  the cached list/groups should appear. (A genuinely-never-fetched first launch offline correctly
  shows the error + retry — that's expected, not a failure.)

## 5. Touch-target by finger — DoD: Accessibility
- **What:** Confirm the school rows, group leaf/branch nodes, the retry control, and the Profile entry
  link are comfortably tappable by finger (≥ 44pt iOS / 48dp Android) — on a device, not by eye in a
  simulator.
- **Why:** Touch-target minimum is a runtime layout property, not statically checkable (Architecture
  Book a11y / DoD a11y axis).
- **How to verify:** Tap each control at its edges; it should activate reliably.

## 6. Color-contrast eyeball — both schemes — DoD: Accessibility / Native correctness
- **What:** Confirm the list/group text on the background, the filter input text/placeholder, and the
  error/empty status text are comfortably legible in light and dark, against the documented WCAG-AA
  pairs in `mobile/src/theme/tokens.ts`.
- **Why:** Contrast is a theme-token property; the documented pairs are the artifact, the rendered
  combination is verified by eye (Architecture Book theming/a11y contrast ownership).
- **How to verify:** View the school + group steps (incl. the error/empty states) in both schemes
  against the documented pairs.

## 7. Performance / no-jank — low-end Android — DoD: Performance
- **What:** On a low-end Android device (or throttled emulator), scroll the school list and expand a
  deep group tree (a school with nested groups, e.g. Université Gustave Eiffel). Confirm no jank: the
  `FlatList` scrolls smoothly, the filter narrows without stutter, the tree expands/collapses smoothly.
- **Why:** Jank on low-end hardware is the DoD's performance bar; not assertable in CI.
- **How to verify:** Scroll the list, type in the filter, expand/collapse branches; transitions feel
  instant. Optionally capture a Reassure baseline for the list.

## 8. E2E — the onboarding read flow (+ settings/personal-events non-regression) — DoD: E2E
- **What:** Run the new `mobile/.maestro/onboarding.yaml` (deep-link the school step → assert the
  seeded "My Gaming Academia" renders from the live `GET /schools`) on **iOS and Android**, and confirm
  `mobile/.maestro/settings.yaml` and `mobile/.maestro/personal-events.yaml` still pass and that
  `mobile/.maestro/schools.yaml` is gone (replaced). Optionally evaluate whether a tap-into-the-nested-
  group-step assertion (a second live `GET .../school-group` read) is reliable enough on **both**
  platforms to add as a bonus (design D5) — only add it if reliable; a flaky e2e is worse than none.
- **Why:** CI proves the query mapping + navigation wiring via Jest; the Maestro flow proves the full
  live read round-trip on the real stack (app → generated client → `customFetch` → NestJS → Postgres).
  The nested group step is intentionally NOT driven (group selectors vary by fixture — D5).
- **How to verify:** Run `ci-mobile-e2e.yml` (on-demand — PR with the `run-e2e` label, or on
  main/production when mobile/openapi changed). All three flows must pass on both platforms.

---

When all eight pass on **both** platforms, **Feature C (School selection, read path) has cleared every
DoD axis** — the data/query layer + persister + selection store (already green in CI) plus the
on-device nav / offline / a11y / native / perf / e2e halves. With A, B, and C's full DoD complete, the
**Phase 1.5 golden-path exemplar** extraction is unblocked. Record the result wherever the Phase-2
Feature-C sign-off lives (roadmap `02-pattern-establishment.md` step 3).

---

# Ship 2 — completed picker (multi-select + confirm) — appended 2026-06-15

**Change:** `add-mobile-school-picker` (Phase-3 ship 2, ADR 016)
**For:** whoever runs the device passes

Ship 2 completed the picker: the group step is now **multi-select with an explicit confirm-commit**,
search is **accent-insensitive name-or-code**, and completion **dismisses the whole onboarding Stack**
(`router.dismissTo("/onboarding")`). The automatable axes are green in CI (types, lint incl. the a11y
touchable rules on the new leaf toggle + confirm control, the Jest tests — the search helper at the 90%
gate + the multi-select/confirm/dismiss/empty-guard screen tests at the 70% floor, i18n FR/EN parity).
The axes below are the **new on-device surface** ship 2 adds — extending the sections above, not
duplicating them.

## S2.1 VoiceOver (iOS) — the new group surface — DoD: Accessibility
- **What:** With VoiceOver on, on `…/onboarding/school` → tap a school → on the group step: confirm each
  leaf announces its **selected/unselected state** on toggle (tap a leaf, hear it become "selected"; tap
  again, hear it become "not selected"); the **confirm** control announces its role + label ("Confirm
  your group selection", button); confirming with **nothing selected** announces the guard ("Select at
  least one group."); focus order through a multi-pick tree (branches expand/collapse, leaves toggle).
- **Why:** lint guarantees the props exist; only a real screen-reader pass proves the *announcements*
  are correct and the multi-pick is usable non-visually.
- **How to verify:** iOS device/simulator + VoiceOver; walk the group step end to end.

## S2.2 TalkBack (Android) — same as S2.1 — DoD: Accessibility
- **What / Why / How:** as S2.1, on Android with TalkBack.

## S2.3 Native-correctness feel — toggle / confirm / full-stack dismissal — DoD: Native correctness
- **What:** Toggle multiple leaves, confirm, and confirm the **whole onboarding Stack dismisses** back
  to the onboarding entry (the welcome surface) — not a single screen pop, not stranded on the school
  list. Both platforms, **light + dark**.
- **Why:** `dismissTo` stack behavior + the selected-leaf accent are on-device visual/nav properties CI
  can't assert.
- **How to verify:** run the flow on iOS + Android, both schemes.

## S2.4 Touch-target by finger — leaf toggle + confirm — DoD: Accessibility
- **What:** Each leaf toggle and the confirm control are comfortably tappable (≥44pt iOS / 48dp Android
  — `minHeight: 48` + `hitSlop` on the confirm).
- **How to verify:** tap each by finger on a device.

## S2.5 Color-contrast — selected-leaf accent + confirm — DoD: Accessibility / Theming
- **What:** The selected-leaf fill (`backgroundSelected` token) + the confirm control read correctly on
  `background`, both schemes, against the documented AA pairs in `src/theme/tokens.ts` (text on
  `backgroundSelected` is AAA in both schemes per the tokens block).
- **How to verify:** eyeball on a device, both schemes.

## S2.6 E2E — the extended onboarding flow — DoD: E2E
- **What:** Run the extended `mobile/.maestro/onboarding.yaml` (welcome → CTA → live `GET /schools` →
  the new **stable school-search** step) on **iOS and Android**, and confirm `settings.yaml` /
  `personal-events.yaml` still pass. The multi-select group toggle/confirm is **not** e2e-driven (D5 —
  fixture-dependent leaf selectors; Jest-proven).
- **How to verify:** `ci-mobile-e2e.yml` (on-demand). All flows pass on both platforms.
