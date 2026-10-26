# Design

## Context

- **The reference look is the week grid.** `features/calendar/renderer/owned-calendar-page.tsx`
  (`tileSurfaceStyle`) draws `backgroundColor: appearance.surface`, `borderLeftWidth: 3`,
  `borderLeftColor: appearance.accent`, and under increased contrast `borderWidth: 2` in
  `appearance.outline`. Its text is `appearance.foreground`. The appearance comes from
  `resolveEventAppearance` in `features/calendar/data/event-color.ts`, computed in the presenters
  (`page-presentation.ts`, `timeline-presentation.ts`) with `useCalendarIncreasedContrast`
  (Android `isHighTextContrastEnabled`; iOS has no supported signal and uses the normal policy).
  The renderer is behind the ADR 033 boundary and its worklet rules; this slice does not edit it.
- **The resolver guarantees the floors by construction.** `surface` composites the source over the
  scheme canvas (35% alpha, 20% under increased contrast). `foreground` is black or white,
  whichever contrasts more with the surface, so it is ≥ 4.58:1 on any opaque surface. `accent`
  steps the source toward the foreground until it reaches 3:1 against the canvas. Invalid input
  falls back to `#64748B`.
- **The other tiles drift from it.** The agenda tile (`calendar/ui/agenda-list.tsx`) has a
  `backgroundElement` fill, `borderLeftWidth: Spacing.half` in raw `event.color`, `Radii.large`
  and a shadow (`shadowOpacity 0.06`, `elevation 2`). The Home upcoming card
  (`home/ui/upcoming-scroller.tsx`), the all-day item (`home/ui/home-screen/today-section.tsx`)
  and both today-timeline tiles (`home/ui/today-timeline.tsx`, positioned and reflowed) take
  `eventSurfaceColor(event.color, scheme)`, `Radii.large`, no stripe, and `text` / `textSecondary`
  text. Measured on the light tint of the eight presets (`SWATCH_PRESETS`) and the fallback,
  `textSecondary` reaches 3.28–4.51:1, so Home time and location lines fail AA today; the
  foreground reaches 11.6–15.9:1.
- **Checklist pills sit on those tiles.** The inline pill is a `Badge` in `positive` or
  `informational`, an outline with a transparent fill (ADR 074). On the agenda's gray fill it
  passed; on a light tint it measures 3.53–4.89:1. The `compact` pill (Home timeline and grid)
  draws the same tones.
- **Layering.** `src/design/` must not import `features/**` (ADR 068, enforced by
  `design-import-policy.test.js` and `import-graph.contract.test.ts`); it may import `@/theme` and
  `@/hooks` (`date-time-field.tsx` already imports `@/hooks`).
- **Lint today.** `local/no-raw-event-color` (ADR 074) reports `backgroundColor`/`borderColor`
  from a `.color` member in `src/**/*.tsx`, ignoring `src/design/**`, `src/theme/**`, the calendar
  renderer and tests, with one allowlisted file (`event-details-content.tsx`, 5.8) at ceiling 1.
  Its documented blind spots include per-side border keys (the agenda stripe) and calls.
- **Selectors.** No Maestro flow names a tile testID; flows tap tiles by accessible name
  (`tapOn: "E2E Imported Lecture(,.*)?"` in `01-fresh-user-import.yaml`), so each label must still
  start with the title. Jest suites use `upcoming-card-<id>`, `today-tile-<id>`,
  `agenda-event-<id>[-progress-<c>-<t>]`, `today-timeline-list`, `home-all-day`.
- The app is not in production; Flutter is the parity bar, and the native platform is the design
  reference (R-2/R-3). Owner decisions (2026-10-25): every event tile uses the grid's tint and
  accent stripe, the agenda shadow goes, no pixel-diff lane.

## Goals / Non-Goals

**Goals:**

- One primitive draws every event tile outside the week-grid renderer, with the grid's look,
  derived from the event color through one resolver.
- Text on a tile meets 4.5:1 and the stripe 3:1 for every palette color in both schemes, proven
  by a test, not by review.
