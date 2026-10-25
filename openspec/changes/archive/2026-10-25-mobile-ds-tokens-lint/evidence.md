# Evidence — mobile-ds-tokens-lint

All commands run in `mobile/` on 2026-10-25 (Europe/Paris DST change day). Every probe edit was
reverted by restoring a byte copy of the file taken before the edit; none is committed. Output is
trimmed to the rule lines and the summary. Where a summary counts more problems than the rule line
shown, the extra problems are side effects of the probe itself (`react/jsx-no-undef` for an
un-imported `Text`, `import/no-duplicates` for a second `react-native` import, import sort), not
the rule under test.

## A — L1: device color scheme only through `@/hooks/use-color-scheme`

Remaining static imports (task 4.3):

```
$ grep -rnE "import[^;]*\b(useColorScheme|Appearance)\b[^;]*from \"react-native\"" src jest
src/hooks/use-color-scheme.ts:1:import { useColorScheme as useDeviceColorScheme } from "react-native"
```

6.1 base block, 6.2 `chrome-seams` override block, 6.3 `calendar-sources-is-a-leaf` add-a-ban
block, 6.4 namespace import and re-export:

### probe: src/features/home/ui/today-timeline.tsx (prepend)
```
+ import { useColorScheme } from "react-native"
```
```
$ npx eslint src/features/home/ui/today-timeline.tsx
1:10  error    'useColorScheme' import from 'react-native' is restricted. Read the color scheme through @/hooks/use-color-scheme — it resolves the Settings theme override (C1). react-native's useColorScheme/Appearance are imported only inside src/hooks/use-color-scheme.ts  no-restricted-imports
✖ 3 problems (2 errors, 1 warning)
```
```
$ npx eslint src/features/home/ui/today-timeline.tsx   # after revert
exit 0 (0 problem lines)
```

### probe: src/components/chrome/glass-surface.tsx (prepend)
```
+ import { Appearance } from "react-native"
```
```
$ npx eslint src/components/chrome/glass-surface.tsx
1:10  error    'Appearance' import from 'react-native' is restricted. Read the color scheme through @/hooks/use-color-scheme — it resolves the Settings theme override (C1). react-native's useColorScheme/Appearance are imported only inside src/hooks/use-color-scheme.ts  no-restricted-imports
✖ 5 problems (2 errors, 3 warnings)
```
```
$ npx eslint src/components/chrome/glass-surface.tsx   # after revert
exit 0 (0 problem lines)
```

### probe: src/features/calendar-sources/data/effective-name.ts (prepend)
```
+ import { Appearance } from "react-native"
```
```
$ npx eslint src/features/calendar-sources/data/effective-name.ts
1:10  error    'Appearance' import from 'react-native' is restricted. Read the color scheme through @/hooks/use-color-scheme — it resolves the Settings theme override (C1). react-native's useColorScheme/Appearance are imported only inside src/hooks/use-color-scheme.ts  no-restricted-imports
✖ 2 problems (1 error, 1 warning)
```
```
$ npx eslint src/features/calendar-sources/data/effective-name.ts   # after revert
exit 0 (0 problem lines)
```

### probe: src/features/home/ui/event-accessibility.ts (prepend)
```
+ import * as RN from "react-native"
```
```
$ npx eslint src/features/home/ui/event-accessibility.ts
1:8   error    * import is invalid because 'useColorScheme,Appearance' from 'react-native' is restricted. Read the color scheme through @/hooks/use-color-scheme — it resolves the Settings theme override (C1). react-native's useColorScheme/Appearance are imported only inside src/hooks/use-color-scheme.ts  no-restricted-imports
✖ 3 problems (2 errors, 1 warning)
```
```
$ npx eslint src/features/home/ui/event-accessibility.ts   # after revert
exit 0 (0 problem lines)
```

### probe: src/features/home/ui/event-accessibility.ts (append)
```
+ export { Appearance } from "react-native"
```
```
$ npx eslint src/features/home/ui/event-accessibility.ts
29:10  error  'Appearance' import from 'react-native' is restricted. Read the color scheme through @/hooks/use-color-scheme — it resolves the Settings theme override (C1). react-native's useColorScheme/Appearance are imported only inside src/hooks/use-color-scheme.ts  no-restricted-imports
✖ 1 problem (1 error, 0 warnings)
```
```
$ npx eslint src/features/home/ui/event-accessibility.ts   # after revert
exit 0 (0 problem lines)
```

