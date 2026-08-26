# 039 — Preserve content and advise source recovery

## Status

Accepted.

## Context

School export URLs can retain a bounded academic-year window after that window
expires or after a university moves its scheduling service. A failed or empty
refresh intentionally preserves the only timetable on the device, but without a
separate signal students can mistake that snapshot for current data.

## Decision

The server classifies source health conservatively from explicit expired windows,
successful content-change evidence, and reviewed school/host transitions. Batch
sync returns fixed, URL-free advisory codes beside unchanged last-good events.
Mobile stores those codes as one rebuildable MMKV snapshot, shows stale advice,
and routes recovery through the existing add-calendar flow. Only the existing
confirm-gated delete can remove the old calendar.

We reject automatic URL rewriting/deletion, server display text, failure status as
the batch signal, and a SQLite schema change for rebuildable advice.

## Consequences

Cached events remain useful offline and during recovery, but are explicitly
labelled as potentially old. Unknown evidence does not alarm users. Contract enums,
mobile translations, the reviewed source registry, and privacy-safe persistence
must evolve together. Detection performs no migration, backfill, rewrite, or
deletion.

## Revisit if

An authenticated server-side migration mechanism can prove source identity,
record an audit trail, and roll back each mapping. That mechanism requires a
separate human-gated rollout; it must not weaken last-good preservation.
