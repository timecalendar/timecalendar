# 024 — Persist event checklists and share event details

## Status

Accepted.

## Context

Checklists apply to both local and synced events and need durable ordering.

## Decision

Store checklist rows in SQLite with a soft event-UID reference and hard deletion. Reorder
items in one synchronous transaction. Use one event-details screen for both event kinds,
with accessible move-up/down controls.

## Consequences

Checklists survive event-source refreshes. Personal events remain editable; synced events
remain read-only apart from local checklist and visibility state.

## Revisit if

Checklist data becomes server-owned or ordering needs multi-device conflict resolution.
