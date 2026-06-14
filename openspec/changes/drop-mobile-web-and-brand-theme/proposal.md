# Drop the web target + tokenize the nav theme + adopt the pink brand hue

## Why

The mobile app targets **iOS + Android only** (the migration's platform scope —
Architecture Book "Scaffold-time rules → Runtime baseline", ADR [002](../../../.claude/rules/mobile/decisions/002-minimum-os.md)
sets iOS/Android floors and says nothing about web). Yet the Expo SDK 56 template
left a **web target** wired in everywhere it touches: `app.config.ts` has a
`web: { output, favicon }` block, `package.json` carries a `"web"` script plus the
`react-dom` + `react-native-web` deps, `src/theme/tokens.ts`'s `Fonts` has a `web:`
branch (the only reason `src/theme/index.ts` carries the `import "@/global.css"`
side-effect), and there are three web-only files (`app-tabs.web.tsx`,
`use-color-scheme.web.ts`, `global.css`, plus `favicon.png`). This is dead weight on
a two-platform app — unused surface that drags deps, a build target nobody ships, and
a styling path (`global.css` / CSS vars) the native app never executes. It is removed
here, recorded as a load-bearing platform-scope decision (ADR).

Two latent theming gaps surface in the same files and are closed now so the **first
real feature (Settings, Phase-1 Feature A, ADR [004](../../../.claude/rules/mobile/decisions/004-phase-1-feature-order.md))
inherits clean ground**:

- The color-scheme source is **split**: `_layout.tsx` imports `useColorScheme`
  straight from `react-native`, while `useTheme` reads it through the
  `@/hooks/use-color-scheme` wrapper. Two sources can drift; Settings will add a
  light/dark/system override later and must have **one** scheme seam to override.
- The React Navigation chrome is **un-tokenized**: `_layout.tsx` feeds stock
  `DefaultTheme` / `DarkTheme` to `ThemeProvider`, so nav surfaces (header, card,
  border, the active tint) can't follow `@/theme` and will visibly diverge from the
  token palette the moment the brand color lands.

And the scaffold ships an **off-brand blue** (`#208AEF` native splash background) with
no brand token at all. The Flutter app's identity is **pink** (`app/lib/modules/shared/services/theme.dart`:
primary `Colors.pink` = `#E91E63`). Adopting the brand *hue* — not the Flutter
Material specifics (R-3) — gives the app its real identity and a `primary`/brand token
the nav theme and future features tint from. The new white-on-pink and pink-on-white
pairings must be **re-verified against WCAG AA**, discharging the theming change's
recorded contrast posture for the brand pair.

This change builds **no feature UI and no theme switcher** — it prepares the
token/theme ground (brand token, one scheme seam, tokenized nav theme) so Settings
can add the override cleanly, and removes the unused web target. No speculative seams.

## What Changes

- **Drop the web target.** Delete `mobile/src/components/app-tabs.web.tsx`,
  `mobile/src/hooks/use-color-scheme.web.ts`, `mobile/src/global.css`,
  `mobile/assets/images/favicon.png`. Remove the `web: { output, favicon }` block from
  `app.config.ts`. Remove the `"web": "expo start --web"` script and the `react-dom` +
  `react-native-web` dependencies from `package.json`. Remove the `web:` branch of the
  `Fonts` `Platform.select` in `tokens.ts` (keep `ios` / `default` — `Fonts.mono` is
  still consumed by `themed-text.tsx`). Remove the now-orphaned `import "@/global.css"`
  side-effect from `theme/index.ts` (it existed only for the `Fonts.web` CSS vars).
  `src/hooks/use-color-scheme.ts` (`export { useColorScheme } from "react-native"`)
  **stays** as a one-line seam — consistency with the wrapper-seam pattern, and it is
  the single scheme source C1 routes through.
