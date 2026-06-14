import { Host, Picker } from "@expo/ui"

// The single import site for `@expo/ui` (SDK-56 native controls — SwiftUI on
// iOS / Jetpack Compose on Android). The chrome-boundary lint rule
// (eslint.config.js) forbids importing `@expo/ui` (+ subpaths) anywhere outside
// src/components/chrome/, so when this alpha API churns the blast radius is this
// file. Feature/route code imports `@/components/chrome`, never `@expo/ui`
// directly (ADR 010, design D4).
//
// We default to the UNIVERSAL entry (`@expo/ui` → build/universal): the same
// call site bridges to SwiftUI / Compose and renders a plain View off-device
// (web, RN fallback, Jest). A control that genuinely diverges later splits to a
// platform-specific entry via composition inside this wrapper, with its own ADR
// (ADR 010 revisit) — there is no diverging control today, so a platform split
// would be the speculative divergence R-2 forbids.
//
// The wrapper stays THIN (design D4): it re-exports `Host` and the value-based
// single-select `Picker` (which already carries `Picker.Item` as a static
// compound member, like NativeTabs.Trigger). It deliberately does NOT theme the
// picker: the native control is OS-chromed and adopts the platform's own
// light/dark appearance — forcing `@/theme` colors onto it would be the LCD
// laziness R-2 rejects and breaks the platform-is-the-reference posture (R-3).
// (Unlike NativeTabs, where the wrapper injects colors because the consumer
// would otherwise reach the raw Colors map.) No higher-level `SettingsPicker` is
// baked in from a single consumer (R-2); that composition is earned by a second
// consumer / the Phase-1.5 golden-path exemplar.

export { Host, Picker }