- Text on a tile grows with the OS text size and is always line-capped (type-level).
- Each tile is one accessibility element whose name comes from the existing label builders.
- Lint closes the agenda-stripe blind spot and the resolver-call path.

**Non-Goals:**

- Editing the week-grid renderer (5.11 decides whether it renders through `EventSurface`).
- Event details' title dot, swatch and `TagBubble` (5.8); the rest of Home (type scale, FAB,
  raw elements, 5.9).
- Cancelled, past or hidden tile states: the design-system proposal names none for `EventSurface`.
- A `dot` variant (see D2), a generic `Card`, a pixel-diff lane.

## Decisions

### D1. The resolver moves to `src/theme/event-appearance.ts`

`resolveEventAppearance`, `EventAppearance`, `EventAppearanceScheme` and the fallback color
(`EventFallbackColor = "#64748B"`) move to `src/theme/event-appearance.ts` and are exported from
`@/theme`. The Rgb helpers (`parseOpaqueHex`, `compositeRgb`, `relativeLuminance`, the Rgb
`contrastRatio`) stay private to the module, so they do not collide with the hex `contrastRatio`
in `theme/contrast.ts`; the module may reuse `contrast.ts` where the signature fits. Outputs are
byte-identical: the existing deterministic vectors in `event-color.test.ts` move into
`event-appearance.test.ts` unchanged. `features/calendar/data/event-color.ts` and its test are
deleted; the calendar presenters and `page-presenter.test.ts` import from `@/theme`; the calendar
data barrel drops the re-exports. `CALENDAR_EVENT_FALLBACK_COLOR` is replaced by the theme
constant at every reference (check with `findReferences` before deleting). `eventSurfaceColor`
and `features/home/ui/event-surface.ts` are deleted (no consumer remains after D7).

`useCalendarIncreasedContrast` moves to `src/hooks/use-increased-contrast.ts` as
`useIncreasedContrast(platform = Platform.OS)`, with its test; `page-presenter.ts` imports it.

Alternatives: (a) `EventSurface` takes a resolved `appearance` prop: every caller would resolve
colors, which is the drift this slice removes, and the proposal names `eventColor`. (b) Keep the
resolver in calendar and lift only an interface: design still cannot call it. (c) A
`src/design/event-surface/resolve.ts`: the presenters (feature `data/`) would import a UI layer.
The theme layer already owns color math and contrast (`contrast.ts`), so it is the natural owner.

### D2. `EventSurface` is the tile; there is no `dot` variant

The proposal sketches `variant: "dot" | "tile"`. ADR 074 already made `ColorDot` the dot and left
"`EventSurface` absorbs the dot's data-color role" as a revisit trigger. A closed union with one
meaningful member is noise, and a dot inside a tile primitive would duplicate `ColorDot`. So
`EventSurface` has no `variant` prop: it is the tile. ADR 074's trigger is answered "no, the dot
stays `ColorDot`" in ADR 076.

### D3. Anatomy and geometry

```ts
type EventSurfaceProps = {
  eventColor: string
  accessibilityLabel: string
  accessibilityHint?: string
  onPress: () => void
  placement?: "flow" | "absolute"   // default "flow"
  density?: "regular" | "compact"   // default "regular"
  testID?: string
  style?: StyleProp<EventSurfaceLayoutStyle>
  children: ReactNode
}
```

- Fill `appearance.surface`; leading stripe `borderLeftWidth: 3` in `appearance.accent` (the grid
  value, as a named constant `EVENT_STRIPE_WIDTH`); under increased contrast `borderWidth: 2` in
  `appearance.outline` with the 3-unit leading edge kept. No shadow, no elevation.
- Corners `Radii.medium` (8). The grid's 2-unit radius suits 14-pt-tall grid tiles, but Home and
  agenda cards are content-height cards; `Radii.large` (16) with a 3-unit leading border renders
  as a curved rail, which theming.md calls a template tell. `Radii.medium` keeps the stripe
  straight along the card's height.
- `overflow: "hidden"`, `gap: Spacing.half`. `density` sets padding: `regular` `Spacing.three`
  (cards, agenda), `compact` `Spacing.two` (all-day items, timeline tiles).
