---
kind: evidence
epic: E06
owner-verdict: pending
---

# E06 — Accessible paging and focus evidence

## Host verification

The Calendar header contains one plain adjustable View outside the vertical and horizontal
ScrollViews. Its action guard pages from the committed index, and the page key identifies native
event-focus reports. The shared reduced-motion hook subscribes to preference changes. Focus
restoration runs in one effect for each committed page and route visit.

On the T08b/E06 integration revision `9d246fbf`, `TZ=UTC npm test -- --coverage --silent`
passed 229 suites and 2,274 tests, with all-file branch coverage of 90.87%.
`npx tsc --noEmit`, `npm run lint`, and `npm run react-compiler:check` passed. The iOS
end-drag-before-touch-finalize regression and Android rest recovery suites passed. These host
checks do not establish native assistive-technology behavior or physical large-text layout.

## iOS Simulator functional smoke

The development binary was rebuilt on iOS from E06 revision `ff5841b4`, including the native
focus observer with `pageKey`. The build succeeded, and direct `simctl` installed and launched
bundle `fr.samuelprak.timecalendar.dev` (bundle version 1) on an iPhone 17 Pro simulator running
iOS 26.5. Metro served the integrated JavaScript revision `9d246fbf`; a
`timecalendar-dev://calendar?focusDate=2026-10-02` deep link rendered the Calendar route.

At simulator content size `accessibility-extra-extra-extra-large`, the title uses a localized
compact month form with meaningful font scaling, while its accessibility label retains the full
month and date. The view menu, adjustable gutter symbol, weekday/date header, and hour gutter fit
in the [captured screen](images/E06-ios-sim-largest-9d246fbf.png). This is a visual functional
check, not a VoiceOver, physical-device, or timing verdict. The direct `simctl` install and
launch did not exercise native chained swipes, reversal, Today, or focus return.

The coordinator also exercised the simulator's native accessibility actions through Orca's
visible Simulator window on the same native binary and JavaScript source. One `AXIncrement`
changed the committed header from Monday, September 28 to Monday, October 5; one `AXDecrement`
returned to September 28. Settled accessibility trees and screenshots confirmed both results.
This checks the adjustable control's native action path, not VoiceOver speech or focus. Pointer
gesture results remain inconclusive because native input delivery could not be established;
they do not establish chained-swipe or reversal acceptance. A Today toolbar action returned
the header from the October 5 week to the current September 28 week.

The source now includes the Week-to-Day placement-readiness fix from PR #453, merged as
`16b899a900bcc72f2187739f534ef119f6199678`. Its transition tests assert the existing
Day/Week labels on the same adjustable control; the PR has no native accessibility workaround.
The earlier simulator run observed a blank header and stale native Week labels after a
Week-to-Day transition. Behavior after the fix remains unverified because the native UI pipe
was unavailable. PR #453 changes JavaScript only, so an installed binary that already contains
the `pageKey` focus observer can be checked with pinned native and JavaScript identities.

## Owner device verdict

**Pending.** No VoiceOver or TalkBack physical-device run has been recorded for the E06 revision.
The Android exact-revision long-session diagnostics are recorded in E07 evidence.

The native focus observer emits `pageKey` on both platforms. Device checks require a binary
containing that native module revision; loading new JavaScript into an older binary is
insufficient. Record the exact Git revision, binary/build identifier, OS, device, screen-reader
state, text size and reduced-motion setting with the owner's verdict.

Use the R05 checklist for one action per page, one destination utterance, committed events and
hidden neighbours, focus return from details, live reduced motion for adjustable/Today/deep-link
navigation, largest text size, and VoiceOver/TalkBack traversal. In particular, verify whether
iOS three-finger horizontal scrolling remains available through the non-accessible pager and
whether it produces any competing native page-status utterance.
