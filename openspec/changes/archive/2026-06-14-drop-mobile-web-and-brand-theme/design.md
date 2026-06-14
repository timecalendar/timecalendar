# Design — drop web target + tokenized nav theme + pink brand hue

## Context

The mobile app (`mobile/`, Expo SDK 56, standalone npm project) targets **iOS +
Android only**. The Expo template it was scaffolded from ships a web target by
default, and that web surface is still wired in: `app.config.ts` `web` block,
`package.json` `"web"` script + `react-dom` / `react-native-web` deps,
`tokens.ts` `Fonts.web` branch, `theme/index.ts` `import "@/global.css"`, and the
`.web.tsx` / `global.css` / `favicon.png` files. None of it ships.

Three theming gaps live in the same files:
- The color-scheme source is split — `_layout.tsx` reads `react-native`'s
  `useColorScheme` directly; `useTheme` reads it via `@/hooks/use-color-scheme`.
- The React Navigation `ThemeProvider` is fed stock `DefaultTheme` / `DarkTheme`, so
  nav chrome can't follow `@/theme`.
- There is no brand token; the scaffold's only brand-ish color is the off-brand blue
  `#208AEF` native splash background. The product brand (Flutter) is **pink**.

Constraints shaping the design:
- **R-1.** Encode before documenting. C1/C2 and the web drop are *config/code*, not new
  lint rules — there is no new boundary to encode here; the enforcing gates are `tsc`,
  `npm run lint`, `npm test`, and `expo prebuild`. (No new lint rule is invented — that
  would be cargo-cult; the existing chrome/theme boundaries already hold.)
- **R-2 / R-3.** Platform-appropriate by intent; **the platform is the design reference,
  not the Flutter app.** Adopt the brand *hue*, not Material specifics. No speculative
  divergence — brand token + tokenized nav theme only; no switcher, no `@expo/ui` body.
- **R-4.** The web drop and the brand-color adoption are load-bearing (reused by every
  future feature / reverse-costly) → each earns an ADR.
- **Heading-role contract is untouched.** `themed-text.tsx` is owned by a parallel
  issue; this change does not edit it. `Fonts.mono` (its only token dependency here)
  must keep resolving — so the `Fonts` `ios` / `default` branches stay.
- **Settings-readiness, not Settings.** Prepare the ground (brand token, one scheme
  seam, tokenized nav theme) so the Phase-1 Settings feature can add a
  light/dark/system override; build none of that override here.

## Goals / Non-Goals

**Goals:**
- Remove the entire web target from `mobile/` (files, config, scripts, deps, the
  `Fonts.web` branch and its `global.css` side-effect) with `Fonts.mono` preserved.
- One color-scheme seam (`@/hooks/use-color-scheme`) consumed by both `useTheme` and
  the root layout (C1).
- The React Navigation theme built from `@/theme` tokens, light and dark, so nav chrome
  follows the token palette (C2).
- A `primary` brand token (pink, Flutter hue) with re-verified WCAG-AA contrast pairs;
  native splash re-tinted to a brand tone.
- Remove the unused `BottomTabInset` token; keep `Radii`.
- Two ADRs, Architecture Book + changelog updates, green gates, clean prebuild.

**Non-Goals:**
- **No theme switcher / no in-app override / no override persistence** — device scheme
  only (Settings, Phase 1.5, needs the MMKV seam). This change only readies the ground.
- **No new dependency, no new lint rule** — the web drop *removes* deps; C1/C2/brand are
  code+config, not a new boundary.
