# ADR 058 — Activity virtual-fragment pagination

## Status

Accepted.

## Context

Activity v1 originally bounded database rows, but one row can contain thousands
of changes. A deterministic 3,656-change fixture serialized above the frozen
one-megabyte page budget at both supported item limits. Existing devices persist
each response item by its string id and may resume opaque cursors after a server
upgrade.

## Decision

The server projects an oversized source log into a deterministic virtual stream
of valid `CalendarLogV1` fragments. Atomic traversal order is `newItems`, then
`changedItems`, then `oldItems`; a changed before/after pair is never split.
Fragments target 256,000 serialized bytes. Fragment zero retains the source log
id, while later fragments receive stable distinct ids derived from the source
id and fragment index.

The v1 page limit counts virtual response items. The server also packs the exact
serialized response envelope to a 900,000-byte target. Its version 2 opaque
cursor identifies the exact next atomic-entry position and includes the anchored
source row only for a positive within-row offset. Previously issued version 1
cursors retain their exclusive-row meaning.

Unread counts, retention, and notification processing remain source-row based.
The public request and response schemas do not change.

## Consequences

One source sync can render as adjacent Activity sections, but every change is
retained and existing id-keyed caches replace the old whole item through
fragment zero. Changing traversal, fragment sizing, or id derivation later can
leave stale synthetic rows on devices and therefore requires an explicit cache
reconciliation plan.

A single atomic entry larger than the target is returned alone so pagination
always progresses; it is counted only by aggregate telemetry and is never
truncated.

## Revisit if

Revisit if Activity introduces explicit fragment metadata or detail fetching,
or if a future representation can reconcile previously cached fragment ids.
