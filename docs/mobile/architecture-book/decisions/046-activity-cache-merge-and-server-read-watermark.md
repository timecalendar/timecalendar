# 046 — Merge the Activity cache by log id and read it against server time

## Status

Accepted.

## Context

Activity is the student-facing history of what changed in a timetable. The server
already writes a `calendar_log` row inside the calendar-sync transaction and keeps
one year of them; the React Native app now caches them locally so history renders
offline. Two properties of that cache are load-bearing and neither is visible in
the code that implements them.

The first is a divergence. Every other server-backed table in the app follows
`calendar_events`: a sync response is the complete current timetable, so the
cheapest way to be exactly right is to drop and replace. Reading the Activity
repository next to it, the obvious question is why it does not do the same.

The second is a clock. Unread count is exact and device-local — read state is not
shared between two installations holding the same token — so the app owns a read
watermark, and something has to supply the time it stores.

Upstream source: `docs/react-native-migration/05-tech-specs/activity-revival.md`,
architecture decisions 5 and 8.

## Decision

**The Activity cache is merged by server log id, never replaced.** A page write
upserts each row on `activity_logs.id` inside one synchronous transaction.

Calendar-log history is cursor-paginated: a page is one bounded window over a
year, and the app deliberately never downloads the whole year. Replacing on a
newest-page refresh would delete every older page a student had already
backfilled by scrolling, shrink the offline timeline to at most one page, and turn
a passive background refresh into user-visible data loss. Upsert identity is also
what makes the recovery paths safe — a repeated newest page, an older page that
overlaps cached rows, and a full restart of the pagination chain after the server
rejects a stored cursor are all idempotent rather than duplicating.

Rejected: a `replaceAll` mirroring `calendar_events`. Consistency with the wrong
strategy is not a virtue.

**The read watermark is a server-issued time; the device clock never writes it.**
A phone whose clock is set forward would hold a watermark ahead of every server
row, so nothing would ever be unread again; set backward, already-read history
would re-count as unread on every refresh. Both failures are silent and
permanent. So the watermark takes the response's `asOf` when the screen is open,
and — when the screen opened offline and there is no fresh `asOf` — advances only
to the newest server timestamp the device can prove it has seen, and only when
that is later than the stored value. A passive refresh stores the server's unread
count **without** touching the watermark, because advancing it there would mark
unseen changes as read.

The same reasoning governs the one-year prune: its cutoff is derived from the
newest server time the device can trust (the write's `asOf` or the newest cached
row timestamp, whichever is later), never from local time, so a wrong clock cannot
delete a year of history.

`lastSuccessfulRefreshAt` is deliberately the opposite — it feeds an elapsed-time
freshness policy, so it is device time. The two clocks living in one row is the
point of this record, not an inconsistency to unify.

## Consequences

- The Activity tables are the first server-backed tables that are not
  drop+replaced, so the reset path — not a replace — is what bounds their growth.
  Both are in the single backend-bound reset list, so an environment switch clears
  them.
- Every page write must carry the calendar ids the device holds, because ownership
  is reconciled by a prune inside the write rather than by a cascade or a replace.
  That keeps the Activity data layer free of a calendar-feature dependency.
- The row count is bounded only by the prune, which needs a trusted server
  timestamp. A write carrying neither a parseable `asOf` nor a parseable cached
  row skips the prune rather than deleting against a garbage cutoff.
- A migration that fails on an installed database is a data incident, so the
  committed SQL is applied to a real SQLite database in the test suite — on a
  fresh install and on top of a database already holding rows in every earlier
  table.
- These tables are backend-bound rebuildable data and are explicitly **not**
  Phase-09 importer targets, so the importer-fidelity constraint that shaped the
  four earlier table schemas does not apply to them.

## Revisit if

- The server starts returning a complete history snapshot rather than a
  cursor-paginated window — the merge would then be buying nothing over a replace.
- Read state becomes server-owned and shared across a token's installations, which
  would move the watermark off the device entirely and retire the clock argument.
- The server page cap rises materially above 100 rows, which would make the
  row-by-row upsert worth revisiting against a chunked multi-row form.
