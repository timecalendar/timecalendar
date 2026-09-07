---
kind: epic
id: E04
status: approved
traces-to: [P01, P02, P03, P04, D01, D02, D03, D04]
depends-on: [E03]
---

# E04 — Prove and control release

## Outcome

The exact store-signed Flutter-to-React-Native update is proved on both platforms, outcome reporting
and low-end behavior meet the approved safety boundary, and rollout widening has explicit evidence.

## Demonstration

Compact and large seed packs survive internal and final public-store updates without uninstalling;
Android paths/backup and both platform sandboxes are recorded; reports arrive without private data;
the staged-release record explains each stop/go decision.

## Definition of done

Every signed-device gate in the technical specification and QA playbook passes on the exact release
artifact, residual failures are dispositioned, and broad rollout proceeds only under separate
release authorization.

## In scope

Evidence procedure, signed update execution, Android backup/path proof, low-end measurements,
report monitoring, and rollout recommendation.

## Out of scope

Importer implementation, automatic source cleanup, reverse migration, or treating repository merge
as authorization to deploy, submit, or widen rollout.

## Risks and boundaries

Store submission, database deployment, production monitoring, and rollout are live acts. They
require the normal dedicated ownership and authorization at execution time.

## Tickets

- [T08 — Prove signed upgrades and staged rollout](T08-signed-upgrade-and-staged-rollout.md)
