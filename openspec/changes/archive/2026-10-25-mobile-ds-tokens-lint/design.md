# Design

## Context

See proposal.md (Why). The current state that shapes the approach:

- `mobile/src/theme/tokens.ts` holds `Colors` (22 roles × light/dark), `Fonts`, `Spacing`,
  `Radii` and `MaxContentWidth` as `as const` records. A long comment block documents the
  contrast pairs with hand-computed ratios. Recomputing them (WCAG 2.x relative luminance) shows
  every pair clears its floor, but several written ratios are off: `textSecondary` on
  `background` is 5.94, not 5.3; on `backgroundElement` it is 5.22, not 4.6; dark `textSecondary`
  on `backgroundElement` is 7.64, not 7.9; light `destructive` on `backgroundElement` is 5.75, not
  5.3; dark `text` on `backgroundSelected` is 13.07, not 13.6. Nothing in CI checks them.
- `src/theme/index.ts` re-exports a named list. Call sites import `@/theme`.
- `@/hooks/use-color-scheme` is the C1 seam. A grep of `mobile/` finds `react-native`'s
  `useColorScheme` imported in exactly two files: the seam and its colocated test. `Appearance`
  is imported nowhere. **L1 has no violations to fix.**
- A grep finds no `allowFontScaling={false}`. **L8 has no violations to fix.**
  `maxFontSizeMultiplier` caps exist at `calendar-view-menu.tsx` (1.3),
  `calendar-screen-header.tsx` (1.75), `owned-calendar-canvas.tsx` (1.2) and
  `owned-calendar-header.tsx` (1, 1.2, 1). The value 1 is effectively "no scaling" for the dense
  date numerals in the owned renderer's header, and `owned-calendar-shell.test.tsx` asserts it.
- `eslint.config.js`: `restrictedImports(extraPatterns, flags)` builds every
  `no-restricted-imports` config. Seven blocks re-call it, and flat config replaces options
  rather than merging them, so a new ban must live inside `restrictedImports` to reach every
  block. No block sets `no-restricted-syntax` today.
- `calendar-screen.test.tsx` › "runs the deterministic accessibility fixture only on the
  development route" fails under `TZ=Europe/Paris`. The probe fixture
  (`src/test-support/owned-calendar/accessibility-probe.ts`) is UTC-anchored: `probe-late` is
  `2026-06-15T23:00Z`, which is 01:00 on 06-16 in Paris, so it leaves the 06-15 day page.
  `jest/setup-localization.ts` makes the "system" display zone equal to the machine zone. CI
  runs under UTC, so it never sees this. The test also reads the real clock
  (`mockUseCalendarClock.mockReturnValue(new Date())` in `beforeEach`), which ties the outcome to
  the run date. Planning verified that calling `setTimezonePreference("UTC")` in that one test
  makes it pass under `TZ=Europe/Paris`.

## Goals / Non-Goals

**Goals:**

- Ship the slice-1.4 tokens exactly as proposal §1 specifies, typed and re-exported, with the
  contrast posture computed in CI rather than only written down.
- Encode L1 and L8 so that a violation fails `npm run lint`, and prove each rule fires
  (inject-and-revert) in every block shape that re-sets the rule.
- Make the accessibility-fixture test independent of zone and date.

**Non-Goals:**

- No consumer migration. Hand-written `44`/`48`, opacities, shadows and `rgba(0,0,0,0.4)` stay
  until phase 3/5 primitives replace them, and the L5/L7 style-literal lint (phase 4) enforces
  the tokens.
- No type ramp (slice 1.5), no `listSurface`, no `onEventColor` helper, no `@/design` barrel.
- No `maxFontSizeMultiplier` floor (see D6).
- No change to the probe fixture or the production probe route.

## Decisions

### D1 — Token shapes follow the proposal sketch verbatim

