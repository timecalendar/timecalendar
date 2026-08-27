## Context

`server/tsconfig.json` emits declarations, and `npm run generate:openapi` begins with
`nest build`. The exported `createNodeInstrumentations` function currently relies on an
inferred return type for an array containing `getNodeAutoInstrumentations(...)`. In the
dependency layout that exposed the blocker, TypeScript named that inferred type through
the auto-instrumentation package's nested `@opentelemetry/instrumentation` installation
and raised `TS2742` before the OpenAPI document could be emitted.

The current clean install on Node `v24.13.0` happens to hoist that type and builds, which
demonstrates that the failure is dependency-layout-sensitive rather than a runtime defect.
The source still lacks a declared portable boundary and can regress when npm installs an
equivalent graph with different physical placement.

## Goals / Non-Goals

**Goals:**

- Make the exported instrumentation factory declaration name only a public type from a
  direct server dependency.
- Keep the exact nested array shape accepted by `NodeSDK`, including every existing
  auto-instrumentation option and sanitization hook.
- Prove the pinned Node build, focused tracer behavior, deterministic OpenAPI generation,
  and committed-contract no-drift gate.

**Non-Goals:**

- Changing enabled or disabled instrumentations, span attributes, exporters, SDK startup,
  shutdown, or telemetry semantics.
- Adding or upgrading dependencies merely to influence npm hoisting.
- Changing controllers, DTOs, `openapi/openapi.json`, generated clients, contact code,
  database/schema state, CI workflows, deploy infrastructure, native/store configuration,
  or legacy Flutter code.
- Establishing a new reusable architecture rule or ADR for a one-function type boundary.

## Decision 1 — Type the factory through the direct SDK contract

Declare the factory return type using the exported `NodeSDKConfiguration` instrumentation
property from the direct `@opentelemetry/sdk-node` dependency. This makes declaration emit
refer to a stable public package boundary already owned by the consumer and retains the
SDK's supported `(Instrumentation | Instrumentation[])[]` shape.

Alternatives considered:

- Import `Instrumentation` directly from `@opentelemetry/instrumentation`: rejected
  because the server does not declare that package as a direct dependency, so this would
  replace an inferred transitive reference with an explicit transitive dependency.
- Use `ReturnType<typeof getNodeAutoInstrumentations>` or another inferred alias: rejected
  because declaration emit may still follow the producing package into its physical
  dependency layout.
- Flatten or otherwise restructure the returned array: rejected because no runtime shape
  change is necessary to establish a portable declaration.
- Disable declaration output: rejected because declarations are a repository-wide server
  build contract and changing that compiler setting would hide the defect broadly.

## Decision 2 — Use existing runtime tests plus declaration-emitting gates

Retain the focused tracer Jest suite as the behavior proof and use `npm run build` plus
`npm run generate:openapi` as the type/declaration regression proof. A new Jest assertion
that merely inspects source text or npm's on-disk hoisting would be brittle and would not
exercise TypeScript's declaration emitter.

The Applier may add a focused type fixture only if the implementation reveals a stable
compiler-level assertion that fails without the boundary. It must not add dependency-tree
manipulation or broaden the test harness for this leaf repair.

## Decision 3 — Treat the committed contract as verification-only

Run OpenAPI generation on Node `v24.13.0`, then require
`git diff --exit-code -- openapi/openapi.json`. No controller or DTO changes are in scope,
so any contract diff is a defect or nondeterminism signal: stop and report it rather than
committing the generated change. The existing server CI generation-and-diff step is the CI
proof gate; no workflow edit is needed.

## Risks / Trade-offs

- **The current hoisted install does not reproduce `TS2742`.** → The explicit public SDK
  annotation removes the dependency-layout inference itself; inspect the emitted tracer
  declaration and run both build entrypoints rather than relying only on reproduction.
- **A broad annotation could mask an incompatible runtime value.** → Use the SDK's own
  exported configuration property, not `unknown`, `any`, or a locally invented interface,
  and keep focused SDK/tracer tests green.
- **OpenAPI generation may expose unrelated service or nondeterministic drift.** → Keep
  `openapi/openapi.json` unstaged, stop, and report any diff before handoff.
- **An in-flight observability change also touches tracer code.** → Keep this repair to
  the exported type boundary so later branch refreshes have a minimal, reviewable conflict
  surface.

