# 008 — Brand color: adopt the Flutter pink hue as the `primary` token

> Origin: the `drop-mobile-web-and-brand-theme` change, design D5 (foundation
> theming readiness). Records the brand-hue adoption and its load-bearing contrast
> usage rule; the token values + verified pairs live in `src/theme/tokens.ts` and
> the Architecture Book "Theming & native-chrome".

## Status

Accepted. **⚠️ Revisit fired (2026-06-16):** the "earn the `primaryStrong` token" clause
fired — the onboarding welcome screen's filled "Get started" CTA is the first
white-text-on-brand consumer, so `primaryStrong` (#C2185B) + `onPrimary` (#ffffff) were
added to `tokens.ts` (the deferral this ADR recorded). The contrast pair
(onPrimary-on-primaryStrong = 5.87:1, AA body) was re-verified; theming.md + the
`tokens.ts` contrast block updated.

## Context

The scaffold shipped an **off-brand blue** — its only brand-ish color was the
`#208AEF` native splash background — and **no brand token at all**. The product's
identity (the Flutter app, `app/lib/modules/shared/services/theme.dart`) is
**pink**: primary `Colors.pink` = `#E91E63`. The token layer and the React
Navigation chrome need a brand `primary` to tint from, and the first real feature
(Settings, ADR [004](./004-phase-1-feature-order.md)) must inherit a verified
brand-contrast posture rather than re-deriving it.

Adopting a Flutter color invites porting Flutter Material chrome (AppBar/FAB/Switch
theming, Poppins, elevation) — which **R-3** forbids (the platform is the design
reference, not the Flutter app). And the bright identity pink is a **contrast trap**:
white text on `#E91E63` is only 4.35:1 — below the 4.5:1 WCAG-AA body floor.

## Decision

Adopt the brand **hue** (pink) — **hue + neutral intent only, no Material widget
port** (R-3). Add a `primary` token to both schemes in `Colors`:
`light.primary = #E91E63` (the Flutter identity tone), `dark.primary = #FF4081` (the
lighter accent that reads on the dark background). The nav theme (ADR-adjacent C2)
and the native splash tint from the brand.

**The load-bearing contrast usage rule** (verified at authoring, documented in
`tokens.ts`):
- White text on a brand fill rides the darker **`#C2185B`** (white-on-`#C2185B` =
  5.87:1, AA body). The bright `#E91E63` is **not** a white-text-on-fill body
  surface (4.35:1 fails body AA).
- `light.primary = #E91E63` is an **accent / tint** — a foreground accent or a
  large/UI element on `background` (4.35:1 meets the 3:1 large-text / WCAG 1.4.11
  UI-component bar), e.g. the nav active tint.
- `dark.primary = #FF4081` (6.30:1 on `#000`, AA body) so the brand reads on dark
  (`#C2185B` on `#000` is only 3.58:1).

*Rejected:* `primary = #C2185B` everywhere — the brand identity is `#E91E63`;
`#C2185B` is the darkened *on-text* tone, not the accent/active tint. **No
`primaryStrong`/button token is added** (R-2) — no white-text-on-brand consumer
exists yet; the contrast block records which tone that future consumer must use.

## Consequences

- The token surface gains `primary` per scheme; `ThemeColor` picks up the key
  automatically and the nav theme + splash tint from it.
- Settings (and every future feature) inherits the named contrast pairs and the
  "white text on brand rides `#C2185B`" rule — not an unused token.
- The DoD's manual color-contrast review checks rendered screens against the named
  pairs (the runtime/CI contrast checker stays deferred — the theming change's D5
  trigger stands).
- R-3 drift risk is bounded: hue + neutral intent only, no AppBar/FAB/Switch
  theming, no Poppins, no Material elevation.

## Revisit if

A designer-driven palette change lands, or a real surface fails the brand-color
contrast (e.g. a white-text-on-brand control that can't use `#C2185B`) — re-verify
the affected pair (or earn the `primaryStrong` token then).
