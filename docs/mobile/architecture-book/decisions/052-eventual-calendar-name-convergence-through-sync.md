# 052 — Converge calendar names through a name-only sync write

## Status

Accepted.

## Context

A rename is global to every holder of the calendar token, but only the renaming device learns it
immediately. Other installations learn through ordinary sync. Reusing `fromCalendarForPublic` to
refresh an existing row is unsafe: the mapper hard-codes the client-only `visible: true`, so a
full-row write would unhide a hidden calendar at every app start. The pre-create import state stays
ephemeral under ADR [047](./047-ephemeral-calendar-import-draft.md) and is not a sync source of
truth.

## Decision

After replacing events, sync compares each returned `calendar.name` with the local row and calls
the narrow `updateName(id, name)` only for rows whose names differ. It never upserts a
`user_calendars` row, never uses the DTO mapper, and changes no other column. Event replacement and
name write-back are separate failure domains: a failed name write leaves replaced events committed,
keeps last-good names, records its own failure context, and retries convergence on a later sync.

## Consequences

Name convergence is eventual and unordered, so one installation may display a stale name for a
sync cycle. A second server-owned field requires another narrow write rather than weakening this
boundary into a full-row upsert. No type or lint rule expresses that the write must stay narrow, so
the binding rule also lives in `features.md`.

## Revisit if

A second server-owned field must converge, `visible` or another local-only column stops being
client-only, or event replacement and metadata convergence must become one transaction.
