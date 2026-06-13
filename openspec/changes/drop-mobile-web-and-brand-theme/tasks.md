# Tasks — drop web target + tokenized nav theme + pink brand hue

> Before writing any code, read the Expo SDK 56 docs (https://docs.expo.dev/versions/v56.0.0/)
> per `mobile/AGENTS.md`. All work is in the `mobile/` standalone project and the
> `.claude/rules/mobile/` Architecture Book. Native projects are CNG/gitignored.

## 1. Drop the web target (design D1, D2)

- [x] 1.1 Delete the four web-only files: `mobile/src/components/app-tabs.web.tsx`,
  `mobile/src/hooks/use-color-scheme.web.ts`, `mobile/src/global.css`,
  `mobile/assets/images/favicon.png`.
- [x] 1.2 In `mobile/app.config.ts`, remove the entire `web: { output: "static", favicon: ... }`
  block.
- [x] 1.3 In `mobile/package.json`, remove the `"web": "expo start --web"` script and the
  `react-dom` + `react-native-web` dependencies; regenerate `package-lock.json`
  (`npm install` in `mobile/`) so the tree stays consistent.
- [x] 1.4 In `mobile/src/theme/tokens.ts`, remove the `web:` branch of the `Fonts`
  `Platform.select` — **keep `ios` and `default`** (`Fonts.mono` is still consumed by
  `themed-text.tsx`, which is owned by a parallel issue and MUST NOT be edited; its
  `Fonts.mono` reference must keep resolving — D2).
- [x] 1.5 In `mobile/src/theme/index.ts`, remove the `import "@/global.css"` side-effect
  (it existed only for the `Fonts.web` CSS vars; with the web branch gone it is orphaned).
- [x] 1.6 Confirm `mobile/src/hooks/use-color-scheme.ts` (`export { useColorScheme } from
  "react-native"`) **stays** as the one-line seam (consistency with the seam pattern; it
  is the single scheme source C1 routes through). Verify no remaining `react-native-web` /
  `react-dom` / `global.css` / `app-tabs.web` reference exists in `mobile/src/` (grep).

## 2. C1 — single color-scheme source (design D3)

- [x] 2.1 In `mobile/src/app/_layout.tsx`, change
  `import { useColorScheme } from "react-native"` to
  `import { useColorScheme } from "@/hooks/use-color-scheme"` so the layout and `useTheme`
  share one scheme seam.

## 3. Brand hue + contrast re-verification (design D5)

- [x] 3.1 In `mobile/src/theme/tokens.ts`, add a `primary` brand token to **both** schemes
  in `Colors`: `light.primary = "#E91E63"` (Flutter `Colors.pink` identity, accent/tint
  usage), `dark.primary = "#FF4081"` (reads on the dark background). Keep `as const`;
  `ThemeColor` picks up the new key automatically.
- [x] 3.2 Update the documented **WCAG-AA contrast pairs** comment block in `tokens.ts` for
  the new brand pairs, with the computed ratios and the usage rule (design D5):
  white-on-`#E91E63` = 4.35:1 (large/UI only, **not** body); white-on-`#C2185B` = 5.87:1
  (the tone white-text-on-brand surfaces MUST use); `#E91E63`-on-white = 4.35:1 (accent/
  large/UI, 3:1 bar); `#FF4081`-on-`#000` = 6.30:1 (dark-scheme brand body, AA). Record
  the rule "white text on brand rides `#C2185B`, the identity pink `#E91E63` is accent/
  tint" so Settings inherits it. Do **not** add an unused `primaryStrong`/button token
  (R-2 — earned by the first white-text-on-brand consumer).
- [x] 3.3 In `mobile/app.config.ts`, re-tint the native splash `backgroundColor` from
  `#208AEF` to the brand pink `#E91E63`; keep/refresh the comment documenting it as the
  single pre-JS literal that can't read tokens (the scheme-asymmetry exemption stands).

## 4. C2 — tokenize the React Navigation theme (design D4)

- [x] 4.1 Add a pure `buildNavTheme(scheme: "light" | "dark")` helper (e.g. in
  `mobile/src/theme/nav-theme.ts`, re-exported from `@/theme`) that spreads the stock RN
  nav `DefaultTheme` (light) / `DarkTheme` (dark) and overrides `colors.background`,
  `colors.card`, `colors.text`, `colors.border`, `colors.primary` from `@/theme` tokens
  per the D4 mapping table. Keep it a pure function (no hooks) so the test can call it
  without rendering the route tree (routes-not-importable rule).
- [x] 4.2 In `mobile/src/app/_layout.tsx`, feed `ThemeProvider` the result of
  `buildNavTheme(...)` keyed on the C1-resolved scheme, replacing the stock
  `DefaultTheme` / `DarkTheme`. Import `DefaultTheme`/`DarkTheme` only inside the helper if
  it lives in `@/theme`.

## 5. B1 — remove the unused `BottomTabInset` token (design D6)

- [x] 5.1 Remove `BottomTabInset` from `mobile/src/theme/tokens.ts` and its re-export in
  `mobile/src/theme/index.ts`. Keep `Radii` and `MaxContentWidth`. Verify (grep + `tsc`)
  nothing imports `BottomTabInset`.

## 6. Test — extend the proof (design D8)

- [x] 6.1 In `mobile/src/theme/theme.test.tsx`: keep the light/dark `useTheme`
  `background`/`text` assertions and the `GlassSurface` fallback render; add (a) a brand
  `primary` light/dark resolution assertion, and (b) a `buildNavTheme` assertion that
  `colors.background` and `colors.primary` equal the scheme-appropriate `@/theme` tokens
  for both light and dark (the D4 nav↔token contract — not a tautology over constants).
  Remove any `BottomTabInset` reference if present.

## 7. Local verification (gates — design D7)

- [x] 7.1 `npx tsc --noEmit` clean in `mobile/` (token shape incl. `primary`, nav-theme
  type, no dangling web/`BottomTabInset` imports).
- [x] 7.2 `npm run lint` clean in `mobile/` (`expo lint --max-warnings 0`; no orphaned
  imports, no literal strings).
- [x] 7.3 `npm test` green in `mobile/` (extended theming proof + the unchanged
  themed-text a11y proof + existing suites).
- [x] 7.4 `npx expo prebuild --clean` succeeds in `mobile/` (native config changed: `web`
  block removed, splash `backgroundColor` changed — must regenerate cleanly).

## 8. ADRs (R-4 — two load-bearing decisions)

- [x] 8.1 Add `.claude/rules/mobile/decisions/007-drop-web-target.md` (from `TEMPLATE.md`):
  context (iOS+Android-only scope; web is unused Expo-template default), decision (drop
  the web target wholesale), consequences (removed deps/files; native app unaffected;
  rollback = revert), revisit-if (a real web roadmap appears). Status: Accepted.
- [x] 8.2 Add `.claude/rules/mobile/decisions/008-brand-color.md` (from `TEMPLATE.md`):
  context (off-brand blue scaffold; Flutter brand is pink), decision (adopt the pink
  **hue** as the `primary` token — `#E91E63` identity / `#FF4081` dark — **R-3 caveat:
  hue + neutral intent only, no Material widget port**), consequences (white-text-on-brand
  rides `#C2185B` per the contrast rule; nav theme + splash tint from the brand; future
  features inherit the token + contrast pairs), revisit-if (a designer-driven palette
  change, or a brand-color contrast failure on a real surface). Status: Accepted.
- [x] 8.3 Add the two rows (007, 008) to `.claude/rules/mobile/decisions/README.md` index.

## 9. Architecture Book + changelog (R-1 pointers)

- [x] 9.1 Update `.claude/rules/mobile/architecture.md` "Theming & native-chrome": the
  brand `primary` token (hue, two tones, accent-vs-white-text usage), the tokenized RN nav
  theme (`buildNavTheme`, the D4 mapping, nav-can't-drift-from-tokens), the **re-verified**
  contrast pairs (the brand pairs + the white-text-rides-`#C2185B` rule), the single
  color-scheme seam (C1), and **`BottomTabInset` removed**. Link the two new ADRs.
- [x] 9.2 Update `.claude/rules/mobile/architecture.md` "Scaffold-time rules": the **web
  target is dropped** — adjust the runtime-baseline / project-placement / `Fonts` mentions
  that reference web (the app is iOS+Android only). Link ADR 007.
- [x] 9.3 Append one entry to `.claude/rules/mobile/architecture-changelog.md` (end of the
  Live section): web target dropped, single scheme seam (C1), tokenized nav theme (C2),
  pink brand token + re-verified contrast, `BottomTabInset` removed, ADRs 007/008.
- [x] 9.4 If `docs/react-native-migration/01-roadmap/01-foundation.md` references a web
  target anywhere, add a one-line note that it is dropped (the foundation steps don't track
  a web target — verified; skip if no mention).

## 10. Validate

- [x] 10.1 `openspec validate drop-mobile-web-and-brand-theme --strict` passes.
