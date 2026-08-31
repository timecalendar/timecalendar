# 053 — Resolve cold launch through one ordered owner

## Status

Accepted.

## Context

Cold launch crosses SQLite migrations, the future Flutter importer, killed-state
notification intent, held-calendar identity, the persisted default tab, Expo
Router, and splash readiness. Independent effects race and can expose Home before
Calendar/onboarding or overwrite a deep link.

## Decision

One process-lifetime startup coordinator resolves in this order: migrations;
the Phase 09 importer insertion point; initial deep-link/notification intent;
held-calendar identity; then the Home/Calendar fallback. Explicit navigation
and onboarding outrank the fallback. The winner is committed once and Settings
changes only affect the next process. `(tabs)` remains the static back-stack
anchor. Splash readiness and tabs-only secondary effects wait for observed route
commitment; prerequisite failures fail closed to an accessible Retry surface.

We reject competing redirect effects and dynamic native-tab trigger order: both
make outcome depend on timing or mutate the stable Home · Calendar · Settings
information architecture.

## Consequences

Phase 09 must insert import work after migrations and before preference/identity
reads. Killed-state notification ownership lives at the coordinator while live
listeners retain foreground/background behavior. New launch prerequisites must
join this sequence and its failure state, not add another redirect.

## Revisit if

Expo Router provides a declarative async initial-route API that preserves the
`(tabs)` deep-link anchor and proves the same intent precedence and first-paint
guarantees without a mounted coordinator.
