# Onboarding design polish — illustrations, final copy, motion, the white-on-brand CTA

**Date:** 2026-06-15
**Change:** `add-mobile-onboarding-flow` (Phase-3 ship 1 — the welcome/brand surface)
**For:** Samuel + whoever owns the brand/design decisions (the planner won't decide these unilaterally)

## What I need

The polished onboarding design layered on top of the **native-default welcome surface** that shipped
(`mobile/src/features/onboarding/ui/welcome-screen.tsx`):

1. **Real illustrations / iconography** for the value-prop lines (the Flutter intro used hand-drawn
   `assets/images/{home,notifications,schools}.png`; we have no RN design artifacts). Decide whether
   each value prop gets an illustration/icon and supply the assets.
2. **Final brand copy** (FR + EN) for the title / tagline / three value props / CTA. The shipped copy
   is functional placeholder copy in `mobile/src/i18n/locales/{en,fr}.json` under `onboarding.welcome.*`.
3. **Optional motion** (a subtle entrance fade) and/or a **multi-page intro** (the Flutter app used a
   3-page carousel). The surface ships **static** today (so reduced-motion is trivially met). If motion
   is added it must honor `AccessibilityInfo.isReduceMotionEnabled()` (the splash's encoded pattern,
   `mobile/src/features/splash/ui/splash-screen.tsx`), keeping the final frame identical. A multi-page
   intro would re-weigh design D2's single-surface decision (ADR 015's revisit clause covers it).
4. **The white-on-brand CTA decision.** The CTA currently uses the brand `primary` as an **accent**
   (a brand-tinted border + the token `text` label on `backgroundElement`), deliberately avoiding
   white text on the bright `#E91E63` fill (4.35:1 — below the body floor). If you want a filled
   white-on-brand button, that earns the **`primaryStrong` `#C2185B` token** (white-on-`#C2185B` =
   5.87:1, AA body) — add it to `mobile/src/theme/tokens.ts` with its contrast note (this is exactly
   the deferral `tokens.ts` records: "no `primaryStrong`/button token until the first white-text-on-
   brand consumer exists").

## Why

We have **no RN design artifacts**, and the final brand surface (illustrations / copy / motion /
button style) is a **design decision, not an engineering one** (R-3 — the platform is the design
reference, not the Flutter app). The migration philosophy ships the native-default surface now and
treats the polish as additive, so the ship does not stall on missing artifacts.

## How to verify

- The polished welcome surface renders correctly on **both** platforms (iOS + Android) in **light and
  dark**.
- Final copy is complete and natural in **FR + EN** (the `tsc`-typed parity gate still passes).
- If a white-on-brand CTA is adopted: the `primaryStrong` `#C2185B` token is added, its contrast is
  re-verified (white-on-`#C2185B` ≥ 4.5:1 body), and the `tokens.ts` brand block is updated.
- If motion is added: it cuts to the final frame under reduced motion (test it with Reduce Motion on).

## Blocks

**Nothing.** Phase-3 ship 1 is complete and shippable with the native-default surface — this is the
additive quality-polish follow-up. (The on-device DoD axes are a separate note:
`2026-06-15-onboarding-flow-dod-manual.md`.)