`Spacing` gains `twoHalf: 12` between `two` and `three` and `fiveHalf: 48` between `five` and
`six`. Every existing key and value is unchanged (315 call sites). `MinTouchTarget` is
`Platform.select({ ios: 44, default: 48 })`, resolved at module load like `Fonts`. `IconSize`,
`StateOpacity`, `Motion` and `Layout` are flat `as const` records. `Elevation` is
`{ raised: { light, dark } } as const` with the proposal's strings
(`"0 2px 6px rgba(0,0,0,0.16)"` / `"0 2px 6px rgba(0,0,0,0.5)"`), so a consumer picks
`Elevation.raised[scheme]` and passes it to the RN `boxShadow` style prop (RN 0.85, New
Architecture). All are exported from `@/theme`.

*Alternatives:* folding elevation into `Colors` (rejected: it is not a color and would widen
`ThemeColor`, so every `themeColor` prop would accept a shadow); a `useElevation()` hook
(rejected: no consumer yet, R-2); renaming `Spacing` to a numeric scale (rejected: 315 call
sites, and the proposal is explicitly additive).

*Name note:* `Layout` also exists as a deprecated Reanimated export. A file needing both aliases
one at import. No current file does, and the proposal name is kept.

### D2 — `outline` and `scrim` values

| Role | Light | Dark | Proof |
| --- | --- | --- | --- |
| `outline` | `#7C7F87` | `#80838D` | light: 4.01 on `background`, 3.52 on `backgroundElement`, 3.07 on `backgroundSelected`. Dark: 5.55 / 4.20 / 3.45 |
| `scrim` | `#00000066` (black 40%) | `#00000099` (black 60%) | non-text overlay, no contrast obligation |

`outline` is a neutral gray in the existing slate family (`textSecondary` `#60646C` /
`#B0B4BA`), not M3's purple-tinted `#79747E`, so it sits with the palette. Light is chosen as the
lightest slate that still clears 3:1 against the darkest light surface (`backgroundSelected`,
which is where a field sits inside a selected container). Dark gets more margin because dark
surfaces span a narrower luminance range. `scrim` light matches the 0.4 black in
`owned-calendar-chooser.tsx`, so phase 5 migrates it without a visual change. Dark is heavier
because a 40% black wash barely changes `#000`/`#212225` surfaces. Values use the 8-digit hex form
that `primarySoft`/`ripple` already use.

*Alternatives:* `outline` = `separator` (rejected: `#C6C6C8` on white is 1.7:1, which fails
1.4.11); one value for both schemes (rejected: theming.md "Light and dark are equal designs").

### D3 — Contrast is computed in `theme.test.tsx` from a typed pair table

The test file holds a `contrastRatio(foreground, background)` helper (WCAG 2.x relative
luminance on 6-digit hex; it throws on alpha hex so a translucent token cannot be "proven" by
accident) and a `documentedPairs` table. Each row is
`{ scheme, foreground: ThemeColor, background: ThemeColor, floor: "body" | "ui" }`, and keying on
`ThemeColor` makes a renamed token a `tsc` error. A `describe.each` asserts `ratio >= 4.5` (body)
or `>= 3` (ui) for every row. The table covers every opaque pair in the `tokens.ts` block, plus
`outline` on `background`/`backgroundElement`/`backgroundSelected` in both schemes. Pair rows
whose foreground is a literal in the comment (white-on-`#E91E63`, `#fff` on `#000` for
`logoSurface`) map to tokens (`onPrimary` on `primary`, `logoSurface` on `background`). The
helper is calibrated in the same file against known values: `#000`/`#fff` = 21, `onPrimary` on
`primaryStrong` ≈ 5.87, `primary` light on `background` ≈ 4.35 (to two decimals).

The `tokens.ts` comment block keeps the human-readable pair list, with every ratio corrected to
the computed two-decimal value. It names `theme.test.tsx` as its gate, so the prose links to the
enforcement (Principle 1). A pair added to the comment without a test row is caught in review.
That is the one remaining manual link, recorded in theming.md.

