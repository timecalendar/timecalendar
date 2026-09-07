## 1. Settings, About, and Home semantics

- [ ] 1.1 Remove the forced casing transform from `SettingsSection` while retaining semantic typography, secondary color, inset, gaps, grouped surfaces, and platform radii; extend `settings-screen.test.tsx` (or the narrow section suite) to prove localized normal casing and hierarchy on iOS and Android.
- [ ] 1.2 Refactor About so `RootPage lane="standard"` supplies the only responsive gutter while the intro and link-error prose use a centered gutterless readable cap; retain standard-width grouped actions, link behavior, version truthfulness, and every `about-*` selector, then extend `about-screen.test.tsx` with compact and tablet geometry assertions.
- [ ] 1.3 Adopt `EmptyState variant="section"` for Home's true no-upcoming and no-today title/caption pairs, keep the Upcoming See-all action as an operable platform-minimum sibling, and retain finished-today, next-day, scroller, all-day, timeline, checklist, routing, and selector behavior; add focused empty/populated assertions in the Home screen suite.

## 2. Feedback action and keyboard ownership

- [ ] 2.1 Refactor Feedback to use readable `RootPage` in render-function form with one `KeyboardSafeActionLayout`; keep intro, inputs, validation, focus traversal, multiline behavior, and status content reachable in the sole scroll body, and place the retryable failure plus submit/sending presentation in the sibling action region without adding a second lane or scroller.
- [ ] 2.2 Replace Feedback's filled submit `Pressable` with `PrimaryAction` using the unchanged localized label and `feedback-submit` selector, forward pending state as busy, and preserve duplicate blocking, remembered e-mail, request/context construction, success Alert/back behavior, retry, analytics/observability privacy, and route parameters.
- [ ] 2.3 Extend `feedback-screen.test.tsx` across iOS and Android to prove padding/height keyboard behavior, body/action sibling ownership, one scroll owner, semantic colors and 44/48 minimums, disabled/busy accessibility state, stable selectors, focus traversal, validation, success, failure, and retry behavior; run that focused suite.

## 3. Programme action and keyboard ownership

- [ ] 3.1 Refactor Programme to use readable `RootPage` in render-function form with one `KeyboardSafeActionLayout`; keep intro, input, and validation error in the scroll body and place Continue in the sibling action region without changing the centered step rhythm or adding another responsive lane.
- [ ] 3.2 Replace Programme's filled Continue `Pressable` with `PrimaryAction`, preserving the localized label, `onboarding-programme-continue` selector, empty-name disabled state, normalization, length validation, Return-key submit, draft write, and Connect route; retain the iOS native and Android header Skip branches unchanged.
- [ ] 3.3 Extend `programme-screen.test.tsx` across iOS and Android to prove padding/height keyboard behavior, body/action sibling ownership, semantic colors and 44/48 minimums, disabled accessibility state, Skip placement and selector, valid/invalid Continue behavior, keyboard submission, draft value, and route transition; run that focused suite.

## 4. Reference consumer and cross-surface regression proof

- [ ] 4.1 Audit the already-conforming personal-event create/edit editor against `mobile-personal-events-ui` and ADR 054; add only missing focused assertions for both platform keyboard branches, shared semantic Save styling/state, sibling error/action placement, readable lane ownership, Delete order, stable selectors, route `uid`, validation, create/edit/save/delete behavior, and confirmation, then run its focused screen/editor suites.
- [ ] 4.2 Run the shared `PrimaryAction`, `KeyboardSafeActionLayout`, `EmptyState`, and responsive/root-page component suites and confirm no consumer weakens their colors, platform target sizes, accessibility state, layout ownership, left alignment, or gutter contract.
- [ ] 4.3 Inspect affected Maestro flows and run the repository's static selector proof so Settings, Home, Feedback, Programme, and personal-event identifiers remain resolvable without claiming local device execution.

## 5. Architecture Book and device-only evidence

- [ ] 5.1 Update `docs/mobile/architecture-book/theming.md`, `features.md`, `accessibility.md`, and `testing.md` plus `CHANGELOG.md` to describe normal localized Settings casing, About's single-gutter readable prose, Home section empty-state adoption, and the Feedback/Programme/personal-event form consumer set; keep ADR 054 as the binding decision and add no ADR unless a genuinely new costly-to-reverse rule appears.
- [ ] 5.2 Add a dated `docs/react-native-migration/inbox/` note tagged `(HUMAN: …)` for iOS/Android keyboard visibility, focus/blur, portrait rotation/remeasurement, Dynamic Type, VoiceOver/TalkBack order/state, touch targets, light/dark action contrast, Settings hierarchy, About phone/tablet gutters, and Home empty rhythm; mark it non-blocking and do not claim device execution on this host.

## 6. Local-green and CI proof

- [ ] 6.1 Run the focused Settings, About, Home, Feedback, Programme, personal-event, shared-action, keyboard-layout, empty-state, root-page, and responsive component suites; record commands and passing counts in the handoff.
- [ ] 6.2 From `mobile/`, run `npx tsc --noEmit`, `npm run lint`, and `npm run react-doctor:changed`; fix every changed-code finding without weakening types, lint rules, test assertions, or the established shared contracts.
- [ ] 6.3 From `mobile/`, run `npm test -- --coverage`; the focused per-platform style/layout tests and existing behavior suites are the CI proof for this change, and the configured 90% logic/70% global thresholds SHALL remain unchanged.
- [ ] 6.4 Review the final diff and confirm the Architecture Book is the only sensitive surface; no API/generated client, server/schema, route, native/store/EAS config, dependency, deployment/CI, secret, unrelated onboarding, global header, new artwork, calendar-management, or legacy Flutter change is present.
