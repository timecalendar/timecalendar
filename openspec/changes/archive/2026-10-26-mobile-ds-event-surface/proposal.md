# Proposal

## Why

Event color is drawn three ways (`assessment.md` issue 8). The week grid draws the full event
appearance: a pale `surface` fill plus a 3px contrast-adjusted `accent` stripe, both from
`resolveEventAppearance`. The agenda draws a neutral `backgroundElement` fill, a 2px stripe in the
raw `event.color` with no 3:1 boundary adjustment, and the app's only card shadow
(`agenda-list.tsx`). The Home cards draw the `surface` fill with no stripe
(`upcoming-scroller.tsx`, `today-timeline.tsx`, `home-screen/today-section.tsx`). Home also puts
`textSecondary` time and location text on that tint, which measures 3.28–4.51:1 in light mode
across the eight swatch presets, below the 4.5:1 body floor. The owner decision of 2026-10-25
(design-system audit README, decision 4) is that the stripe is part of the event color: every
event tile uses the grid's tint and accent stripe, and the agenda loses its gray fill and shadow.
Roadmap slice 3.9 (`migration-roadmap.md`, last slice of phase 3) delivers this as the
`EventSurface` primitive, with ADR F. It unblocks the Home (5.9), event details (5.8) and
renderer-tile (5.11) migrations.

## What Changes

- **The event appearance resolver moves to the theme layer.** `resolveEventAppearance` and its
  color math move from `features/calendar/data/event-color.ts` to `src/theme/event-appearance.ts`
  and are exported from `@/theme`, so `src/design/` can use them (ADR 068 forbids design → features).
  The algorithm and its outputs do not change. The calendar presenters import it from `@/theme`.
  The week-grid renderer is not edited: it already draws `tile.appearance`, which now comes from
  the theme resolver. `eventSurfaceColor` and `features/home/ui/event-surface.ts` are deleted.
  The Android high-text-contrast hook moves from `features/calendar/data` to
  `src/hooks/use-increased-contrast.ts` so the primitive and the calendar presenter share it.
