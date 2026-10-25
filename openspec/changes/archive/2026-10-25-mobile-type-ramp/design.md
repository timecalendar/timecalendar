# Design

## Context

See proposal.md (Why). The current state that shapes the approach:

- `mobile/src/components/themed-text.tsx` owns seven styles in a local `StyleSheet`:
  `default` 16/24/500, `small` 14/20/500, `smallBold` 14/20/700, `subtitle` 32/44/600,
  `title` 48/52/600, `caption` 12/14/600, `captionSmall` 11/13/400. The values are the same on
  both platforms. `title` and `subtitle` get `accessibilityRole="header"` from an inline
  boolean; `{...rest}` spreads last, so a caller role wins.
- Color comes from `themeColor?: ThemeColor` (any token, including brand `primary`). Non-test
  call sites: `textSecondary` 44, `actionText` 10, `onPrimary` 4, `background` 2,
  `destructive` 1, `error` 1, `primary` 1, plus 2 conditional expressions.
- 148 `<ThemedText` elements in 59 non-test files. Literal `type` usage: `title` 4 sites,
  `subtitle` 11, `small` 24, `smallBold` 46, `captionSmall` 3 (calendar renderer) plus one
  conditional `captionSmall`/`small` in `checklist-progress-indicator.tsx`. `caption` has no
  call site. Every element without `type` renders `default`.
- Tests that pin today's numbers: `home-screen.test.tsx:167,170` asserts 32/44/600 on the
  "Up next" and "Today" empty-state titles (`EmptyState` uses `subtitle`). The owned-calendar
  shell tests assert `captionSmall` 11/13 and local renderer styles; they are untouched because
  `caption`/`captionSmall` keep their values.
- `src/theme/brand-small-text.test.ts` scans source for `type="smallBold"` combined with
  `themeColor="primary"` (the 4.35:1 brand-text failure).
- The jest-expo preset runs as iOS. `theme.test.tsx` already proves a `Platform.select` token on
  both platforms with `jest.isolateModules` + `jest.doMock` of
  `react-native/Libraries/Utilities/Platform` (the `MinTouchTarget` case). `src/theme/**` is
  under the 90% line/branch gate.
- React Native 0.85 `Text` has the iOS-only `dynamicTypeRamp` prop. `RCTAttributedTextUtils.mm`
  computes the font multiplier from `UIFontMetrics(forTextStyle:)` for that ramp and still applies
  `maxFontSizeMultiplier` as a cap. Without it, iOS scales every size linearly by the content
  size multiplier, which over-scales large titles and under-scales body at accessibility sizes.
- `textTertiary` (`#3C3C434D` / `#EBEBF54D`) is documented in `tokens.ts` as a decorative
  disclosure-chevron tint at ~30% alpha, exempt from contrast. It is not a text token.
- Next free ADR number is 063 (062 is the highest merged; no open PR reserves 063).

## Goals / Non-Goals

**Goals:**

- One typed, platform-resolved ramp in `@/theme` that `ThemedText` renders and phase 3
  primitives can consume.
- Every existing `type` keeps compiling; the heading role covers every heading step; text color
  can be set through a closed `tone` that cannot express brand-pink text.
- Each rule is a type or a test (Principle 1). No prose-only rule.

**Non-Goals:**

- Migrating call sites to the new names or to `tone` (phase 5), or moving `EmptyState` /
  `PageIntro` to `title2` (phase 3.3 `StatusView`). Shared components keep their current `type`.
- Deleting the aliases or `themeColor`, or renaming `type` to `variant` (phase 4.3).
- The `local/no-style-literals` typography lint (L6, phase 4.1). Local `fontSize` overrides in
  features (Home's 20/25/700 section titles, the Settings brand header's 28/34/700) stay.
- A Jest proof of rendered geometry or Dynamic Type growth. That is the device pass.
- The calendar renderer: `caption`/`captionSmall` values and every renderer style stay as they
  are (ADR 033 boundary).

## Decisions

### D1. The ramp values

