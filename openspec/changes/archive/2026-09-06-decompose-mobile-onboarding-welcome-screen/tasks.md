## 1. Establish the refactor baseline

- [x] 1.1 Run the focused existing welcome-screen Jest suite and record its natural-exit result before edits; inspect `welcome-screen.tsx`, its test, the pager Jest seam, `ui/index.ts`, and the top-level onboarding barrel so every existing test ID/export is accounted for.
- [x] 1.2 Record the current line count and responsibility map for the 385-line screen, then identify the final feature-local page catalog/page, pager, controls, indicator, reduced-motion hook, and coordinator modules; verify no proposed component is materially above 200 lines and no new symbol needs a public barrel without a consumer.

## 2. Extract page, pager, and control responsibilities

- [x] 2.1 Extract the immutable welcome → agenda → notifications descriptor catalog and page renderer, preserving literal asset imports, semantic `page.id` keys, localized title/body keys, responsive illustration sizing, headings, and hidden decorative-image behavior; run the focused page/screen assertions.
- [x] 2.2 Extract the feature-local native pager component with direct `react-native-pager-view` rendering, non-collapsable direct page children, forwarded ref, and native-shaped `onPageSelected` callback; verify swipe events remain the sole selection-state source and the existing pager Jest mock still drives both imperative methods.
- [x] 2.3 Extract Skip/Next/final controls with explicit props while preserving all test IDs, translated labels, button roles, platform 44pt/48dp minimums, forward-symbol accessibility hiding, stable top/footer geometry, and `/onboarding/school` navigation; rerun the navigation and final-page control tests.
- [x] 2.4 Reduce `WelcomeScreen` to the safe-area coordinator for page state, navigation, window-derived illustration height, reduced-motion state, entrance presentation, pager composition, indicator, and controls; verify every resulting component's line count and preserve `ui/index.ts` plus top-level feature exports.

## 3. Move decorative motion to Reanimated

- [x] 3.1 Extract the live reduced-motion owner around `AccessibilityInfo.isReduceMotionEnabled()` and `reduceMotionChanged`, guarding late initial resolution and removing the subscription on cleanup; add focused tests for initial true/false state, a mid-screen preference change, and unmount-before-resolution/listener cleanup.
- [x] 3.2 Replace the entrance opacity's React Native `Animated` value/timing with Reanimated shared-value/style timing at the existing 300ms duration; when preference state is unresolved schedule nothing, when reduced cancel and snap to opacity 1, and on replacement/unmount cancel owned work.
- [x] 3.3 Extract the grouped indicator and replace JavaScript-driven width timing with Reanimated shared values/styles at the existing 150ms duration; retain immediate token-based active/inactive colors, one localized grouped accessibility label, three non-focusable pills, and every indicator test ID.
- [x] 3.4 Keep normal imperative Next on `setPage` and reduced-motion Next on `setPageWithoutAnimation`; verify a false→true preference change cancels decorative work, snaps final styles, and immediately changes the pager method without remounting.
- [x] 3.5 Add Reanimated's supported Jest setup for the pinned dependency only if the focused tests require it, without dependency, Babel, native-plugin, permission, or application-configuration changes; prove the setup through the ordinary Jest entrypoint rather than a handwritten worklet runtime mock.

## 4. Refocus automated behavior proofs

- [x] 4.1 Update the route-level welcome suite to retain fixed localized page order, headings, native swipe selection, both Next transitions, grouped indicator labels/active state, Skip/final navigation, final-page control absence, and hidden decorative descendants after extraction.
- [x] 4.2 Replace React Native `Animated.timing`/`parallel` call-shape assertions with rendered final-style and user-behavior proofs for normal and reduced modes; add focused cancellation/cleanup assertions only at the module that owns that lifecycle.
- [x] 4.3 Run `cd mobile && npm test -- --runInBand src/features/onboarding/ui/welcome-screen.test.tsx` plus every newly extracted module suite; confirm it exits naturally with no pending timers/open handles and that these committed tests are discovered by the unchanged `test-mobile` CI Jest command.

## 5. Update current architecture guidance

- [x] 5.1 Update `docs/mobile/architecture-book/features.md` so the onboarding entry's current responsibility describes its feature-owned page/pager/control/indicator composition and UI-thread decorative motion while retaining ADR 036's native pager ownership.
- [x] 5.2 Update `docs/mobile/architecture-book/testing.md` with the supported Reanimated Jest posture only if the implementation adds a reusable suite setup/testing rule, and record the Architecture Book change in `CHANGELOG.md`; do not add a new ADR for this reversible leaf refactor.
- [x] 5.3 Confirm the Phase 03 roadmap, navigation guidance, ADRs 015/036, translations, and existing device-pass inbox remain accurate; record device-only verification as not rerun on this host rather than creating a new HUMAN inbox note for unchanged behavior.

## 6. Local green, React Doctor, and scope proof

- [x] 6.1 Run `cd mobile && npx tsc --noEmit` and resolve all strict ref, event, Reanimated style, and typed-i18n errors.
- [x] 6.2 Run `cd mobile && npm run lint` and resolve formatting, import order, accessibility, literal-string, hook, and feature-boundary findings with zero warnings.
- [x] 6.3 Run the full mobile suite with `cd mobile && npm test -- --runInBand` when practical; record whether Jest exits naturally, and if it is impractical record the concrete limitation alongside the focused-green evidence without weakening timeouts, retries, or coverage thresholds.
- [x] 6.4 Run React Doctor 0.9.13 from `mobile/` against branch changes with `npx --yes react-doctor@0.9.13 --scope changed --base origin/main --project . --no-score --verbose`; classify every residual finding as fixed, pre-existing/out of scope, or a documented false positive without adding suppressions solely to raise the score.
- [x] 6.5 Run `git diff --check`, inspect changed-file line counts, and review the final path diff to prove test IDs, translations, route destinations, public barrels, safe-area/touch-target behavior, and feature dependency direction are preserved.
- [x] 6.6 Confirm the diff does not touch `openapi/openapi.json`, generated clients, server migrations/schema, mobile native/store/EAS/Firebase config, dependency manifests, CI/deploy workflows, Terraform/Kubernetes, or legacy Flutter; flag scope expansion before proceeding if any such path appears.
- [x] 6.7 Run `openspec validate decompose-mobile-onboarding-welcome-screen --strict` and keep proposal, design, delta spec, tasks, implementation, Architecture Book guidance, and recorded verification aligned for the later archive stage.
