## Context

The React Native app already uses GitHub Actions for CI, EAS for signed distribution, and Maestro
for native E2E. Clean hosted runners repeatedly pay native build and tool-install costs, while the
always-on home Mac Mini could retain Xcode, simulator, CocoaPods, and DerivedData state. The source
repository is public, however, so attaching a persistent runner directly to workflows that can run
untrusted pull-request code would create a broad security boundary. A home machine is also a single
point of failure and must not become the only release path or a credential vault.

This change records the recommendation only. It uses the existing OTA documentation style and
separates future implementation into independently reviewable slices.

## Goals / Non-Goals

**Goals:**

- Give maintainers one ordered documentation pack that answers whether and how to use the Mac.
- Assign hosted CI, the Mac runner, and EAS distinct responsibilities and trust boundaries.
- Define exact-SHA inputs, evidence, approval gates, fallback behavior, and cache policy.
- Provide measurable pilot and rollout criteria for E2E, internal, beta, and production builds.

**Non-Goals:**

- Provision or inspect the Mac, repositories, runners, simulators, credentials, or store accounts.
- Add or change workflows, EAS profiles, app configuration, native projects, or release automation.
- Make the Mac a pull-request runner, signing host, sole release path, or general SSH target for
  agents.

## Decisions

### Use a hybrid architecture

Hosted GitHub Actions remains the public-repository control plane and fallback. A repository-scoped
runner in a private orchestration repository executes only trusted exact-SHA iOS E2E jobs. EAS
Build remains the signed-binary builder and submission provenance source.

The alternative of moving all CI and signed builds to the Mac was rejected because it combines
untrusted workflow execution, persistent state, signing material, and a home-machine availability
dependency. The alternative of staying entirely hosted remains safe but does not exploit warm native
caches for the slowest E2E work.

### Build once and promote by immutable identity

Every manual build resolves a commit SHA before work begins and records the EAS build ID, platform,
version, runtime fingerprint, and evidence. Submission promotes that exact build ID after a protected
approval; it does not rebuild from a branch name. TestFlight internal groups use EAS Submit groups,
while external groups and Beta Review use the EAS Workflows `testflight` job.

### Cache dependencies and derived outputs, not mutable source or secrets

The pilot may retain package downloads, CocoaPods downloads, simulator runtimes, and externalized
DerivedData keyed by the relevant lockfiles and toolchain versions. Generated native trees,
workspaces, credentials, logs containing secrets, and cross-trust artifacts are cleaned per run.
A scheduled clean-cache run proves the pipeline is reproducible.

### Adopt in bounded phases

The sequence is inventory/baseline, trusted iOS E2E pilot, routine E2E, internal store delivery,
then beta/production rehearsal. Android moves only after a benchmark shows that warm builds outweigh
serialization on the single Mac.

## Risks / Trade-offs

- **Persistent runner compromise** → isolate it in a private orchestration repository, never route
  pull-request heads to it, minimize tokens and scrub each workspace.
- **Home-machine outage** → keep hosted iOS fallback and keep signed builds/submission on EAS.
- **Warm cache hides drift** → run weekly clean-cache canaries and key caches by explicit inputs.
- **Faster builds preserve flaky tests** → measure build, simulator, transport, assertion, backend,
  and availability failures separately; speed alone is not the pilot success condition.
- **Documentation becomes stale** → record exact workflow contracts and make future implementation
  slices revisit the relevant ADR/configuration at the time they are built.

## Migration Plan

No runtime migration occurs in this change. Future delivery follows the phased plan in
`docs/mobile/build-infrastructure/06-adoption-plan.md`, with each phase in a separate PR and a hosted
rollback path retained throughout.

## Open Questions

Phase 0 must inventory the Mac hardware/toolchain, confirm it is dedicated, establish disk quotas,
measure hosted p50/p90 baselines, and name the human release approver and break-glass operator.
These facts affect implementation but do not block the recommendation.
