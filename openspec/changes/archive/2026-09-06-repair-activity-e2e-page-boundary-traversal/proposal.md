## Why

`mobile/.maestro/activity.yaml` ends with three assertions that prove the Activity
feature's cross-page contract: the same-timestamp UUID pair straddling the client's
50-row page boundary, and the older-page anchor that exists only in a second server
response. Those assertions have never once executed successfully in CI. The most recent
native gate failed on both platforms at the first of them:

```
Scrolling DOWN until id: activity-new-e2e-activity-tie-higher is visible
  with speed 40, visibility percentage 100%, timeout 60000 ms ... FAILED
No visible element found: id: activity-new-e2e-activity-tie-higher
```

The failure is **not** in the three layers the assertion spans. It is in the flow's own
traversal budget: at Maestro's default scroll speed each gesture is a drag too slow to
fling, so the list advances less than half a screen per gesture while the fixture is 52
full-width sections — roughly thirteen screens. Both jobs were still making forward
progress, on every gesture, when the clock expired.

The first response to that was to widen the bound from 60 s to 120 s. That masks the
defect rather than fixing it, and it is still marginal: the slower platform needs about
92 s of the 120 s it was given. The traversal has to get faster, not the clock longer.

## What Changes

- Give the three Activity page-boundary `scrollUntilVisible` steps an explicit fast
  scroll `speed`, so each gesture carries a fling instead of a slow drag.
- Restore the row-50 traversal's `timeout` to the suite-standard 60 000 ms, removing the
  widened bound.
- Add relative-position assertions at the foot of the list, where all three boundary rows
  are on screen together, so the flow proves the *order* `tie-higher` → `tie-lower` →
  `older-anchor` rather than only that each row eventually appears.
- Replace the repository proof that pinned the widened bound with one that derives the
  page boundary from its two real sources — the seed script's log count and the client's
  `ACTIVITY_PAGE_LIMIT` — and pins the traversal budget and the order assertions.
- Record the traversal-gesture rule and the anti-mask rule in the Architecture Book.

Explicitly not changed: the server's tie ordering, the app's pagination, the seed
fixture, and the assertion set. All three were investigated and cleared; see `design.md`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-e2e`: the Activity flow's page-boundary traversal is bounded by gesture
  distance rather than by a widened clock, and it asserts rendered order at the boundary.

## Impact

- Affected repository areas: `mobile/.maestro/activity.yaml`,
  `mobile/e2e/activity-maestro-selectors.test.ts`,
  `docs/mobile/architecture-book/testing.md`, `docs/mobile/architecture-book/CHANGELOG.md`.
- No application source changes. No server, database, migration, OpenAPI, generated
  client, dependency, native/store config, deployment infrastructure, or legacy Flutter
  change.
- **Sensitive surfaces touched: none.** The investigation reached into
  `server/src/modules/calendar-log/` and `server/src/scripts/seed-e2e-activity.ts` to
  clear them as causes; neither is modified.
- Proof cost: the definitive evidence is the label-gated native gate (~35 min per
  platform, per head), and any later commit voids it. This host has no KVM, so native
  execution is CI-only.
