## 1. Confirm dependency and baseline contracts

- [ ] 1.1 Read the exact Expo SDK 56 pager-view, `expo-image`, and `expo-symbols` documentation required by `mobile/AGENTS.md`; confirm the pinned pager API, child-view requirement, imperative methods, selection event shape, image accessibility props, and platform symbol names still match `design.md` before application edits.
- [ ] 1.2 Run the existing focused welcome-screen test and inventory every `onboarding.welcome.*` caller, onboarding testID, `/onboarding` entry, QR/iCal route, and affected Architecture Book/roadmap reference; record any baseline mismatch before replacing behavior.
- [ ] 1.3 Record source checksums and dimensions for `app/assets/images/{schools,home,notifications}.png` so the later copies can be verified byte-for-byte without modifying `app/`.

## 2. Native pager dependency and Jest seam

- [ ] 2.1 From `mobile/`, install the Expo-compatible dependency with `npx expo install react-native-pager-view`; commit only the resulting `package.json` and lockfile dependency changes, with no `app.config.ts` plugin or permission.
- [ ] 2.2 Add a suite-wide pager Jest setup module that renders children inside a React Native `View`, forwards its ref, exposes `setPage` and `setPageWithoutAnimation`, and emits native-shaped `onPageSelected` events; register it in `jest.config.js` with a concise native-module rationale.
- [ ] 2.3 Run a minimal Jest smoke through the mock and `npx expo install --check` to prove dependency resolution before composing the screen.

## 3. Assets and localized page model

- [ ] 3.1 Create `mobile/assets/images/onboarding/` and copy the legacy files byte-for-byte as `welcome.png` from `schools.png`, `agenda.png` from `home.png`, and `notifications.png` from `notifications.png`; compare checksums and dimensions to the baseline.
- [ ] 3.2 Replace all consumed `onboarding.welcome.*` entries in `en.json` and `fr.json` with the approved `onboarding.page.*`, Skip, Next, CTA, accessibility-label, and page-indicator keys verbatim; keep `TimeCalendar` literal in both welcome titles.
- [ ] 3.3 Search application/test/catalog sources to prove no obsolete `onboarding.welcome.*` consumer or dead catalog key remains, while QR/iCal route files and the school picker's iCal fallback are unchanged.

## 4. Carousel screen implementation

- [ ] 4.1 Replace the interim welcome content with a typed three-page descriptor in welcome → agenda → notifications order, rendering each copied asset through `expo-image` with `contentFit="contain"`, decorative accessibility, roughly 25%-window height plus a tablet cap, and a `backgroundElement`/`Radii.large` card.
- [ ] 4.2 Compose the safe-area-aware stable layout: 60pt top bar, flex pager (`onboarding-pager`), `MaxContentWidth` page content, grouped page indicator, and bottom footer without vertical jumps; use only `@/theme` spacing/radius/color tokens.
- [ ] 4.3 Drive `currentPage` exclusively from `onPageSelected`; implement swipe parity, Skip (`onboarding-skip`) and Next (`onboarding-next`) on pages 1–2, hide both on page 3, retain `onboarding-welcome-cta` on the final filled CTA, and push `/onboarding/school` from Skip/final CTA.
- [ ] 4.4 Render Next with the platform forward symbol (`arrow.forward` iOS / `arrow_forward` Android) and brand tint, and size Skip/Next/final Pressables to at least the platform 44pt/48dp target with translated roles/labels.
- [ ] 4.5 Preserve the existing 300ms entrance fade and reduced-motion subscription; animate indicator widths for 150ms when allowed, snap widths/opacity when reduced, and call `setPageWithoutAnimation` rather than `setPage` for reduced-motion Next.
- [ ] 4.6 Group the three decorative pills into one accessible element labeled `onboarding.pageIndicator` with 1-based current/total values; expose every page title as a heading and keep illustration/symbol/dot descendants out of the accessibility focus order.

## 5. Automated behavior and CI proof tests

