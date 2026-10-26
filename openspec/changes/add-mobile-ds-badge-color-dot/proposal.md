# Proposal

## Why

Small status pills and event-color dots are each drawn by hand (`duplication-and-drift.md` §A14,
§A15). The About header caption, the checklist progress pill, the personal-events list swatch and
the Home summary dots each pick their own padding, radius, type, ring and color handling. The Home
dots draw a `#FFFFFF` ring literal. The brand caption pill puts `actionText` on the translucent
`primarySoft` wash, which no contrast test covers and which measures 4.30:1 on a
`backgroundElement` surface, below the 4.5:1 body-text floor. Roadmap slice 3.7
(`migration-roadmap.md`, phase 3) gives them two primitives, `Badge` and `ColorDot`, before the
3.9 event-surface slice and the phase 5 screen migrations build on them.

## What Changes

- **`Badge`** in `mobile/src/design/badge/`, exported from `@/design`: a short label in a closed
  `tone` (`brand`, `neutral`, `positive`, `informational`, `destructive`) and a `size`
  (`small`, `medium`), with an optional leading icon (an SF Symbol / Material glyph pair drawn
  by `Icon` with `scaling: "text"`). The tone fixes the appearance. `brand` is a `primarySoft` wash
  with an `onPrimarySoft` label. `neutral` is a `backgroundElement` fill with a `textSecondary`
  label. The status tones are a 1-unit outline with the label in the tone color. Callers cannot
  pass a color, a font or a height; `style` takes layout keys only and merges last. The label
  grows with the OS text size and wraps to at most two lines. No fixed height, no
  `adjustsFontSizeToFit`, and never `clip`.
- **Badge accessibility is a required choice.** `accessibilityLabel: string | null` is required.
  A string makes the badge one text element with that name, so a count such as `2/5` can be
  announced as "2 of 5 checklist items completed". `null` hides the badge because the owning
  row or card already carries the phrase.
- **`ColorDot`** in `mobile/src/design/color-dot/`, exported from `@/design`: a circular dot in an
  event or calendar color (`color: string`, the stored `#RRGGBB` value, ADR 011), a `size`
  (`small` 8, `medium` 12, `large` 16 from a new `ColorDotSize` token), and an optional `ring`
  naming the theme surface the dot sits on (`background`, `backgroundElement`, `homeHero`). The
  ring then reads as a cut-out where dots overlap. A `ColorDot` is always decorative, like `Icon`.
  It is hidden from VoiceOver and TalkBack, and the control that shows it owns any spoken color
  name (the swatch picker keeps naming presets through `SWATCH_NAME_KEYS`).
- **Theme**: a new `onPrimarySoft` color role (light `#AD1457`, dark `#FF80AB`) for text on the
  brand wash. Contrast pairs gain an optional `over` surface, so a translucent background is
  composited before the ratio is computed. `onPrimarySoft` on `primarySoft` over `background`,
  `backgroundElement` and `homeHero` (4.88–8.11:1) and every other Badge tone pair are CI-checked
  in both schemes. `ColorDotSize` is a new token.
- **Call sites migrate** (every `testID` kept; no Maestro selector changes):
  - the About brand header caption pill (`chrome/native-list-header.tsx`) becomes
    `Badge tone="brand" size="small"` and keeps `captionTestID`;
  - the checklist progress pill's `inline` variant
    (`event-checklists/ui/checklist-progress-indicator.tsx`) becomes a `Badge` (`positive` when
    complete, `informational` when partial, with the checked or pending glyph and
    `accessibilityLabel={null}`); the grid-tile `compact` variant stays as is;
  - the personal-events list leading swatch (`personal-events/ui/personal-events-list.tsx`)
    becomes `ColorDot size="large"`;
  - the Home welcome-card summary dots (`home/ui/home-screen/welcome-card.tsx`) become
    `ColorDot size="medium" ring="homeHero"`, which removes the `#FFFFFF` literal.
