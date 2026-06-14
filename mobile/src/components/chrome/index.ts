// Native-chrome wrapper seam. Each module under src/components/chrome/ is the
// single import site for one alpha native-chrome API; the chrome-boundary lint
// rule (eslint.config.js) forbids importing those APIs anywhere else. Feature
// and route code imports `@/components/chrome`, never the alpha packages — when
// they churn (they're all alpha), the blast radius is this directory. This is
// the roadmap step-10 insurance against alpha churn.

export { GlassSurface } from "@/components/chrome/glass-surface"
export { NativeTabs } from "@/components/chrome/native-tabs"

// @expo/ui — wrapper landed (A2 / TIM-131). The Settings screen is the first
// `@expo/ui` consumer (discharging the theming-D6 deferral), so the boundary-only
// note became a real wrapper body: `expo-ui.tsx` is the single import site for
// `@expo/ui` (the universal `Host` + `Picker`), enforced by the chrome lint
// boundary. The wrapper stays thin — only the controls a consumer needs are
// re-exported; the OS-chromed picker is not force-themed (ADR 010, design D4).
export { Host, Picker } from "@/components/chrome/expo-ui"
