# Owned calendar renderer discovery

Status: Rounds 1 and 2 are recorded; Round 3 triage and proposed owner questions are published.
Discovery continues; no renderer implementation or architecture is authorized by these documents.

This directory is the working home for the owned React Native calendar renderer project. Its first job is to establish the product contract with the product owner before architecture or implementation begins.

## Document map

1. [Discovery scope and evidence](./01-discovery-scope-and-evidence.md) records what is confirmed, what was merely observed, where existing sources disagree, and what this discovery may and may not decide.
2. [Functional specification questionnaire](./02-functional-specification-questionnaire.md) is the decision backlog for future product-owner sessions.
3. [Round 3 triage and owner questions](./round-3-triage-and-owner-questions.md) maps all 187 rows that were unanswered after Round 2 to a triage disposition and publishes the short ELI5 Round 3 set.
4. [The original implementation prompt](../01-roadmap/owned-calendar-renderer-prompt.md) is retained as historical input. Its proposed requirements and solutions are not approved scope.

Future numbered documents should follow this naming scheme:

- `03-functional-specification.md` after the product questions are answered;
- `04-non-functional-requirements.md` after measurable quality and performance budgets are confirmed;
- `05-acceptance-plan.md` after the supported device and accessibility matrix is confirmed;
- `06-architecture-options.md` only after the functional specification is stable;
- `07-architecture-decision.md` only after options have been measured and reviewed;
- `08-delivery-plan.md` only after scope and architecture are approved.

The filenames above reserve a useful sequence; they do not authorize creating those documents or choosing their content without owner input.

## Decision policy

Only an explicit product-owner answer can put product behavior in scope or out of scope. Existing code, tests, Flutter behavior, roadmap prose, OpenSpec artifacts, ADRs, and the legacy prompt are evidence. They are not substitutes for confirmation.

Every future statement must carry one of these statuses until the specification is approved:

- `CONFIRMED_IN`: the product owner explicitly requires it;
- `CONFIRMED_OUT`: the product owner explicitly excludes it;
- `DEFERRED`: deliberately postponed, with a stated revisit point;
- `OBSERVED`: present in a codebase or document but not accepted as future behavior;
- `HYPOTHESIS`: a possible need that must be validated;
- `NEEDS_RESEARCH`: a factual question that requires measurement or investigation;
- `UNANSWERED`: no decision exists.

Silence, existing behavior, an old test, and an unanswered question never mean approval.

## Confirmed for this discovery

- We are preparing the functional scope for an owned React Native calendar renderer.
- We must not infer requirements that the product owner has not confirmed.
- The Flutter implementation is historical evidence, not the product specification or an architecture template.
- Feature correctness, performance, code quality, maintainability, and open-source quality matter.
- The desired engineering posture is to avoid deliberate compromises and known technical debt from the start.
- This session produces documentation and an extensive question backlog, not product code.

Round 2 confirmed the priority order, persistence and navigation rules, week model, all-day
and cross-midnight semantics, accessibility target, initial performance matrix and budgets,
responsibility split, quality/debt gates, and bounded fixture catalog. The questionnaire
continues to make the remaining product and acceptance details explicit instead of inferring
them from those broad decisions.

## Readiness after Round 3 triage

The blocking first-pass owner decisions are recorded, but the project is not yet ready to
call `03-functional-specification.md` complete. Round 3 audited all 187 rows that were unanswered
after Round 2. Twelve directly supported transitions are now recorded, leaving 175
`UNANSWERED`: 20 repository/standards research, 29 recommendation-led specification, 50 genuine
owner choices, 55 later-choice dependencies, and 21 explicit out-of-scope candidates.

Five factual items already have bounded research actions: `P-004`, `PL-003`, `PF-006`,
`PF-007`, and `PF-008`. The production aggregate was re-attempted without reading raw data and
is blocked by database network reachability plus denied pod exec/port-forward. The host also has
no physical/emulated mobile runtime, and the owned renderer does not yet exist for an honest
release baseline. These are named measurement blockers, not owner decisions.

The next owner step is the 12-question dependency-ordered Round 3 set. Architecture and
implementation remain unauthorized until the resulting row answers remove material product
ambiguity and the owner explicitly authorizes the functional specification.

## Explicitly outside this discovery session

- Implementing, prototyping, or changing the renderer;
- choosing React Native views, Reanimated, Gesture Handler, Skia, Canvas, a fork, or another rendering technology;
- accepting the proposed renderer API in the legacy prompt;
- accepting its performance numbers, page counts, overscan, event-volume targets, or device matrix;
- declaring any current React Native or Flutter behavior a parity requirement;
- removing `@howljs/calendar-kit`, its patch, or its adapter;
- writing a delivery estimate or implementation task breakdown;
- changing the current application behavior.

## How to run the owner-response session

1. Read this README and `01-discovery-scope-and-evidence.md` completely.
2. Verify that merged `main` contains the exact 12 questions in `round-3-triage-and-owner-questions.md`; do not move an owner-response ticket to review before that check passes.
3. Ask only those 12 Round 3 questions, in order. Do not send the 175-row backlog to the owner or ask for researchable facts.
4. Record the owner's exact answer, decision status, and any examples. Do not silently normalize ambiguity.
5. If an answer depends on facts rather than preference, mark it `NEEDS_RESEARCH` and create a bounded agent-owned action. Do not guess or hand agent work to the owner.
6. Restate each completed topic as candidate requirements and non-requirements for owner confirmation.
7. Create the functional specification only after the owner confirms that the questionnaire is sufficiently resolved.
8. Keep architecture and implementation proposals out of the functional specification unless the product owner explicitly states a technical constraint as a requirement.
