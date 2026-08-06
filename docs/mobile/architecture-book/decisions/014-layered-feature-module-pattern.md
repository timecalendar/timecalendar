# 014 — Organize features by explicit sublayers

## Status

Accepted.

## Context

Preferences, local CRUD, and server-read features converged on the same ownership pattern
while needing different kinds of logic.

## Decision

Use `src/features/<feature>/<layer>/`, adding only needed layers such as `data`, `store`,
`form`, and `ui`. Give each layer a public barrel. Sublayers import sibling barrels, never
their feature barrel. Routes remain thin, and feature UI does not access API, database, or
MMKV dependencies directly. ESLint encodes these boundaries.

Logic layers are subject to the 90% coverage gate; presentation contributes to the global
70% floor.

## Consequences

Ownership and dependency direction remain visible without imposing a rigid feature template.
See [golden-path.md](../golden-path.md) for the working guide.

## Revisit if

A real feature needs a new layer or cannot maintain an acyclic dependency graph.