### probe: src/features/home/ui/event-accessibility.ts (prepend)
```
+ import Appearance from "react-native/Libraries/Utilities/Appearance"
```
```
$ npx eslint src/features/home/ui/event-accessibility.ts
1:1  error    'react-native/Libraries/Utilities/Appearance' import is restricted from being used by a pattern. Read the color scheme through @/hooks/use-color-scheme — it resolves the Settings theme override (C1). react-native's useColorScheme/Appearance are imported only inside src/hooks/use-color-scheme.ts  no-restricted-imports
✖ 3 problems (2 errors, 1 warning)
```
```
$ npx eslint src/features/home/ui/event-accessibility.ts   # after revert
exit 0 (0 problem lines)
```

### probe: src/features/home/ui/event-accessibility.ts (prepend)
```
+ import useColorScheme from "react-native/Libraries/Utilities/useColorScheme"
```
```
$ npx eslint src/features/home/ui/event-accessibility.ts
1:1  error    'react-native/Libraries/Utilities/useColorScheme' import is restricted from being used by a pattern. Read the color scheme through @/hooks/use-color-scheme — it resolves the Settings theme override (C1). react-native's useColorScheme/Appearance are imported only inside src/hooks/use-color-scheme.ts  no-restricted-imports
✖ 3 problems (2 errors, 1 warning)
```
```
$ npx eslint src/features/home/ui/event-accessibility.ts   # after revert
exit 0 (0 problem lines)
```

### probe: src/hooks/use-color-scheme.ts (prepend, deep import stays allowed in the seam)
```
+ import Appearance from "react-native/Libraries/Utilities/Appearance"
```
```
$ npx eslint src/hooks/use-color-scheme.ts
1:1  error    Run autofix to sort these imports!      simple-import-sort/imports
1:8  warning  'Appearance' is defined but never used  @typescript-eslint/no-unused-vars
(no no-restricted-imports report)
```

6.5 seam negative, then the inherited storage and route-entrypoint bans inside the seam block:

### seam negative
```
$ npx eslint src/hooks/use-color-scheme.ts
exit 0
```

### probe: src/hooks/use-color-scheme.ts (prepend)
```
+ import "react-native-mmkv"
```
```
$ npx eslint src/hooks/use-color-scheme.ts
1:1  error  'react-native-mmkv' import is restricted from being used by a pattern. Use the @/storage seam — react-native-mmkv is imported only inside src/storage/  no-restricted-imports
✖ 2 problems (2 errors, 0 warnings)
```
```
$ npx eslint src/hooks/use-color-scheme.ts   # after revert
exit 0 (0 problem lines)
```

### probe: src/hooks/use-color-scheme.ts (prepend)
```
+ import "@/app/_layout"
```
```
$ npx eslint src/hooks/use-color-scheme.ts
1:1  error  '@/app/_layout' import is restricted from being used by a pattern. Route files under src/app/ are entrypoints — move shared code to a module and import that instead  no-restricted-imports
✖ 2 problems (2 errors, 0 warnings)
```
```
$ npx eslint src/hooks/use-color-scheme.ts   # after revert
exit 0 (0 problem lines)
```

## B — L8: font scaling is never disabled

Remaining hits (task 5.2), all test assertions that the prop is not disabled:

```
$ grep -rn "allowFontScaling" src
src/features/splash/ui/splash-screen.test.tsx:61:      expect(getByText("TimeCalendar").props.allowFontScaling).not.toBe(false)
src/components/empty-state.test.tsx:36:        "allowFontScaling",
src/components/error-surfaces.test.tsx:214:      expect(view.getByText(message).props.allowFontScaling).not.toBe(false)
```

6.6 JSX attribute in a feature `ui/` file, 6.7 object-property form and the
`maxFontSizeMultiplier` negative, 6.8 a `*.test.tsx` file (no exemption):

### probe: src/features/home/ui/upcoming-scroller.tsx (append)
```
+ export const Probe = () => <Text allowFontScaling={false}>{null}</Text>
```
```
$ npx eslint src/features/home/ui/upcoming-scroller.tsx
144:34  error  Text must follow the OS font size — do not disable allowFontScaling. Cap dense UI with maxFontSizeMultiplier instead (accessibility.md → Font scaling)  no-restricted-syntax
✖ 2 problems (2 errors, 0 warnings)
```
```
$ npx eslint src/features/home/ui/upcoming-scroller.tsx   # after revert
exit 0 (0 problem lines)
```

### probe: src/features/home/ui/event-accessibility.ts (append)
```
+ export const textProps = { allowFontScaling: false }
```
```
$ npx eslint src/features/home/ui/event-accessibility.ts
29:28  error  Text must follow the OS font size — do not disable allowFontScaling. Cap dense UI with maxFontSizeMultiplier instead (accessibility.md → Font scaling)  no-restricted-syntax
✖ 1 problem (1 error, 0 warnings)
```
```
$ npx eslint src/features/home/ui/event-accessibility.ts   # after revert
exit 0 (0 problem lines)
```

