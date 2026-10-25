# Design system proposal

Date: 2026-10-25. Status: **proposal for owner approval**. Nothing here is implemented. It builds
on [assessment.md](./assessment.md) and must fit the Architecture Book; where it changes a
binding rule it names the ADR it needs (listed in [migration-roadmap.md](./migration-roadmap.md#adrs-to-write)).

Guiding constraints from the book:

- **Principle 1:** every rule below ships with its lint rule, type, or test, or it does not ship.
- **Principle 2:** primitives share meaning, not necessarily layout. iOS follows HIG, Android
  follows Material 3. A primitive may render two different native compositions.
- **Native controls are not re-skinned.** `Switch`, `DateTimePicker`, `Picker`, menus and native
  dialogs stay native (theming.md "Native platform expression"). The DS does not wrap them just to
  route them through the system; it only composes them where a product contract is needed
  (ADR 056/060 pattern).
- **No styling runtime** (theming.md: `StyleSheet` + typed `as const` tokens; NativeWind/Tamagui/
  Unistyles rejected). This proposal keeps that.

## 1. Token model

### What exists (`mobile/src/theme/`)

| Token | Where | State |
| --- | --- | --- |
| `Colors.light/dark` (22 roles each) | `tokens.ts:3-48` | Good. Neutral, brand (`primary`, `primaryStrong`, `actionText`, `onPrimary`, `primarySoft`), status (`positive`, `informational`, `destructive`, `error`), surface (`homeHero*`, `logoSurface`), utility (`separator`, `ripple`, `textTertiary`). AA pairs documented at `:52-154`. |
| `Spacing` half/one/two/three/four/five/six = 2/4/8/16/24/32/64 | `tokens.ts:175-183` | Good grid, but no 12 (used at 8 sites) and no 48 (jump 32 → 64). |
| `Radii` small/medium/large/pill = 4/8/16/9999 | `tokens.ts:185-190` | Fine for RN surfaces. No `borderCurve` convention. |
| `Fonts` sans/serif/rounded/mono | `tokens.ts:156-173` | Unused (zero `fontFamily` overrides). Keep. |
| `MaxContentWidth`, responsive lanes | `tokens.ts:192`, `responsive.ts` | Good. |
| Type ramp | `components/themed-text.tsx:45-84` | **Lives in a component, not in `theme/`, and is not a platform ramp.** |
| Elevation, opacity/state, motion, icon size, touch target | — | **Missing.** Each shows up as literals (5 opacities, `#000000` shadows, 44/48 repeated by hand, icon sizes 14–30). |

The hex light/dark pairs are the right choice here even though Expo's guidance prefers
`PlatformColor`/`Color.ios.*`: the same values must flow into SwiftUI `tint` and Compose
`seedColor` (`native-settings.tsx`), the contrast posture is documented per pair, and the brand is
custom. Keep hex pairs; do not introduce a second color system.

### Additions

All additive; no existing key is renamed in phase 1 (315 `Spacing.`/`Radii.` call sites).

```ts
// theme/tokens.ts — additions (sketch)
export const Spacing = {
  half: 2, one: 4, two: 8,
  twoHalf: 12,          // new: 8 current literal sites
  three: 16, four: 24, five: 32,
  fiveHalf: 48,         // new: section/hero rhythm, empty-state artwork gap
  six: 64,
} as const

export const MinTouchTarget = Platform.select({ ios: 44, default: 48 })   // replaces 12+ hand-written 44/48 branches

export const IconSize = { small: 14, medium: 17, large: 22, xlarge: 28 } as const

export const StateOpacity = {
  pressed: 0.65,        // iOS only; Android uses ripple
  disabled: 0.55,       // replaces 0.45 / 0.55 / 0.62 / 0.8 drift
} as const

export const Elevation = {                 // boxShadow strings, never legacy shadow props
  raised: { light: "0 2px 6px rgba(0,0,0,0.16)", dark: "0 2px 6px rgba(0,0,0,0.5)" },
} as const                                  // only the RN FAB earns this today

export const Motion = { fast: 150, base: 250, slow: 400 } as const   // consumers still own reduced motion

export const Layout = { fabClearance: 96 } as const  // replaces 88 / 96 / 112
```

Color roles to add (each with light + dark value and a documented AA pair, per theming.md):

| Role | Why | Replaces |
| --- | --- | --- |
| `outline` | Text-field and outlined-button boundary at ≥ 3:1 against `background` | `backgroundSelected` strokes (≈1.3:1, unverified) |
| `scrim` | Modal/backdrop dimming | `rgba(0,0,0,0.4)` in `owned-calendar-chooser.tsx` |
| `onEventColor` resolution (helper, not a token) | Text that must sit on a data color resolves an explicit foreground or the color stays decorative | `TagBubble` text on `tag.color` |

### Type ramp, owned by `theme/typography.ts`

Move the ramp out of `ThemedText` into `src/theme/typography.ts` and make it platform-resolved:
same semantic names, iOS sizes from Apple's Dynamic Type defaults, Android sizes from the M3
type scale. The renderer stays `ThemedText`.

| Variant | iOS (HIG) | Android (M3) | Role | Header role |
| --- | --- | --- | --- | --- |
| `largeTitle` | 34/41 bold | 32/40 regular (headlineLarge) | Non-stack hero only (welcome) | yes |
| `title` | 28/34 bold | 28/36 (headlineMedium) | In-content title (event, release) | yes |
| `title2` | 22/28 bold | 24/32 (headlineSmall) | Empty-state screen title | yes |
| `sectionTitle` | 20/25 semibold | 22/28 (titleLarge) | Section header (Home, Activity, Hidden events, agenda day) | yes |
| `headline` | 17/22 semibold | 16/24 medium (titleMedium) | Row titles, card titles | no |
| `body` | 17/22 regular | 16/24 (bodyLarge) | Default text | no |
| `callout` | 16/21 | 14/20 (bodyMedium) | Secondary body | no |
| `label` | 15/20 semibold | 14/20 medium (labelLarge) | Buttons, text actions | no |
| `footnote` | 13/18 | 12/16 (bodySmall) | Captions, helper text | no |
| `caption` / `captionSmall` | 12/14 semibold, 11/13 | same | Dense calendar tiles (unchanged) | no |

Migration mapping: `default` → `body`; `small` → `callout`; `smallBold` → `label`; `subtitle` →
`sectionTitle` (as section header) or `title2` (empty state); `title` → `title` or `largeTitle`.
The old names stay as deprecated aliases until the last consumer moves; a lint rule then deletes
them. Heading-role contract (accessibility.md) extends to every variant marked "yes".

The exact iOS/Android numbers are a starting point taken from HIG and M3 defaults (unverified
against the current rendered screens); the owner should check them on device in phase 1.

## 2. Primitive set

Conventions for every primitive (from the expo-design-system contract, adapted to this codebase):

- `variant` = visual intent, closed string union; `size` = `"small" | "medium" | "large"` (default
  `medium`) mapped to tokens only; states = `disabled`, `busy`, `selected` where relevant, pressed
  via ripple on Android and `StateOpacity.pressed` on iOS.
- `style` merges **last** and is for layout only. (`PrimaryAction` merges it first today,
  `primary-action.tsx:45`; fix in phase 2.)
- Required `accessibilityLabel` when there is no text child; `testID` passthrough; a11y state
  derived from props, never set by callers.
- Colors come only from `useTheme()`; callers cannot pass a color to a primitive (no `color` prop).
  Data colors enter only through `EventSurface`/`ColorDot`, which take an event color by name.

| Primitive | Lives in | API sketch | Replaces |
| --- | --- | --- | --- |
| `ThemedText` | `components/` | `variant: TypeVariant`, `tone?: "primary" \| "secondary" \| "tertiary" \| "action" \| "destructive" \| "onPrimary"` | 5 ad-hoc type scales; `themeColor="primary"` on text (8 AA failures: `action` maps to `actionText`) |
| `Button` | `components/` | `variant: "filled" \| "tonal" \| "outlined" \| "text" \| "destructive"`, `size`, `label`, `icon?: IconName`, `busy`, `disabled`, `onPress` | `PrimaryAction` (kept as `Button variant="filled"` alias), A1–A4: welcome/connect/manual-import/changelog CTAs, `QrActionButton`, outlined Back/Intranet buttons, neutral fills, Skip/Next/See all/Unhide text buttons, Delete |
| `HeaderAction` | `chrome/` (wraps `unstable_headerRightItems` / `Stack.Toolbar`) | `items: { icon, label, onPress, menu? }[]`, `side` | 3 header mechanisms (A5) incl. pink calendar icons; text "Close" buttons |
| `FloatingAction` | `chrome/` (generalize `NativeSettingsFloatingAction`) | `icon`, `label`, `onPress`; renders `null` on iOS | `HomeAddFab`, `CalendarAddFab` (text-glyph "+", duplicated shadow) |
| `NativeList`, `NativeListSection`, `NativeListRow`, `NativeListSwitchRow`, `NativeListChoiceRow`, `NativeListRadioDialog`, `NativeListAlert` | `chrome/` (rename of `native-settings.tsx` exports; `NativeSettings*` aliases kept) | unchanged contract | `SettingsRow`/`SettingsSection` adapters (delete after about + environment move over) |
| `ListRow` (+ `ListSection`) | `components/` | `title`, `subtitle?`, `leading?: ReactNode` (icon / dot / logo), `trailing?: "chevron" \| "check" \| ReactNode`, `onPress` / `href`, `selected`, `destructive`; platform-adaptive geometry mirroring the seam (iOS inset-grouped with separators; Android M3 segment surfaces, no chevrons) | For virtualized or custom lists where SwiftUI/Compose lists cannot go (FlatList owners): timezone chooser rows, `SchoolRow`, `HiddenRow`, `ActivityItemRow`, personal-event `EventRow`, provider rows, `GroupNode` |
| `Separator` | `components/` | `inset?: "none" \| "leading" \| number` | `RowSeparator`, hairline row borders (A10) |
| `TextField` | `components/` | `label`, `value`, `onChangeText`, `error?`, `helper?`, `multiline?`, `secureTextEntry?`, all `TextInputProps` passthrough | `stepStyles.input`, feedback, iCal URL, personal-event fields, checklist input (A12); wires `FieldError` and `outline` |
| `DateTimeField` | `components/` (promoted from personal-events, fixed) | `value`, `mode: "date" \| "time" \| "datetime"`, `zone`, `locale` | personal-events copy; Android chains date then time dialogs so `datetime` works |
| `StatusView` | `components/` | `kind: "loading" \| "empty" \| "error"`, `presentation: "screen" \| "section" \| "inline"`, `title`, `caption?`, `action?`, `artwork?` | `EmptyState`, `ErrorState` (kept as thin aliases), `ListStatus`, `StatusSymbol`, `GuideLoading`, `ImportProgressView`, event-details status, plain-text empty states (A11). One spinner color rule: `textSecondary` for page/section, `onPrimary` inside filled buttons |
| `ErrorNotice`, `FieldError` | `components/` | unchanged | — |
| `Badge` | `components/` | `tone: "brand" \| "neutral" \| "positive" \| "informational" \| "destructive"`, `label`, `size` | header caption pill, checklist progress pill, calendar view pill (A14). `SwiftBadge` stays native |
| `Icon` | `components/` | `name: IconName` where `IconName` keys a table of `{ sf: SFSymbol, material: MaterialSymbol }` (extends `chrome/native-settings-icons.ts`), `size: keyof IconSize`, `tone` | raw `SymbolView` in 11 files, unicode ↑ ↓ ×, "+" glyph, CSS-border chevron (A16); fixes Android icon gaps |
| `ColorDot` | `components/` | `color: EventColor`, `size: "small" \| "medium" \| "large"`, decorative (hidden from a11y) | 5 dot/swatch implementations (A15) |
| `EventSurface` | `components/` | `variant: "dot" \| "wash" \| "block"`, `eventColor`, children; resolves foreground via `onEventColor` | Home wash cards, agenda tiles, event-details swatch, `TagBubble` (A8). Owner decides whether agenda keeps a "block" rail |
| `Card` | — | **Not proposed.** Grouped lists cover most uses ("Everything's a Card" slop tell). Re-evaluate only if `EventSurface` leaves a real second consumer. | — |
| `Sheet` / chooser | — | **Not a component.** Pattern: Router `formSheet` (iOS) / `fullScreenModal` or native menu (Android), or `MenuView`. Lint bans RN `Modal` in feature UI. | `owned-calendar-chooser.tsx` custom Modal; environment 4-button `Alert` |
| Page layout | `components/` (unchanged) | `RootPage`, `PageIntro`, `KeyboardSafeActionLayout`, `AdaptiveContent` | — |

Not wrapped, used directly from chrome or RN: `Switch` (via `NativeListSwitchRow`),
`DateTimePicker`, `Picker`, `MenuView`, `NativeTextEntryDialog`, `GlassSurface`, `NativeTabs`.

## 3. Where it lives

```
src/theme/                tokens.ts, typography.ts (new), responsive.ts, nav-theme.ts, use-theme.ts, index.ts
src/components/chrome/    native/alpha-API seam: thin wrappers + composed native controls (ADR 010/056/060)
src/components/           RN-built primitives + page layout, ONE public barrel: src/components/index.ts
src/components/<name>/    a primitive that needs >1 file (e.g. status-view/, list-row/) keeps its *.gallery.tsx + test beside it
src/gallery/              CSF3-shaped fixture types + explicit registry (see storybook-options.md)
src/features/<x>/ui/      product compositions only; no generic primitives
```

Rejected: a new `src/design-system/` or `src/components/ds/` tree. It would create a second
"shared UI" home next to `components/` that the golden path already names ("Put reusable
primitives in `src/components/`"), forcing every existing import to move for no boundary gain.
The barrel plus lint gives the same enforcement.

Rule for the boundary (to write into theming.md):

- Imports an alpha or native-UI API (SwiftUI/Compose via `@expo/ui`, native tabs, glass,
  `unstable_header*Items`) → `chrome/`.
- Pure React Native, no product nouns, ≥ 2 consumers or about to have them → `components/`.
- Product nouns (school, checklist, changelog) → feature `ui/`, exported through the feature barrel
  when another feature consumes it.

## 4. Enforcement (Principle 1)

Each item is a gate, not prose. Blocks follow the existing `eslint.config.js` shape; the
`restrictedImports([...])` re-call caveat in lint-format.md applies to every new block.

| # | Gate | Mechanism | Scope / exemptions |
| --- | --- | --- | --- |
| L1 | `useColorScheme` and `Appearance` from `react-native` banned | `no-restricted-imports` `paths` + `importNames` | Exempt `src/hooks/use-color-scheme.ts` |
| L2 | Features import shared UI only through `@/components` and `@/components/chrome` barrels | `no-restricted-imports` pattern `@/components/*` except `chrome` | `src/components/**` itself |
| L3 | Raw `TextInput`, `ActivityIndicator`, `Modal`, `TouchableOpacity`, `TouchableHighlight`, `Button`, `Text` from `react-native` banned in `src/features/*/ui/**` | `no-restricted-imports` `importNames` with messages naming the primitive | Ratchet allowlist of not-yet-migrated files (see below); `calendar/renderer/**` exempt (owned renderer) |
| L4 | `SymbolView` / `expo-symbols` only in `components/icon*` and `chrome/` | `no-restricted-imports` | Same ratchet |
| L5 | No color literals in styles | `local/no-style-literals` (new rule in `mobile/tools/eslint-rules/`): hex/`rgb()`/`hsl()`/named colors in `style`, `color`, `tintColor`, `*Color` props | Exempt `src/theme/**`, `color-swatch-presets.ts`, data fallback constants, `paging-spike/**` |
| L6 | No numeric `fontSize`/`lineHeight`/`fontWeight` outside the ramp | same rule, option `typography: true` | Exempt `src/theme/typography.ts`, `chrome/**` (SwiftUI/Compose modifiers are not RN styles) |
| L7 | No legacy `shadow*`/`elevation`; spacing/radius literals other than 0, 1, `hairlineWidth` | same rule, options | Ratchet |
| L8 | `allowFontScaling={false}` banned | `no-restricted-syntax` (accessibility.md lists it as deferred debt; this discharges it) | none |
| L9 | No `themeColor="primary"` / `tone` on text below large size | Type: `ThemedText` `tone` union has no `"brand"`; brand text is `tone="action"` | type-level, no exemption |
| L10 | Every `components/**` primitive has a gallery fixture and a test | Jest contract test that globs `src/components/**/*.tsx` exports and asserts a matching `*.gallery.tsx` (CSF3-shaped, see [storybook-options.md](./storybook-options.md#recommendation)) and `*.test.tsx` | Helpers listed explicitly |
| L11 | Every fixture renders in light + dark on iOS + Android without errors | `src/gallery/registry.test.ts` renders every registered story under each scheme and `Platform.OS` | — |

**Ratchet, not big bang.** L3/L4/L7 start as `error` with an explicit per-file allowlist array in
`eslint.config.js` (the not-yet-migrated files, generated once). A test asserts the list only
shrinks (compares against a committed count). Each migration slice removes its files from the list.
This follows the existing opt-out style (`banChromeAlpha: false`) and keeps `--max-warnings 0`.

Like the existing seam blocks, a green lint does not prove a ban fires: each new block lands with
the inject-and-revert check lint-format.md already requires, plus a RuleTester test for the local
rule (pattern: `mobile/tools/eslint-rules/no-js-call-in-worklet.test.js`).

## 5. Platform-specific token resolution

- Tokens stay single-source; platform differences resolve **inside primitives** via
  `Platform.select` (touch target, ramp sizes, pressed feedback, list geometry), never at call sites.
- Android M3 surface roles used by the seam (`surfaceContainer`, `onSurfaceVariant`, `errorContainer`)
  come from Compose's seeded scheme (`seedColor = primary`). RN-built Android rows must match that
  visually; `ListRow` gets an Android `surfaceContainer`-equivalent token pair
  (`listSurface` light/dark) verified on device against the seam in the gallery. (unverified: exact
  seeded values; derive by sampling the Compose host in both schemes.)
- iOS 26 Liquid Glass stays behind `GlassSurface`; no glass tokens.
- Dark mode: every new token lands as a pair (theming.md "Light and dark are equal designs"); the
  gallery/story matrix renders both.

## 6. What this does not change

- The chrome seam rules, ADR 054 root-page semantics, the native-settings contract, the calendar
  renderer boundary (ADR 033), responsive lanes, i18n and a11y rules.
- Event colors remain data, not tokens.
- No styling library, no web target (ADR 007).
