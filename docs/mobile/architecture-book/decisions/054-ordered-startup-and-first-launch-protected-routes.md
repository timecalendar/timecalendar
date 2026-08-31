# 054 — Order startup before first-launch protected routes

## Status

Accepted.

## Context

The first durable calendar read must not race committed SQLite migrations or the future Flutter
importer. An effect-driven redirect can hide Home visually while still mounting its readers and
runtime effects. A fresh user also needs a deliberate personal-calendar path, while a recovered
calendar token must prevent onboarding before Home paints.

## Decision

Startup awaits migrations and then one typed Phase 09 legacy-import prerequisite. Failures and the
five-second watchdog keep navigation closed and expose Retry; timeout never grants readiness. Only
after both prerequisites resolve does one atomic calendar-sources live-query snapshot decide route
eligibility.

The root puts onboarding behind the inverse eligibility guard. One other `Stack.Protected` guard
contains `(tabs)` and every post-onboarding sibling. Zero calendars with no durable onboarding
resolution therefore fall back to onboarding without mounting tabs. A skip or imported-calendar
resolution, or any held calendar, grants eligibility: the Stack removes onboarding and rebuilds from
tabs as one route-graph change, with no screen-level redirect race. The eligible group is declared
before the unprotected development-token-import exception because the navigator may fall back by
route declaration order when its configured initial route was protected during initialization. A
recovered calendar seeds `calendarImported` so later deletion cannot reopen onboarding. The token-
import route remains the sole unprotected exception; its existing variant gate remains authoritative
and a successful durable write makes the protected routes eligible.

## Consequences

Startup readers and runtime effects must stay below the ordered prerequisite and first-read
boundaries. Adding a root route requires classifying it inside the shared protected group or as an
explicit pre-eligibility exception. Phase 09 replaces the no-op prerequisite without changing route
policy. A stalled prerequisite shows recovery rather than opening an unknown schema.

## Revisit if

Expo Router removes protected screens, Phase 09 needs a different ordering boundary, a second
legitimate pre-eligibility route appears, or onboarding eligibility becomes server-authoritative.
