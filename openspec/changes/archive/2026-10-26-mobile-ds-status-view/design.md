# Design

## Context

See proposal.md → Why. Current state the approach builds on:

- `src/design/status/` holds `EmptyState` (`variant: "screen" | "section"`, title, caption,
  artwork, Android live region), its artwork records, and `error-surfaces.tsx`: `ErrorState`
  (fixed error glyph, title/message group with the `alert` role, filled primary `Button`,
  `ErrorTextAction` secondary), `ErrorNotice` (surface + `ErrorTextAction`), `FieldError`
  (alert text with an optional `nativeID`). `ErrorTextAction` is a raw `Pressable` text button the
  `local/no-raw-button` rule misses because its role is a variable.
- `useErrorAnnouncement(message, { native })` in `src/hooks/` announces on iOS on every message
  change (queued); on Android it announces only with `native: true`, because shared React Native
  surfaces carry a polite live region (decision from `harmonize-mobile-error-surfaces`). Chrome
  (`native-settings.tsx`, `native-error-notice.tsx`) calls it too.
- Call sites: `EmptyState` in 6 files (Home today, Home upcoming, Activity, personal-events list,
  hidden events, user calendars), `ErrorState` in 7 (export guides, Activity, school picker, group
  picker, backend-environment gate, import result, QR import), 12 distinct files.
  `ActivityIndicator` outside `src/design/` in 7 files. `ListEmptyComponent` in 4 files.
- ADR 067: `Button` variants and `ButtonRow`; ADR 068: family folders, `@/design` exports
  primitives only, design folders import each other by `@/design/<folder>/<file>`, the gallery is
  `@/design/gallery`; ADR 065: `Icon` with required `scaling`; ADR 063: `ThemedText` heading
  steps carry the header role.
- `useIsAccessibilityTextSize()` (`@/theme`) is the one accessibility-size threshold (1.786).
- The gallery never forces a font scale; the reviewer sets the device text size.
- Another branch edits `src/components/chrome/` and the DateTimePicker; this change does not touch
  chrome. `useErrorAnnouncement`'s existing signature stays valid for chrome.

## Goals / Non-Goals

**Goals:**

- One status primitive whose props make the common mistakes unrepresentable (an action on a
  spinner, artwork on an error, a raw spinner color).
- The full-screen state scrolls and never pushes content under the header at AX5.
- Screen-reader behavior owned by the primitive, provable in Jest: one announcement per
  appearance, heading titles, busy loading.
- A lint ratchet that keeps new screens off hand-built loaders and list empties.

**Non-Goals:**

- Toasts, banners, snackbars, skeleton loaders, pull-to-refresh, progress percentages.
- Changing `ErrorNotice` or `FieldError` beyond the action button and the dead prop.
- A `TextField` (slice 3.4) or `ListRow` (3.6).
- Migrating screens outside the 3.3 list beyond the mechanical `EmptyState`/`ErrorState` rename.

## Decisions

### D1. `EmptyState`, `ErrorState` and `ErrorTextAction` are removed, not aliased

The roadmap suggests aliases; the call-site count decides against them. Twelve files render one of
the two, each a prop rename (`variant` → `presentation`, `message` → `caption`, `primaryAction` →
`action`). Aliases would leave two ways to draw a status, need their own ratchet, and be deleted
in phase 5 anyway, which is the ADR 067 argument that removed `PrimaryAction`. `ErrorTextAction`
is a raw text button; `ErrorNotice`'s action and `StatusView`'s secondary render `Button
variant="text"` instead (same `MinTouchTarget`, `actionText` label, busy/disabled semantics owned
by `Button`). `ErrorAction` becomes `StatusAction`:

```ts
type StatusAction = Pick<ButtonProps,
  "label" | "onPress" | "accessibilityLabel" | "accessibilityHint" | "accessibilityRole" |
  "testID" | "disabled" | "busy">
```

The one `role: "link"` caller (iCal URL notice) passes `accessibilityRole: "link"`.

Rejected: aliases (two APIs, a second ratchet); keeping `ErrorTextAction` as a `Button` wrapper (a
second name for `Button variant="text"`).

### D2. Props are a discriminated union on `kind`

