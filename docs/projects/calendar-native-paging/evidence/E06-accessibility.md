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

On the E05-integrated implementation branch, `TZ=UTC npm test -- --coverage` passed 228 suites
and 2,257 tests (one existing skip); all-file branch coverage was 90.76%. The focused E06 suites,
`npx tsc --noEmit`, `npm run lint`, and `npm run react-compiler:check` also passed. Final T08b
integration remains to be checked. These host checks do not establish native assistive-technology
behavior or physical large-text layout.

## Owner device verdict

**Pending.** No VoiceOver or TalkBack physical-device run has been recorded for the E06 revision.
The iOS Simulator was recovered after SpringBoard crashes during the E05 run and is available
for a rebuilt native functional smoke. The Android phone and PC remain reserved for T08b until
the coordinator releases them.

The native focus observer now emits `pageKey` on both platforms. Device checks require a rebuilt
binary containing that native module revision; loading new JavaScript into an older binary is
insufficient. Record the exact Git revision, binary/build identifier, OS, device, screen-reader
state, text size and reduced-motion setting with the owner's verdict.

Use the R05 checklist for one action per page, one destination utterance, committed events and
hidden neighbours, focus return from details, live reduced motion for adjustable/Today/deep-link
navigation, largest text size, and VoiceOver/TalkBack traversal. In particular, verify whether
iOS three-finger horizontal scrolling remains available through the non-accessible pager and
whether it produces any competing native page-status utterance.