- **No `@expo/ui` wrapper body** — still boundary-only (the theming change's D6 stands).
- **No port of Flutter Material specifics** (AppBar/FAB/Switch theming, Poppins font,
  Material elevation) — R-3: take the hue + neutral intent, keep platform idioms.
- **No edit to `themed-text.tsx`** (parallel issue) — only the constraint that
  `Fonts.mono` keeps resolving.
- **No animation / reduced-motion work** — the splash owns that; this only re-tints its
  background literal.

## Decisions

### D1 — Drop the web target wholesale; the native app loses nothing
Delete the four web-only files (`app-tabs.web.tsx`, `use-color-scheme.web.ts`,
`global.css`, `assets/images/favicon.png`), the `web` block in `app.config.ts`, the
`"web"` script + `react-dom` / `react-native-web` deps in `package.json` (regenerate the
lockfile), the `Fonts.web` branch, and the orphaned `import "@/global.css"`. Web is an
Expo-template default the two-platform app never builds; carrying it is dead surface,
extra deps, and a styling path (CSS vars via `global.css`) the native runtime never
executes. *Why now:* this is the file set the brand/scheme/nav work touches anyway, so
the cleanup and the readiness work land together. *Alternative:* keep web "just in
case" — rejected: there is no web roadmap, the deps and `.web.tsx` resolution add
maintenance and confusion (a contributor sees a `app-tabs.web.tsx` and assumes web is
supported). Load-bearing platform-scope decision → **ADR 007**.

`src/hooks/use-color-scheme.ts` (`export { useColorScheme } from "react-native"`)
**stays** even though its `.web` sibling is deleted: it is the one-line seam the
wrapper-seam pattern wants (and the seam C1 routes the layout through). Without the
`.web` variant, Metro resolves the bare `.ts` on both platforms — exactly the desired
behavior.

### D2 — `Fonts.mono` must survive the web-branch removal (parallel-issue constraint)
`themed-text.tsx` (owned by a parallel issue, **not edited here**) consumes `Fonts.mono`.
Removing only the `web:` branch of the `Platform.select` leaves `ios` and `default`
intact, so `Fonts.mono` resolves to `ui-monospace` (iOS) / `monospace` (default) exactly
as before on the two target platforms. `tsc` is the guard: `Fonts` keeps the same shape
(`{ sans, serif, rounded, mono }`), only the platform map shrinks. *Alternative:* drop
`Fonts` entirely — rejected, it would break `themed-text.tsx` which we must not touch.

### D3 — C1: one color-scheme seam
`_layout.tsx` switches `import { useColorScheme } from "react-native"` to
`import { useColorScheme } from "@/hooks/use-color-scheme"`. Now the layout and
`useTheme` read the **same** seam. *Why:* two scheme sources can drift, and Settings
(Phase 1) will add a light/dark/system override — it must override exactly one place.
Routing the layout through the wrapper makes that future override a single-file change.
The wrapper today is a pass-through (`export … from "react-native"`); the value is the
seam, not present behavior. *Alternative:* leave the layout on the RN import — rejected:
it bakes in a second scheme source the moment an override exists.

### D4 — C2: nav theme built from `@/theme` tokens, light and dark
`_layout.tsx` builds two nav themes — spread `DefaultTheme` (light) / `DarkTheme` (dark)
and override `colors` from `@/theme` tokens for both, then pick by the resolved scheme:

| RN nav `colors` key | light token | dark token |
| --- | --- | --- |
| `background` | `Colors.light.background` | `Colors.dark.background` |
| `card` | `Colors.light.backgroundElement` | `Colors.dark.backgroundElement` |
| `text` | `Colors.light.text` | `Colors.dark.text` |
| `border` | `Colors.light.backgroundSelected` | `Colors.dark.backgroundSelected` |
| `primary` | `Colors.light.primary` (brand) | `Colors.dark.primary` (brand) |

Spread-then-override keeps the stock `fonts` and any keys we don't tokenize (RN nav's
theme type requires the full `colors` set; spreading the default supplies the rest). The
resolution reuses the scheme value from C1 (D3) — one read, no second source. *Why:* nav
chrome (header, card, hairline border, active tint) now follows `@/theme`, so it can't
drift from the token palette when the brand color lands — exactly the gap that would
otherwise show as stock-blue nav next to pink-branded content. *Alternative:* leave stock
`DefaultTheme`/`DarkTheme` — rejected: the `primary` tint and surfaces would visibly
mismatch the tokens. The mapping is **the** nav↔token contract and is the thing the new
test asserts (resolve `background`/`primary` per scheme from tokens).

