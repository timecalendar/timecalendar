# Design — mobile theming + native-chrome wrappers

## Context

`mobile/` has a loose, Expo-template-era theme layer: `src/constants/theme.ts` holds `Colors`
(light/dark), `Spacing`, `Fonts`, plus a couple of layout constants, and a `useTheme` hook
(`src/hooks/use-theme.ts`) resolves `Colors` by `useColorScheme`. `ThemedText` / `ThemedView`
consume it; `ThemedText` already encodes the a11y heading-role contract (step 7). Three
**alpha** native-chrome surfaces are in play:

- `expo-router/unstable-native-tabs` — used **directly** in `src/components/app-tabs.tsx`,
  which also reaches into the raw `Colors` map. Marked alpha; "API is subject to change."
- `@expo/ui` (`~56.0.17`) — installed, **unused**; three unstable entry points
  (`swift-ui`, `jetpack-compose`, `universal`), no documented stability.
- `expo-glass-effect` (`~56.0.4`) — installed, **unused**; iOS-26-only Liquid Glass with a
  documented `View` fallback on unsupported platforms (`isLiquidGlassAvailable()` /
  `isGlassEffectAPIAvailable()` gate it).

The Liquid Glass degradation baseline is already recorded under the Architecture Book's
Minimum OS floors: iOS 16.4–25 → non-glass fallback, iOS 26+ → glass.

Constraints shaping the design:
- **R-1.** Encode the swappability boundary before documenting it — a lint rule, not just prose.
- **R-2 / R-3.** Platform-appropriate by intent; the platform is the design reference, not the
  Flutter app. No speculative divergence — we wrap what is used now, not every alpha surface.
- **R-6 / scope.** Step 10 is insurance + tokens, not features. No splash (step 13 depends on
  this), no feature UI, no new dependency.
- **Heading-role contract is load-bearing.** Repointing `ThemedText` must not change its props
  or its `type→accessibilityRole="header"` mapping; the a11y proof test must stay green.

## Goals / Non-Goals

**Goals:**
- A first-class, typed token layer under `src/theme/` (colors, spacing, radii, typography) with
  light/dark resolution; `Themed*` + `useTheme` repointed at it with **identical public API**.
- Our own swappable wrappers under `src/components/chrome/` over native-tabs, the glass effect,
  and `@expo/ui`, so feature/route code never imports the alpha APIs directly.
- The Liquid-Glass-vs-fallback decision lives in **one** place (the `GlassSurface` wrapper).
- A lint boundary that fails if anything outside `src/components/chrome/` imports the alpha APIs.
- A documented WCAG-AA contrast posture for the light/dark token pairs.
- One CI proof test (token resolves light/dark + wrapper renders). Step 10 marked done.

**Non-Goals:**
- **No splash, no feature UI** — step 13 (splash) depends on this and is the first real consumer
  of the wrappers/animation; we build the seam, not what flows through it.
- **No new dependency, no `app.config.ts` plugin change** — all three surfaces already ship.
- **No CSS-in-JS / styling library** (NativeWind, Tamagui, unistyles) — `StyleSheet` + typed
  token constants is the established pattern; introducing a styling runtime is speculative (R-2).
- **No runtime contrast checker** — contrast is an authoring-time + manual-review posture
  (see D5); a runtime/CI contrast lint is recorded debt, not built.
- **No in-app theme override / theme switcher** — device color scheme only, like i18n follows
  the device locale; an override is a Settings (Phase 1.5) concern needing the MMKV seam.
