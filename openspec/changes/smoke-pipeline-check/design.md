# Design — pipeline smoke check

## Context

TIM-466 is a board smoke test, not a feature. The only thing under test is the pipeline itself: can a run commit, push, and open a draft PR with the post-fix GitHub App credentials.

## Decisions

### D1 — A docs marker file, not code

The change touches `docs/` only so the diff can never affect the product, and so the PR is safe to close unmerged if the board prefers. No lint, type, or test surface is involved.

## Non-Goals

- Any product change.
- Any change to CI, workflows, or credentials themselves.
