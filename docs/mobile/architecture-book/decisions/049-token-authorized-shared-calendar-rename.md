# 049 — Authorize shared calendar rename by token possession

## Status

Accepted.

## Context

Calendars are reached through a bearer token in the URL path. TimeCalendar has no account,
calendar owner, per-device identity, or per-holder permission model, and one token is routinely
shared within a cohort. The naming and manual-import contract introduces a shared rename endpoint;
the preceding import draft remains the separate, ephemeral concern recorded in ADR
[047](./047-ephemeral-calendar-import-draft.md).

## Decision

Possession of the calendar token is the entire capability for read, sync, and rename.
`PATCH /v1/calendars/{token}` returns `404` for an unknown token without disclosing other calendar
data, accepts duplicate and empty names, and resolves concurrent changes last-write-wins. Rename
updates normal entity metadata but never `lastUpdatedAt`, which continues to mean a successful
upstream refresh. The renaming device persists the name returned by the server, not its typed
input. We reject accounts or ownership, per-device aliases, rename permissions, and rename history
for this contract.

## Consequences

Any cohort member holding the token can rename the calendar for every holder, with no audit trail
or undo. Other devices converge on sync. Empty names remain legal and use the display fallback;
existing rows are not backfilled.

## Revisit if

Accounts or per-calendar ownership arrive, support needs to answer who performed a rename, or
students request per-device aliases.
