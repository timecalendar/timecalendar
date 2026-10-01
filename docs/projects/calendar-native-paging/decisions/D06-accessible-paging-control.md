---
kind: decision
id: D06
status: approved
traces-to: [P04]
supersedes: []
---

# D06 — A plain adjustable control outside the scroll views owns accessible paging

## Context and evidence

Both points below are probable defects found by reading RN 0.85.3 source (R05 §2.1). They are not
verified on a device.

- **iOS:** an `accessible` view becomes a single VoiceOver element that hides its children
  (`RCTViewComponentView.mm:350,1425`). The adjustable vertical ScrollView
  (`renderer/owned-calendar-canvas.tsx:235`) contains every tile.
- **Android:** scroll views install their own accessibility delegate, which ignores
  `accessibilityActions`, and RN does not replace it (`ReactAccessibilityDelegate.kt:592-608`).

**Reduced motion is read once.** Reanimated's `useReducedMotion` is captured at app start. Today
jumps with no animation, which is a §6.4 gap.

## Options considered

- **Keep the actions on the vertical ScrollView.** Both defects stay.
- **Merge the date row into one adjustable element.** It loses the per-date heading focus targets
  that §6.4 requires.
- **A plain adjustable View in the header's gutter corner, outside both scroll views** (proposed).

## Proposed choice

**The control.** One adjustable leaf View in the header's top-left gutter corner (52 pt wide, at
least 56 pt tall).
- Increment and decrement call `scrollTo(committed ± 1)` through D03's settle path.
- A guard ignores a second action while one is in flight.
- No ScrollView is `accessible`.

**Android.** The horizontal ScrollView gets `importantForAccessibility="no"`.

**iOS three-finger swipe.** Horizontal three-finger paging is disabled: the horizontal ScrollView
is hidden from VoiceOver, so the adjustable control is the only accessible pager and VoiceOver
never announces "Page X of Y" over the content window (owner, 2026-10-01).

**Exposure.** What screen readers can reach (pages, header slot, title, heading, label) is keyed on
the committed index. One React commit switches all of it at settle.

**Motion.** The reduced-motion preference is read live.
- A target one page away animates one page.
- A farther target jumps to the page next to it, then animates one page.
- With reduced motion, it jumps directly.

**Focus restoration.** One effect plus `useEffectEvent`, keyed by `committedKey:visit`.
- The imperative `restoreFocus`, the mirrored refs and `restoreFocusRef` are removed.
- The focus observer's `generation` prop becomes `pageKey`.

## Tradeoffs and consequences

- This fixes current accessibility defects regardless of the paging engine, once they are
  confirmed on a device.
- It amends ADR 061 ("keep … existing vertical scroll and pager owners").

## Approval

Owner (Samuel Prak) approved explicitly in the Claude Code planning session, 2026-10-01 (round-1 answers).