- **C1 — single color-scheme source.** Route `_layout.tsx`'s `useColorScheme` through
  `@/hooks/use-color-scheme` instead of importing it straight from `react-native`, so
  the app has exactly one scheme seam (the one `useTheme` already reads and Settings
  will later override).
- **C2 — tokenize the React Navigation theme.** Build the `ThemeProvider` nav theme
  from `@/theme` tokens — spread the stock `DefaultTheme` / `DarkTheme` and override
  `colors.background` / `card` / `text` / `border` / `primary` from the token set, for
  both light and dark — so nav chrome can't drift from `@/theme`.
- **Adopt the pink brand hue.** Add a `primary` / brand token (pink, aligned to the
  Flutter hue) to `tokens.ts`, with a darker on-text tone for white-on-brand surfaces.
  Re-verify the WCAG-AA contrast for the new foreground/background pairs and document
  the verified ratios in `tokens.ts`. Repoint the native splash `backgroundColor` off
  `#208AEF` to a brand tone. **R-3 caveat:** adopt the brand *hue* + neutral intent;
  keep platform-idiomatic surfaces; do **not** port Material specifics wholesale.
- **B1 — token hygiene.** Keep `Radii` (Settings is its first real consumer). Remove
  the unused `BottomTabInset` token (no consumer) from `tokens.ts` and its re-export in
  `index.ts`.
- **Two ADRs** (next free numbers 007, 008): dropping the web target (platform-scope),
  and the pink brand-hue adoption (align-to-Flutter-hue with the R-3 platform-idiom
  caveat). Both rows added to `decisions/README.md`.
- **Architecture Book + changelog updates** — "Theming & native-chrome" (brand token,
  tokenized nav theme, re-verified contrast pairs, `BottomTabInset` removed) and
  "Scaffold-time rules" (web target dropped — runtime baseline / placement / Fonts) and
  one Rule-changelog entry.
- **Tests stay green** — update `theme.test.tsx` for the token changes; add a nav-theme
  resolution assertion. `npx tsc --noEmit`, `npm run lint`, `npm test` all green;
  `npx expo prebuild --clean` succeeds (native config changed via `app.config.ts`).

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `mobile-theming`: the brand `primary` token enters the token surface and the
  contrast-pair posture (white-on-brand / brand-on-background re-verified to WCAG AA);
  light/dark resolution now flows through a **single** color-scheme seam consumed by
  both `useTheme` and the root layout; the React Navigation chrome is built from theme
  tokens (nav surfaces can't drift from `@/theme`); the web target and the unused
  `BottomTabInset` token are removed from the theme layer.

## Impact

- `mobile/`: deleted web files (`app-tabs.web.tsx`, `use-color-scheme.web.ts`,
  `global.css`, `assets/images/favicon.png`); `tokens.ts` (web `Fonts` branch removed,
  `BottomTabInset` removed, `primary` brand token added, contrast pairs re-verified);
  `theme/index.ts` (`@/global.css` import + `BottomTabInset` re-export removed);
  `app/_layout.tsx` (C1 scheme seam + C2 tokenized nav theme); `app.config.ts`
  (`web` block removed, native splash `backgroundColor` → brand tone);
  `package.json` (`web` script + `react-dom` / `react-native-web` deps removed, lockfile
  regenerated); `theme.test.tsx` updated.
- `.claude/rules/mobile/`: two new ADRs (`007`, `008`) + `decisions/README.md` index
  rows; Architecture Book "Theming & native-chrome" + "Scaffold-time rules" updated;
  one Rule-changelog entry.
- `docs/react-native-migration/01-roadmap/01-foundation.md`: a one-line note if a web
  mention exists (the foundation steps don't track a web target; checked).
- Native projects are CNG/gitignored — regenerated by `expo prebuild --clean`. No
  server / web / `app/` (Flutter) code touched. No feature UI, no theme switcher, no
  `@expo/ui` wrapper, no override persistence (Settings, Phase 1.5).