- `placement: "flow"` sets `minHeight: MinTouchTarget` and `justifyContent: "center"`; content
  height grows with text. `placement: "absolute"` sets `position: "absolute"` and no minimum
  height: the caller's `top`/`left`/`width`/`height` from the overlap engine own the geometry,
  exactly as the today-timeline tile does today (its large-text reflow keeps using `flow`).
- `EventSurfaceLayoutStyle` is a `Pick<ViewStyle, …>` of layout keys only: `position` is not in it
  (set by `placement`), but `top`, `left`, `right`, `bottom`, `width`, `height`, `flex`,
  `flexGrow`, `flexShrink`, `alignSelf` and the margins are. `style` merges last. No color, radius,
  border, shadow or padding key compiles (`@ts-expect-error` tests).
- Pressed state: Android `android_ripple={{ color: theme.ripple, foreground: true }}`; iOS
  `opacity: StateOpacity.pressed` while pressed (the token, replacing the Home-local 0.62).

### D4. Text: `EventSurfaceText` in the foreground, line-capped by type

`EventSurface` provides its resolved appearance through `EventSurfaceContext`
(`src/design/event-surface/event-surface-context.ts`, a leaf with no component import), with a
`useEventSurfaceAppearance(): EventAppearance | undefined` hook. `EventSurfaceText` is a
`ThemedText` without `tone`/`themeColor` whose color is `appearance.foreground`; it throws when
rendered outside an `EventSurface` (a programming error, caught by its test). Its
`numberOfLines` is a required `number` prop (encodes the iOS trailing-word clip rule: an uncapped
iOS `Text` clips a long last word), and `ellipsizeMode="clip"` and `adjustsFontSizeToFit` are
omitted from its props. Every line is `accessible={false}` (the surface is the element).

Hierarchy comes from the type step: titles use `label` (the `smallBold` alias), detail lines
(time, location) use `callout` (the `small` alias), positioned timeline tiles keep `callout` for
the title as today. All lines are the foreground color.

Alternative rejected: a secondary foreground (the foreground composited toward the surface at
reduced alpha). It adds a second derived color whose floor must be found per color; the grid draws
title and location in one foreground, and that is the reference look.

### D5. One accessibility element, existing labels

`EventSurface` renders one `Pressable` with `accessible`, `accessibilityRole="button"`, the
required `accessibilityLabel` and the optional `accessibilityHint`; children never become
separate elements. Callers keep their builders: Home passes `homeEventOpenLabel(t, event, time,
progress)` and the `home.event.hint.details` / `home.event.hint.edit` hint; the agenda keeps its
`calendar.agenda.event.openLabel` / `openLabelWithProgress` composition. Each label starts with
the title, so the Maestro name selectors keep matching.

### D6. Checklist progress reads the surface (`Badge` tone `onEventSurface`)

`Badge` gains tone `onEventSurface`: a 1-unit outline and a label, both in the surrounding
surface's `foreground`, read through `useEventSurfaceAppearance()`. It throws outside a surface.
`badge.tsx` imports only the context leaf, so no cycle forms (the context module imports
`@/theme` types only). In `ChecklistProgressIndicator`, when `useEventSurfaceAppearance()` returns
an appearance, the `inline` pill uses `onEventSurface` and the `compact` pill draws its border,
glyph and count in the foreground; otherwise both keep `positive`/`informational`. Complete and
partial stay distinct by glyph (`checkmark.square.fill` / `square`, `check_box` /
`check_box_outline_blank`), so color is not the only signal. The week-grid renderer is not inside
an `EventSurface`, so grid tiles are unchanged (5.11).

Alternatives: (a) Leave the pills as they are: the agenda migration would move the inline pill from
a passing gray fill to a failing tint (3.53:1 on pink). (b) Give the pill an opaque fill on the
tile: a pill-in-a-card look and a new token pair per color. (c) Silently swap all status tones
inside a surface: implicit, and a `destructive` badge would lose its meaning.

### D7. Call-site mapping