```ts
type Common = {
  presentation: "screen" | "section" | "inline"
  title: string
  announcementKey?: string
  testID?: string
  style?: StyleProp<StatusLayoutStyle>   // ButtonLayoutStyle keys
}
type Loading = Common & { kind: "loading" }
type Empty = Common & {
  kind: "empty"; caption?: string
  action?: StatusAction; secondaryAction?: StatusAction
} & ({ artwork?: StatusArtwork; symbol?: never } | { symbol?: StatusSymbol; artwork?: never })
type Failure = Common & {
  kind: "error"; caption?: string
  action?: StatusAction; secondaryAction?: StatusAction
}
export type StatusViewProps = Loading | Empty | Failure
```

`StatusArtwork` is the existing `{ light, dark }` image pair (renamed from `EmptyStateArtwork`);
`StatusSymbol` is `{ ios: SFSymbol; android: MaterialGlyph }` (the `ButtonIcon` shape). `style` is
layout-only and merges last, as `Button`'s does (ADR 067). The error kind always draws the fixed
`exclamationmark.circle` / `error_outline` glyph in `error`; there is no caller override.

Rejected: one flat prop bag (a spinner with a retry type-checks); `message` for the error caption
(two names for the same slot).

### D3. Three presentations; `screen` owns its scroll

| Presentation | Container | Alignment | Used by |
| --- | --- | --- | --- |
| `screen` | vertical `ScrollView` with `headerScrollProps(false)`, `contentContainerStyle` `{ flexGrow: 1, justifyContent: "center", paddingVertical: Spacing.five }` | centered, text centered | a page whose only content is the status (inside `RootPage`, which owns safe area and header inset) |
| `section` | plain `View`, `flexGrow: 1`, `justifyContent: "center"`, `paddingHorizontal: Spacing.four`, `paddingVertical: Spacing.five` | centered, text centered; vertically centered in whatever height the parent gives, content-sized in an unsized list slot | a `ListEmptyComponent`, or a status inside a page that already scrolls |
| `inline` | plain `View`, content-sized | leading, text leading | a status inside a content section (Home sections) |

The AX5 finding is a centered, non-scrolling column taller than its viewport. A `flexGrow` content
container inside a `ScrollView` centers while it fits and scrolls from the top once it does not, so
nothing rises under the header. The scroll lives in `screen` only: a `section` inside a
`FlatList`'s empty slot must not nest a second vertical scroll view. Callers that wrapped
`ErrorState` in their own `ScrollView` (export guides, import result, QR failure, Activity,
backend-environment gate) drop the wrapper, or use `section` when the wrapper carries other
content. `screen` fills its parent (`flex: 1`), so it is a non-function `RootPage` child (the lane
view is `flex: 1`) or sits in a `flex: 1` lane.

Rejected: an `onLayout` measure that switches to scrolling (a second layout pass, flicker on live
text-size change); `screen` without its own scroll and a Book rule "wrap it" (the defect exists
because that rule was implicit).

### D4. Media per kind, and artwork leaves at accessibility sizes

- `loading`: `ActivityIndicator` in `textSecondary`, size `large` for `screen`/`section` and
  `small` for `inline`, inside a `View` with `accessibilityElementsHidden` and
  `importantForAccessibility="no-hide-descendants"` (the Button finding: those props on the
  indicator itself leave the native iOS indicator exposed as "In progress"). `inline` lays the
  spinner and title in a row.
- `empty`: optional `artwork` (max width 280, height 200, `contentFit="contain"`, decorative) or
  `symbol` (`Icon` 40, `scaling="fixed"`, `textSecondary`).
- `error`: the fixed error glyph (`Icon` 40, `scaling="fixed"`, `error`).
- When `useIsAccessibilityTextSize()` is true, artwork is not rendered. The text then owns the
  viewport, which is what the HIG and Material large-text guidance ask for, and the illustration is
  decorative, so nothing is lost. Symbols and the error glyph are 40 pt and stay. The switch
  follows a live text-size change because the hook does.

Rejected: shrinking artwork with the font scale (it grows the wrong way: bigger text, smaller
picture, still competing for height); hiding symbols too (they carry the state at a glance and
cost 40 pt).

### D5. Semantics and roles

