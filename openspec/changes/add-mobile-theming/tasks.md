## 1. Token layer (`src/theme/`)

- [x] 1.1 Create `src/theme/tokens.ts`: move the Expo-template tokens out of `src/constants/theme.ts` — `Colors` (light/dark records), `Spacing`, `Fonts`, and the layout constants (`BottomTabInset`, `MaxContentWidth`) — keeping `ThemeColor` derived from `Colors`. Add `radii` (a small typed radius scale) so radius is a token, not a magic number; keep all values `as const`.
- [x] 1.2 Document the **WCAG-AA contrast pairs** in `src/theme/tokens.ts` (a commented, structured list of foreground-on-background pairings per scheme, e.g. `text`/`background`, `textSecondary`/`backgroundElement`, selected states) — each verified AA at authoring time. This is the artifact the DoD's manual contrast review checks against (design D5).
- [x] 1.3 Move `useTheme` to `src/theme/use-theme.ts` (resolves `Colors` by the `@/hooks/use-color-scheme` wrapper, unchanged logic). Re-export `useTheme` and the public token surface from `src/theme/index.ts` so call sites import `@/theme`.
- [x] 1.4 Delete `src/constants/theme.ts` and `src/hooks/use-theme.ts` after repointing (step 2); keep `src/hooks/use-color-scheme{,.web}.ts` (scheme detection, not tokens). Confirm `@/global.css` side-effect import is preserved (it moved out of `constants/theme.ts` — re-add it where the token module loads, or keep it imported from `_layout.tsx`).

## 2. Repoint existing consumers (no behavior change)

- [x] 2.1 Repoint `src/components/themed-text.tsx` and `src/components/themed-view.tsx` at `@/theme` (import source only — props, `type→style`, and the `type→accessibilityRole="header"` mapping unchanged; design D2).
- [x] 2.2 Repoint every other `@/constants/theme` consumer (`(tabs)/profile.tsx`, `app-tabs.web.tsx`, and any found by grep) at `@/theme`.
- [x] 2.3 Confirm `src/components/themed-text.test.tsx` (the a11y heading-role proof) still passes **unmodified** — it is the regression guard for D2.

## 3. Native-chrome wrapper seam (`src/components/chrome/`)

- [x] 3.1 Create `src/components/chrome/native-tabs.tsx`: the single import site for `expo-router/unstable-native-tabs`; wrap/re-export `NativeTabs` (+ the `.Trigger` / `.Trigger.Label` / `.Trigger.Icon` parts the app uses), sourcing tab-bar colors from `@/theme` so consumers stop reaching into the raw color map.
- [x] 3.2 Create `src/components/chrome/glass-surface.tsx`: the single import site for `expo-glass-effect`; centralize the degradation decision — `isLiquidGlassAvailable()` → `GlassView`, else a plain themed `View` rendering the same children (design D3; baseline iOS 26+ glass / iOS 16.4–25 + Android + web + Jest → fallback).
- [x] 3.3 Create `src/components/chrome/index.ts`: barrel exporting the wrappers, with a documented thin pass-through note for `@expo/ui` describing where its wrapper goes when the first consumer arrives (no `@expo/ui` component rendered now — design D6, R-2).
- [x] 3.4 Repoint `src/app/(tabs)/_layout.tsx`'s `app-tabs.tsx` to use `@/components/chrome` (native-tabs wrapper) + `@/theme`; drop its direct `expo-router/unstable-native-tabs` and raw `Colors` imports.

## 4. Encode the swappability boundary (lint, R-1)

- [x] 4.1 In `mobile/eslint.config.js`, add `no-restricted-imports` patterns banning `expo-router/unstable-native-tabs`, `expo-glass-effect`, and `@expo/ui` (+ subpaths) with a message naming the `@/components/chrome` seam; carve out `src/components/chrome/**` (mirror the `mutator-owns-fetch` exemption shape). Record the caveat (static-import-only, not dynamic-import evasion) for the Architecture Book.
- [x] 4.2 Verify the rule bites: a temporary direct import outside `chrome/` fails `npm run lint`; remove the probe.

## 5. CI proof test (mirrors i18n/a11y/firebase, R-1)

- [x] 5.1 Create `src/theme/theme.test.tsx`: assert `useTheme` resolves a token to its expected **light** value and its expected **dark** value (drive `useColorScheme`'s two states), and assert `GlassSurface` renders its children without throwing in Jest (the fallback path). Keep minimal — proves resolution + wrapper render, not constant existence.

## 6. Local verification (gates)

- [x] 6.1 `npx tsc --noEmit` clean in `mobile/`.
- [x] 6.2 `npm run lint` clean in `mobile/` (`--max-warnings 0`; the new chrome-boundary rule passes — only `chrome/` imports the alpha APIs).
- [x] 6.3 `npm test` green in `mobile/` (theming proof + the unchanged themed-text a11y proof + existing suites).

## 7. Docs (R-1 pointers + ownership)

- [x] 7.1 Add a "Theming & native-chrome" section to `.claude/rules/mobile/architecture.md`: the token layer (`src/theme/`, light/dark via `useTheme`, tokens-as-types), the wrapper seam (`src/components/chrome/`, one wrapper per alpha surface, the centralized glass degradation), the **alpha-churn caveat** (why the seam exists — the roadmap insurance), the lint boundary as the R-1 enforcement (with the static-import-only caveat), and **contrast ownership** (the documented AA token pairs; runtime checker deferred with trigger). Update the Lint & format "Rule inventory" with the chrome-boundary rule and the a11y section's "contrast" deferral note to point here.
- [x] 7.2 Append an entry to `.claude/rules/mobile/architecture-changelog.md` (Live section).
- [x] 7.3 Mark step 10 done in `docs/react-native-migration/01-roadmap/01-foundation.md` with a one-line summary.

## 8. Validate

- [x] 8.1 `openspec validate add-mobile-theming --strict` passes.