### probe: src/features/home/ui/upcoming-scroller.tsx (append)
```
+ export const Probe = () => <Text maxFontSizeMultiplier={1.3}>{null}</Text>
```
```
$ npx eslint src/features/home/ui/upcoming-scroller.tsx
✖ 1 problem (1 error, 0 warnings)
```
```
$ npx eslint src/features/home/ui/upcoming-scroller.tsx   # after revert
exit 0 (0 problem lines)
```

### probe: src/features/home/ui/today-timeline.test.tsx (append)
```
+ export const Probe = () => <Text allowFontScaling={false}>{null}</Text>
```
```
$ npx eslint src/features/home/ui/today-timeline.test.tsx
280:34  error  Text must follow the OS font size — do not disable allowFontScaling. Cap dense UI with maxFontSizeMultiplier instead (accessibility.md → Font scaling)  no-restricted-syntax
✖ 2 problems (2 errors, 0 warnings)
```
```
$ npx eslint src/features/home/ui/today-timeline.test.tsx   # after revert
exit 0 (0 problem lines)
```

The `maxFontSizeMultiplier={1.3}` negative's single problem is `react/jsx-no-undef` (`'Text' is
not defined`), not `no-restricted-syntax`:

```
144:29  error  'Text' is not defined  react/jsx-no-undef
✖ 1 problem (1 error, 0 warnings)
```

## C — contrast gate

6.9 / 3.2: `Colors.light.outline` set to `#C6C6C8` (the `separator` value):

```
+ outline: "#C6C6C8",
$ npx jest src/theme/theme.test.tsx
  ✕ resolves the outline and scrim roles per scheme
  ✕ clears the ui contrast floor
  ✕ clears the ui contrast floor
  ✕ clears the ui contrast floor
  ● theme › resolves the outline and scrim roles per scheme
  ● light outline on background › clears the ui contrast floor
      Expected: >= 3   Received: 1.7055404192257981
  ● light outline on backgroundElement › clears the ui contrast floor
      Expected: >= 3   Received: 1.4995193564861584
  ● light outline on backgroundSelected › clears the ui contrast floor
      Expected: >= 3   Received: 1.3061335847350126
Tests:       4 failed, 56 passed, 60 total
```

After revert: `Tests: 60 passed, 60 total`.

`MinTouchTarget` per-platform test bites: with the default branch set to 47,
`resolves MinTouchTarget on android to 48` fails and the iOS case passes. Reverted.

Computed ratios (WCAG 2.x, two decimals), the values in the `tokens.ts` block:

| Scheme | Foreground on background | Ratio | Floor |
| --- | --- | --- | --- |
| light | `text` #000000 on `background` #ffffff | 21.00 | body (4.5:1) |
| light | `text` #000000 on `backgroundElement` #F0F0F3 | 18.46 | body (4.5:1) |
| light | `text` #000000 on `backgroundSelected` #E0E1E6 | 16.08 | body (4.5:1) |
| light | `textSecondary` #60646C on `background` #ffffff | 5.94 | body (4.5:1) |
| light | `textSecondary` #60646C on `backgroundElement` #F0F0F3 | 5.22 | body (4.5:1) |
| light | `text` #000000 on `homeHero` #FCE4EC | 17.45 | body (4.5:1) |
| light | `homeHeroDate` #AD1457 on `homeHero` #FCE4EC | 5.79 | body (4.5:1) |
| light | `onPrimary` #ffffff on `primaryStrong` #C2185B | 5.87 | body (4.5:1) |
| light | `primaryStrong` #C2185B on `background` #ffffff | 5.87 | ui (3:1) |
| light | `actionText` #C2185B on `background` #ffffff | 5.87 | body (4.5:1) |
| light | `error` #B3261E on `background` #ffffff | 6.54 | body (4.5:1) |
| light | `error` #B3261E on `backgroundElement` #F0F0F3 | 5.75 | body (4.5:1) |
| light | `destructive` #B3261E on `backgroundElement` #F0F0F3 | 5.75 | ui (3:1) |
| light | `positive` #146C43 on `background` #ffffff | 6.45 | body (4.5:1) |
| light | `positive` #146C43 on `backgroundElement` #F0F0F3 | 5.67 | body (4.5:1) |
| light | `informational` #0B57D0 on `background` #ffffff | 6.39 | body (4.5:1) |
| light | `informational` #0B57D0 on `backgroundElement` #F0F0F3 | 5.61 | body (4.5:1) |
| light | `outline` #7C7F87 on `background` #ffffff | 4.01 | ui (3:1) |
| light | `outline` #7C7F87 on `backgroundElement` #F0F0F3 | 3.52 | ui (3:1) |
| light | `outline` #7C7F87 on `backgroundSelected` #E0E1E6 | 3.07 | ui (3:1) |
| dark | `text` #ffffff on `background` #000000 | 21.00 | body (4.5:1) |
| dark | `text` #ffffff on `backgroundElement` #212225 | 15.91 | body (4.5:1) |
| dark | `text` #ffffff on `backgroundSelected` #2E3135 | 13.07 | body (4.5:1) |
| dark | `textSecondary` #B0B4BA on `background` #000000 | 10.08 | body (4.5:1) |
| dark | `textSecondary` #B0B4BA on `backgroundElement` #212225 | 7.64 | body (4.5:1) |
| dark | `text` #ffffff on `homeHero` #321824 | 16.26 | body (4.5:1) |
| dark | `homeHeroDate` #FF80AB on `homeHero` #321824 | 6.91 | body (4.5:1) |
| dark | `onPrimary` #ffffff on `primaryStrong` #C2185B | 5.87 | body (4.5:1) |
| dark | `primaryStrong` #C2185B on `background` #000000 | 3.58 | ui (3:1) |
| dark | `actionText` #FF4081 on `background` #000000 | 6.30 | body (4.5:1) |
| dark | `error` #FFB4AB on `background` #000000 | 12.37 | body (4.5:1) |
| dark | `error` #FFB4AB on `backgroundElement` #212225 | 9.37 | body (4.5:1) |
| dark | `destructive` #FFB4AB on `backgroundElement` #212225 | 9.37 | ui (3:1) |
| dark | `positive` #7EE2A8 on `background` #000000 | 13.33 | body (4.5:1) |
| dark | `positive` #7EE2A8 on `backgroundElement` #212225 | 10.10 | body (4.5:1) |
| dark | `informational` #A8C7FA on `background` #000000 | 12.21 | body (4.5:1) |
| dark | `informational` #A8C7FA on `backgroundElement` #212225 | 9.25 | body (4.5:1) |
| dark | `outline` #80838D on `background` #000000 | 5.55 | ui (3:1) |
| dark | `outline` #80838D on `backgroundElement` #212225 | 4.20 | ui (3:1) |
| dark | `outline` #80838D on `backgroundSelected` #2E3135 | 3.45 | ui (3:1) |
| light | `primary` #E91E63 on `background` #ffffff | 4.35 | ui (3:1) |
| light | `onPrimary` #ffffff on `primary` #E91E63 | 4.35 | ui (3:1) |
| dark | `primary` #FF4081 on `background` #000000 | 6.30 | body (4.5:1) |
| dark | `logoSurface` #ffffff on `background` #000000 | 21.00 | ui (3:1) |

`scrim` (`#00000066` / `#00000099`) is translucent and has no contrast obligation; the helper
refuses it (`refuses a translucent token`).

## D — calendar fixture test under the machine zone (commit A)

Before the fix (machine date 2026-10-25, the Europe/Paris DST change day):

```
$ TZ=Europe/Paris npx jest src/features/calendar/ui/calendar-screen.test.tsx -t "deterministic accessibility fixture"
CalendarScreen owned shell › runs the deterministic accessibility fixture only on the development route
  Error: Unable to find an element with role: button, name: /^Fixture probe-late,/
numFailedTests: 1, numPendingTests: 48
```

After the fix (whole file):

```
TZ=Europe/Paris        Tests: 49 passed, 49 total
TZ=UTC                 Tests: 49 passed, 49 total
TZ=America/Los_Angeles Tests: 49 passed, 49 total
```

6.10: after all reverts, `git status` lists only the intended change files under `mobile/src/`
(`theme/index.ts`, `theme/theme.test.tsx`, `theme/tokens.ts`, `hooks/use-color-scheme.test.ts`).

## E — suite runs (8.3, 8.4)

```
$ TZ=UTC npm test -- --coverage        # CI zone, per-file 90% branch gate
Test Suites: 242 passed, 242 total
Tests:       2471 passed, 2471 total
exit 0 (tokens.ts 100% branches)

$ TZ=Europe/Paris npm test             # machine zone (/etc/localtime → Europe/Paris, CET)
Test Suites: 242 passed, 242 total
Tests:       2471 passed, 2471 total
exit 0
```