| Site | Placement / density | Lines (type, `numberOfLines`) |
| --- | --- | --- |
| Home upcoming card (`upcoming-card-<id>`, width 200) | flow / regular | title label 2, time callout 2, location callout 1, inline pill |
| Home all-day item (in `home-all-day`) | flow / compact | title label 2, inline pill |
| Home timeline positioned tile (`today-tile-<id>`) | absolute / compact | title callout 2, location callout 1 (when `showText`), compact pill |
| Home timeline reflowed tile (`today-tile-<id>` in `today-timeline-list`) | flow / compact | time callout 2, title label 3, location callout 2, inline pill |
| Agenda tile (`agenda-event-<id>[-progress-…]`) | flow / regular, `style={{ flex: 1 }}` | title label 2, time callout 2, location callout 1, inline pill |

The reflowed list is the large-text layout, so it allows one more line for title and location;
every line is now capped (the reflowed title and location were uncapped). The agenda row keeps its
`indicatorColumn` (the brand now marker, labelled `calendar.agenda.nowLabel`) outside the tile.
Every `testID` and label is kept. The `tile` style's shadow comment, the Home `iosPressed` styles
and `eventSurfaceColor` imports go.

### D8. Contrast is a CI test, for the palette and a sweep

`src/theme/event-appearance.test.ts` checks, for each color in the gallery palette (D10: the eight
`SWATCH_PRESETS` and `EventFallbackColor`) × `light`/`dark` × increased contrast on/off:
`contrastRatio(foreground, surface) ≥ 4.5`, `contrastRatio(accent, canvas) ≥ 3`, and every output
an opaque `#RRGGBB`. A second `it.each` sweeps the 216-color grid (`00`, `33`, …, `FF` per channel)
for the same floors, because imported school colors are arbitrary. The palette list is imported
from `@/features/personal-events/ui/color-swatch-presets` in the test only (tests are not graph
edges, ADR 068); the gallery's own copy is asserted equal to it in the gallery test.

### D9. Lint: per-side borders and resolver calls