- `empty` / `error`: the title is `ThemedText type="sectionTitle"`, which carries the header role
  (ADR 063), then the caption as `body` in `textSecondary`. Neither group is `accessible`, so the
  heading stays a separate rotor stop and the caption a separate text stop; the error glyph,
  symbol and artwork are hidden. The error title keeps no `alert` role: `alert` collapses the
  heading into one group and neither VoiceOver nor TalkBack speaks a mounted alert by itself. The
  announcement (D6) carries the urgency.
- `loading`: one `accessible` element, `accessibilityRole="progressbar"`, `accessibilityLabel`
  = title, `accessibilityState={{ busy: true }}`, the visible title text inside it. The title is
  not a heading: a "Loading…" heading is rotor noise, and the state is transient. `progressbar` is
  the native semantic of an indeterminate indicator on both platforms (Android `ProgressBar`, iOS
  updates-frequently trait).
- Actions are `Button`s: `action` is `filled`, `secondaryAction` is `text`, stacked (primary
  first) with `Spacing.two`; full width in `screen`/`section`, intrinsic and leading in `inline`.
  `busy` on the action is `Button`'s busy (label kept, `{ disabled, busy }`). Stacked, not a
  `ButtonRow`: system empty/error views (`ContentUnavailableView`, Material empty states) stack a
  primary and a text action.

Rejected: role `text` with `busy` for loading (busy on a plain view is read by neither screen
reader); `alert` on the error title (above).

### D6. Announced once per appearance

`StatusView` calls `useErrorAnnouncement(spoken, { key: announcementKey ?? kind })` where `spoken`
is `title` for `loading` and `title. caption` otherwise. The hook gains an optional `key`: when
given, it announces on mount and when the key changes, not when the message changes under the
same key. That keeps the school no-results state, whose title embeds the query, from speaking on
every keystroke (the `ListStatus` `announceKey` behavior, now in the hook). Without `key` the hook
behaves as today, so chrome callers are untouched. The latest message is read from a ref updated in
an effect, not during render (React Compiler). Android announcement stays with the polite live
region on the `StatusView` root, the shared-surface rule; iOS uses the queued announcement.

Rejected: explicit Android announcements with `native: true` and no live region (deterministic,
but breaks the one-owner rule already recorded for every shared RN surface and the
`mobile-school-selection` live-region requirement); a separate `useStatusAnnouncement` hook (two
hooks with the same body).

### D7. Field errors fold into the field's hint

React Native forwards `aria-describedby` and `nativeID` relations to neither UIKit nor Android
views. The working, cross-platform channel a `TextInput` has is `accessibilityHint`: VoiceOver
reads it after label, value and trait; React Native on Android exposes it on the node (TalkBack
reads it after the name and the typed value). A new pure helper in
`src/design/status/field-error-hint.ts`:

```ts
export function fieldErrorHint(error: string | undefined, hint?: string): string | undefined
// error && hint → `${error}. ${hint}`; error → error; else hint
```

Every `TextInput` that renders a `FieldError` passes `accessibilityHint={fieldErrorHint(error,
hint)}`. `FieldError` keeps its alert text, Android live region and iOS announcement, so the error
is spoken when it appears and again whenever the field gains focus. `FieldError`'s `nativeID` prop
is deleted; `aria-describedby` becomes a lint error (D9).

Rejected: folding the error into `accessibilityLabel` (changes the field's name, which the field
identity and label selectors rely on); `accessibilityValue` (masks the typed text); Android
`accessibilityLabelledBy` (Android-only, and it names the field rather than describing it, so
TalkBack would read the error instead of the label).

### D8. Call-site mapping

Slice 3.3 (testIDs unchanged):

