# 032 — Patch calendar-kit's live scroll anchor

## Status

Accepted for `@howljs/calendar-kit` 2.5.6.

## Context

During sustained fast scrolling, calendar-kit's debounced event-store anchor stayed near
the starting week. Widening buffers only moved the point where mounted pages became empty.
The library exposes no public control for this mechanism.

## Decision

Apply the checked-in `patch-package` patch. It advances the store anchor on visible-column
changes and throttles repacking to at most once per 150 ms while preserving the settled
`onDateChanged` callback. Pin the package version and fail installation if the patch fails.

## Consequences

Fast flings keep event data available, at the cost of periodic repacking. The patch itself
is not exercised by Jest because tests use the renderer seam; dense device testing is required.

## Revisit if

Upstream fixes the behavior, the package is upgraded, or repacking misses frame budgets.
