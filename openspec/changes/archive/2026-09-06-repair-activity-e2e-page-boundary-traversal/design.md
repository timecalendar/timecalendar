# Design

## The fixture, and what the assertions are meant to prove

`server/src/scripts/seed-e2e-activity.ts` writes 52 calendar logs onto one seeded
Activity calendar. Ordered the way the server serves them — `createdAt DESC, id DESC` —
they land in fixed absolute positions:

| Rows | Content |
| --- | --- |
| 1–3 | the `new`, `changed` and `cancelled` rows the earlier assertions already exercise |
| 4–49 | 46 filler rows, one per minute, all distinct timestamps |
| 50 | `tie-higher` — id `…051`, `createdAt` minute 100 |
| 51 | `tie-lower` — id `…050`, the **same** `createdAt` minute 100 |
| 52 | `older-anchor` — minute 99 |

The client asks for exactly `ACTIVITY_PAGE_LIMIT = 50` rows
(`mobile/src/features/activity/data/request.ts`). So the tie pair is deliberately split
by the page boundary: the higher UUID is the last row of the first response, the lower
UUID is the first row of the second. Observing both, in that order, is simultaneously a
proof of the server's tie-break (`id DESC`, not `id ASC`) and of scroll-driven cursor
pagination through the real server. `older-anchor` is the second-page witness that cannot
be explained by anything cached.

None of that is asserted today. The flow only scrolls until each of the three ids is
visible, one at a time.

## Decision 1 — The failure is the traversal budget, not any of the three candidate layers

The ticket named three candidate causes. All three were investigated; the failure is none
of them.

