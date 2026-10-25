# Assessment: is the current UI organization sound?

Date: 2026-10-25. Inputs: [screen-inventory.md](./screen-inventory.md),
[component-inventory.md](./component-inventory.md),
[duplication-and-drift.md](./duplication-and-drift.md), and a direct read of `src/theme/`,
`src/components/` and the Architecture Book. Every number below comes from those files; paths are
relative to the repo root.

## Verdict

The **layering is sound; the vocabulary is missing.** Routes → `features/<x>/ui` →
`components/` + `components/chrome/` → `theme/` is the right shape, and the parts the book
already encodes (thin routes, chrome seam for alpha APIs, `RootPage`/`PrimaryAction`/
`EmptyState`/`KeyboardSafeActionLayout`, the AA-documented token pairs) are better than most
production RN apps. What is missing is the layer between tokens and screens: a small set of
named primitives (text ramp, button family, list row, text field, status view, icon) with
lint behind them. Features therefore fill the gap locally, and the gaps show up as duplication,
a few contrast failures and two Android functional bugs.

Token discipline is already high. `Spacing.`/`Radii.` appear 315 times against 53 numeric
literals; production code has 5 hex literals (21 more are in the dev-only paging spike); no
file bypasses the color-scheme seam; every `Link asChild` and `NativeTabs.Trigger` child already
uses `StyleSheet.flatten` ([duplication-and-drift.md §B0](./duplication-and-drift.md#b0-summary-table)).
The drift is not in values; it is in **components and typography**.

## What is good (keep it)

- **Thin routes over feature UI.** All 37 screen routes are one-line re-exports
  ([screen-inventory.md §1](./screen-inventory.md#1-summary-table)); route structure is test-enforced
  (`mobile/src/components/settings-route-structure.test.ts`).
- **The chrome seam.** Alpha APIs (`@expo/ui`, native tabs, glass) have one import site each,
  lint-enforced (`mobile/eslint.config.js:319`, block `timecalendar/chrome-seams`).
- **The native-settings composition** (`mobile/src/components/chrome/native-settings.tsx`) is
  the best design-system work in the app: one closed row contract, real SwiftUI Form on iOS and
  Material 3 grouped segments on Android, brand tint/seed applied once, features pass copy and
  intent only (theming.md "Rule: feature screens never set tint…"). Ten screens are built from it
  with zero raw primitives.
- **Root-page semantics** (ADR 054): `RootPage` (23 consumers), `PageIntro`, `PrimaryAction`,
  `EmptyState`, `KeyboardSafeActionLayout`, `FieldError`/`ErrorNotice` already behave like DS
  primitives with tests and a11y contracts.
- **Tokens with documented contrast pairs** (`mobile/src/theme/tokens.ts:52-154`) and one
  color-scheme seam (`mobile/src/hooks/use-color-scheme.ts`).

## Issues ranked by impact

1. **No type ramp.** `ThemedText` has seven sizes and a gap from 16 to 32
   (`mobile/src/components/themed-text.tsx:45-84`): `title` is 48 and `subtitle` 32, far above
   the iOS `title1` (28) / M3 `headlineSmall` (24) a content heading needs. Features invent
   20/25/700, 20/28/600, 21/28/700, 28/34/700 and 30/36/700, or use the 32px `subtitle` as a
   section header (6 sites). Home "Up next" jumps 20 → 32 px between filled and empty states
   (`mobile/src/features/home/ui/home-screen/upcoming-section.tsx:57-65`). Two screens still
   render a 48px in-body title under the native title (guide page, event details).
2. **No button family beyond `PrimaryAction`.** 4 hand-rolled filled CTAs, 6 outlined, 4 neutral
   filled, 6 text buttons, 3 header-action mechanisms and 2 different RN FABs
   ([§A1–A6](./duplication-and-drift.md#a1-filled-brand-button-candidate-primaryaction-which-already-exists)).
   This is the single biggest source of literal drift (borderWidth, opacities, shadows).
3. **Accessibility defects from missing primitives.** Light-scheme brand `primary` (#E91E63,
   4.35:1) is used for 14px bold label text at 8 sites, below AA body
   (`mobile/src/features/onboarding/ui/welcome-controls.tsx:29`, `:78`;
   `connect-screen.tsx:103`; `hidden-events-screen.tsx:179`; `upcoming-section.tsx:75`;
   `event-checklist.tsx:96`; `guide-page-screen.tsx:290`; `personal-event-actions.tsx:61`); the
   right token, `actionText`, already exists (`tokens.ts:13`). `TagBubble` puts text on a
   server-supplied tag color. Text-field strokes use `backgroundSelected` (≈1.3:1 against white,
   unverified) below the 3:1 non-text bar. Several list Pressables have no pressed feedback.
4. **Two list systems.** Short lists use the native-settings seam; eight long or custom lists
   hand-build rows with different heights (56/64), press feedback, chevrons and separators
   ([§A7](./duplication-and-drift.md#a7-list-rows-candidate-the-nativesettings-seam-plus-one-rn-listrow)).
   The seam is named "settings" though nothing in it is settings-specific, and a second row API
   (`SettingsRow`/`SettingsSection`) lives inside the settings feature and is consumed only by
   *other* features (about, environment), which inverts ownership.
5. **Platform bugs hidden by local implementations.** Android personal events cannot pick a time:
   `DateTimeField` opens only `mode="date"` on Android
   (`mobile/src/features/personal-events/ui/date-time-field.tsx:72-83`) while iOS gets
   `datetime` (`:50-58`). `StatusSymbol` returns `null` on Android
   (`mobile/src/features/school-selection/ui/status-symbol.tsx:8`). The environment picker is an
   `Alert` with four buttons in development builds (Android shows three; unverified at runtime).
6. **Status states vary by feature.** 9 feature-local loading/empty/error variants, spinners in 5
   colors ([§A11](./duplication-and-drift.md#a11-empty-loading-and-error-states)).
7. **No text field.** Five restyled `TextInput` implementations, two of them duplicates of
   `step-styles.ts` ([§A12](./duplication-and-drift.md#a12-text-inputs-candidate-textfield)).
8. **Event-color vocabulary is split three ways.** The week grid draws the full event appearance:
   pale `surface` fill plus a 3px contrast-adjusted `accent` stripe
   (`mobile/src/features/calendar/renderer/owned-calendar-page.tsx:280-287`, values from
   `resolveEventAppearance`, `mobile/src/features/calendar/data/event-color.ts:91-103`). The agenda
   draws a neutral `backgroundElement` fill, a 2px stripe in the raw `event.color` (no 3:1 contrast
   adjustment) and the app's only card shadow (`agenda-list.tsx:197-200`, `:247-254`). Home cards
   draw the `surface` fill only, no stripe (`upcoming-scroller.tsx:108`, `today-timeline.tsx:210`,
   `:344`). Owner decision: the stripe is part of the event's color; every event tile uses the grid's
   surface + accent stripe, and the agenda shadow goes. theming.md's "no colored leading rail" rule
   stays for generic cards and gains an explicit event-tile exception (ADR F).
9. **Ambiguous homes.** `src/components/` has no barrel and no rule for what belongs there vs in
   `chrome/`. `chrome/` mixes two different things: thin alpha-API wrappers (ADR 010) and large
   composed product components (`native-settings.tsx` ≈ 24 KB, header, numeric editor, text
   dialog; ADRs 056/060). Calendar header icons tint `primary`, against navigation.md's "header
   items are not pink" (`mobile/src/features/calendar/ui/calendar-screen/calendar-screen-actions.tsx:40-72`).
10. **Lint covers seams, not visuals.** `mobile/eslint.config.js` has no rule for hex literals,
    numeric `fontSize`, legacy shadow props, raw `TextInput`/`ActivityIndicator` in feature UI,
    or `useColorScheme` from `react-native` (it holds by convention only). Under Principle 1 the
    current cleanliness is luck plus review, not a gate.
11. **Dev-only surfaces ship in store bundles.** `/dev-paging-spike`, `/dev-import` and
    `/settings-gallery` are runtime-gated (`isDevVariant()` / backend capability), not stripped
    ([screen-inventory.md](./screen-inventory.md#1-summary-table)). Harmless today, but any
    catalog must not follow that pattern.

## Ambiguities to settle

| Question | Current state | Recommendation |
| --- | --- | --- |
| `components/` vs `chrome/` | Implicit | `chrome/` = anything that imports an alpha/native-UI API (SwiftUI, Compose, native tabs, glass, unstable header items). `components/` = React Native-built primitives and page layout. Feature = anything with product nouns. |
| Is native-settings "settings"? | Name says yes, contents say no | Rename the public surface to `NativeList*` (keep `NativeSettings*` aliases during migration). |
| Where do cross-feature UI parts live? | `SettingsRow` in settings, consumed by about/environment; checklist UI consumed by calendar/home | Generic parts move to `components/`; product parts (checklist) stay feature-owned and exported through the barrel, as today. |
| Event visuals | Two vocabularies | One `EventSurface` vocabulary (dot / wash / block) owned by `components/`, consumed by Home, agenda, details. |

## Per-screen scorecard

Grades: **A** consistent with siblings, token-only, mostly shared components, no known a11y or
platform defect. **B** minor drift (local styles, some hand-built controls). **C** several
hand-built primitives, a known a11y/platform defect, or a pattern that diverges from siblings.
Reuse ratio = shared DS components ÷ (shared + feature-local + raw element count), from the
screen inventory. Grades are the auditor's judgment on those inputs.

| Screen | Consistency | Tokens | Reuse | A11y | Platform | Overall | Main reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Settings hub | A | A | A (4/5) | A | A | **A** | Pure seam |
| About | A | A | A | A | A | **A** | Seam, but via settings' adapter |
| Appearance / Language / Timezone settings | A | A | A | A | A | **A** | Seam |
| Notification settings + 3 children | A | A | A | A | A | **A** | Seam; native dialogs on Android |
| User calendars / detail | A | A | A | A | A | **A** | Seam + native header items |
| Institution name / iCal URL / Feedback | A | A | B | A | A | **A−** | Root-page primitives; each restyles `TextInput` |
| Calendar import result | A | A | B | A | A | **A−** | |
| Programme | A | A | B | A | B | **B+** | Header action split by platform by hand |
| Activity | B | A | C (5/19) | B | A | **B** | Card rows without press feedback; 32px section headers |
| Changelog / sheet | B | A | C | A | A | **B** | Hand-rolled CTA (opacity 0.8); custom Close |
| Provider selection / Guide page | B | A | C | C | A | **B−** | 48px in-body title; pink body text; card rows |
| QR scan | B | A | B | A | A | **B** | Outlined action button local |
| Hidden events | C | A | C | C | B | **C+** | Card rows, 32px section headers, pink "Unhide" |
| Personal events list | C | B | C | B | A | **C+** | Card rows, no press feedback, numeric literals |
| Personal event form | B | A | B | C | **C** | **C** | Android cannot set time; pink Delete not `destructive` |
| School picker | B | A | C | B | **C** | **C+** | Status icon missing on Android; iOS-only separator |
| School group picker | C | A | C | C | B | **C** | Selection shown by background only, no check; neutral-fill main CTA |
| Welcome / Connect / Manual import | C | B | C | C | B | **C** | Hand-rolled CTAs and outlined buttons; pink text |
| Timezone chooser | C | A | C (1/6) | B | B | **C+** | Hand-built rows next to seam siblings; no `RootPage` |
| Home | C | B | C (5/52) | B | B | **C** | 36 raw elements; own type scale; local FAB; `#000000` shadow |
| Event details | C | B | C | C | B | **C** | 48px title; `TagBubble` text on data color; unicode icons in checklist |
| Calendar | C | B | C (4/35) | B | C | **C** | Pink header icons; text-glyph FAB; custom `Modal` chooser; rail tiles |
| Paging spike (dev) | — | F | F | — | — | **n/a** | Throwaway spike; 21 hex literals; exclude from DS scope |

**Best exemplars:** the settings family (seam composition) and institution-name / iCal URL /
feedback (root-page composition). **Worst offenders:** Calendar, Home, Event details, onboarding
welcome/connect/import, personal-event form.

## De facto design system, needing only a name and a home

| Exists today as | Becomes |
| --- | --- |
| `ThemedText` (57 consumers) | `Text` ramp (keep the `ThemedText` name) |
| `PrimaryAction` (8) + 18 hand-rolled buttons | `Button` (`variant`, `size`, `icon`, `busy`) |
| `NativeSettings*` (11 screens) | `NativeList*` (same contract) |
| `RootPage`, `PageIntro`, `KeyboardSafeActionLayout`, `AdaptiveContent` | Page layout primitives (unchanged) |
| `EmptyState`, `ErrorState`, `ErrorNotice`, `FieldError`, `ListStatus`, `GuideLoading`… | `StatusView` family (`loading`/`empty`/`error`, `screen`/`section`/`inline`) |
| `stepStyles.input` + 4 copies | `TextField` |
| `RowSeparator` + hairline row borders | `Separator` |
| `native-settings-icons.ts` SF/Material pairs | `Icon` |
| `eventSurfaceColor` + dots/swatches | `EventSurface`, `ColorDot` |

## Device evidence (iOS simulator)

Checked on 2026-10-25 against a fresh development build of this branch (iPhone 17 Pro simulator,
iOS 26.5, default text size, light and dark). Android was not run: Android builds are not run on
the Mac host, so every Android claim in this audit comes from code reading.

- **Home, light:** the empty "Up next" heading renders at the 32px `subtitle` size, matching
  "Today", while the populated heading is 20px (issue 1). "See all" is small pink text on white
  (issue 3). The welcome card uses its own type scale.
- **Calendar:** the view-menu chevron and the header "+" are brand pink. Home's "+" uses the label
  color (issue 9). The accessibility tree also exposes a stray static text `"index"` at the header
  title position (route name leaking; source not traced, unverified).
- **Settings, light and dark:** the native-settings seam renders as intended (inset-grouped
  SwiftUI Form, brand icon tiles, tertiary chevrons) and is the visual reference the RN `ListRow`
  must match.
- **Hidden events (empty):** `EmptyState variant="screen"` with artwork renders well. The back
  button's accessibility label is `"(tabs)"`, the route-group name, not a localized title. Every
  root sibling pushed from a tab probably shares this; it needs a VoiceOver check and a fix in
  `buildCompactRootScreenOptions` or the tabs screen title (unverified beyond this screen).
