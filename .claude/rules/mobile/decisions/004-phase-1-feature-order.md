# 004 — Phase 1 feature order: Settings → Personal events → School selection

> Origin: migration-approach §8, knob **K-4** (proto-ADR → real ADR at scaffold).

## Status

Accepted. Not yet started (Phase 1 follows Phase 0 / the foundation).

## Context

Phase 1's three features exist to stress **different architectural axes** so the
pattern is validated against variety before it is blessed (§4). The order must make
a failing pattern easy to attribute, so each feature should add exactly one new
axis. Explicitly not the calendar.

## Decision

1. **Settings** — local prefs (MMKV), simple native controls, i18n surface.
2. **Personal events** — device-local CRUD: Drizzle/SQLite, offline writes, forms,
   native date/time pickers, list rendering.
3. **School selection / onboarding** — server-data read flow: TanStack Query, sync,
   offline cache, nested navigation.

**Why:** ascending complexity, each feature adding exactly one new architectural
axis. Personal events is chosen over hidden events for the CRUD slot because it is
self-contained — the user creates from scratch and it doesn't depend on synced
events existing (its calendar overlay lands in Phase 2 via a clean seam).

## Consequences

- Settings, as the first logic-bearing feature, owns wiring the K-3 coverage
  threshold ([003](./003-coverage-threshold.md)).
- The golden-path exemplar ([../golden-path.md](../golden-path.md)) is extracted in
  Phase 1.5 from what these three features teach — so this order also fixes the
  order in which the exemplar's lessons accrue.

## Revisit if

A dependency forces a different order, or one feature proves too thin to exercise
its intended axis (swap it for one that does).
