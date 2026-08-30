# 051 — Version individual controllers by path

## Status

Accepted.

## Context

Calendar rename is a new contract, while Flutter release builds in the field still call the
existing unversioned calendar routes and cannot be migrated by this change. The import draft that
feeds new calendar creation is independently recorded in ADR
[047](./047-ephemeral-calendar-import-draft.md); it does not change the compatibility boundary of
those server routes.

## Decision

`/v1` is a literal prefix in an individual controller's path. NestJS global versioning remains
disabled because `app.enableVersioning` would apply a default version across controllers that
Flutter still calls unversioned. Two routes carry the prefix today:
`PATCH /v1/calendars/{token}` in `CalendarV1Controller` within the existing `CalendarModule`, and
`POST /v1/calendar-logs/search`. Calendar read by token, create, sync, and every other existing
route remain unversioned. An API-wide versioning migration is deferred, not decided.

## Consequences

The API intentionally carries two routing styles, so contributors must choose the route style from
the compatibility contract rather than copying the newest controller. The rule is repeated in
`data.md` because the framework cannot enforce it safely.

## Revisit if

A third or fourth `/v1` route makes controller-local prefixes more expensive than one coordinated
migration, a breaking change is required on a route Flutter still calls, or Flutter is retired.
