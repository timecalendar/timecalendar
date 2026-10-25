# Tasks

All commands run in `mobile/` unless stated. Commit plan: **commit A** = §1, test-only
calendar fixture fix. **Commit B** = §2–§7, tokens, lint, evidence and docs.

## 1. Fixture test is zone and date independent (commit A, design D7)

- [x] 1.1 Confirm the failure before the fix:
      `TZ=Europe/Paris npx jest src/features/calendar/ui/calendar-screen.test.tsx -t "deterministic accessibility fixture"`
      fails with "Unable to find an element with role: button, name: /^Fixture probe-late,/".
- [x] 1.2 In `src/features/calendar/ui/calendar-screen.test.tsx`: import
      `ACCESSIBILITY_PROBE_ANCHOR` alongside `recordAccessibilityProbeDiagnostic` (the module mock
      spreads `actual`, so the constant passes through). In the test "runs the deterministic
      accessibility fixture only on the development route", call `setTimezonePreference("UTC")`
      and `mockUseCalendarClock.mockReturnValue(ACCESSIBILITY_PROBE_ANCHOR)` before `render`. Add
      `remove(SETTINGS_KEYS.timezone)` to the top-level `beforeEach`. Do NOT use
      `jest.useFakeTimers`/`setSystemTime` and do NOT touch `process.env.TZ`. Verify: the whole
      file passes under each of `TZ=Europe/Paris`, `TZ=UTC` and `TZ=America/Los_Angeles`.
- [x] 1.3 Commit A alone (`test(mobile): pin the calendar accessibility fixture to UTC`).

## 2. Tokens (design D1, D2)

- [x] 2.1 `src/theme/tokens.ts`: insert `twoHalf: 12` (after `two`) and `fiveHalf: 48` (after
      `five`) into `Spacing`. Add `MinTouchTarget = Platform.select({ ios: 44, default: 48 })`,
      `IconSize { small: 14, medium: 17, large: 22, xlarge: 28 }`,
      `StateOpacity { pressed: 0.65, disabled: 0.55 }`,
      `Elevation { raised: { light: "0 2px 6px rgba(0,0,0,0.16)", dark: "0 2px 6px rgba(0,0,0,0.5)" } }`,
      `Motion { fast: 150, base: 250, slow: 400 }`, `Layout { fabClearance: 96 }`, all `as const`.
      Verify: `npx tsc --noEmit` clean.
- [x] 2.2 Add `outline` (`#7C7F87` light / `#80838D` dark) and `scrim` (`#00000066` light /
      `#00000099` dark) to `Colors.light` and `Colors.dark`. Verify: `ThemeColor` includes both
      (tsc: `const _: ThemeColor = "outline"` compiles in the test).
- [x] 2.3 `src/theme/index.ts`: export `Elevation`, `IconSize`, `Layout`, `MinTouchTarget`,
      `Motion`, `StateOpacity` (sorted; `simple-import-sort/exports` passes). Verify: `npm run lint`.
- [x] 2.4 Update the `tokens.ts` contrast block. (a) Add an OUTLINE section listing the six
      `outline` pairs with computed ratios (light 4.01 / 3.52 / 3.07, dark 5.55 / 4.20 / 3.45 on
      `background` / `backgroundElement` / `backgroundSelected`), against the WCAG 1.4.11 3:1
      bar. (b) Add `scrim` to the NON-TEXT list: an overlay with no foreground and no contrast
      obligation. (c) Replace every written ratio with the two-decimal value the test helper
      computes (design Context lists the known-wrong ones). (d) Replace "There is no runtime/CI
      checker" with a line naming `src/theme/theme.test.tsx` as the gate, plus "a pair added here
      needs a row in its `documentedPairs` table". Describe the current state only. Verify: every
      ratio in the block equals the test's computed value (cross-check by printing the table once
      locally).

## 3. Token proof in `theme.test.tsx` (design D3)

- [x] 3.1 Add the `contrastRatio(fg, bg)` helper (WCAG 2.x relative luminance; throws on non-6-digit
      hex) and calibration cases: `#000000`/`#ffffff` → 21; `onPrimary` on `primaryStrong` → 5.87;
      light `primary` on `background` → 4.35 (`toBeCloseTo(x, 2)`). Plus one case asserting it
      throws for `Colors.light.scrim`.
