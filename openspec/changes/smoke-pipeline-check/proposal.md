# Pipeline smoke check

## Why

The delivery pipeline's GitHub App credentials were replaced on 2026-09-06 (TIM-466). We need one end-to-end run that commits, pushes, and opens a draft PR under the new App to prove the plumbing works. No product behavior is at stake.

## What Changes

- Add `docs/smoke-pipeline-check.md`, a one-sentence marker file recording that this smoke test ran.

## Impact

- `docs/` only. No code, no tests, no contract, no sensitive surface.
