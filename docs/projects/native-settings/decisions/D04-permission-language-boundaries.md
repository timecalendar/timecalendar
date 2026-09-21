---
kind: decision
id: D04
status: approved
traces-to: [P01, P03, P04]
supersedes: []
---

# D04 — Defer permission lifecycle and bound language refresh

## Context and evidence

A basic notification status read is small. A complete experience includes prompting,
refusal, provisional authorization, Android runtime permission and categories, returning
from system Settings, and reconciling app intent with OS state. The owner questions adding
that work to this project. Existing startup/request behavior has known limitations.

Automatic language detection currently runs at startup and explicit System selection.
expo-localization already exposes a reactive locale hook. No new native bridge is needed
to attempt a single listener that refreshes i18next when the effective language changes.

## Options considered

- Full permission lifecycle and OS locale synchronization now: too broad for this project.
- Partial permission banner only: small, but introduces lifecycle states without completing
  their recovery experience and risks expanding this project piecemeal.
- Defer the complete permission flow, retain a bounded language listener: recommended.
- Omit all language refresh: acceptable fallback if the existing API cannot keep it simple.

## Decision

Defer notification permission UI, changing prompt timing, Android request repair, category
management, and system-settings links to a future change. Preserve current permission
behavior while separating it from the resilient preference-sync implementation. Subscription
copy describes user intent and never claims device authorization or guaranteed delivery.
Document known permission limitations in the plan; create no permission ticket here.

Use one existing-API app-level locale listener only while language preference is system;
call i18next only on an actual supported-language change. No OS app-language synchronization,
supported-locale configuration migration, new library/native bridge, or expanded state
machine. If that boundary cannot be met, retain startup/manual-selection behavior.

## Tradeoffs and consequences

Settings presentation and durable saves can ship without claiming that notification delivery
or permission recovery is repaired. Some users can still have an active subscription while
the OS blocks delivery. The existing Android request gap remains explicitly deferred.
Automatic-language refresh improves a rare transition at small cost; explicit language
overrides remain independent of OS per-app language settings in this project.

## Approval

Project owner, Codex conversation, 2026-09-21: “Approve these choices and continue to
roadmap/tickets.” The quoted response directly answers the scoped product and D02–D04
review question, including the package combination, durable synchronization mechanism and
ambiguous-timeout tradeoff, full permission deferral, and bounded language refresh.
