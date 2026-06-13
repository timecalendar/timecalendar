// Native-chrome wrapper seam. Each module under src/components/chrome/ is the
// single import site for one alpha native-chrome API; the chrome-boundary lint
// rule (eslint.config.js) forbids importing those APIs anywhere else. Feature
// and route code imports `@/components/chrome`, never the alpha packages — when
// they churn (they're all alpha), the blast radius is this directory. This is
// the roadmap step-10 insurance against alpha churn.

export { NativeTabs } from "@/components/chrome/native-tabs"
export { GlassSurface } from "@/components/chrome/glass-surface"

// @expo/ui — boundary, not a rendered stub (design D6, R-2). @expo/ui has no
// consumer in the app today; rendering a throwaway control "to prove the
// wrapper" would be exactly the speculative divergence R-2 forbids. Its half of
// the seam is the lint boundary (the ban covers @expo/ui + subpaths) plus this
// note: when the first consumer arrives (likely Settings, Phase 1.5), add an
// `expo-ui.tsx` wrapper here as the single import site for `@expo/ui`
// (`/swift-ui`, `/jetpack-compose`, `/universal`) and export its component(s)
// from this barrel. The boundary is real and enforced now; the body is earned.
