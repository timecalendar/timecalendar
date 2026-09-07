# ADR 057 — Three-journey native smoke budget

## Status

Accepted.

## Context

Native E2E is a daily/manual health signal under ADR 055, while ADR 038 isolates
each top-level Maestro flow in its own process and classifies startup retries
structurally. A broad inventory of destination, permutation, detailed-ordering,
and UI-polish flows consumed native time without improving the ordinary merge
signal already supplied by deterministic tests and static harness gates.

## Decision

The daily native pack has exactly three top-level business journeys:

1. fresh-user listed-school/programme import through the real URL and backend
   path, ending with a synced Agenda event and its details;
2. personal-event create, edit, cold-reopen, and delete through Home or Calendar;
3. subscribed-calendar visibility off and on, with cold schedule rendering proof
   after both mutations.

Helpers are nested and do not count as journeys. Baseline CI enforces the exact
top-level inventory, recursive selector integrity, non-vacuous negative
assertions, process isolation, teardown, and structural classifier behavior.
Candidate additions normally replace a lower-value journey or land at a cheaper
test seam. More than five top-level business journeys requires a new board
decision.

Daily smoke does not define release readiness. A Phase 10 release candidate keeps
broader, human-directed exploratory acceptance for parity areas omitted from the
pack, including notifications, assistant behavior, in-place migration, settings,
and detailed visual/interaction variants.

## Consequences

The native signal is shorter and centered on import, local creation, persistence,
and representative calendar management. Detailed behavior can regress only if
its owning lower-level tests and release-candidate acceptance both miss it, so
the removed-flow coverage map remains explicit. The native workflow cadence,
immutable target, both-platform selection, process-per-flow lifecycle, and retry
semantics do not change.

## Revisit if

Revisit when product usage or release incidents show that one retained journey
has lower signal than a replacement, or when native execution becomes cheap and
reliable enough for a board decision to raise the maximum beyond five.