`no-raw-event-color` extends its key set to `backgroundColor`, `borderColor`, `borderLeftColor`,
`borderRightColor`, `borderTopColor`, `borderBottomColor`, `borderStartColor`, `borderEndColor`,
and adds a `CallExpression` check: a call whose callee is the identifier `resolveEventAppearance`
(or a member ending in it) is reported with a second message id `eventAppearanceCall` ("Event
tiles are EventSurface from @/design (ADR 076)"). The scope (`src/**/*.tsx`), ignores and the
allowlist are unchanged; `.ts` presenters stay outside `files`, so the calendar data layer keeps
calling the resolver. The allowlist ceiling stays pinned at 1 (`event-details-content.tsx`).
RuleTester gains invalid cases for `borderLeftColor: event.color`, `borderStartColor: item?.color`
and `resolveEventAppearance({ … })`, and a valid case for `borderLeftColor: theme.primary`; the
`eventSurfaceColor(...)` valid case becomes a generic call (`mix(event.color)`), because the helper
is gone. Remaining caveat: a color passed through a variable, an arbitrary helper or a `color=` JSX
prop is not followed.

### D10. Gallery

`src/design/event-surface/event-surface.gallery.tsx`, meta `id: "event-surface"`, stories:

- `Palette`: the eight presets and the fallback as `flow`/`regular` tiles with title, time and
  location (the palette constant is local; D8 asserts it equals `SWATCH_PRESETS`).
- `Placements`: `flow` vs `absolute` (inside a fixed-height frame) and `regular` vs `compact`.
- `IncreasedContrast`: the palette with a caption naming the current signal state from
  `useIncreasedContrast()` (`gallery.eventSurface.contrast.on` / `.off`). The signal cannot be
  forced at runtime and `EventSurface` takes no appearance override (an override prop would
  reopen raw colors), so the outline is seen on an Android device with high-text-contrast on and
  asserted in Jest with the hook mocked.
- `Checklist`: partial and complete inline pills and a compact pill on a tile.
- `LongStrings`: the longest FR title in `gallery.eventSurface.*` with a long location, plus the
  text-size caption pattern from `badge.gallery.tsx` (`gallery.eventSurface.textSize.accessibility`
  / `.standard`) so the largest text size is named on device.

Every tile has a label built like Home's (title, time, location), so the registry a11y matrix
finds no unlabeled element and `known-a11y-violations.ts` does not change. Registered after
`colorDot`. FR/EN keys under `gallery.eventSurface.*`.

### D11. Tests and coverage

- `event-surface.test.tsx` (iOS and Android via `usePlatform`, both schemes via the
  `@/hooks/use-color-scheme` mock, the increased-contrast hook mocked): fill, stripe width and
  accent, radius, no shadow keys, outline under increased contrast, invalid color → fallback
  appearance; one element with role, label, hint and testID, children not separately accessible;
  `onPress`; iOS pressed opacity token and Android ripple; `flow` min height vs `absolute`
  position; density padding; style merges last; `EventSurfaceText` foreground color, required
  `numberOfLines` passthrough, throw outside a surface; growth at `fontScale` 3 (no
  `adjustsFontSizeToFit`, lines still capped). `@ts-expect-error` for a missing
  `accessibilityLabel`, a `backgroundColor`/`shadowOpacity`/`borderRadius` style key, a `color`
  prop and an `EventSurfaceText` without `numberOfLines`.
- `badge.test.tsx`: `onEventSurface` inside a surface (foreground outline and label, per scheme)
  and its throw outside. `checklist-progress-indicator.test.tsx`: both variants inside and outside
  a surface.
- Call-site suites (`home-screen.test.tsx`, `today-timeline.test.tsx`, `calendar-screen.test.tsx`
  or the agenda suite): each tile keeps its testID and label, has the stripe in the resolved
  accent, no shadow on the agenda tile, and text in the foreground.
- `jest.config.js`: `src/design/event-surface/event-surface.tsx` and
  `src/design/event-surface/event-surface-context.ts` at `{ lines: 90, branches: 90 }`.
  `src/theme/**` and `src/hooks/**` are already 90%-gated.

### D12. ADR 076

`docs/mobile/architecture-book/decisions/076-event-surface.md` records ADR F: event tiles share
the grid's tint and accent stripe (owner decision), the theme-owned resolver (D1), no `dot`
variant (D2), the geometry and `Radii.medium` (D3), foreground-only text with type-capped lines
(D4), the surface-aware checklist pill (D6), the lint extension (D9), and the theming.md event-tile
exception: the "no colored leading rail" rule stays for generic cards; an `EventSurface` stripe is
the event's color, not decoration. Rejected: resolved `appearance` prop, `dot` variant,
`Radii.large`, a secondary foreground, the gray agenda fill and shadow, editing the renderer now.
Revisit if: 5.11 moves grid tiles onto `EventSurface`; a cancelled/past state is specified; iOS
gains a supported increased-contrast signal.

## Risks / Trade-offs

- [Visual change on Home and agenda] → owner-decided; device evidence in both schemes on iOS
  (conductor) and Android (inbox) before merge of 5.9 builds on it.
- [Black text on a dark-scheme tint is never chosen; white on light never chosen] → by the
  resolver: the foreground is whichever endpoint contrasts more, so a light-scheme tint can get
  white text only if the tint is darker than mid-gray, which 35% over white never is. The sweep
  test proves the floors either way.
- [The grid's own compact pill still draws status tones on its tint (3.5–4.9:1 in light)] → the
  renderer is out of scope; recorded in ADR 076 consequences for 5.11.
- [Moving the resolver touches the calendar presenters] → outputs are byte-identical, pinned by
  the moved deterministic-vector test and `page-presenter.test.ts`; the renderer file is not edited.
- [`onEventSurface` throws outside a surface] → only reachable by a programming error; tested.
- [Android TalkBack and high-text-contrast rendering] → device evidence, inbox note.

## Migration Plan

Three commits on `feat/mobile-ds-event-surface`:

1. Theme resolver and hook move (D1) with tests; calendar presenters import from `@/theme`; no
   visual change. `npm test` green.
2. `EventSurface`, `EventSurfaceText`, the context, `Badge` `onEventSurface`, the checklist
   indicator, the gallery, the call-site migration (D7) and the lint extension (D9).
3. ADR 076, Architecture Book, CHANGELOG.

Rollback: revert the branch; there is no data or native change.
