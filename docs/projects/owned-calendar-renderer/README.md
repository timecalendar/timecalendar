---
kind: project
id: owned-calendar-renderer
status: implementable
decision: go
---

# Owned calendar renderer

## Intent

Replace the patched `@howljs/calendar-kit` day/week timeline before the React Native launch with
an owned TimeCalendar renderer that is correct, glance-fast, accessible, resource-bounded, and
maintainable without compatibility baggage. Keep Calendar orchestration, local data access,
synchronization, agenda, and event-details navigation outside the timeline boundary.

## State

As of 2026-09-14:

- Product: `approved`, `go`; P01–P08 and the detailed launch contract remain binding.
- Design and architecture: `approved`; the owner approved D01–D08, explicitly including D04–D06
  with evidence collected during implementation.
- Delivery policy: approved small vertical slices, one at a time. Agent implements/checks, owner
  tests/gives feedback, fixes are verified, owner accepts, the slice merges, then the next starts.
- Roadmap: seven outcome groups and 29 tickets; E01/T01–T04 are completed and merged.
- Readiness: E02/T05–T08 are next, using the accepted native scroll/pager implementation.
  [E01 completion evidence](./research/results/E01/completion.md) separates completion and host
  regression checks from unrecorded device observations and final release gates.

Start E02 with [T05 — Day/week mode](./epics/E02-control-the-calendar-view/T05-day-week-mode.md),
then deliver T06 zoom, T07 native resizing and T08 current time sequentially.
The [roadmap](./roadmap.md) defines the full execution order; [delivery.md](./delivery.md) defines
exactly when to stop for the owner. An epic is a grouping, never a batch to finish before QA.

## Position in the React Native migration

Calendar uses the owned empty-week renderer; calendar-kit is absent. The remaining owned
Calendar capabilities must finish before Phase 10 parity and store cutover can pass. This work does
not reopen the already-owned local calendar data, sync, agenda, Home, or event-details work unless
approved design evidence exposes a contradiction.

At the wider roadmap level, the repository documents Phases 01–06 as source-complete with various
physical-device checks still outstanding; Phase 07 is partial; Phase 08 is not yet marked shipped;
the Phase 09 data-migration plan is implementable but not delivered; and Phase 10 contains some
release infrastructure while parity, signed upgrade proof, hardening, and store cutover remain.

## Planning map

- [Product contract](./product.md): approved product authority, P01–P08 and detailed behavior.
- [Technical design](./design.md): approved architecture and incremental migration path.
- [Decision index](./decisions/README.md): eight approved choices, alternatives and approval evidence.
- [System audit](./research/technical-system-audit.md): source evidence and scoped migration inventory.
- [Acceptance research](./research/technical-acceptance-plan.md): comparative evidence gates and all
  29 discovery research rows, with remaining measurement and human-review obligations.
- [Roadmap](./roadmap.md) and [epic index](./epics/README.md): ordered small slices.
- [Delivery protocol](./delivery.md): owner QA, feedback, acceptance, merge and evidence records.
- [Discovery evidence](./research/README.md): preserved owner inputs and historical records.

## Approval log

- 2026-08-27 through 2026-09-07: four discovery answer rounds supplied product input.
- 2026-09-12: owner clarified Monday as launch policy and date-only versus timed semantics.
- 2026-09-12: product owner stated “I approve the product specs. Continue with the next step
  $lyro-tools:project-planning” in the continuation conversation for this project. Product is
  approved; this authorizes technical investigation and design.
- 2026-09-12: owner stated “I hereby approve all decisions” and explicitly approved D04–D06
  with testing during implementation. The same message requested small vertical slices with
  per-ticket checklists, owner feedback/acceptance and merge before the next brick. D01–D08, the
  corresponding target design and this delivery policy are approved; individual implementation
  tickets remain planned until their real QA/merge evidence exists.

- 2026-09-14: owner confirmed E01 completion and authorized refreshing the documents, committing
  to main and dispatching E02. Product outcomes and sequential owner-QA gates remain binding.

## Residual risks and caveats

- E01 supplies an empty week with native paging, full-day scrolling and dated weekday columns,
  preserving stored data and existing agenda/details. Further capabilities arrive one accepted
  brick at a time. The app must stay buildable;
  the incomplete timeline cannot ship. This follows the approved pre-launch breaking replacement
  and avoids a vendor/owned dual path.
- D04–D06 are approved starting choices, not measured guarantees. Each relevant ticket owns its
  immediate evidence; T26–T28 retain final performance/resource/human-device gates. Failures stop
  the affected slice, and a changed architecture/product premise requires a recorded decision.
- Low-confidence tickets are T12 (native off-viewport semantic reachability), T14 (DST visual
  geometry), and T24 (representative workload data/access). Each names a bounded first experiment
  or concrete external evidence requirement; none is hidden in a final quality sweep.
- Production aggregate access was historically blocked. Tablet identities, physical-device access,
  human accessibility testers and the owner-approved visual reference still need confirmation at
  the owning tickets. The agent prepares engineering evidence; the owner is not asked to invent
  algorithms, workload percentiles or numerical budgets.
- All 29 research rows map to execution tickets in the acceptance plan. Original discovery labels
  remain historical; no measurement is marked complete merely because architecture is approved.
- A ticket accepted on an agreed narrow fixture/device does not establish the full final product
  matrix. Explicit intermediate deferrals have a destination ticket and must close before launch.
- E02 work sites were revalidated against local main and fetched origin/main at
  `d293988e9dbf64a592388c8796e816fe65f49e46` on 2026-09-14. Later ticket inventories retain
  their dated planning baseline and must be revalidated at execution. The unrelated workspace ICS
  file is not inspected or used.

## Adversarial readiness review

The plan would fail if the initial shell grew into a complete renderer before first review, if an
agent continued while owner feedback was pending, or if accessibility/DST work were postponed to
final polish. T01’s exclusions, delivery.md’s explicit stop/merge gate, and early T12/T14 demos
address those failure modes. A large discovered fix must be split before expanding implementation.

A small page count alone cannot guarantee dense-event memory or accessible reachability. T09/T11
and T12 measure the separate data/visual/semantic costs; T27 measures long-session recovery.
Unavailable workload data cannot be replaced by invented percentiles: T24 names the operator or
explicit synthetic-assumption review required to proceed. These uncertainties affect downstream
acceptance, not the readiness of the next E02 slice.

## Document validation

On 2026-09-12 the ready validator passed with zero errors/warnings. Active-document links, all
29 ticket-specific QA checklists, all 29 research-to-ticket mappings and formatting also passed.
Planning readiness means the next ticket is defined; it does not certify native behavior, imply owner QA happened,
authorize automatic merges, or complete the broader React Native release process.

On 2026-09-14, the mixed completed/planned project passes structural validation (`--mode draft`),
modified-document relative-link checks and scoped Prettier checks. The planning-only `--mode ready`
validator reports five status errors because it requires E01 and T01–T04 to remain planned;
those completed records retain their accurate status. E02 itself has no reported readiness error.