- **No `@expo/ui` component actually rendered** — it has no consumer yet; we establish the
  wrapper *boundary* (so the lint rule has a home and the seam is documented), not a stub
  control nobody uses (that would violate R-2's "no speculative divergence").

## Decisions

### D1 — Token layer is typed TS constants under `src/theme/`, consolidating `constants/theme.ts`
A `src/theme/` module (`tokens.ts` for raw scales + `index.ts` re-exporting `useTheme` and the
public token surface) holds colors (light/dark records), spacing, radii, and typography. Plain
`as const` TS constants — no styling runtime — because that is exactly the established pattern
(`StyleSheet` + token constants) and it keeps `tsc` as the only type gate. The Expo-template
`src/constants/theme.ts` is **moved** into `src/theme/` (its `Colors`/`Spacing`/`Fonts` become
the seed of the new layer); call sites are repointed to `@/theme`. *Alternative:* leave tokens
in `src/constants/` and only add wrappers — rejected: the roadmap step is "design tokens" as a
named layer, and a `theme/` home is where the contrast pairs (D5) and the `useTheme` move
naturally live. *Alternative:* a styling library — rejected (R-2, see Non-Goals).

`useTheme` moves from `src/hooks/` to `src/theme/` so the token layer owns light/dark
resolution end to end; `src/hooks/use-color-scheme{,.web}.ts` stay (they wrap RN's
`useColorScheme` with the web static-render fix and are scheme detection, not tokens).

### D2 — `Themed*` props unchanged; the heading-role contract is preserved verbatim
`themed-text.tsx` / `themed-view.tsx` change only their **import source** (`@/theme` instead of
`@/constants/theme` + `@/hooks/use-theme`). The `ThemedTextProps` / `ThemedViewProps` shapes,
the `type→style` map, and critically the `type==="title"|"subtitle" → accessibilityRole="header"`
mapping (caller override still wins) are untouched. The existing `themed-text.test.tsx` a11y
proof must stay green unmodified — that is the regression guard for this decision.

### D3 — Native-chrome wrappers under `src/components/chrome/`, one per used surface
Three thin wrappers, each the single place its alpha API is imported:
- **`chrome/native-tabs.tsx`** — re-exports / lightly wraps `NativeTabs` (and the `.Trigger`
  compound parts the app uses), pulling tab-bar colors from `@/theme` so call sites stop
  reaching into the raw color map. `app-tabs.tsx` is repointed at it. This is the *only* live
  consumer today.
- **`chrome/glass-surface.tsx`** — wraps `expo-glass-effect`. Centralizes the degradation
  decision: when `isLiquidGlassAvailable()` (iOS 26+), render `GlassView`; otherwise (iOS
  16.4–25, Android, web, Jest) render a plain themed `View`. One import site for the glass API,
  one place the baseline lives in code (mirroring the prose baseline under Minimum OS floors).
- **`chrome/index.ts`** — barrel for the wrapper surface; a documented thin pass-through note
  for `@expo/ui` (no component rendered yet — D6) so the boundary and its lint rule have a home.

Wrappers are the *seam*, deliberately minimal: they own the alpha import and the
theme-token/degradation glue, nothing more. When the alpha APIs churn, the blast radius is this
directory. *Alternative:* wrap inside `app-tabs.tsx` only — rejected: that re-couples each new
chrome consumer to the alpha API; a named seam is the insurance the roadmap asks for.

### D4 — Encode the swappability boundary as a lint rule (R-1)
`eslint.config.js` gains a `no-restricted-imports` block banning
`expo-router/unstable-native-tabs`, `expo-glass-effect`, and `@expo/ui` (+ subpaths) everywhere
**except** `src/components/chrome/**`, which is exempted exactly like `src/api/mutator.ts` is
exempted from the fetch ban (`mutator-owns-fetch` pattern). This makes the seam structural, not
a convention that erodes the next time someone reaches for `GlassView`. The `no-restricted-imports`
machinery already used (axios, `@react-navigation/*`, `../`) extends cleanly — the chrome
patterns are added to a chrome-scoped block and a complementary `ignores: chrome` on the global
block, or via a path-regex pattern with the chrome dir as the carve-out. Caveat the lint can't
carry, recorded in the book: it catches the static import specifier, not a dynamic
`require()`/`import()` evasion — it guards accident, review covers adversaries (same posture as
the raw-fetch rule). *Alternative:* prose-only convention — rejected, violates R-1 outright for
the one rule this whole change exists to protect.

### D5 — Contrast is a documented token-pair posture, not a runtime check (DoD ownership)
The a11y change (step 7) deferred color contrast to theming "owned jointly with theming, step
10," and the DoD's Accessibility axis names it. This change discharges it as a **posture**, not
a tool: the token layer documents its foreground/background **pairs** (e.g. `text`-on-`background`,
`textSecondary`-on-`backgroundElement`, selected states) and each pair is verified to meet
**WCAG AA** (4.5:1 body / 3:1 large text) at authoring time; the DoD's manual contrast review
checks rendered screens against those named pairs. No runtime/CI contrast lint is built — a
static checker can't know which token lands on which background at a given site (the same
authorial-intent gap that kept the heading role in the component, not lint), and there is no
offender to guard yet. Recorded as deferred debt with its trigger (the first screen with
non-token-pair color combinations, or a designer-driven palette change) and owner. *Alternative:*
wire a contrast assertion into the proof test — rejected: it would assert a tautology over the
pairs we just authored, not catch real regressions; the honest gate is human review against the
documented pairs, like the manual screen-reader passes.

