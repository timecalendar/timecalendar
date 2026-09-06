## Why

The onboarding welcome experience currently concentrates page content, native pager coordination, controls, accessibility, reduced-motion state, and React Native animations in one 385-line screen. Splitting those responsibilities and moving decorative animation off the JavaScript thread will make the screen easier to maintain while preserving the first-launch experience.

## What Changes

- Extract the fixed three-page catalog and page presentation into focused onboarding UI modules.
- Extract native-pager coordination and Skip/Next/final controls while preserving `onPageSelected` as the selection source of truth and ADR 036's direct `react-native-pager-view` contract.
- Extract the grouped page indicator and implement its decorative transition with the installed Reanimated stack instead of React Native's JavaScript-driven width animation.
- Keep a live reduced-motion preference subscription with cleanup; snap entrance, indicator, and imperative page changes whenever reduced motion is enabled, including after a preference change while the screen is mounted.
- Refocus tests on user-visible paging, navigation, labels, accessibility grouping, motion behavior, and cleanup rather than React Native `Animated` implementation details.
- Preserve translations, route destinations, test IDs, safe-area and touch-target behavior, feature barrels, and the static page order.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-onboarding-flow`: Strengthen the existing carousel contract so decorative animation is worklet-driven when allowed, entirely absent under reduced motion, and safely cancelled across preference changes, rerenders, and unmounts while the existing paging and accessibility behavior remains unchanged.

## Impact

- Mobile implementation and focused tests under `mobile/src/features/onboarding/ui/`.
- The onboarding UI sub-barrel only if extracted public-within-feature modules require it; the top-level feature export remains compatible.
- Architecture Book current-state guidance for the onboarding component and animation ownership boundary.
- No dependency, API contract, generated client, schema/migration, native/store configuration, CI/deploy, Firebase, Terraform/Kubernetes, or legacy Flutter changes.