### D5 — Brand hue: pink from `@/theme`, two tones, contrast-resolved (R-3)
Adopt the Flutter brand **hue** (pink) without porting Material specifics. Add to
`Colors` (both schemes) a `primary` brand token. The contrast re-verification (computed
at authoring time, WCAG AA = 4.5:1 body / 3:1 large) is the load-bearing part:

| pair | ratio | AA verdict |
| --- | --- | --- |
| white on `#E91E63` (pink primary) | **4.35:1** | large text ✅, body ❌ (< 4.5) |
| `#E91E63` on white (brand-on-light-bg) | **4.35:1** | large ✅, body ❌ |
| white on `#C2185B` (pink shade700) | **5.87:1** | body ✅ |
| black on `#F8BBD0` (pink shade100) | **13.0:1** | body ✅ (AAA) |
| `#C2185B` on `#000` (dark bg) | **3.58:1** | large ✅, body ❌ |
| `#FF4081` (pink accent) on `#000` | **6.30:1** | body ✅ |

**Decision on tone usage (the contrast resolution):**
- **Any surface that draws white text on brand fill (button label, a primary nav/active
  tint that carries text) uses the darker `#C2185B`** (white-on-`#C2185B` = 5.87:1, AA
  body). The bright `#E91E63` is *not* used as a white-text-on-fill body surface — its
  white-on-fill ratio is 4.35:1, below the 4.5:1 body floor (the issue flagged this).
- **`primary` as a tint/accent on a neutral background (e.g. the RN nav `primary` active
  tint, an icon/selection tint — not body text on the brand itself)** uses `#E91E63`
  light scheme: this is the brand identity color, used where it is the *foreground* of a
  large/non-body element on `background`, or as a small accent; its 4.35:1 on white meets
  the 3:1 large-text / non-text-contrast bar (WCAG 1.4.11 UI-component contrast is 3:1).
  For the **dark scheme** `primary`, use the lighter/accent `#FF4081` (6.30:1 on `#000`,
  AA body) so the brand reads on a dark background — `#C2185B` on `#000` is only 3.58:1.
- **Native splash background** (`app.config.ts`) is re-tinted from `#208AEF` to the brand
  pink `#E91E63`. The existing JS splash overlay renders brand text from `@/theme`; the
  native pre-JS literal just needs to read acceptably in both schemes (it's a brand fill,
  not a body-text surface) — `#E91E63` is the brand identity tone and is the right choice
  for the single pre-JS literal (the documented scheme-asymmetry exemption stands).

Concretely the token shape: `primary` per scheme in `Colors` — `light.primary = #E91E63`
(brand identity, accent/tint usage; not white-body-on-fill), `dark.primary = #FF4081`
(reads on dark). A separate **`onPrimary` posture** is documented in the contrast block:
white text belongs on `#C2185B`, so a future button uses `#C2185B` as its fill (recorded
as a named pair), not `primary` directly. We do **not** add a `primaryStrong`/button
token this change — no button consumer exists yet (R-2); the contrast block documents
*which tone a future white-text-on-brand surface must use* so Settings inherits the rule,
not an unused token. *Alternative:* make `primary = #C2185B` everywhere — rejected: the
brand identity color is `#E91E63` (the Flutter `Colors.pink`), and `#C2185B` is the
darkened *on-text* tone; the active tint / accent should be the identity pink. *R-3:* no
AppBar/FAB/Switch/Poppins port — hue + neutral intent only.