- [x] 3.2 Add the typed `documentedPairs` table (`scheme`, `foreground: ThemeColor`,
      `background: ThemeColor`, `floor: "body" | "ui"`) covering every opaque pair in the
      `tokens.ts` block (text/textSecondary on the neutral surfaces, homeHero pairs, brand pairs,
      `actionText`, `error`, `destructive`, `positive`, `informational`, `logoSurface` on dark
      `background`) plus the six `outline` rows (all `ui`). Use `describe.each` to assert
      `>= 4.5` for body and `>= 3` for ui. Verify: passes, and temporarily setting
      `Colors.light.outline` to `#C6C6C8` makes the outline rows fail (revert; record in
      `evidence.md` §C).
- [x] 3.3 Value tests: `useTheme()` resolves `outline` and `scrim` to the light and then the dark
      value. `Spacing` keeps every pre-existing key/value and adds `twoHalf` 12 / `fiveHalf` 48.
      `IconSize`, `StateOpacity`, `Motion` and `Layout.fabClearance` equal design D1.
      `Elevation.raised.light !== Elevation.raised.dark`, and both match
      `/^0 2px 6px rgba\(0,0,0,0\.\d+\)$/`. `MinTouchTarget` is 44 under `Platform.OS = "ios"`
      and 48 under `"android"`, using `jest.isolateModules` + `require("@/theme/tokens")`, with
      `Platform.OS` restored in `finally` (no fake timers).
- [x] 3.4 Verify: `npx jest src/theme --coverage --collectCoverageFrom='src/theme/**'` passes
      and `tokens.ts` has 100% branch coverage.

## 4. Lint L1, device color scheme only in the seam (design D4)

- [x] 4.1 `eslint.config.js`: add `deviceColorSchemeImportPath` (`name: "react-native"`,
      `importNames: ["useColorScheme", "Appearance"]`, the D4 message). Add a
      `banDeviceColorScheme = true` flag to `restrictedImports` that appends it to `paths`. Add the
      block `timecalendar/color-scheme-seam` (`files: ["src/hooks/use-color-scheme.ts"]`,
      `restrictedImports([routeEntrypointImportPattern], { banDeviceColorScheme: false })`)
      after `export-guide-seam`, with a comment explaining why the route pattern is re-included.
- [x] 4.2 `src/hooks/use-color-scheme.test.ts`: remove the `react-native` `useColorScheme`
      import. Drive the device scheme through a factory-assigned `mockDeviceScheme = jest.fn()`
      (`RN.useColorScheme = (...args) => mockDeviceScheme(...args)` inside the existing
      `jest.mock("react-native", …)`; keep the mutate-not-spread comment). Verify: the test file
      passes and `npm run lint` is clean.
- [x] 4.3 Confirm zero remaining hits:
      `grep -rnE "import[^;]*\b(useColorScheme|Appearance)\b[^;]*from \"react-native\"" src jest`
      matches only `src/hooks/use-color-scheme.ts`. Record the output in `evidence.md` §A.

## 5. Lint L8, font scaling never disabled (design D5)

- [x] 5.1 `eslint.config.js`: add the `restrictedSyntax` constant (the two D5 selectors + message,
      with a comment saying any block re-setting `no-restricted-syntax` must spread it). Add
      `"no-restricted-syntax": ["error", ...restrictedSyntax]` to `timecalendar/architecture`.
      Verify: `npm run lint` clean (the tree has no hits).
- [x] 5.2 Confirm zero hits: `grep -rn "allowFontScaling" src` returns only the two
      `not.toBe(false)` test assertions (`splash-screen.test.tsx`, `error-surfaces.test.tsx`) and
      the `empty-state.test.tsx` prop check. Record in `evidence.md` §B.

## 6. Inject-and-revert evidence (the R-1 proof for each rule)

Create `openspec/changes/mobile-ds-tokens-lint/evidence.md` with sections A (L1), B (L8) and
C (contrast gate). For each probe, paste the exact edit, the trimmed `npx eslint <file>` (or
`npx jest`) output showing the error and rule id, and the clean re-run after reverting.
Probes must not be committed.

- [x] 6.1 **L1 base:** `import { useColorScheme } from "react-native"` in
      `src/features/home/ui/today-timeline.tsx` → error with the seam message. Revert.
- [x] 6.2 **L1 Appearance in an override block:** `import { Appearance } from "react-native"` in
      a `src/components/chrome/` file (chrome-seams block) → error. Revert.
- [x] 6.3 **L1 in the add-a-ban block:** the same import in a `src/features/calendar-sources/`
      file (B-6 block) → error. Revert.
