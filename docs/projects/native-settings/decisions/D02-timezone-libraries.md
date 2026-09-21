---
kind: decision
id: D02
status: approved
traces-to: [P02, P04]
supersedes: []
---

# D02 — Standard data and existing time-zone calculations

## Context and evidence

The owner requires worldwide zone selection, common-city search, and a standard library.
The published @vvo/tzdb 6.198.0 data includes Paris, Marseille, Lyon, and Toulouse under
Europe/Paris. date-fns-tz is already installed and uses Intl for actual time calculations.
Unicode CLDR provides translated exemplar names such as London/Londres.

## Options considered

- Handwritten city/zone data and daylight-saving rules: rejected by the owner's instruction.
- Intl alone: supports time formatting but does not supply common-city discovery.
- Replace the date stack with another date library: no demonstrated benefit for these screens.
- @vvo/tzdb search data, existing date-fns-tz/Intl, and a bounded CLDR label subset: recommended.

## Decision

Use the recommended combination, pinning compatible library versions through normal package
management. Search operates offline. The app indexes supplied names and aliases, not its own
geographic rules. Preserve existing named-zone identifiers and expose all supported names;
do not treat display grouping as permission to rewrite stored zones. Add remembered manual
selection without changing stored event instants or all-day semantics.

## Tradeoffs and consequences

Common-city coverage is bounded by the library. A small CLDR import/build step supports
translated names without bundling the full data distribution. Mobile/server runtime support
must be checked, including aliases, UTC, fractional offsets, and daylight saving. Newer zone
data and old OS runtimes can disagree. Updating dependencies is the maintenance path.

## Approval

Project owner, Codex conversation, 2026-09-21: “Approve these choices and continue to
roadmap/tickets.” The quoted response directly answers the scoped product and D02–D04
review question, including the package combination, durable synchronization mechanism and
ambiguous-timeout tradeoff, full permission deferral, and bounded language refresh.
