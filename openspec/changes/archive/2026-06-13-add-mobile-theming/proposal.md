# Theming + native-chrome wrappers behind our own swappable abstractions

## Why

The native-chrome APIs the app leans on — Expo Router's `unstable-native-tabs`, `@expo/ui`,
and `expo-glass-effect`'s Liquid Glass — are all **alpha** and **churn**: native-tabs is
literally imported from `expo-router/unstable-native-tabs` ("API is subject to change"),
`@expo/ui` ships three unstable entry points (`swift-ui` / `jetpack-compose` / `universal`)
with no documented stability, and the glass effect is iOS-26-only with a runtime-detected
fallback. Today `app-tabs.tsx` imports `NativeTabs` **directly** and reaches into the raw
`Colors` map, and `@expo/ui` / `expo-glass-effect` are installed-but-unused. The roadmap risk
note (foundation §"Risks") is explicit: *"Native-chrome APIs are alpha; the wrapper layer
(step 10) is the insurance against their churn."* This change builds that insurance.

Foundation roadmap step 10. It is also where the **color-contrast** DoD obligation lands: the
a11y change (step 7) deferred contrast to theming by name ("owned jointly with theming,
step 10"), and the DoD's Accessibility axis says "Color contrast — against the theme tokens
(owned jointly with theming, step 10)." This change OWNS that posture.

## What Changes

- **A first-class token layer under `mobile/src/theme/`** — colors (light/dark), spacing,
  radii, and typography — consolidating and superseding the scattered Expo-template
  `src/constants/theme.ts` (`Colors` / `Spacing` / `Fonts`). Tokens are plain typed TS
  constants; light/dark resolution stays through `useColorScheme`. `ThemedText` / `ThemedView`
  and `useTheme` are repointed at the new layer **without changing their public props** — the
  `ThemedText` heading-role contract (a11y step 7) is preserved byte-for-byte.
- **Our own native-chrome wrapper seam under `mobile/src/components/chrome/`** — thin
  abstractions over the three alpha surfaces: a `NativeTabs` wrapper (the only consumer is
  `app-tabs.tsx`, repointed), a `GlassSurface` wrapper over `expo-glass-effect` that resolves
  the Liquid-Glass-vs-fallback decision in one place (iOS 26+ glass, iOS 16.4–25 / Android →
  plain themed `View`, the degradation baseline already recorded under Minimum OS floors), and
  a documented thin pass-through for `@expo/ui` primitives. Call sites import `@/components/chrome`
  / `@/theme`, **never** the alpha APIs directly.
- **A lint boundary rule** (`no-restricted-imports`) banning direct imports of
  `expo-router/unstable-native-tabs`, `expo-glass-effect`, and `@expo/ui/*` everywhere except
  the wrapper modules under `src/components/chrome/` — encoding the swappability boundary (R-1)
  so the insurance can't silently erode. Mirrors the existing `mutator-owns-fetch` pattern.
- **A contrast posture, recorded, not a runtime check** — documented light/dark token *pairs*
  (foreground-on-background) verified to meet WCAG AA at authoring time; the DoD's manual
  contrast review checks against these named pairs. No alpha-API or new dep needed.
- **One CI proof test** mirroring the i18n / a11y / firebase proofs: assert a token resolves
  through `useTheme` under light **and** dark, and that the `GlassSurface` wrapper renders its
  children (proving the fallback path renders in Jest, where no native glass exists).
- **Architecture Book** gains a "Theming & native-chrome" section (token-layer + wrapper-seam
  pointers, the alpha-churn caveat, contrast ownership); roadmap step 10 marked done.

No new runtime dependencies: `@expo/ui` and `expo-glass-effect` already ship with the SDK 56
template, and native-tabs is part of `expo-router`. No `app.config.ts` plugin changes — none
of the three surfaces needs a config plugin at this scope.

## Capabilities

### New Capabilities

- `mobile-theming`: the mobile app's design-token layer and its consumption (light/dark
  resolution, the `Themed*` / `useTheme` contract preserved), the native-chrome wrapper seam
  that isolates the three alpha APIs behind our own abstractions, the lint boundary that
  enforces the seam (R-1), the Liquid-Glass degradation decision centralized in one wrapper,
  the documented WCAG-AA contrast posture for token pairs, and what CI proves (token resolves
  light/dark + wrapper renders) vs. what is manual (visual platform review + contrast pass).

### Modified Capabilities

<!-- none. mobile-a11y owns the ThemedText heading-role contract; this change repoints the
component's token source without changing that requirement. The lint inventory (mobile-lint-format)
gains one boundary rule — recorded in the Architecture Book as normal rule evolution, not a
requirement change to that capability's spec. -->

## Impact

- `mobile/`: new `src/theme/` (token modules + `useTheme` move + proof test) and
  `src/components/chrome/` (the native-chrome wrappers); `src/constants/theme.ts` consolidated
  into `src/theme/` (or re-exported during the move); `app-tabs.tsx` repointed at the
  `NativeTabs` wrapper + `@/theme`; `themed-text.tsx` / `themed-view.tsx` repointed at
  `@/theme` (props unchanged); `eslint.config.js` gains the chrome-boundary rule. No new deps.
- `.claude/rules/mobile/architecture.md`: "Theming & native-chrome" section added; the
  Lint & format rule inventory and the a11y "contrast" deferral note updated to point here.
- `.claude/rules/mobile/architecture-changelog.md`: one entry.
- `docs/react-native-migration/01-roadmap/01-foundation.md`: step 10 marked done.
- No server/web/`app/` code touched. Native projects are CNG/gitignored. No splash, no feature
  UI — splash is step 13 and depends on this.
