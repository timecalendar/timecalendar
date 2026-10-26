# 074 — Badge and ColorDot

## Status

Accepted.

## Context

Small status pills and event-color dots were each drawn by hand (`duplication-and-drift.md` §A14,
§A15). The About header caption, the checklist progress pill, the personal-events swatch and the
Home summary dots each chose their own padding, radius, type, ring and color handling, and the
Home dots drew a `#FFFFFF` ring literal. The brand caption put `actionText` on the translucent
`primarySoft` wash, a pair no contrast test could check: `contrastRatio` refuses an alpha hex, and
composited over a `backgroundElement` surface the pair measures 4.30:1, below the 4.5:1 body
floor. Phase 3 slice 3.9 (`EventSurface`) and the phase 5 screen migrations build on whatever
pill and dot exist.

## Decision

- **The tone fixes the badge's appearance.** `Badge` (`src/design/badge/`) takes a closed `tone`:
  `brand` is a `primarySoft` wash with an `onPrimarySoft` label, `neutral` a `backgroundElement`
  fill with `textSecondary`, and `positive`, `informational` and `destructive` a 1-unit outline
  with the label in the tone color. There is no color, font or height prop; `style` takes layout
  keys only and merges last.
- **Size and scaling.** `size` is `small` (`caption`) or `medium` (`label`, the default), with
  token padding and `Radii.pill`. The label grows with the OS text size, has `numberOfLines={2}`
  and tabular figures, and never shrinks to fit or clips. The optional icon is an `Icon` with
  `scaling="text"` sized to the label's `TypeRamp` font size.
- **The accessibility choice is required.** `accessibilityLabel: string | null` has no default: a
  string makes the badge one `text` element with that name (a count reads as a phrase), `null`
  hides it for an owner that already announces the information.
- **The dot is decorative.** `ColorDot` (`src/design/color-dot/`) draws the stored `#RRGGBB`
  verbatim in a circle of `ColorDotSize` (8 / 12 / 16), hidden from VoiceOver and TalkBack, with
  no label prop. An optional `ring` names the surface token it sits on (`background`,
  `backgroundElement`, `homeHero`) and draws a 2-unit border in it. A spoken color name belongs to
  the control that shows the color (the swatch picker's `SWATCH_NAME_KEYS`).
- **A brand-wash label role and composited pairs.** `onPrimarySoft` (`#AD1457` light / `#FF80AB`
  dark) is the text on the wash. A `documentedContrastPairs` row can name the opaque surface under
  a translucent background (`over`); `pairRatio` composites before computing the ratio, and a
  translucent background without `over` still throws. The wash is checked over `background`,
  `backgroundElement` and `homeHero` in both schemes.
- **The compact checklist pill stays.** The `inline` checklist variant is a hidden `Badge`; the
  `compact` variant keeps its own drawing, fitted inside calendar grid tiles whose size the
  renderer decides (ADR 033).
- **Chrome imports `badge/` by path.** `NativeListHeader` renders its caption as a brand `Badge`
  from `@/design/badge/badge`, a third design leaf after `text/` and `list/`; `badge.tsx` imports
  only `@/theme`, `@/design/text/themed-text` and `@/design/icon/icon`, so no cycle forms.
- **A ratchet, no shape rule.** `local/no-raw-event-color` reports a `backgroundColor` or
  `borderColor` read from a `.color` member outside `src/design/`, `src/theme/`, the calendar
  renderer and tests, with a one-entry allowlist (`event-details-content.tsx`, slice 5.8).

Rejected:

- An `appearance: "soft" | "outlined"` prop: ten combinations, six with no consumer and no
  contrast pair.
- All-outlined badges: changes the About caption for no gain.
- A single line with ellipsis: an ellipsized count or version loses information at the text
  sizes that need it.
- An optional label defaulting to the visible text: `2/5` would be read as a bare number.
- A `decorative` boolean beside an optional label: two props that can contradict each other.
- A label prop on the dot, and a `ringColor` string: the first moves a color name away from the
  control that owns it, the second reopens raw colors.
- An opaque `brandContainer` fill: changes the caption on every surface and still needs a label
  token.
- A `Radii.pill` shape rule: FABs, glass buttons, the now line, the agenda rail and page
  indicators draw the same radius, so it is no badge signature.

## Consequences

- `event-details-content.tsx` keeps its title dot and `TagBubble` on the allowlist until slice
  5.8; text on `tag.color` needs the 3.9 foreground resolution first.
- The checklist indicator has two drawing paths until the 3.9/5.11 tile work absorbs `compact`.
- A color reached through a variable or a call, or a `color=` prop, is not matched by the rule;
  review covers it.
- The dark Home ring is the dark hero surface instead of white.
- TalkBack announcements, the wrap at the largest size and the ring rendering are device evidence
  (`docs/react-native-migration/inbox/2026-10-26-mobile-ds-badge-color-dot-device-pass.md`).

## Revisit if

- `EventSurface` (slice 3.9) absorbs the dot's data-color role.
- A status badge needs a soft fill.
- The native list seam's `SwiftBadge` / Compose `Badge` is replaced by `Badge`.