Owner-approved proposal numbers, filled in from the HIG and M3 defaults where the proposal
leaves a cell blank (Android weights are the M3 defaults: 400 for headline/title-large/body,
500 for title-medium/label). Size/line height in pt (iOS) and sp/dp (Android).

| Variant | iOS size/lh/weight | iOS `dynamicTypeRamp` | Android size/lh/weight | Android letterSpacing | M3 role |
| --- | --- | --- | --- | --- | --- |
| `largeTitle` | 34/41/700 | `largeTitle` | 32/40/400 | 0 | headlineLarge |
| `title` | 28/34/700 | `title1` | 28/36/400 | 0 | headlineMedium |
| `title2` | 22/28/700 | `title2` | 24/32/400 | 0 | headlineSmall |
| `sectionTitle` | 20/25/600 | `title3` | 22/28/400 | 0 | titleLarge |
| `headline` | 17/22/600 | `headline` | 16/24/500 | 0.15 | titleMedium |
| `body` | 17/22/400 | `body` | 16/24/400 | 0.5 | bodyLarge |
| `callout` | 16/21/400 | `callout` | 14/20/400 | 0.25 | bodyMedium |
| `label` | 15/20/600 | `subheadline` | 14/20/500 | 0.1 | labelLarge |
| `footnote` | 13/18/400 | `footnote` | 12/16/400 | 0.4 | bodySmall |
| `caption` | 12/14/600 | none | 12/14/600 | none | (dense tile) |
| `captionSmall` | 11/13/400 | none | 11/13/400 | none | (dense tile) |

Rules carried by the table:

- iOS has no `letterSpacing`: SF applies optical-size tracking itself, and a manual value would
  double it.
- Android carries the M3 tracking because the Compose host (Settings seam) renders M3 typography
  with it; RN text beside it must match.
- `caption`/`captionSmall` carry no `dynamicTypeRamp` so the dense calendar tiles keep linear
  scaling under their existing `maxFontSizeMultiplier` caps.
- `lineHeight >= fontSize` for every step (asserted in the test).

Shape (sketch, not prescriptive):

```ts
type TypeStep = {
  style: Pick<TextStyle, "fontSize" | "lineHeight" | "fontWeight" | "letterSpacing">
  dynamicTypeRamp?: TextProps["dynamicTypeRamp"]
}
export type TypeVariant = "largeTitle" | "title" | ... | "captionSmall"
export const TypeRamp: Readonly<Record<TypeVariant, TypeStep>> =
  Platform.select({ ios: iosRamp, default: androidRamp })
```

Both per-platform records are `satisfies Record<TypeVariant, TypeStep>`, so a missing step on
either platform is a `tsc` error. Only `TypeRamp` and the `TypeVariant` / `TypeStep` types are
exported (the per-platform records stay private, like `Fonts`).

### D2. `ThemedText` keeps the `type` prop; aliases resolve inside the component

- `ThemedTextType = TypeVariant | "default" | "small" | "smallBold" | "subtitle"`.
- A private `legacyTypeAliases: Record<"default" | "small" | "smallBold" | "subtitle",
  TypeVariant>` maps `default → body`, `small → callout`, `smallBold → label`,
  `subtitle → sectionTitle`. The component resolves `type` to a ramp step once, then applies
  `TypeRamp[step].style` and `dynamicTypeRamp={TypeRamp[step].dynamicTypeRamp}` (before
  `{...rest}`, so a caller `dynamicTypeRamp` wins).
- Default `type` is `"body"` (same rendering as `"default"`).
- The local `StyleSheet` in `themed-text.tsx` is deleted.

**Alternatives.** (a) Rename to `variant` now, as the proposal's primitive table sketches:
rejected for this slice. Two props for one concept is ambiguous, and renaming 148 call sites is
the phase 4.3 codemod that deletes the aliases anyway. (b) Put the aliases in `typography.ts`:
rejected. They are a `ThemedText` compatibility surface, not tokens, and phase 4.3 deletes them
with the component change. (c) `subtitle → title2`: rejected. Five of the eleven `subtitle`
sites are section headers (Hidden events ×2, Activity, Changelog, agenda day, calendar chooser),
and mapping to `sectionTitle` also removes Home's 20 → 32 jump between the filled and empty
"Up next" states on iOS (20 vs 20).