- **Deferred with reasons** (design D9): the event-details title dot and `TagBubble` (slice 5.8,
  `EventSurface`/`Badge` there), the calendar view-menu pill (a menu trigger, slice 5.10 screen
  chrome), the agenda indicator column (slice 3.9 `EventSurface`), the swatch picker's 48 pt
  swatches (an input control, slice 5.3), the onboarding page indicator (a pager control, slice
  5.1), the checklist `compact` grid-tile variant (renderer-bounded geometry, slice 3.9/5.11),
  and `SwiftBadge` / Compose `Badge` in the native list seam (native idiom, stays).
- **Lint (Principle 1)**: a new `local/no-raw-event-color` rule. In `src/**/*.tsx` it reports a
  `backgroundColor` or `borderColor` style value read from a `.color` member (such as
  `event.color` or `tag.color`) outside `src/design/`, `src/theme/`, the calendar renderer and
  tests: event colors enter UI only through `ColorDot` (and `EventSurface` later). Its allowlist
  holds `event-details-content.tsx` (slice 5.8) at ceiling 1.
- **Gallery**: `badge` and `color-dot` fixtures cover every tone and size, the icon, hidden and
  labelled accessibility, the longest FR label, a caption naming the text-size branch, dot sizes,
  the ring on each surface, and the overlapping stack. `known-a11y-violations.ts` does not grow.
  FR/EN `gallery.badge.*` / `gallery.colorDot.*` keys.
- **Docs**: ADR 074 (Badge and ColorDot), theming.md (Badges and color dots, the `onPrimarySoft`
  role, composited pairs), accessibility.md, lint-format.md, testing.md, features.md,
  architecture.md (the `badge/` and `color-dot/` families) and a dated CHANGELOG entry.

## Capabilities

### New Capabilities

- `mobile-design-system-badge`: the `Badge` and `ColorDot` contracts (tones, sizes, appearance,
  text scaling, required accessibility choice, decorative dots, surface ring), their gallery
  fixtures, and the call-site migration that keeps identifiers and accessible names.

### Modified Capabilities

- `mobile-theming`: a brand-wash label role, and contrast pairs that composite a translucent
  background before checking it.
- `mobile-lint-format`: an event color drawn as a raw style fill outside the design layer is a
  ratcheted lint error.

## Impact

- **Code (`mobile/`)**: new `src/design/badge/{badge,badge.test,badge.gallery,badge.gallery.test}.tsx`
  and `src/design/color-dot/{color-dot,color-dot.test,color-dot.gallery,color-dot.gallery.test}.tsx`.
  Changed `src/design/index.ts`, `src/design/gallery/registry.ts`, `src/theme/tokens.ts`
  (`onPrimarySoft`, `ColorDotSize`), `src/theme/contrast.ts` (`over`, compositing),
  `theme.test.tsx` and `src/theme/index.ts`. Changed `src/components/chrome/native-list-header.tsx`
  and its test, `event-checklists/ui/checklist-progress-indicator.tsx` and its test,
  `personal-events/ui/personal-events-list.tsx`, and `home/ui/home-screen/welcome-card.tsx`, with
  their tests. Changed `src/i18n/locales/{en,fr}.json`, `eslint.config.js`, `tools/eslint-rules/`
  (new rule, allowlist, tests, design-import policy row) and `jest.config.js` (90% tier rows).
- **Native**: none. No new dependency, no fingerprint change.
- **Visual**: the About caption label tone darkens slightly (`onPrimarySoft`). The inline
  checklist pill moves to the Badge type (`label` at medium). The personal-events swatch is a
  16-unit circle instead of a 24-unit rounded square. The Home dots' ring takes the hero surface
  color in both schemes instead of white.
- **Out of scope**: `EventSurface` and event tiles (3.9), header and floating actions (3.8),
  `TagBubble` and event details (5.8), calendar screen chrome (5.10) and the renderer.
