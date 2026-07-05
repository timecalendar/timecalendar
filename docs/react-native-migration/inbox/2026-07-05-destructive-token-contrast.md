# Destructive color + text contrast — a designed token pair (token-layer follow-up)

Date: 2026-07-05
Origin: `refine-mobile-user-calendars-a11y-native` (iterate-screen panel: native#4 MAJOR,
a11y#2 MAJOR, rn#5)
Owner: user / design (a design-system decision, not a single-screen fix)

## What is needed

Destructive affordances currently render in **brand pink**, not system red, and some pink
14px labels fail WCAG AA in light mode. The proper fix is a **designed `danger`/`error`
token pair** in `mobile/src/theme/tokens.ts` with:

- a **fill** tone for icon/panel use — system red `#FF3B30` (light) / `#FF453A` (dark) —
  meeting the WCAG 1.4.11 3:1 non-text bar; and
- a **text** tone (a darker red) meeting AA 4.5:1 on the backgrounds it lands on,
  per-scheme verified,

so destructive text and the trash icon/swipe panel read as destructive and pass contrast.

## Exact failing ratios (measured by the panel)

- Add button `primary` on `#fff` (light) = **4.35:1** — fails body AA (needs 4.5:1). NB:
  moving the add into the native header (this change) already aligns its tint with the
  shipped event-details header-action pattern, so this specific instance becomes a repo-wide
  header-tint question rather than this screen's.
- Android trash label `primary` on `backgroundElement` `#F0F0F3` (light) = **3.82:1** — fails
  body AA (needs 4.5:1).

## Why deferred (not fixed in the refine ship)

- It spans **more than this screen** — every destructive affordance in the app inherits it;
  fixing it here would be a local patch that drifts from the rest.
- Adding a token speculatively for one screen violates R-2 (earned, not speculative) and the
  refine ship's "no new token" constraint.
- The value choices (system-red vs. a brand-tuned red, the exact text shades, per-scheme
  verification) are a **design decision**, user/design-owned.

## How to verify (when built)

Add the token pair with the AA/1.4.11 ratios computed and documented in the `tokens.ts`
contrast block (the D5 trigger), then re-point destructive affordances (trash icon, swipe
panel, any destructive text) at it and manually contrast-review the rendered screens in both
schemes.

## Also noted (device pass, not a token)

Dynamic Type icon scaling (a11y#7 NIT): the fixed-size SymbolView does not track Dynamic
Type. Acceptable for now (row height grows with text, no clip) — note for the device pass.
