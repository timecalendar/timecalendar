---
kind: decision
id: D05
status: approved
traces-to: [P01, P02, P03, P04]
supersedes: []
---

# D05 — Fixed notification scheduling and owner-led visual acceptance

## Context and evidence

The daily queue drains at 19:00 Europe/Paris. The owner explicitly retains that schedule
for everyone and personally owns the native visual verification pass.

## Options considered

Preserve the fixed Paris schedule or add per-user scheduling. Record visual acceptance in
implementation criteria or create a separate QA ticket. The owner selected the former in
both cases.

## Decision

Daily notifications remain scheduled at 19:00 Europe/Paris independently of display zone.
Preserve the other queue schedules as well; explain frequency honestly without promising
exact arrival. Display-zone preferences only affect displayed/push-formatted event times.

The project owner performs device visual acceptance. Implementation work carries relevant
automated checks and a concise description of the surfaces/states to review. No standalone
visual verification ticket, epic, tracker item, or agent assignment is created.

## Tradeoffs and consequences

Some users receive daily processing at a different local hour. That is intended. Native
fidelity still requires human evidence; automated tests are not a substitute, and the plan
must not mark visual acceptance complete before the owner supplies it.

## Approval

Project owner, Codex conversation, 2026-09-21: “Yes it's 19:00 Paris time, we know it. we don't
want to adapt to users' timezone.” For visual verification: “Yes ofc. But i'll do it, no need
to write a ticket for that.” This is explicit approval of both constraints.
