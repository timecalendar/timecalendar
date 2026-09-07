## 1. Compact root Stack chrome

- [ ] 1.1 Add a typed compact root-screen options helper under `mobile/src/components/chrome/`, re-export it through the chrome barrel, and cover the visible-header, no-large-title, theme surface, and minimal back-display values with a focused unit test.
- [ ] 1.2 Apply the helper as the root Stack default; explicitly register `(tabs)`, `onboarding`, `profile`, `more`, and `dev-import` as headerless exceptions while preserving changelog presentation and every feature-owned header action.
- [ ] 1.3 Extend the route-structure proof to enumerate every root route, reject unclassified siblings, assert chevron-only back behavior without `(tabs)`, and verify personal-events list/form titles remain localized through feature-owned `Stack.Screen` options.

## 2. Shared page and empty-state primitives

- [ ] 2.1 Add `RootPage` and `PageIntro` shared modules that compose the existing measured readable/standard lanes with non-header safe-area and vertical-rhythm ownership, accept list/scroll/plain children without adding a scroller, and permit caption-only intros when the native header owns the route title.
- [ ] 2.2 Add focused RootPage/PageIntro tests for compact/tablet owner measurements, lane alignment, optional heading/caption hierarchy, list-owner composition, theme surface, and the absence of a mandatory duplicate title.
- [ ] 2.3 Add the shared `EmptyState` with screen-centered and section-left-aligned variants, required title, optional caption, optional paired local artwork, caller-owned `testID`, decorative-image accessibility hiding, normal font scaling, theme selection, and no animation.
- [ ] 2.4 Add focused EmptyState tests for both variants, title/caption source order and roles, no-artwork behavior, light/dark local-source selection, Dynamic Type-compatible props, stable selector forwarding, and reduced-motion safety by construction.

## 3. Local illustration assets and provenance

- [ ] 3.1 Export optimized local PNG light/dark variants of unDraw “Developer Activity” and “No data” from their official pages, recoloring the accent to the exact light/dark `primary` tokens; store them under `mobile/assets/images/empty-states/` with scheme-specific names and no remote URI.
- [ ] 3.2 Add a repository-safe asset record beside the images naming each official source page, creator, official license URL, retrieval date, exact variant colors, and product-UI use posture; confirm the assets are not redistributed as a pack or used for AI/ML training.
- [ ] 3.3 Add a static-source proof that Metro/Jest can resolve all four bundled files and that the empty-state component chooses only the local light/dark source pair without adding an SVG/image runtime dependency.

## 4. Semantic primary action and keyboard-safe owner

- [ ] 4.1 Add `PrimaryAction` using `primaryStrong`/`onPrimary`, 44-point iOS and 48-dp Android minimum heights, translated accessible labeling, caller-owned selector/style, and activation-blocking disabled/busy states with one non-focusable progress indicator.
- [ ] 4.2 Add focused PrimaryAction tests for both platform target sizes, both themes, exact semantic colors, enabled activation, blocked disabled/busy activation, accessibility state, visual state, label retention, and progress semantics.
- [ ] 4.3 Add `KeyboardSafeActionLayout` with an independently scrollable content region and sibling pinned action region inside `KeyboardAvoidingView`, iOS padding/Android height behavior, `keyboardShouldPersistTaps="handled"`, measured-lane composition, and caller-owned safe-area/navigation responsibility.
- [ ] 4.4 Add focused keyboard-layout tests that exercise both platform branches, body/action separation, content scrollability, lane-style forwarding, action ordering, and the absence of absolute positioning or a second scroller.

## 5. Representative consumer adoption

- [ ] 5.1 Refactor Activity onto the shared root-page/full-screen EmptyState composition with the paired “Developer Activity” assets and split EN/FR title/caption keys; retain `activity-empty`, loading, cached/full errors, refresh control, SectionList pagination, row selectors, and navigation behavior in focused tests.
- [ ] 5.2 Refactor Hidden events onto the shared root-page/full-screen EmptyState composition with the paired “No data” assets and EN/FR title/caption keys; retain `hidden-events-empty`, write-error distinction, stale-UID filtering, section/list behavior, un-hide targets, and existing flow selectors in focused tests.
- [ ] 5.3 Refactor PersonalEventEditor to use KeyboardSafeActionLayout and PrimaryAction for Save, move the localized create/edit title exclusively into compact native Stack chrome, and preserve field order, validation, native pickers, Save/Delete order, error notices, routing, persistence calls, and every `personal-event-*` selector.
- [ ] 5.4 Extend personal-event component coverage for native create/edit titles, no duplicate in-content title, pinned readable-lane action region, keyboard behavior on both platforms, semantic Save enabled/busy behavior, delete distinction, failure paths, and unchanged CRUD hook calls.

## 6. Architecture Book and device-proof handoff

- [ ] 6.1 Add ADR 054 documenting shared semantics with platform-native placement, root-route classification, empty-state artwork ownership, and the page/safe-area/list/keyboard ownership split; index it under `docs/mobile/architecture-book/decisions/`.
- [ ] 6.2 Update `navigation.md`, `theming.md`, `accessibility.md`, and `testing.md` with the implemented current-state contracts and append the required dated entry to `docs/mobile/architecture-book/CHANGELOG.md`; keep guidance aligned with code and link rather than duplicate the ADR.
- [ ] 6.3 Update the Activity, Hidden events, and personal-events current-state feature guidance where needed, and add a non-blocking migration-inbox note tagged `(HUMAN: …)` for iOS/Android keyboard geometry, VoiceOver/TalkBack order, Dynamic Type, light/dark artwork, touch targets, and real-device rendering.

## 7. Local-green and CI proof

- [ ] 7.1 From `mobile/`, run focused Jest suites for root-route structure, shared page/intro/empty/action/keyboard components, Activity, Hidden events, and the personal-event form; record commands and passing counts in the PR handoff.
- [ ] 7.2 From `mobile/`, run `npx tsc --noEmit`, `npm run lint`, and `npm run react-doctor:changed`; fix every error or warning without weakening configured rules or suppressing a new finding.
- [ ] 7.3 From `mobile/`, run `npm test -- --coverage`; this full Jest coverage run plus the new route/primitive/consumer tests is the CI proof for the exact implementation head.
- [ ] 7.4 Inspect the existing Activity, Hidden events, and personal-event Maestro flows/static selector checks and confirm their selectors still match; do not require local emulator execution on this host, and leave native rendering evidence to the explicit inbox note and CI-on-main path.
- [ ] 7.5 Review the final diff and confirm the Architecture Book is the only sensitive surface, all artwork is local and license-recorded, and there is no API/generated client, server/schema, native/store config, dependency, deploy/workflow, secret, page-specific out-of-scope polish, or legacy Flutter change.
