---
kind: decision
id: D01
status: proposed
traces-to: [P01, P03]
supersedes: []
---

# D01 — Download-only identity and success eligibility

## Context and evidence

Current fetcher combines transport and parsing; strategy and URL transformations precede it. Owner requests retrieval-only sharing and exact effective-request identity.

## Options considered

Stored URL alone, parsed-event caching, and exact effective-request bytes with validation were considered. The first two risk mixing contexts or calendar state.

## Proposed choice

Choose exact identity and successful bytes as specified in design.md. Validate once for admission, then independently parse/transform per consumer; bypass customData until TIM-573 is verified.

## Tradeoffs and consequences

Adds one admission parse and explicit strategy/config version maintenance. Preserves independent persistence and terminal parsing failures. This validation rule needs explicit owner approval.

## Approval

Pending explicit owner approval of this record. Owner constraints are recorded in
[the answer record](../research/owner-answers.md); full proposal approval is not inferred.