| File | Today | After |
| --- | --- | --- |
| `school-selection/ui/school-picker-screen.tsx` | `ListStatus` loading/no-results/empty, `ErrorState`, `MissingSchoolAction` raw link | `StatusView` `section`: loading; `empty` + `symbol` `magnifyingglass`/`search`, `announcementKey="noResults"`, missing-school `secondaryAction`; `empty` + `graduationcap`/`school`, `announcementKey="empty"`; `error` with retry. `MissingSchoolAction` → `Button variant="text" size="small"` with its hint (footer and status) |
| `school-selection/ui/list-status.tsx`, `status-symbol.tsx` (+ tests) | feature-local status | deleted; their tests' assertions move to `status-view.test.tsx` and the picker test |
| `school-selection/ui/school-group-picker-screen.tsx` | plain loading/empty text, `ErrorState` | `StatusView` `section` loading and empty, `error` with retry; Confirm stays (5.5) |
| `export-guides/ui/guide-status.tsx` | `GuideLoading` row, `GuideBlockingError` in a `ScrollView` | `RootPage lane="readable"` + `StatusView` `screen` loading / `error` (retry `busy`, Back secondary) |
| `calendar-sources/ui/import-progress-view.tsx` | spinner + text | `RootPage` + `StatusView` `screen` loading; component and default `testID` kept |
| `calendar-sources/ui/calendar-import-result-screen.tsx` | `ErrorState` in a `ScrollView` | `StatusView` `screen` `error`; success view unchanged (5.7) |
| `calendar-sources/ui/qr-import-views.tsx` | `ErrorState` in a `ScrollView` | `StatusView` `screen` `error` |
| `calendar-sources/ui/user-calendars-screen.tsx` | `EmptyState screen` in a lane view | non-function `RootPage` child `StatusView` `screen` `empty`; still mounted only after `loaded` |
| `calendar/ui/event-details-status.tsx` | default spinner; plain not-found text | `StatusView` `screen` loading; not-found `empty` + `symbol` `calendar.badge.exclamationmark`/`event_busy`; lane testIDs kept |
| `settings/ui/timezone-chooser-screen.tsx` | `summary` view with text | `ListEmptyComponent` `StatusView` `section` `empty` + `magnifyingglass`/`search`, `announcementKey="noResults"`, `testID="timezone-no-results"` |