### D6 — Keep `Radii`, remove `BottomTabInset`
`Radii` stays — Settings is its first real consumer (the issue confirms; cutting a token
we'll use next is churn). `BottomTabInset` (`Platform.select({ ios: 50, android: 80 })`)
has **no consumer** (grep-verified: only its definition + re-export) — remove it from
`tokens.ts` and its re-export in `index.ts`. *Why:* it's dead since the native-tabs
wrapper landed; an unused exported token invites accidental use of a magic inset. `tsc`
confirms nothing imports it. *Alternative:* keep it "for later" — rejected: speculative,
and the native tab bar supplies its own inset now.

### D7 — No new lint rule; gates are tsc/lint/test/prebuild (R-1)
This change adds no new import boundary or rule to encode. C1/C2 are wiring, the web drop
is removal, the brand token is a value. The R-1-relevant enforcement is that the existing
gates stay green: `tsc` (token shape, nav-theme type, no dangling web imports), `npm run
lint` (`--max-warnings 0`; no orphaned imports, no literal strings), `npm test` (theme
proof incl. the new nav-theme assertion), and `npx expo prebuild --clean` (native config
changed: `web` block removed, splash background changed — must regenerate cleanly).
Inventing a "no react-native-web import" lint rule would be cargo-cult — the dep is gone,
so there's nothing to import. *This is recorded so the reviewer doesn't expect a new
rule.*

### D8 — Test: extend the proof for tokens + assert nav-theme resolution
`theme.test.tsx` keeps the light/dark `useTheme` token assertions and the `GlassSurface`
fallback render. It is **extended**, not replaced: (a) the brand `primary` token resolves
to its light value under light and its dark value under dark (mirrors the existing
`background`/`text` assertions); (b) a **nav-theme resolution** assertion — the nav theme
built in/for the layout maps `colors.background` and `colors.primary` to the
scheme-appropriate `@/theme` tokens (the D4 contract), proving nav chrome follows tokens
rather than asserting a tautology over constants. If the nav-theme builder is inlined in
`_layout.tsx`, factor the pure mapping into a small exported helper (e.g.
`buildNavTheme(scheme)`) the test can call without rendering the route tree (route files
aren't importable from tests — the route-structure rule); the layout consumes the helper.
*Why a helper:* keeps the assertion at the pure-mapping level and respects the
routes-not-importable boundary. Any `BottomTabInset` reference in the test is removed.

## Risks / Trade-offs

- **Removing `react-dom`/`react-native-web` could break a transitive that assumes them**
  → mitigated: nothing in `src/` imports either (grep-verified); `prebuild` + `tsc` +
  test catch a regression; rollback = revert. The lockfile is regenerated so the tree
  stays consistent.
- **Brand contrast subtlety** → the headline risk. `#E91E63` white-on-fill is 4.35:1
  (below body AA), so D5 fixes the usage rule: white text rides `#C2185B` (5.87:1), the
  identity pink is accent/tint (3:1 UI-component / large-text bar), dark-scheme `primary`
  is `#FF4081` (6.30:1). Documented in `tokens.ts`; the DoD manual contrast review checks
  rendered screens against the named pairs (the runtime checker stays deferred — D5 of the
  theming change).
- **R-3 drift risk** → adopting a Flutter color invites porting Flutter chrome. Bounded:
  hue + neutral intent only, no Material widget theming, no Poppins. Recorded in ADR 008.
- **C2 nav-theme type churn** → RN nav's `Theme` type requires the full `colors` set;
  spreading `DefaultTheme`/`DarkTheme` supplies the rest, so `tsc` enforces completeness.
- **Native splash literal asymmetry** → unchanged posture: one pre-JS literal that can't
  read tokens; re-tinted to the brand pink, documented as the existing scheme-asymmetry
  exemption (splash section), not new debt.

## Migration Plan

Additive/removal + repoint; rollback = revert. Order: ① remove web files + config +
deps + lockfile + `Fonts.web` + `global.css` import (D1/D2) → ② C1 scheme seam in
`_layout.tsx` (D3) → ③ add `primary` brand token + re-verify/ document contrast pairs +
re-tint native splash (D5) → ④ C2 tokenized nav theme + `buildNavTheme` helper (D4) → ⑤
remove `BottomTabInset` (D6) → ⑥ extend `theme.test.tsx` (D8) → ⑦ ADRs 007/008 + index +
Architecture Book ("Theming & native-chrome", "Scaffold-time rules") + changelog. Gate on
`npx tsc --noEmit`, `npm run lint`, `npm test`, `npx expo prebuild --clean`.

## Open Questions

None blocking. Deferred (recorded, not built): the in-app theme override / switcher and
override persistence (Settings, Phase 1.5, MMKV seam); a `primaryStrong`/button token
(first white-text-on-brand consumer — D5); the runtime/CI contrast checker (theming D5
trigger stands); the `@expo/ui` wrapper body (theming D6 stands).