### D3. Heading role is an exhaustive record

```ts
const headingRole: Record<TypeVariant, boolean> = {
  largeTitle: true, title: true, title2: true, sectionTitle: true,
  headline: false, body: false, callout: false, label: false,
  footnote: false, caption: false, captionSmall: false,
}
```

The role is looked up on the resolved ramp step, so `subtitle` inherits `sectionTitle`'s `true`
and the other aliases inherit `false`. Adding a `TypeVariant` without a row is a `tsc` error.
`headline` is not a heading: it is the row/card title style, and a row title exposed as a
heading would flood the VoiceOver rotor. The record lives in `themed-text.tsx`, not in
`typography.ts`, because the role is authorial semantics the component owns
(accessibility.md), while the ramp is visual.

### D4. Alias remaps change rendered sizes (device-check list)

| Alias → step | iOS before → after | Android before → after | Sites |
| --- | --- | --- | --- |
| `default` → `body` | 16/24/500 → 17/22/400 | 16/24/500 → 16/24/400, +0.5 tracking | Every `ThemedText` without `type` (most body copy, all screens). Elements with a local `fontSize` but no `fontWeight` also lose 100 weight. |
| `small` → `callout` | 14/20/500 → 16/21/400 | 14/20/500 → 14/20/400, +0.25 | Error surfaces; Activity; agenda list; event details; Hidden events; Home today/upcoming/timeline/scroller; personal events list; school picker; timezone chooser; checklist progress (non-compact) |
| `smallBold` → `label` | 14/20/700 → 15/20/600 | 14/20/700 → 14/20/500, +0.1 | `PrimaryAction` label; error surfaces; every text action and field label across onboarding (welcome controls, connect, manual import, institution, programme), calendar (status, view menu, event-details actions/content, agenda), personal events (fields, actions, list), school group picker, Home (welcome card, today, upcoming, timeline, scroller), feedback, iCal URL, QR action, guide page, provider selection, Hidden events, Activity, checklist, timezone chooser |
| `subtitle` → `sectionTitle` | 32/44/600 → 20/25/600 | 32/44/600 → 22/28/400 | `EmptyState` title (all screen/section empty states incl. Home), `PageIntro` title (`root-page.tsx`), Hidden events section headers ×2, Activity group header, Changelog release header, agenda day header, calendar chooser title, import-result title, checklist title. The Settings brand header (`native-settings-header.tsx`) overrides size, line height and weight locally (28/34/700), so it renders unchanged |
| `title` → `title` | 48/52/600 → 28/34/700 | 48/52/600 → 28/36/400 | Splash app name, onboarding welcome page titles, event details title, guide page title |
| `caption`, `captionSmall` | unchanged | unchanged | Calendar renderer tiles |

Highest-risk sites for the device pass: splash and onboarding welcome (hero text drops 48 → 28),
`EmptyState variant="screen"` (32 → 20 on iOS; phase 3.3 moves it to `title2`), every
`PrimaryAction` label (weight), and Android headings (weight 600 → 400 per M3). A size the
device pass rejects is changed in `typography.ts` (one row) and in the test tables, nowhere
else.

### D5. `tone` is a closed union, exclusive with `themeColor`

```ts
type TextTone = "primary" | "secondary" | "action" | "destructive" | "onPrimary"
const toneColor: Record<TextTone, ThemeColor> = {
  primary: "text", secondary: "textSecondary", action: "actionText",
  destructive: "destructive", onPrimary: "onPrimary",
}
type ColorProps =
  | { tone?: TextTone; themeColor?: never }
  | { tone?: never; themeColor?: ThemeColor }
export type ThemedTextProps = TextProps & { type?: ThemedTextType } & ColorProps
```

Color resolves `themeColor ?? toneColor[tone ?? "primary"]`. `TextTone` is exported for phase
3 primitives.