Mechanical renames outside 3.3 (no layout change beyond the primitive's): Home today and upcoming
(`inline`), Activity empty (`screen` is wrong inside its `SectionList` empty slot → `section`) and
its empty-error (`screen`, wrapper dropped), personal-events list (`section`, in
`ListEmptyComponent`), hidden events (`section`, inside the page scroll), backend-environment
gate (`section` error inside its recovery `ScrollView`). Their spinners stay (D9 allowlist).

The Material glyph `event_busy` joins `MATERIAL_GLYPHS`, pinned by `icon.test.tsx` against
expo-symbols' font table (`search`, `school`, `error_outline` exist).

### D9. Lint: one ratcheted local rule and one syntax ban

`tools/eslint-rules/no-ad-hoc-status.js` (registered in `index.js`), modeled on `no-raw-button`:

- reports a named `ActivityIndicator` import from `react-native` (aliases included);
- reports a `ListEmptyComponent` JSX attribute whose value is a JSX element, or a component
  identifier, not named `StatusView`, looking through conditional and logical expressions and
  fragments; `null`/`undefined` branches pass.

Block `timecalendar/ad-hoc-status`: `files: ["src/**/*.tsx"]`, ignores `src/design/**`,
`src/components/chrome/**`, `src/features/calendar/renderer/**`, `**/*.test.tsx`, and
`adHocStatusAllowlist`. The allowlist after migration, each with its removing slice:

- `src/features/activity/ui/activity-screen.tsx` — 5.4 (loading, older-page footer, empty slot)
- `src/features/environment/ui/environment-runtime-gate.tsx` — 3.5 (recovery progress)
- `src/features/calendar-sources/ui/dev-import-screen.tsx` — 5.7 (developer import progress)

`ad-hoc-status-allowlist.test.js` mirrors `raw-button-allowlist.test.js` (ceiling 3, each entry
exists, each still violates, no duplicates). Plain-text empties are invisible to lint by design;
the remaining ones are listed in the proposal's Out of scope and in the Book.

`aria-describedby` joins the shared `restrictedSyntax` list
(`JSXAttribute[name.name='aria-describedby']`, message: "React Native forwards no described-by
relation; fold the error into accessibilityHint with fieldErrorHint (ADR 069)"), so every block
that spreads the list carries it.

`school-picker-screen.tsx` leaves `raw-button-allowlist.js`; the ceiling drops to 15.

Rejected: `no-restricted-imports` for `ActivityIndicator` (the import-policy flag matrix in
ADR 068 is fragile and the policy test would grow a dimension); banning `FlatList` empties via
`no-restricted-syntax` (the selector cannot exempt `StatusView` through conditionals cleanly).

### D10. Gallery fixture

`src/design/status/status-view.gallery.tsx`, meta `status-view`, title
`gallery.statusView.title`. Stories (ids `status-view--<kebab>`):

| Export | Id | Content |
| --- | --- | --- |
| `LoadingScreen` | `loading-screen` | `screen` loading in `RootPage` |
| `LoadingSection` | `loading-section` | `section` loading under a section title |
| `LoadingInline` | `loading-inline` | `inline` loading in a content stack |
| `EmptyScreen` | `empty-screen` | `screen` empty, title + caption, no media |
| `EmptyScreenArtwork` | `empty-screen-artwork` | `screen` empty with `noDataArtwork` and a filled action |
| `EmptySection` | `empty-section` | `section` empty with a symbol and a text secondary action |
| `EmptyInline` | `empty-inline` | `inline` empty under a section heading |
| `ErrorScreen` | `error-screen` | `screen` error, retry + secondary, press counter |
| `ErrorRetryBusy` | `error-retry-busy` | `screen` error, retry `busy`, secondary disabled |
| `ErrorSection` | `error-section` | `section` error with retry |
| `LongStrings` | `long-strings` | `screen` empty with artwork, `gallery.stress.*` title/body, both actions; a caption line names whether artwork is shown (`useIsAccessibilityTextSize()`) |

"Largest text size" is a device condition, not a story: the gallery does not force a font scale
(ADR 064, the ButtonRow precedent), so `long-strings` at AX5 is the AX check and the caption says
which branch is active. Jest drives the font-scale branch by mocking `useWindowDimensions`.

`empty-state.gallery.tsx` is deleted with `EmptyState`; `error-surfaces.gallery.tsx` drops
`State`, `StateBusy` and its state long-strings content (its `LongStrings` becomes a long
`ErrorNotice`) and keeps `notice`, `notice-compact`, `field-error`, `long-strings`; its field-error
story uses `fieldErrorHint`. A colocated `status-view.gallery.test.tsx` proves the press counter
and the busy story. FR/EN `gallery.statusView.*` keys are added; `gallery.emptyState.*` and the
state-only `gallery.errorSurfaces.*` keys are removed.

### D11. Coverage

`src/design/status/status-view.tsx` and `src/design/status/field-error-hint.ts` get the 90%
lines/branches tier in `jest.config.js` (Button precedent). `src/hooks/**` is already at 90%;
`use-error-announcement.ts` gains a colocated test (it has none today) covering the `key` path.

### D12. ADR 069

`docs/mobile/architecture-book/decisions/069-status-view.md`: D1 (removal, not aliases), D2–D3
(kinds, presentations, `screen` scrolls), D4 (artwork at AX sizes), D5–D6 (roles, announcement
ownership), D7 (field errors via hint), D9 (ratchet). Re-check open PRs for a reserved 069 before
writing.

## Risks / Trade-offs

- [Android live region re-speaks a changed title under the same key, e.g. the no-results query] →
  polite regions coalesce; same as today's `ListStatus`; recorded for the device pass.
- [`progressbar` on Android may read "in progress" after the label] → native Android behavior for
  an indeterminate indicator; device pass confirms wording.
- [TalkBack hint delivery on `TextInput` varies by Android version] → `FieldError`'s live region
  still announces on appearance; the screen-reader pass (inbox) verifies the field reads it on focus.
- [A caller puts `screen` inside a scroll view or list] → lint cannot see the nesting; the Book and
  the type doc name the rule, the `ListEmptyComponent` check steers lists to `section` by example,
  and review catches the rest.
- [Visual drift on migrated screens (spinner color, title step, text secondaries)] → intended
  convergence; the gallery and conductor device pass cover each story; copy and selectors stay.
- [Removing `EmptyState`/`ErrorState` touches screens owned by later slices] → prop renames only,
  each file's existing test re-run; no layout restructure beyond dropped `ScrollView` wrappers.

## Migration Plan

One PR: primitive + hook + helper + tests, gallery, call-site migration, deletion, lint, docs.
Rollback is a revert; nothing persists and the app is not in production.