- [x] 6.4 **L1 namespace + re-export:** `import * as RN from "react-native"` and
      `export { Appearance } from "react-native"` in a feature file → both error. Revert.
- [x] 6.5 **L1 seam negative + inherited ban in the seam block:** `npx eslint
      src/hooks/use-color-scheme.ts` is clean. Then inject `import "react-native-mmkv"` there →
      still errors (the seam block did not drop the storage ban). Inject an `@/app/...` import →
      still errors (route pattern re-included). Revert.
- [x] 6.6 **L8 JSX:** `<Text allowFontScaling={false}>` in a feature `ui/` file → error with the
      L8 message. Revert.
- [x] 6.7 **L8 object form:** `const textProps = { allowFontScaling: false }` in a feature file →
      error. **Negative:** `maxFontSizeMultiplier={1.3}` stays clean. Revert.
- [x] 6.8 **L8 in a test file:** `allowFontScaling={false}` in a `*.test.tsx` → error (no test
      exemption). Revert.
- [x] 6.9 **Contrast gate:** the §3.2 outline mutation (record here). Revert.
- [x] 6.10 After all reverts, `git status` shows no stray probe edits under `src/`.

## 7. Architecture Book (current state only, no history narration)

- [x] 7.1 `docs/mobile/architecture-book/theming.md` "Token layer": list the new tokens and their
      intent (`MinTouchTarget` resolves per platform at module load, `StateOpacity.pressed` is iOS
      only because Android uses ripple, `Elevation` is `boxShadow` strings per scheme and never
      legacy `shadow*`, `Motion` consumers own reduced motion, `Layout.fabClearance`), plus
      `outline` (3:1 boundary role) and `scrim` (overlay, no obligation). Update the `index.ts`
      public-surface list. In "Single color-scheme seam (C1)", state that it is lint-enforced
      (L1, `timecalendar/color-scheme-seam`). Rewrite "Contrast" and "What CI proves" so
      `theme.test.tsx` computes every documented opaque pair against its floor (the
      `documentedPairs` table). Call-site placement stays the DoD's manual review. Replace the
      "No runtime/CI contrast checker" deferred item with the remaining gap (a call-site checker;
      trigger unchanged).
- [x] 7.2 `docs/mobile/architecture-book/lint-format.md`: add `timecalendar/color-scheme-seam`
      to the block list. Add rule-inventory bullets for L1 (the `banDeviceColorScheme` flag inside
      `restrictedImports`, why the seam block re-includes the route pattern, the static-import-only
      caveat) and L8 (the two selectors, no exemption, and the `restrictedSyntax` re-spread caveat
      for any future `no-restricted-syntax` block). Each bullet points at its config block.
- [x] 7.3 `docs/mobile/architecture-book/accessibility.md`: move font scaling into "What lint
      enforces" (L8, `no-restricted-syntax`, both forms, no exemption). Record that
      `maxFontSizeMultiplier` caps are allowed, list where they live (calendar view menu 1.3,
      calendar screen header 1.75, owned canvas 1.2, owned header 1/1.2), and name the
      accessibility workstream as owner of whether the `={1}` header caps stay. Remove the
      Dynamic-Type guard from "What lint can't encode" and "Deferred". In "Color contrast", say
      the token pairs are computed in `theme.test.tsx`.
- [x] 7.4 `docs/mobile/architecture-book/CHANGELOG.md`: add a newest-first
      `## 2026-10-25 — Design-system tokens, color-scheme and font-scaling lint` entry, with bullets
      for the token additions, the CI-computed contrast pairs, L1, L8 and the touched files
      (`theming.md`, `lint-format.md`, `accessibility.md`).
- [x] 7.5 `docs/mobile/design-system-audit/migration-roadmap.md` is exploration, not rules: leave
      it unchanged.

## 8. Verify (DoD)

- [x] 8.1 `npx tsc --noEmit` clean.
- [x] 8.2 `npm run lint` (`--max-warnings 0`) clean.
- [x] 8.3 `npm test -- --coverage` green under the CI zone (`TZ=UTC npm test -- --coverage`), with
      the 90% per-file branch gate passing.
- [x] 8.4 `npm test` once with the machine zone (no `TZ=UTC`; Europe/Paris on the owner machine):
      green. Record the zone and the summary line in `evidence.md`.
- [x] 8.5 `npm run react-doctor:changed` reports no new findings.
- [ ] 8.6 `openspec validate mobile-ds-tokens-lint` passes. CI `test-mobile` is green on the PR,
      and the PR body links `evidence.md`.
