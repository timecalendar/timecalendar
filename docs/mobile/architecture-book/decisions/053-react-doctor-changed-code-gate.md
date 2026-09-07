# 053 — Keep React Doctor advisory globally and blocking on changed code

## Status

Accepted.

## Context

React Doctor identifies useful React and React Native risks, but the mobile project has an
evidence-classified existing inventory. A full warning gate would charge unrelated changes for
that debt, while an unpinned ad hoc invocation cannot produce comparable evidence. Dependency
analysis can also cross into independent sibling package graphs when the standalone project
boundary is not explicit.

## Decision

The mobile project pins React Doctor exactly in its lockfile and owns two scripts. The full scan is
mobile-only, cache-disabled, verbose, telemetry/score-free, supply-chain-free, and advisory. CI
runs the same scanner against findings newly introduced relative to `origin/main` and blocks at
warning severity. The normalized full inventory and its evidence live in
[`docs/mobile/react-doctor.md`](../../react-doctor.md); no rule suppression or score target replaces
triage.

Dependency vulnerability tools retain ownership of supply-chain findings. A dependency from a
sibling package graph is not a mobile dependency unless it resolves from the mobile lockfile.

## Consequences

Existing diagnostics remain visible and owned without blocking unrelated work, while every new
warning or error fails the changed-code gate. CI checkout must retain enough history to resolve the
base and merge base. Tool upgrades require an explicit pin, refreshed normalized inventory, and
gate-contract verification.

## Revisit if

The classified inventory reaches zero, React Doctor changes its changed-issue identity semantics,
the repository becomes one package graph, or a replacement analyzer provides an equally
reproducible mobile-only changed-code gate.
