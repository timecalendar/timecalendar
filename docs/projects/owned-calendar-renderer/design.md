---
kind: design
status: not-started
---

# Target technical design

## Current context and constraints

The current React Native Calendar uses `@howljs/calendar-kit` 2.5.6 behind
`mobile/src/features/calendar/renderer/`, with a committed patch and a renderer-neutral feature
boundary. Calendar events are read locally; network synchronization is a separate workflow. Agenda,
Calendar screen orchestration, navigation, settings, filtering, and event details sit outside the
day/week renderer.

The draft product contract requires a clean pre-launch replacement and explicitly declines a
fallback, dual renderer, compatibility shim, or public-package promise. These are draft product
constraints until [product.md](./product.md) is approved, not approved architecture (`P08`).

## Target architecture

No target architecture has been selected. Technical investigation starts only after product
approval and must compare viable rendering, gesture, virtualization, accessibility, and dependency
strategies against measured evidence. The design must preserve the approved product contract rather
than changing it to suit a preferred stack.

## Data and contracts

Product evidence currently requires local-only rendering reads, atomic application of completed
sync changes, shared date context across timeline and agenda, and independently verifiable date,
interval, timezone, segmentation, overlap, label-input, and geometry semantics. The final data API,
imperative API, module split, cache/index shape, and migration path remain undecided (`P02`, `P03`,
`P06`).

The first weekday must enter week arithmetic, paging, and layout as an explicit product-policy
input. Monday is the only launch value, but it must not be encoded as an unchangeable primitive;
weekend filtering must identify Saturday and Sunday rather than assume that a work week is the
first five columns. The event domain must likewise preserve the semantic distinction between a
date-only all-day range and an instant-bounded timed event. A provider-specific timezone-bearing
all-day representation is not part of the launch contract and must not be inferred from duration or
midnight boundaries.

## Security and integrity

Invalid events must be isolated without exposing event content or identifiers in diagnostics.
Privacy-safe aggregate workload research must use fabricated fixtures and suppressed small cohorts.
Architecture work must document dependency provenance, licensing, release, maintenance, and
security ownership before adding a rendering or native dependency (`P03`, `P04`).

## Failure handling and operations

The Calendar must continue showing valid local data when background sync fails. Local-store errors
need accessible failure and retry behavior. The renderer must bound retained pages, views, events,
semantic nodes, memory, and idle work. Exact recovery boundaries and observability hooks await
technical design (`P05`, `P06`).

## Rollout and rollback

The app is unshipped, so a coordinated breaking replacement on `main` is acceptable after planning
approval. The draft product contract rejects a calendar-kit fallback, dual renderer, compatibility
shim, and percentage rollout. Architecture must define a safe development and verification path
within those constraints and identify any native runtime-fingerprint changes (`P08`).

## Verification strategy

The accepted direction combines deterministic automated correctness and invariant tests with
release-build profiling and recorded human physical-device verification. The detailed device,
fixture, accessibility, gesture, resize, resource, and regression obligations are listed in
[product.md](./product.md) and the [questionnaire](./research/functional-specification-questionnaire.md).
Exact tools, repetition rules, artifacts, and measurable thresholds remain design work
(`P01`–`P07`).

## Decision index

No project-local architecture decision is approved or proposed yet. The decision backlog is kept in
[decisions/README.md](./decisions/README.md).

## Open risks

- `PF-021`: visible work and bounded prefetch/overscan.
- `B-006`: whether and how an imperative renderer API exists.
- `B-010`: the final Hermes/New Architecture constraint.
- `B-011`: the role of Reanimated, Gesture Handler, or alternatives.
- `B-012`: the evidence required for a native or rendering dependency.
- `B-014`: dependency ownership, maintenance, licensing, release, and security criteria.
- The release resource budgets, device floor, zoom/density values, contrast algorithm, and workload
  fixtures still require the research named in the product contract.
