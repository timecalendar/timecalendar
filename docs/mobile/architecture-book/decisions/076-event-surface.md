# 076 — Event surface

## Status

Accepted.

## Context

Event color was drawn three ways (design-system audit `assessment.md` issue 8). The week grid drew
the full event appearance: a pale `surface` fill and a 3-unit contrast-adjusted `accent` stripe,
both from `resolveEventAppearance`. The agenda drew a neutral `backgroundElement` fill, a 2-unit
stripe in the raw stored color with no 3:1 adjustment, and the app's only card shadow. Home drew
the `surface` fill with no stripe and put `textSecondary` time and location text on it, which
measured 3.28–4.51:1 in light mode across the eight swatch presets, below the 4.5:1 body floor.

The owner decision of 2026-10-25 (design-system audit README, decision 4): the stripe is part of
the event color. Every event tile uses the grid's tint and accent stripe, and the agenda loses its
gray fill and shadow.

ADR 068 forbids `src/design/` from importing `features/**`, and the resolver lived in
`features/calendar/data/event-color.ts`.

## Decision

- **The resolver is theme-owned.** `resolveEventAppearance`, `EventFallbackColor` and the
  `EventAppearance` types live in `src/theme/event-appearance.ts` and are exported from `@/theme`.
  The calendar presenters and the design layer share it; the outputs are those the grid already
  drew. The Android high-text-contrast signal is `useIncreasedContrast` in `src/hooks/`.
- **`EventSurface` is the event tile** (`src/design/event-surface/`, exported from `@/design`). It
  takes the stored `eventColor`, resolves the appearance for the scheme and the contrast signal,
  and draws the `surface` fill, a 3-unit leading `accent` stripe, `Radii.medium` corners, no
  shadow, and a 2-unit `outline` border under increased contrast. The stripe is an absolutely
  positioned child `View` clipped by the tile's `overflow: "hidden"`, with the content padded by
  the stripe width: a `borderLeftWidth` on rounded corners tapers into a curved rail.
- **One element.** The tile is one pressable button with a required `accessibilityLabel` and an
  optional hint, built by the existing feature label builders. iOS shows the pressed opacity;
  Android shows the ripple.
- **Geometry by prop.** `placement` is `flow` (a `MinTouchTarget` minimum height) or `absolute`
  (the caller's timeline geometry); `density` is `regular` or `compact` padding. `style` takes
  layout keys only and merges last. There is no color, shadow or radius prop.
- **Foreground text, capped by type.** `EventSurfaceText` draws in the resolved `foreground`
  (black or white, ≥ 4.5:1 on the surface). `numberOfLines` is required, `ellipsizeMode="clip"`
  and shrink-to-fit are excluded by type, and it throws outside a surface. Title and detail lines
  differ by type step, not tone.
- **No `dot` variant.** A dot beside a title stays `ColorDot` (ADR 074); this answers ADR 074's
  `EventSurface` trigger.
- **The checklist pill reads the surface.** `Badge` tone `onEventSurface` is a 1-unit outline and
  label in the surface foreground and throws outside a surface. The checklist indicator uses it for
  the inline pill on a surface and draws the `compact` pill in the foreground there; elsewhere
  both keep their status tones.
- **The event-tile exception.** theming.md's "no colored leading rail" rule stays for generic
  cards. An event tile's stripe is the event's color, not decoration, and only `EventSurface` or
  the week-grid renderer draws it.
- **Lint.** `local/no-raw-event-color` also reports the six per-side border colors read from a
  `.color` member and any `resolveEventAppearance` call in a component file outside the design
  layer, the theme module, the calendar renderer and tests. Its allowlist stays at one entry
  (event details, 5.8), ceiling 1.
- **Contrast is a test.** `src/theme/event-appearance.test.ts` asserts the floors for every swatch
  preset and the fallback, and a 6×6×6 sRGB grid, in both schemes under both contrast policies.

Rejected:

- A resolved `appearance` prop: every caller would resolve, and the scheme and contrast signal
  could disagree between tile and text.
- A `dot` variant: `ColorDot` already draws it.
- `Radii.large`: the grid tiles are `Radii.medium`, and the look must match.
- A secondary foreground for details: no gray tone holds 4.5:1 on every tint.
- Keeping the agenda's gray fill and shadow: the owner decision removes them.
- Editing the week-grid renderer in this slice: it already draws the resolver's output.

## Consequences

- Home and agenda tiles change look: Home gains the stripe and black or white text; the agenda
  loses its fill and shadow.
- Event details keeps its raw color and stays allowlisted until 5.8.
- The grid's own compact pill keeps its status tones on the tint (3.5–4.9:1 in light) until 5.11
  moves grid tiles onto `EventSurface`.
- Android rendering, TalkBack and the high-text-contrast setting are device evidence
  (`docs/react-native-migration/inbox/2026-10-26-mobile-ds-event-surface-device-pass.md`).

## Revisit if

- 5.11 moves grid tiles onto `EventSurface`.
- A cancelled or past event state is specified.
- iOS gains a supported increased-contrast signal.