*Alternatives:* move the pair table into `tokens.ts` as exported data (rejected: no runtime
consumer, so bundle weight for documentation, and it rewrites the whole block in a slice sized S);
a separate `contrast.ts` production helper (rejected: R-2, no consumer); asserting the exact
documented numbers (rejected: comments cannot be read by the test, and floors are the contract).

### D4 — L1 lives inside `restrictedImports` behind a `banDeviceColorScheme` flag

A new `deviceColorSchemeImportPath`
(`{ name: "react-native", importNames: ["useColorScheme", "Appearance"], message }`) is appended
to `paths` when `banDeviceColorScheme` (default `true`) is set. Because every block builds its
config through `restrictedImports`, the ban reaches the storage, chrome, Activity, export-guide
and calendar-sources blocks automatically. A new block `timecalendar/color-scheme-seam`
(`files: ["src/hooks/use-color-scheme.ts"]`) sits after the existing seam blocks and calls
`restrictedImports([routeEntrypointImportPattern], { banDeviceColorScheme: false })`. The
route-entrypoint pattern is re-included because `routes-not-importable` also matches that file,
and dropping it there would silently lift the `@/app` ban (the lint-format.md re-call caveat).
ESLint's `importNames` also reports `import * as RN from "react-native"` and
`export { useColorScheme } from "react-native"`. The tree has no namespace imports of
`react-native` (only `require()` inside `jest.mock` factories, which the rule does not inspect).

Message: "Read the color scheme through @/hooks/use-color-scheme — it resolves the Settings theme
override (C1). react-native's useColorScheme/Appearance are imported only inside
src/hooks/use-color-scheme.ts."