**Server tie ordering — cleared.**
`server/src/modules/calendar-log/repositories/activity-search.queries.ts` orders both page
shapes `ORDER BY "createdAt" DESC, "id" DESC`, and the cursor predicate is the row-value
comparison `("createdAt", "id") < ($3, $4)` — one lexicographic comparison, so a tie can
neither skip a row nor repeat one. `calendar-log-search.repository.test.ts` already proves
this against a real database ("orders strictly by createdAt DESC, id DESC across
calendars", with an explicit shared-timestamp case). The seeded ids `…051` > `…050` at an
identical `createdAt` therefore resolve to rows 50 and 51 exactly as the flow's comment
claims.

**Seed / selector drift — cleared.**
`activity-screen.tsx` renders `testID={`activity-${item.kind}-${event.uid}`}`; the tie rows
are seeded as `oneNew(...)`, so their kind is `new` and their ids are exactly the asserted
`activity-new-e2e-activity-tie-higher` / `-tie-lower`. The same construction resolves for
`activity-new-e2e-activity-new` and for every `activity-new-e2e-activity-filler-NNN` that
appears in the failing runs' own screen hierarchies, so the family is demonstrably intact.

**App pagination — not reached, therefore not the failure.**
The captured screen hierarchies at the moment of failure show the viewport nowhere near
the end of the list: rows 34–37 on Android, rows 30–33 on iOS, out of 52. `onEndReached`
never fired, so no second page was ever requested. Pagination is *unproven by this run*,
not broken — and it is independently covered locally by
`activity-screen.test.tsx` ("loads older pages from end reached…") and by the
coordinator/repository cursor tests.

**What actually happened.** Both platforms made forward progress on *every* gesture and
ran out of clock:

| | gestures in ~60 s | seconds per gesture | rows advanced per gesture | viewport top reached |
| --- | --- | --- | --- | --- |
| Android | 21 | 2.9 | 1.6 | row 34 |
| iOS | 13 | 4.6 | 2.2 | row 30 |

Four sections fit on screen on both platforms. Placing row 50 fully in view needs the
viewport top at about row 47 — 46 rows of travel — which is ~29 gestures / ~85 s on
Android and ~21 gestures / ~97 s on iOS. The 60 s bound was never survivable, and the
120 s bound survives it only by about 23 s on the slower platform.

The cause is the gesture, not the clock. Maestro maps `speed` to a swipe duration —
`scrollDuration = (100 − speed) × 10 + 1`, confirmed by the run's own metadata
(`originalSpeedValue=40`, `scrollDuration=601`). At the default speed the finger travels
roughly 40 % of the screen over 601 ms, about 0.7 screens per second: below both
platforms' fling thresholds, so the list stops dead at the end of every gesture and the
next hierarchy round trip costs 2.9 s (Android) or 4.6 s (iOS) regardless. That per-cycle
overhead is fixed and not ours to shrink. The distance per cycle is.

## Decision 2 — Fling instead of drag: set an explicit `speed`, keep the standard bound

The three page-boundary `scrollUntilVisible` steps get `speed: 90` (a 101 ms swipe over
the same finger travel, ~6× the velocity), and the row-50 traversal's `timeout` returns to
the suite-standard `60000`.

Nothing about the assertion weakens. No sleep, no retry, no `optional`, no widened clock,
no deleted check — the step still has to find the real row, rendered from a real server
response, within the same 60 s every other traversal in the suite gets. The bar moves
back up, not down.

**Why overshoot is safe here, specifically.** A fast fling can carry the list further than
intended, and `scrollUntilVisible` only ever scrolls one direction — so a target flung
past is a target lost. It cannot happen with this fixture: the list clamps at its bottom,
and the target sits in the terminal viewport either way. Before the second page loads the
last row is `tie-higher` itself (row 50 of 50); after it loads the last three rows are
`tie-higher`, `tie-lower`, `older-anchor` (50–52 of 52), and both failing runs show four
sections co-visible on both platforms. Maximum overshoot lands on the target rather than
beyond it. This property is a consequence of the fixture placing the boundary rows at the
*end* of history, so it is written into the flow as a comment: a later fixture that adds
rows below `older-anchor` would invalidate it.

Rejected alternatives:

- *Widen the clock again.* This is the mask the ticket exists to remove, and it is
  already within 23 s of failing on the slower platform.
- *Shorten the fixture.* The 49 preceding rows are what puts the tie pair on the page
  boundary. Removing them removes the contract under test.
- *Tune the `SectionList` virtualization.* The captured hierarchies contain only the four
  on-screen rows, so the native tree is already small; the per-cycle cost is Maestro's
  round trip, not rendering. Changing shipped rendering to speed a test up would also be
  the wrong direction of causality.

## Decision 3 — Assert the order, not just the presence

At the foot of the list all three boundary rows are on screen together, so the order can
be asserted directly and for free — no extra traversal:

```yaml
- assertVisible:
    id: "activity-new-e2e-activity-tie-higher"
    above:
      id: "activity-new-e2e-activity-tie-lower"
- assertVisible:
    id: "activity-new-e2e-activity-tie-lower"
    above:
      id: "activity-new-e2e-activity-older-anchor"
```

This is what the ticket's title asks for and what the flow has never checked. Three
independent "is it visible" scrolls cannot distinguish the correct tie-break from its
reverse; two relative-position assertions can. They are additive — every existing
`assertVisible` stays.

## Decision 4 — The local proof derives the boundary instead of restating it

`mobile/e2e/activity-maestro-selectors.test.ts` currently pins the widened bound
("gives only the row-50 pagination traversal the measured wider bound"). That test is
replaced, not deleted, by one that proves the things the native gate is too expensive to
be the first to notice:

1. **The boundary is where the flow says it is.** Read the filler count from
   `server/src/scripts/seed-e2e-activity.ts` and `ACTIVITY_PAGE_LIMIT` from
   `mobile/src/features/activity/data/request.ts`, and assert that the three leading rows
   plus the fillers plus `tie-higher` come to exactly the page limit — and that the
   `tie-higher` id sorts above the `tie-lower` id, at the same seeded minute. Today "row
   50" is a prose claim in a comment; a filler-count edit or a page-limit change would
   silently move the boundary and leave the flow proving nothing while still passing.
2. **The traversal budget stays honest.** All three page-boundary scrolls carry the fast
   `speed` and the standard `60000` bound, in order. A future widening fails the baseline
   gate rather than merging as a green mask.
3. **The order assertions exist**, in the right direction.

This discriminates: on the current `main` it fails on (2) — the bound is `120000` and no
`speed` is set — and on (3), which does not exist yet. It passes on the change.

It belongs in the **baseline** gate, for the same reason `maestro-selectors.test.ts` does:
the native gate is label-gated and costs ~35 min per platform, so a regression must be
caught at the commit that causes it.

## Verification

- Local (this host): jest for the mobile e2e proofs, tsc, lint, and Maestro YAML parse.
  Native execution is impossible here — no KVM, no simulator.
- Definitive: the label-gated native gate, green at **flow** level on both platforms on
  one exact head, attributed at flow and attempt level rather than job level. Taken
  **last**, after simplify, because any later commit voids it.