### D6 — `@expo/ui` gets a boundary, not a rendered stub (R-2)
`@expo/ui` has no consumer in the app today and there is no feature that needs a native input
control this step. Rendering a throwaway `@expo/ui` control "to prove the wrapper" would be
exactly the speculative divergence R-2 forbids. So the `@expo/ui` half of the seam is the lint
boundary (D4) + a documented pass-through note in `chrome/index.ts` describing where a real
wrapper goes when the first consumer (likely Settings, Phase 1.5) arrives. The boundary is real
and enforced now; the wrapper body is earned by its first user.

### D7 — CI proves token-resolves + wrapper-renders; visual + contrast are manual
`src/theme/theme.test.tsx` (mirroring the i18n/a11y/firebase proof tests, gated by `test-mobile`)
asserts two things tooling *can*: (a) `useTheme` resolves a token to the expected light value
and to the expected dark value (driving `useColorScheme`'s two states), proving light/dark
resolution end to end, not merely that the constants exist; (b) `GlassSurface` renders its
children in the Jest environment — where no native glass exists, this exercises the **fallback**
path, proving the wrapper degrades to a real rendered `View` rather than throwing. What CI
**cannot** prove and is therefore manual (owned by the DoD / step 13 splash visual pass): that
Liquid Glass actually renders on an iOS 26 device, that the fallback looks right on iOS 16.4–25
and Android, and that the contrast pairs read correctly on-device. Mirrors the Firebase split of
CI-provable wiring vs. on-device manual proof.

## Risks / Trade-offs

- **Repointing `ThemedText` could regress the heading-role contract** → mitigated by D2 (props
  unchanged, import-source-only edit) and the untouched `themed-text.test.tsx` a11y proof as the
  regression guard. `tsc` catches a broken token-key reference.
- **The chrome lint exemption is path-scoped** → if the `chrome/` directory is renamed or a new
  alpha surface is added without a wrapper, the rule must be updated; same maintenance shape as
  `mutator-owns-fetch`. Static-import-only (no dynamic-import evasion) — accident, not adversary.
- **Alpha churn is the whole point** → the wrapper localizes it, but an alpha API can still
  break a build on SDK bump; the seam means one directory absorbs it. `GlassSurface`'s
  `isLiquidGlassAvailable()` gate is itself an alpha API — if its name/shape churns, the change
  is one wrapper, exactly as intended.
- **`@expo/ui` boundary with no body (D6)** → a reviewer may expect a working wrapper; the
  design records *why* it is a boundary-only seam (no consumer, R-2) so it reads as deliberate,
  not unfinished.
- **Contrast as posture, not gate** → relies on human review against documented pairs; recorded
  as such (D5), consistent with the DoD's existing manual axes. Trigger for upgrading to a tool
  is recorded.

## Migration Plan

Additive + repoint; rollback = revert. Order: ① create `src/theme/` (move tokens from
`constants/theme.ts`, move `useTheme`, document contrast pairs) → ② repoint `themed-text.tsx` /
`themed-view.tsx` / any other `@/constants/theme` consumer at `@/theme` → ③ create
`src/components/chrome/` wrappers (`native-tabs`, `glass-surface`, barrel) → ④ repoint
`app-tabs.tsx` at the wrappers + `@/theme` → ⑤ add the chrome-boundary lint rule → ⑥ proof test
→ ⑦ Architecture Book section + Lint inventory + a11y contrast note update + changelog + roadmap.
Gate on `npx tsc --noEmit`, `npm run lint` (zero warnings — the new boundary rule passes because
only `chrome/` imports the alpha APIs), `npm test`.

## Open Questions

None blocking. Deferred (recorded, not built): a runtime/CI contrast lint (D5 trigger), an
in-app theme override (Settings / MMKV seam), the real `@expo/ui` wrapper body (first input-control
feature, D6), and any animation/reduced-motion handling (no animation exists; the splash, step
13, inherits reduced-motion by name per the a11y section and DoD).