The seam's test, `use-color-scheme.test.ts`, drops its `import { useColorScheme as
useDeviceColorScheme } from "react-native"`. It holds a `mockDeviceScheme = jest.fn()` assigned
inside the existing `jest.mock("react-native", …)` factory (`RN.useColorScheme = (...args) =>
mockDeviceScheme(...args)`; the `mock` prefix satisfies babel-jest hoisting). That leaves exactly
one exempt file.

*Alternatives:* exempting `**/*.test.*` (rejected: a test that reads the device hook directly
bypasses the seam it should be exercising, and a blanket exemption is a hole); a `boundaries`
rule (rejected: `boundaries` classifies files, not named bindings of an external package); a
separate block that adds only the new path (rejected: flat-config replacement would erase every
other ban, the exact failure B-6's comment documents).

*Caveat (lint cannot carry):* `require("react-native").Appearance` and
`jest.requireActual("react-native")` are not static imports. As with the raw-fetch and chrome
bans, this guards against accidents, and review covers deliberate evasion.

### D5 — L8 is a `no-restricted-syntax` pair of selectors in the architecture block

The `timecalendar/architecture` block gains `"no-restricted-syntax": ["error",
...restrictedSyntax]`, where `restrictedSyntax` is a named constant:

- `JSXAttribute[name.name='allowFontScaling'][value.expression.value=false]`
- `Property[key.name='allowFontScaling'][value.value=false]`

Both carry the message "Text must follow the OS font size — do not disable allowFontScaling. Cap
dense UI with maxFontSizeMultiplier instead (accessibility.md → Font scaling)." No other block sets
`no-restricted-syntax`, so it applies to every linted file, tests included, with no exemption (as
the proposal says). A comment on `restrictedSyntax` says that any future block re-setting
`no-restricted-syntax` must spread it, the same replacement caveat as `restrictedImports`. The
object-property selector closes the spread-props route
(`<Text {...{ allowFontScaling: false }}>`, shared `textProps` constants) at no cost. A
`TextInput` is covered because the selector is element-agnostic.

*Alternatives:* `react-native/no-...` plugin rules (none exist for this); a local rule (rejected:
two esquery selectors express it fully, and a local rule needs its own RuleTester suite for no
gain).

### D6 — `maxFontSizeMultiplier` is not floored

The proposal's L8 bans only `allowFontScaling={false}`. Every existing cap is in calendar chrome
or the owned renderer (ADR 033 boundary), where dense grids and header numerals are sized to a
cell. Banning `maxFontSizeMultiplier={1}` would force a renderer change outside this slice, and
choosing a floor (1.2? 1.3?) is an accessibility-workstream decision (owner decision 8). The
accessibility.md entry records that caps are allowed, lists where they live, and names the
accessibility workstream as the owner of whether `={1}` in `owned-calendar-header.tsx` stays.

### D7 — The fixture test pins its own zone and clock

Inside the one test, before `render`, it calls `setTimezonePreference("UTC")`, which matches the
fixture's UTC authoring, and `mockUseCalendarClock.mockReturnValue(ACCESSIBILITY_PROBE_ANCHOR)`
(the probe's own anchor, imported from `@/test-support/owned-calendar/accessibility-probe`). The
top-level `beforeEach` adds `remove(SETTINGS_KEYS.timezone)`, so no later test inherits the
preference even if this one throws. The `owned shell` describe has no timezone cleanup today; the
display-zone describe cleans only in its own `afterEach`.

This uses the app's own display-zone seam instead of mutating `process.env.TZ`, which does not
reliably re-resolve the zone inside a running V8, and instead of faking timers, because mid-suite
`jest.useFakeTimers` poisons downstream tests in this harness. The clock pin is a mock return
value, not a timer fake. The fix ships as its own commit (test-only, no product change).
Planning prototyped exactly this edit, then reverted it. All 49 tests in the file passed under
`TZ=Europe/Paris`, `UTC` and `America/Los_Angeles` on 2026-10-25, the Europe/Paris DST change day.

*Alternatives:* rewrite the fixture in device-local time (rejected: the probe route's UTC anchor
is also consumed by `owned-calendar-shell.test.tsx` and `accessibility-projection.test.ts`, which
pass today; changing it widens the blast radius); `TZ=UTC` in the npm `test` script (rejected:
hides every zone bug suite-wide, and the owner runs Jest in Europe/Paris on purpose).

## Risks / Trade-offs

- [The comment block and the test table drift apart] → The comment names the test as its gate,
  theming.md records the add-both rule, and the test's `ThemeColor` keys catch renames.
- [`outline` light is 3.07 on `backgroundSelected`, a thin margin] → It is above the floor, and a
  `backgroundSelected` change re-runs the gate. A field on `backgroundSelected` is rare, and a
  failing row makes any future darkening of that surface visible.
- [`Platform.select` at module load makes `MinTouchTarget` hard to test per platform] → The test
  uses `jest.isolateModules` with `Platform.OS` set before `require("@/theme/tokens")`, then
  restores `Platform.OS` in `finally`.
- [A future block re-sets `no-restricted-syntax` and silently drops L8] → The named
  `restrictedSyntax` constant plus a comment, and lint-format.md carries the caveat. The
  inject-and-revert evidence shows the rule fires today.
- [Other `calendar-screen.test.tsx` cases are zone-sensitive at extreme offsets] → Under
  `TZ=Pacific/Kiritimati` (UTC+14), three other tests fail ("opens synced and personal timed
  tiles by their original UID", "opens each crowded synced and personal semantic identity
  directly", "pages away and back on resident window rows without syncing"). This change does not
  touch them, and they are out of scope: the slice fixes the reported fixture test. Recorded so
  the next zone-hygiene pass starts from evidence, not a rediscovery.
- [Unused tokens look speculative (R-2)] → The audit counts the literal sites each one replaces,
  and phase 3 primitives consume them. Declared additive by the owner-approved roadmap.

## Migration Plan

Additive. Rollback is a revert of the change's commits. No data, native or OTA impact (the RN
app is not in production).
