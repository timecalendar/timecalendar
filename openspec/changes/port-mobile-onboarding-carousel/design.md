## Context

`mobile/src/features/onboarding/ui/welcome-screen.tsx` is a presentation-only, welcome-first entry that pushes `/onboarding/school` and deliberately does not gate first launch (ADR 015). It currently renders one text-heavy page with three actions. The legacy Flutter screen is a three-page `PageView` with the desired messages and raster assets, but its page order, full-screen gradient, Material treatment, and changelog side effect are not the React Native design reference.

This change keeps the existing route and feature boundary while adding one native dependency. `expo-image` and `expo-symbols` are already installed. `react-native-pager-view` is Expo-supported, autolinks without a config plugin or permissions, and has no useful off-device implementation, so both the runtime fingerprint and Jest environment need deliberate treatment. The native dependency, Architecture Book/ADR rules, and EAS runtime documentation are sensitive surfaces; Flutter assets are read/copy input only.

The repository currently has both an active `docs/mobile/architecture-book/CHANGELOG.md` and newer prose saying Git is the history. The issue explicitly requires an architecture changelog entry, so this change updates the existing uppercase file and does not recreate the obsolete `architecture-changelog.md` path.

## Goals / Non-Goals

**Goals:**

- Deliver the approved welcome → agenda → notifications carousel with equivalent swipe and explicit-control navigation on iOS and Android.
- Preserve the current welcome-first route, school-selection destination, entrance fade, deep-link reachability, and no-first-launch-gate posture.
- Make light and dark schemes first-class with theme tokens, accessible grouping/labels, reduced-motion behavior, dynamic layout bounds, and platform touch targets.
- Make the native dependency and native-build consequence explicit and test the screen deterministically off device.

**Non-Goals:**

- No first-launch redirect, QR entry-point re-homing, iCal-route removal, or changelog implementation/state write.
- No gradient, replacement illustrations, analytics event, new theme token, Material port, or custom pager abstraction intended for reuse.
- No API contract, generated client, database/schema, server, deploy/CI workflow, secret, Firebase, `app.config.ts`, `eas.json`, or committed store configuration change.
- No edits under legacy `app/`; its Dart and three PNGs are read/copy sources only.

## Decisions

### Decision 1 — Use `react-native-pager-view` directly at the onboarding UI edge

Install the Expo-compatible version with `cd mobile && npx expo install react-native-pager-view` and render it directly from `onboarding/ui`. It provides `UIPageViewController` on iOS and `ViewPager2` on Android, matching R-3's native-correct rule. A `ScrollView` with `pagingEnabled` is rejected because it recreates page selection, snap, and native paging behavior at a lower-level seam. A carousel package is rejected as broader than the requirement.

The dependency is specific to this one feature and has a small imperative/event surface, so a repository-wide wrapper is not earned. ADR 036 records the costly-to-reverse dependency choice and revisit triggers. Autolinking requires no `app.config.ts` plugin and adds no permission. It does change the fingerprint runtime, so installed binaries must be rebuilt; `runtime.md` and `eas.md` record that consequence without changing `eas.json` or CI.

### Decision 2 — One page model owns content, image mapping, and page order

Define a typed, module-local page descriptor list in the required order:

| Index | Translation keys | Copied asset |
| --- | --- | --- |
| 0 | `onboarding.page.welcome.*` | `schools.png` → `mobile/assets/images/onboarding/welcome.png` |
| 1 | `onboarding.page.agenda.*` | `home.png` → `mobile/assets/images/onboarding/agenda.png` |
| 2 | `onboarding.page.notifications.*` | `notifications.png` → `mobile/assets/images/onboarding/notifications.png` |

Each static asset is imported through a literal `require`/module reference that Metro can bundle. `expo-image` renders it with `contentFit="contain"`, `accessible={false}`, and no alt text because the adjacent heading/body carry its meaning. The copy operation preserves the original bytes; re-encoding or redesign belongs to a later illustration ticket.

### Decision 3 — Pager events are the source of page state; controls drive the pager imperative API

Hold `currentPage` in the screen. `onPageSelected` is the single state transition for swipes and imperative navigation, preventing the indicator/footer from getting ahead of the native page. The Next control calls `setPage(currentPage + 1)` when motion is allowed and `setPageWithoutAnimation(currentPage + 1)` when reduced motion is enabled. Skip and the final CTA both call `router.push("/onboarding/school")`.

The top bar remains 60pt high on every page; Skip is visually absent on the last page without collapsing the bar. The footer similarly switches between Next on pages 1–2 and the full-width final CTA on page 3. The old QR and URL controls and their dead catalog keys are removed from this surface only; their routes remain untouched.

### Decision 4 — Keep the existing reduced-motion subscription and coordinate both animation families

Retain the existing asynchronous `AccessibilityInfo.isReduceMotionEnabled()` read, change subscription, and 300ms entrance opacity. Until the initial preference resolves, the entrance animation is not scheduled. With reduced motion enabled, opacity snaps to its final value, Next uses `setPageWithoutAnimation`, and indicator widths snap to their active/inactive targets. Otherwise the entrance fade remains 300ms and indicator width transitions use `Animated.timing` over 150ms.

Pager swipes remain user-driven native gestures under reduced motion; the setting removes programmatic transition and decorative width animation, not direct manipulation.

