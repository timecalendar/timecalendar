---
kind: decision
id: D07
status: approved
traces-to: [P02, P06, P07, P08]
supersedes: []
---

# D07 — Use a coordinated clean replacement and compatible native binaries

## Context and evidence

P08 excludes a vendor fallback or dual renderer. app.config.ts enforces portrait and
requireFullScreen, and ADR 042 plus source/prebuild checks encode that contract. ADRs 019/032
select calendar-kit and its patch; ADR 033 supplies a useful ownership boundary.

## Options considered

- Dual renderer or percentage flag: contradicts approved P08.
- Change only the timeline component: misses controller, agenda, data, settings and native gaps.
- Coordinated source replacement, revised native contract and held launch: recommended.

## Decision

Deliver the clean replacement as owner-accepted vertical slices. The first slice installs an
owned shell on Calendar and removes the vendor facade, adapter, patch and exclusive test/lint
machinery coherently. Later slices add one observable capability at a time. Preserve useful ownership seams, unrelated dependencies, device
families, event storage fidelity and fingerprint OTA policy. Enable approved orientation/resizing
through source Expo configuration and update generated-contract checks. Reconcile only displaced
portions of global ADRs/current OpenSpecs after the target exists, linking project-local records.
Each slice keeps the app buildable and existing out-of-scope flows working; the timeline is
intentionally incomplete during this pre-launch sequence. There is no parallel vendor/owned path
or runtime switch. Rollback means a coherent pre-launch source/build revision; launch stays held
until owned-renderer acceptance passes.

## Tradeoffs and consequences

Orientation changes affect the app shell and require wider navigation/chrome smoke tests. Fresh
compatible binaries are required. No data rewrite is planned; additive query indexes must preserve
old-reader compatibility. An older calendar-kit build may aid development recovery but is not
made launch-eligible by this rollback policy. No deployment is authorized by this decision.

## Approval

Approved by the product owner on 2026-09-12 in this project's continuation conversation:
“I hereby approve all decisions.” The owner explicitly included D04–D06 and directed that their
behavior be tested during implementation, one small ticket at a time, with owner QA, feedback,
acceptance and merge before the next ticket. This replaces the earlier pre-implementation
measurement gate; it does not claim measurements exist or waive the final product contract.

The approved architecture is the starting direction. An implementation failure is investigated
in the affected ticket. Changing an approved boundary or weakening a product requirement needs
an explicit decision update; ordinary tuning within the boundary can follow ticket QA feedback.
