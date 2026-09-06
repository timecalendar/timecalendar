## Context

`mobile/src/features/onboarding/ui/welcome-screen.tsx` is a 385-line presentation component that owns six concerns: the static page catalog, responsive page rendering, the native pager/ref contract, Skip/Next/final controls, a grouped accessible indicator, and reduced-motion-aware entrance/indicator animation. ADR 036 requires the feature to keep `react-native-pager-view`, direct native page-selection events, and `setPageWithoutAnimation` for reduced motion. The existing page order, translations, route, test IDs, safe area, decorative accessibility, and platform touch targets are already shipped behavior.

The current indicator width transition uses React Native `Animated` with `useNativeDriver: false`; it therefore performs avoidable decorative animation work on the JavaScript thread. Reanimated 4.3.1 and its worklets runtime are already pinned mobile dependencies, but the feature does not yet use their Jest setup. The reduced-motion preference must remain live while the screen is mounted, so the existing `AccessibilityInfo` initial read plus event subscription remains the authoritative preference source.

## Goals / Non-Goals

**Goals:**

- Keep every welcome-screen component focused and materially below 200 lines.
- Preserve native swipe selection and the existing imperative Next, Skip, and final-action behavior.
- Run entrance opacity and indicator width transitions on Reanimated's UI-thread runtime when motion is allowed.
- Schedule no decorative timing animation while reduced motion is enabled, and cancel in-flight work when the preference changes or the relevant component unmounts.
- Preserve the accessibility tree: page headings, hidden illustrations/symbols/pills, one grouped indicator label, localized control labels, and platform-sized targets.
- Make focused Jest proofs assert observable state and behavior rather than the removed React Native `Animated` call shape.

**Non-Goals:**

- No copy, translation-key, route, page-order, first-launch gating, illustration, color-token, or onboarding-flow change.
- No replacement or abstraction of ADR 036's native pager, and no generic shared carousel/animation primitive.
- No dependency version, Babel, native plugin, permission, app config, EAS, Firebase/store, OpenAPI/generated client, schema, CI workflow, deploy, or legacy Flutter change.
- No change from the existing semantic `page.id` keys; numeric indicator keys remain acceptable for the fixed, non-reordered three-pill presentation.

## Decision 1 — Split by UI responsibility while keeping one screen coordinator

Keep `WelcomeScreen` as the route-facing coordinator for current page, navigation, reduced-motion state, responsive illustration height, and the safe-area layout. Extract feature-local modules for the immutable page catalog/page rendering, the native pager, controls, and grouped indicator. A small feature-local reduced-motion hook may own the initial `AccessibilityInfo` read and live subscription.

The pager module renders `PagerView` directly and forwards the native ref/event types needed by the coordinator; this is feature composition, not the generic wrapper rejected by ADR 036. Page controls receive explicit state/callback props and do not own navigation. The static descriptor retains `page.id` as its semantic React key. Only `WelcomeScreen` remains exported through `ui/index.ts` and the top-level onboarding barrel unless an extracted symbol is genuinely used outside this screen.

Alternatives rejected: keeping one file with local subcomponents does not reduce ownership or test boundaries; creating shared pager/indicator primitives would generalize a one-feature contract without a second consumer; moving presentation into a new feature layer would violate the existing UI-only ownership.

## Decision 2 — Preserve one live reduced-motion source and pass it explicitly

Retain an asynchronous `AccessibilityInfo.isReduceMotionEnabled()` read guarded against late settlement, subscribe to `reduceMotionChanged`, and remove the subscription on unmount. Represent the unresolved initial state explicitly so decorative animation is not scheduled before the preference is known. Pass the resolved value to the entrance and indicator components and use the same value when choosing `setPage` versus `setPageWithoutAnimation`.

This keeps mid-screen preference changes coherent across all motion families. Introducing a second reduced-motion hook inside animated children is rejected because independently timed reads could temporarily disagree with the pager decision and complicate cleanup.

## Decision 3 — Move only decorative animation to Reanimated shared values

Replace React Native `Animated.Value`/`Animated.timing` with Reanimated `useSharedValue`, `useAnimatedStyle`, `withTiming`, and `cancelAnimation` in the feature-owned entrance and indicator modules. When motion is allowed, animate entrance opacity over the existing 300ms and each pill width over the existing 150ms. When reduced motion is true, cancel any in-flight animation before assigning final opacity and width values directly. Cleanup cancels owned shared-value animations so rerenders and unmounts leave no continuing decorative work.

Active/inactive colors remain ordinary theme-derived state because they do not need interpolation. Native pager swipes remain direct user manipulation; only programmatic Next changes between animated and non-animated pager methods. Layout animation is intentionally limited to three tiny indicator pills, preserving the current visual contract without introducing layout-transition APIs or a broader animation abstraction.

Keeping React Native `Animated` is rejected because indicator width cannot use its native driver. Replacing the native pager with a Reanimated carousel is rejected because it violates ADR 036 and would broaden risk far beyond decorative motion.

## Decision 4 — Prove behavior at the smallest owning boundary

Keep the route-level welcome test responsible for fixed page order/copy, native swipe selection, both Next transitions, Skip/final navigation, final-page controls, translated labels, headings, hidden decorative assets, and grouped indicator state. Add focused tests around the reduced-motion hook/animated components as needed to prove late initial reads are ignored, the listener is removed, reduced mode resolves directly to final styles, allowed mode resolves to the same final visual state, and preference changes/unmount cancel owned work.

Use Reanimated's supported Jest setup for this pinned version rather than a handwritten runtime imitation. Assertions target rendered styles, selected page behavior, and cleanup outcomes; they do not retain expectations about `Animated.timing`, `Animated.parallel`, or `useNativeDriver`. The suite-wide pager mock remains unchanged because it is the established off-device seam for ADR 036.

## Risks / Trade-offs

- **[Risk] Reanimated's Jest environment can expose styles differently from React Native `Animated`.** → Use the package's supported test setup and assert final rendered behavior at focused component boundaries; avoid timing-call-count assertions.
- **[Risk] A live preference change can leave an old animation running.** → Cancel the owned shared value before every snap/restart and again in effect cleanup; cover false→true changes and unmount.
- **[Risk] Component extraction can accidentally alter accessibility grouping or test IDs.** → Treat the current accessibility tree and IDs as explicit props/contracts and retain screen-level regression proofs.
- **[Risk] Forwarding the pager ref can drift from the suite-wide mock.** → Keep the native `PagerView` ref/event types at the feature-local pager boundary and run both animated and reduced-motion imperative paths through the existing mock.
- **[Trade-off] Several small UI modules add files.** → The boundaries map to independently changing responsibilities and keep the route-facing screen readable; no symbols are added to public barrels without a consumer.

## Migration Plan

This is an internal refactor with no persisted data or rollout migration. Land the extracted modules and behavior tests atomically on the existing branch. Rollback is the single pull-request revert; translations, routes, native dependencies, and runtime configuration remain unchanged.

## Open Questions

None. ADR 036 and the handoff define the paging contract, and the smallest reversible path is fully specified.