- [ ] 5.1 Rewrite `welcome-screen.test.tsx` through the real theme/i18n setup and pager mock to assert all three localized title/body pairs, fixed page order, and the literal `TimeCalendar` welcome title.
- [ ] 5.2 Add component proofs for native page-selection/swipe and both Next transitions, indicator labels/active state, Skip navigation, final CTA navigation, final-page absence of Skip/Next, grouped dot accessibility, headings, translated control labels, and retained route destinations.
- [ ] 5.3 Prove motion-enabled Next calls `setPage` and uses 150ms indicator timing while reduced motion calls `setPageWithoutAnimation` and snaps the indicator/entrance state; cover preference changes after mount and animation cleanup.
- [ ] 5.4 Run the focused welcome suite with coverage and confirm `welcome-screen.tsx` reaches at least 90% branch coverage without lowering `jest.config.js` thresholds.
- [ ] 5.5 Update `mobile/.maestro/onboarding.yaml` to assert `TimeCalendar`, tap `onboarding-next` twice, assert the notifications title, activate `onboarding-welcome-cta`, and preserve every existing school-step live-read/search assertion; keep the flow platform-neutral for the on-main iOS and Android CI proof.

## 6. Architecture Book and migration documentation

- [ ] 6.1 Write and index ADR 036 for choosing `react-native-pager-view` over `ScrollView pagingEnabled`, including native platform implementations, feature-local import, Jest mock obligation, autolinking/no-permission facts, fingerprint consequence, rejected alternatives, and concrete revisit triggers; leave ADR 015 valid.
- [ ] 6.2 Update `features.md` to describe the localized three-page onboarding carousel and unchanged school/source composition; update `runtime.md` with the native dependency/autolink/no-permission inventory entry.
- [ ] 6.3 Update `eas.md` to state that the pager moves the fingerprint and requires a fresh native build while preserving human-invoked EAS policy; do not edit `mobile/eas.json`, `mobile/app.config.ts`, Firebase/store configuration, or any CI/deploy workflow.
- [ ] 6.4 Append a dated entry to the existing `docs/mobile/architecture-book/CHANGELOG.md` for the carousel/pager rule and ADR; do not create the retired `architecture-changelog.md` path.
- [ ] 6.5 Update Phase 03 roadmap step 1 from dangling “design polish inboxed” language to the resulting landed carousel state, and add the Phase 07 roadmap note that its future changelog feature must decide fresh-install/current-version suppression because onboarding intentionally writes no version state.
- [ ] 6.6 Revise `docs/react-native-migration/inbox/2026-06-15-onboarding-flow-dod-manual.md` for the new surface and `(HUMAN: …)` native proof axes: both schemes, VoiceOver/TalkBack page announcements and grouped indicator, swipe/Next parity, touch targets, tablet width, and fresh development/EAS binary; keep them non-blocking.

## 7. Local green and close-out

- [ ] 7.1 Run `cd mobile && npx tsc --noEmit` and resolve strict typing, pager-ref/event, static-image, and typed-i18n parity errors.
- [ ] 7.2 Run `cd mobile && npm run lint` and resolve formatting plus boundary, accessibility, no-literal-string, and import-order findings with zero warnings.
- [ ] 7.3 Run `cd mobile && npm test -- --coverage`; retain the configured 90% logic/70% global gates and keep the complete suite green.
- [ ] 7.4 Run `cd mobile && npx expo install --check && npx expo-doctor` and verify the pager dependency is compatible with Expo SDK 56; inspect resolved Expo config to confirm no pager permission/plugin or unintended native/store config change.
- [ ] 7.5 Review `git diff --check` and the final path diff to confirm no OpenAPI/generated client, server migration/schema, deploy/CI, secret, Terraform/Kubernetes, Flutter source/asset, `app.config.ts`, `eas.json`, or Firebase/store-config mutation entered the change.
- [ ] 7.6 Run `openspec validate port-mobile-onboarding-carousel --strict` after implementation and keep proposal/design/spec/tasks aligned for the archive stage; record local-green results and defer only the explicitly HUMAN on-device axes.