**Decision: `tertiary` is left out** of the proposal's tone list. The only tertiary token,
`textTertiary`, is a 30%-alpha decorative tint documented as exempt from contrast; as a text
tone it would render text at roughly 1.6:1. A tertiary text tone needs a contrast-verified token
pair first (R-2: earned, not speculative). Alternative rejected: map `tertiary` to
`textSecondary` (two tones with one color is a silent alias).

`tone="primary"` means the primary label color (UIKit `.label`), not brand `primary`. The
naming follows the proposal; the JSDoc on `TextTone` states it, and the brand member's absence
is the type-level guard (L9).

### D6. Brand-text scan covers `label`

`brand-small-text.test.ts` matches `type="smallBold"` or `type="label"` with
`themeColor="primary"`. `tone` cannot express brand pink, so it needs no scan. The detector's
own fixture test gains a `type="label"` case.

### D7. Tests

- `src/theme/typography.test.ts`: per platform (`ios`, `android`) via the `isolateModules` +
  `doMock` pattern from `theme.test.tsx` (restore in `finally`), assert `TypeRamp` equals the D1
  table exactly (`toEqual` against a literal expected table in the test, so a value change is a
  visible two-place diff). Assert `lineHeight >= fontSize` for every step, that Android steps have
  no `dynamicTypeRamp`, that iOS steps have no `letterSpacing`, and that `caption` /
  `captionSmall` are equal across platforms.
- `src/components/themed-text.test.tsx` (iOS, the preset platform): a typed
  `Record<ThemedTextType, { step: TypeVariant; heading: boolean }>` expectations table drives
  `it.each`, so a new `type` without a row is a `tsc` error in the test too. Per row: header role
  present or absent (`getByRole` / `queryByRole`), flattened style matches
  `TypeRamp[step].style`, and `dynamicTypeRamp` prop equals `TypeRamp[step].dynamicTypeRamp`.
  Plus: no `type` renders `body`; each tone resolves its light token and one tone its dark token
  (scheme via `jest.mock("@/hooks/use-color-scheme", …)`, the `theme.test.tsx` / `empty-state.test.tsx` pattern); `themeColor` still resolves; caller
  `style` wins over the ramp; caller `accessibilityRole` wins; caller `dynamicTypeRamp` wins.
  Type-level: `// @ts-expect-error` on `tone="brand"`, `tone="tertiary"`, `type="huge"`, and
  `tone` + `themeColor` together (checked by `tsc`, which runs on test files).
- `home-screen.test.tsx`: the two empty-title assertions use `TypeRamp.sectionTitle.style`
  instead of literals.

### D8. ADR 063, not a book-only rule

The ramp changes every text style and amends the heading contract, which the roadmap lists as
ADR B. ADR 063 records: ramp in `theme/typography.ts`, platform-resolved (HIG + iOS Dynamic Type
ramps / M3 + tracking), aliases until phase 4.3, `tone` without brand or tertiary, heading role
per step. Revisit if the device pass or the accessibility workstream rejects a step, if Expo/RN
ships platform text styles natively (e.g. `PlatformFont`/text-style props on Android), or if a
custom font family is adopted.

## Risks / Trade-offs

- **Visible regressions across every screen.** Intended (owner-approved starting point). The
  device pass is the gate; the fix path is one row in `typography.ts`.
- **Android headings at weight 400 may read as weak** next to iOS bold. M3-correct; if the
  device pass disagrees, change the Android weight in D1 and record it in ADR 063.
- **iOS body grows to 17 with tighter line height (22).** Multi-line body blocks (changelog
  items, guide prose, captions) wrap more. Check text-clipping on iOS (known gotcha: uncapped
  Text clipping a trailing word).
- **Layouts tuned to 48/32 headings** (splash, welcome pager, event details header row with a
  `flex: 1` title) may now look sparse. Accepted until phase 5.
- **`dynamicTypeRamp` changes iOS scaling at accessibility sizes** for every non-caption step.
  This is the point (Apple's curve), but AX5 must be part of the device pass.
- **`tone="primary"` reads like brand `primary`.** Mitigated by the type (no brand member) and
  JSDoc; phase 4.3 can revisit the name when `themeColor` goes.