- **`EventSurface`** in `mobile/src/design/event-surface/`, exported from `@/design`: the shared
  event tile. It takes the stored `eventColor`, resolves the appearance for the current scheme and
  the increased-contrast signal, and draws the week-grid look: the `surface` fill, a 3-unit
  leading `accent` stripe, `Radii.medium` corners, no shadow, and a 2-unit `outline` border under
  increased contrast. It is one pressable accessibility element (`accessibilityRole="button"`,
  required `accessibilityLabel`, optional hint), with the iOS pressed opacity and the Android
  ripple. `placement` is `flow` (a minimum touch target and content height) or `absolute` (the
  caller's timeline geometry); `density` is `regular` or `compact` padding. `style` takes layout
  keys only and merges last. There is no color, shadow or radius prop.
- **`EventSurfaceText`** draws text in the resolved `foreground` (black or white, at least 4.5:1
  on the surface by construction). `numberOfLines` is required by type, so a tile line can never
  be uncapped. Title and detail lines are told apart by type step, not by a gray tone.
- **Checklist progress on a tile reads the surface.** `Badge` gains an `onEventSurface` tone (a
  1-unit outline and label in the surface foreground) that only renders inside an `EventSurface`.
  The checklist indicator uses it for the inline pill when inside a surface, and draws the
  `compact` pill in the foreground there. Outside a surface (the week-grid renderer), both keep
  their current status tones.
- **Call sites migrate** (every `testID` and accessible name kept; no Maestro selector changes):
  the Home upcoming card, the Home all-day item, the Home today-timeline tiles (positioned and
  reflowed) and the agenda tile. The Home tiles gain the stripe and their text moves to the
  foreground. The agenda tile drops `backgroundElement`, the raw-color stripe and the shadow. The
  agenda now-indicator column stays outside the tile. Labels keep the existing builders
  (`homeEventOpenLabel`, the agenda `calendar.agenda.event.openLabel*` keys).
- **Lint (Principle 1).** `local/no-raw-event-color` also reports per-side border colors
  (`borderLeftColor`, `borderRightColor`, `borderTopColor`, `borderBottomColor`,
  `borderStartColor`, `borderEndColor`) read from a `.color` member, and any call to
  `resolveEventAppearance` in a React component file outside the design layer, the theme module,
  the calendar renderer and tests. The allowlist stays at one entry (`event-details-content.tsx`,
  slice 5.8) with its ceiling pinned at 1.
- **Contrast is a test.** A theme test checks, for every swatch preset and the fallback color, in
  light and dark, with and without increased contrast: foreground on surface ≥ 4.5:1, accent
  against the canvas ≥ 3:1, and the surface opaque. A sweep over a 6×6×6 sRGB grid checks the
  same floors for arbitrary imported colors.
- **Gallery**: an `event-surface` fixture with every swatch preset and the fallback in both
  placements, both densities, the increased-contrast outline, checklist progress (partial and
  complete), the longest FR title, and the largest text size. `known-a11y-violations.ts` does not
  grow. FR/EN `gallery.eventSurface.*` keys.
- **Docs**: ADR 076 (event tiles share the grid's tint and accent stripe), theming.md (the
  event-tile exception to the no-rail rule, the `EventSurface` section, the resolver in the theme
  layer), accessibility.md, lint-format.md, calendar.md (the resolver's owner), features.md (Home,
  agenda, checklist), testing.md, architecture.md (the `event-surface/` family) and a dated
  CHANGELOG entry.

## Capabilities

### New Capabilities

- `mobile-design-system-event-surface`: the `EventSurface` and `EventSurfaceText` contracts (the
  grid look derived from the event color, foreground text, capped lines, one accessibility element,
  placement and density), the surface-aware checklist pill, the gallery fixture, and the Home and
  agenda migration that keeps identifiers and accessible names.

### Modified Capabilities

- `mobile-theming`: the event appearance resolver is part of the theme layer and its contrast
  floors are CI-checked for every palette color.
- `mobile-lint-format`: the raw event-color rule also covers per-side border colors and direct
  resolver calls in feature UI.
- `mobile-calendar-agenda`: an agenda tile is an event surface (tint and accent stripe), with no
  gray fill and no shadow.

## Impact

- **Code (`mobile/`)**: new `src/theme/event-appearance.ts` (+ test), `src/hooks/use-increased-contrast.ts`
  (+ test, moved), `src/design/event-surface/{event-surface,event-surface-context}` with tests and
  gallery. Changed `src/theme/index.ts`, `src/design/index.ts`, `src/design/badge/badge.tsx`,
  `src/design/gallery/registry.ts`, `features/calendar/data/{index,page-presenter,page-presentation,timeline-presentation}.ts`,
  `features/calendar/ui/agenda-list.tsx`, `features/home/ui/{upcoming-scroller,today-timeline}.tsx`,
  `features/home/ui/home-screen/today-section.tsx`,
  `features/event-checklists/ui/checklist-progress-indicator.tsx` and their tests,
  `src/i18n/locales/{en,fr}.json`, `tools/eslint-rules/no-raw-event-color{,.test}.js`,
  `jest.config.js` (90% rows). Deleted `features/calendar/data/event-color{,.test}.ts`,
  `features/calendar/data/use-increased-contrast{,.test}.ts` and `features/home/ui/event-surface.ts`.
- **Native**: none. No new dependency, no fingerprint change.
- **Visual**: Home cards and tiles gain the 3-unit accent stripe, `Radii.medium` corners and
  black/white text. Agenda tiles take the event tint, the adjusted accent stripe and
  `Radii.medium`, with no shadow. The week grid is unchanged.
- **Out of scope**: event details title dot, swatch and `TagBubble` (5.8), the rest of the Home
  migration (5.9), the week-grid renderer's own tile code (5.11), cancelled/past/hidden tile
  states (not named by the proposal), and a pixel-diff lane (owner decision 5).