### Decision 5 — Compose one safe-area screen with bounded page content

The screen remains a neutral `background` surface inside a full-height safe area. Its stable vertical regions are: 60pt top bar, flexing pager, indicator row, and bottom footer. Page content is centered and capped at `MaxContentWidth`, with `Spacing.four` horizontal padding. Each illustration sits in a rounded `backgroundElement` card using `Radii.large`; its displayed image height derives from roughly 25% of the current window height and has a tablet cap so large screens do not produce oversized art.

Titles use `ThemedText type="title"` and therefore the encoded header role; bodies use `textSecondary`. The active indicator uses `primary`, inactive indicators use `backgroundSelected`, and the final CTA uses the documented `primaryStrong`/`onPrimary` AA pair. Skip and Next use `primary` as tint. There are no raw color literals.

Top/Next Pressables have at least 44pt on iOS and 48dp on Android; the final CTA has `minHeight: 48`. The Next arrow is `SymbolView` with `arrow.forward` on iOS and `arrow_forward` on Android, hidden from the accessibility tree because the button label carries meaning.

### Decision 6 — Expose one semantic page indicator, not three controls

Wrap all visual pills in one `accessible` container labeled with `t("onboarding.pageIndicator", { current, total })`. The pills are decorative descendants and cannot receive focus individually. The label updates from page selection, so VoiceOver/TalkBack encounter one localized page-state announcement rather than three meaningless dots. Skip, Next, and final CTA each receive their specified translated accessibility labels and button role.

Manual device proof covers actual announcement quality and focus order; component tests prove the resolved label, grouping, headings, roles, and control visibility.

### Decision 7 — Provide a suite-wide imperative pager mock

Add a Jest setup module for `react-native-pager-view`. The mock renders all children inside a React Native `View`, forwards a ref, and exposes `setPage` and `setPageWithoutAnimation`. Each method emits the same `onPageSelected` event shape as the native component so a press on Next exercises the screen's real state transition. Tests can also invoke `onPageSelected` to model a swipe.

Rewrite `welcome-screen.test.tsx` to cover every page's localized title/body, both Next transitions and indicator labels, Skip/final navigation, last-page control absence, accessibility grouping/labels, swipe state, and reduced-motion branches (snap API/no indicator timing versus animated API/timing). The screen remains a `ui/` file under the repository's global 70% configured bucket, but the focused report must demonstrate at least 90% branch coverage for this file as required by the issue; do not weaken or misrepresent `jest.config.js`.

### Decision 8 — Update current-state documentation and retain the existing route contract

ADR 015 remains valid as the completed welcome-first stack decision. ADR 036 adds only the native pager dependency choice. Update `features.md`, `runtime.md`, `eas.md`, ADR index, `CHANGELOG.md`, Phase 03 step 1, and the existing manual onboarding DoD note. Add the missing Phase 07 roadmap note that the future RN changelog must decide fresh-install suppression/current-version behavior; this carousel performs no version-state write.

The manual note expands to both schemes, VoiceOver/TalkBack page-state announcements, swipe/Next parity, touch targets, and tablet width. A fresh development/EAS binary is a human-only operational consequence and is recorded as `(HUMAN: …)` evidence, never as an implementation blocker.

## Risks / Trade-offs

- **[Native pager methods and selection events drift across library upgrades]** → Pin the Expo-compatible lockfile version, keep use feature-local, test the event/ref contract, and give ADR 036 an SDK/library-upgrade revisit trigger.
- **[The opaque-white legacy PNGs look accidental in dark mode]** → Frame each unchanged raster on `backgroundElement`; defer asset replacement rather than applying ad hoc filters.
- **[Small screens or large type crowd the vertical layout]** → Let the pager region flex, cap illustration height, avoid fixed text heights, retain font scaling, and include large-type/device checks.
- **[Page controls and native swipe state diverge]** → Derive UI exclusively from `onPageSelected`, including imperative transitions.
- **[Screen-reader users hear dots or stale page state]** → Group pills as one element with a changing translated label and verify announcement/focus order on VoiceOver and TalkBack.
- **[A JS-only update reaches an old binary without the native pager]** → Fingerprint runtime isolation prevents delivery; require fresh native binaries and document the expected behavior.
- **[Removing welcome QR/URL buttons is mistaken for route removal]** → Tests and scope preserve the routes; only this entry surface changes.

## Migration Plan

1. Install the pager dependency and add its Jest mock before importing it in the screen.
2. Copy the three legacy image files into the RN onboarding asset directory and replace the screen/catalog/tests in one coherent step.
3. Update Maestro and all current-state architecture, roadmap, ADR, changelog, and manual-proof documents.
4. Run focused onboarding tests and coverage, then the complete local mobile green suite and strict OpenSpec validation.
5. Ship a fresh native binary for device/QA proof; the fingerprint intentionally separates it from pre-change binaries.

Rollback is a normal revert of the feature commit: restore the text-only screen/catalog/tests, remove the copied assets and pager dependency/lockfile entry, and rebuild native binaries. No persisted data or server migration needs reversal.

## Open Questions

None. Page order, copy, assets, navigation destinations, dependency, design tokens, accessibility behavior, and follow-up scope are fixed by the issue brief.
