# Owned calendar renderer discovery

Status: Rounds 1–3 owner answers are recorded. Discovery continues; no functional specification,
renderer implementation, or architecture is authorized by these documents.

This directory is the working home for the owned React Native calendar renderer project. Its first job is to establish the product contract with the product owner before architecture or implementation begins.

## Document map

1. [Discovery scope and evidence](./01-discovery-scope-and-evidence.md) records what is confirmed, what was merely observed, where existing sources disagree, and what this discovery may and may not decide.
2. [Functional specification questionnaire](./02-functional-specification-questionnaire.md) is the decision backlog for future product-owner sessions.
3. [Round 3 triage and answer record](./round-3-triage-and-owner-questions.md) maps all 187 rows that were unanswered after Round 2, preserves the short ELI5 question set, and records the owner's free-form and structured answers.
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

## Readiness after Round 3 answers

The blocking first-pass owner decisions are recorded, but the project is not yet ready to
call `03-functional-specification.md` complete. The questionnaire's 280 unique rows now total 172
`CONFIRMED_IN`, 45 `CONFIRMED_OUT`, five `DEFERRED`, nine `NEEDS_RESEARCH`, and 49
`UNANSWERED` after the owner's Round 3 free-form response and eight structured follow-up choices
were propagated row by row.

The nine bounded research keys are `P-004`, `PL-003`, `T-011`, `T-012`, `E-020`, `V-009`,
and `PF-006`–`PF-008`. The production aggregate remains blocked by database network reachability
plus denied pod exec/port-forward. The host also has no physical/emulated mobile runtime, and the
owned renderer does not yet exist for an honest release baseline. Numeric zoom bounds, crowding
thresholds, and contrast algorithms are agent-owned technical work, not owner decisions.

Remaining `UNANSWERED` keys, in questionnaire order:

- Users/platform: `U-002`, `U-005`, `U-006`, `U-008`, `U-009`, `U-010`; `PL-007`, `PL-010`.
- Navigation/time: `N-012`, `N-015`, `N-018`; `T-009`.
- Events/interactions/dates/visuals/accessibility: `E-014`, `E-025`; `I-013`; `D-009`,
  `D-010`; `V-012`, `V-013`; `A-010`, `A-011`.
- Performance: `PF-009`–`PF-011`, `PF-014`, `PF-015`, `PF-018`–`PF-028`.
- Boundaries/migration: `B-002`, `B-003`, `B-005`, `B-006`, `B-009`–`B-014`; `M-011`,
  `M-012`.

No new owner question is created by this answer-recording change. Architecture and implementation
remain unauthorized until later discovery removes material product ambiguity and the owner
explicitly authorizes the functional specification.

## Explicitly outside this discovery session

- Implementing, prototyping, or changing the renderer;
- choosing React Native views, Reanimated, Gesture Handler, Skia, Canvas, a fork, or another rendering technology;
- accepting the proposed renderer API in the legacy prompt;
- accepting its performance numbers, page counts, overscan, event-volume targets, or device matrix;
- declaring any current React Native or Flutter behavior a parity requirement;
- removing `@howljs/calendar-kit`, its patch, or its adapter;
- writing a delivery estimate or implementation task breakdown;
- changing the current application behavior.

## How to continue discovery

1. Read this README and `01-discovery-scope-and-evidence.md` completely.
2. Treat the questionnaire as the row-level source of truth and the Round 3 document as the
   answer audit trail; never restore a historical recommendation that the owner corrected.
3. Complete bounded factual or technical research with agents. Do not ask the owner to provide
   measurements, algorithms, or repository facts.
4. Preserve unresolved product precision explicitly. If another owner round becomes necessary,
   prepare its exact short keyed set on merged `main` before starting the response issue.
5. Create the functional specification only after the owner confirms that the questionnaire is
   sufficiently resolved.
6. Keep architecture and implementation proposals out of the functional specification unless the
   product owner explicitly states a technical constraint as a requirement.
