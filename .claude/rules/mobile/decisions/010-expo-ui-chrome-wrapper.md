# 010 — @expo/ui adopted behind the chrome wrapper seam; universal entry the default

> Origin: the `add-mobile-settings-screen` change (TIM-131 / A2), design D4 + D8.
> The full wiring lives in the Architecture Book "Theming & native-chrome"; this
> is the load-bearing decision.

## Status

Accepted.

## Context

A2 (the Settings screen) is the **first consumer of `@expo/ui`** — the SDK-56 native-controls
library (SwiftUI on iOS / Jetpack Compose on Android). The theming change (step 10) deliberately
shipped `@expo/ui` as a **boundary only**: the chrome lint rule bans it outside
`src/components/chrome/`, but no wrapper body was written ("rendering a throwaway control to prove
the wrapper would be exactly the speculative divergence R-2 forbids… when the first consumer arrives,
likely Settings, add an `expo-ui.tsx` wrapper"). That consumer is now here.

Two choices are load-bearing — copied by every later native control (Personal Events' date/time
pickers, the B/C feature controls) and costly to reverse — so they earn an ADR (R-4):

1. **How `@expo/ui` is reached.** The chrome seam (`src/components/chrome/`) localizes alpha-API
   churn to one directory per API; `@expo/ui` is alpha and ships multiple unstable entry points.
2. **Which entry to default to.** `@expo/ui` exposes a **universal** entry
   (`import { ... } from "@expo/ui"`, cross-platform `Host` + controls with a plain-`View` fallback
   off-device) and **platform-specific** entries (`@expo/ui/swift-ui`, `@expo/ui/jetpack-compose`).
   The default sets the posture every later control inherits.

## Decision

1. **Adopt `@expo/ui` behind a chrome wrapper:** `src/components/chrome/expo-ui.tsx` is the single
   import site for `@expo/ui`, exported (typed) from the chrome barrel. Feature/route code imports
   `@/components/chrome`, never `@expo/ui` — enforced by the existing chrome lint boundary (R-1). The
   wrapper stays **thin**: it re-exports the universal `Host` + `Picker` (which already carries
   `Picker.Item` as a static compound member), and **does not** bake in higher-level composed
   components or force theming onto the OS-chromed controls (a native picker adopts the platform's own
   appearance — forcing colors is the LCD laziness R-2 rejects and breaks the R-3 native-reference
   posture). Higher-level composition is earned by a second consumer / the Phase-1.5 golden-path
   exemplar.
2. **Default to the universal entry.** The same call site works on both platforms; the controls are
   identical native chrome; there is no current need to drop to a platform-specific entry. Choosing
   universal avoids a speculative platform split (R-2). A control that genuinely diverges later splits
   via composition inside the wrapper, with its own ADR (R-2).

Operational facts that flow from adoption (recorded so the next consumer doesn't re-derive them),
verified against `node_modules/@expo/ui@56.0.17` + a clean `npx expo prebuild --clean`:
`@expo/ui` **autolinks** (it ships `expo-module.config.json` and no `app.plugin.js`) — **no
`app.config.ts` `plugins` entry**, like `react-native-mmkv` v4. Its babel-plugin is **`Icon`-only**
(SF Symbol / drawable resolution) — not added to `babel.config.js` until a consumer uses `@expo/ui`'s
`Icon`. Its native module has no off-device JS, so Jest needs a suite-wide `@expo/ui` mock
(`jest/setup-expo-ui.ts`, mirroring `setup-firebase`/`setup-splash`).

*Rejected:* import `@expo/ui` directly at the screen (defeats the chrome seam + its lint); default to
platform-specific entries (speculative divergence with no diverging control — R-2); a fully-composed
`SettingsPicker` from one screen's two pickers (cross-feature abstraction from a sample size of one —
R-2).

## Consequences

- Every later native control copies this seam: add/extend `expo-ui.tsx`, import from
  `@/components/chrome`. The blast radius of `@expo/ui` churn is one file.
- The Architecture Book's "Theming & native-chrome" `@expo/ui` note flips from boundary-only to
  "wrapper landed"; the theming-D6 deferral is discharged.
- The native picker's appearance is the platform's (reviewed on-device, R-3) — not theme-tinted.
  Accepted; if a design later needs a tinted control and `@expo/ui` exposes the surface, the wrapper
  adds it then.
- Maestro cannot deterministically drive the native picker across both platforms; the control→hook
  wiring is proven by the Jest test instead, the e2e proves render + reachability (the change's D5).

## Revisit if

- A control genuinely needs a platform-specific entry (`@expo/ui/swift-ui` / `/jetpack-compose`) or
  diverges enough to split — re-open the universal default for that control (with its own ADR).
- `@expo/ui` proves unstable enough that a non-`@expo/ui` fallback control is warranted — it lives
  behind the same `expo-ui.tsx` wrapper API (that is exactly what the seam is for).
- A second consumer wants the same composed control shape — promote it to a higher-level component in
  the wrapper / the golden-path exemplar (the body the thin wrapper deferred).
