---
kind: project
id: native-settings
status: implementable
decision: go
---

# Native settings

## Intent

TimeCalendar settings follow iOS and Android conventions with precise native surfaces,
searchable worldwide time zones, and notification preferences that survive navigation and
temporary network failure. French and English are first-class experiences.

## State

- Product: approved.
- Technical design: approved; D01–D05 approved.
- Roadmap: three outcome epics, four canonical tickets.
- Readiness: implementable subject to the recorded native-integration and rollout checks.
- Publication and fleet dispatch: explicitly authorized through the commit and Paperclip skills.

## Review package

- [Product and boundaries](product.md)
- [Target design](design.md)
- [Delivery sequencing](roadmap.md)
- [Repository evidence and unresolved risks](research/evidence.md)
- [D01: Native presentation](decisions/D01-native-presentation.md), approved
- [D02: Library-backed time zones](decisions/D02-timezone-libraries.md), approved
- [D03: Durable notification synchronization](decisions/D03-notification-sync.md), approved
- [D04: Permission and language scope](decisions/D04-permission-language-boundaries.md), approved
- [D05: Fixed delivery schedule and human visual acceptance](decisions/D05-schedule-and-acceptance.md), approved

## Approval log

Approval source is the project owner's conversation with Codex on 2026-09-21. Exact excerpts
and their scope are preserved in the decision records. No approval is inferred from silence.

- The owner requested pixel-perfect native settings for both platforms and approved the
  proposed frequency and days-ahead selection flows with “Perfect.”
- The owner explicitly selected common-city time-zone search and the single language list.
- The owner required a standard time-zone library and approved manual-zone memory.
- The owner approved the native presentation direction, resilient saves, and a bounded
  language refresh. The exact synchronization architecture is approved in the decision review below.
- The owner fixed daily delivery at 19:00 Paris time and owns device visual verification,
  explicitly requesting no ticket for that activity.
- The owner explicitly answered the scoped product/D02–D04 approval question with
  “Approve these choices and continue to roadmap/tickets.” This approves the library
  combination, durable synchronization architecture and timeout tradeoff, permission deferral,
  and bounded language refresh. Canonical decomposition follows that instruction.
- The owner approved the complete four-ticket package with “approve everything” and requested
  a direct commit/push on main followed by Paperclip epic dispatch. This includes the roadmap,
  three outcome groupings, four implementation tickets, and their acceptance criteria.

## Residual risks and caveats

- SwiftUI forms inside Expo Router, native sheet search, numeric keyboard dismissal, and
  assistive-technology behavior require device evidence. Available APIs are not visual proof.
- Older installed OS time-zone databases may lag the library and server. Zone aliases and
  runtime validation need compatibility tests; existing preferences must not be erased.
- Without server-side preference revisions, a timed-out request can finish late. D03 promises
  durable intent and repeated convergence, not strict distributed last-write ordering.
- Permission management is deferred. The existing Android request gap and
  startup prompt remain known limitations, not claims that this project fixes delivery.
- Evidence was checked against clean local main and origin/main at
  `3e5c818e6ec5e2435c8c66750f2503ab85cbad0c`. Revalidate before ticket execution.

## Implementation entry point

Start with [T01: Native hub, theme, and language](epics/E01-native-preferences/T01-native-preferences.md).
It validates a complete native journey before other settings reuse its presentation contracts.
Reliable notification saves (T05) can proceed independently; the time-zone chooser (T03)
uses T01’s native presentation contract.
See [the roadmap](roadmap.md) for dependencies and confidence drivers.

Planning readiness does not certify implementation, device appearance, or a release. The
owner's visual acceptance remains a rollout gate, with no separate ticket.
