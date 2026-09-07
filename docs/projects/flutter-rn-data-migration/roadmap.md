---
kind: roadmap
status: approved
---

# Roadmap

## Sequencing principles

Retire platform access and persistence uncertainty before joining it to startup. Keep the backend
report contract parallel with native source access. Build acceptance with each seam, then require a
single integrated automated gate before signed-device and rollout work.

## Epic order and dependencies

1. [E01 — Establish migration foundations](epics/E01-migration-foundations/README.md): storage,
   reporting contract, and native source access can be demonstrated independently.
2. [E02 — Import valid data safely](epics/E02-safe-import-engine/README.md): bounded replay and the
   idempotent engine produce a complete terminal result from fixtures.
3. [E03 — Gate startup and automate acceptance](epics/E03-bootstrap-and-acceptance/README.md): the
   app exposes no consumer before migration settles and the full failure matrix is executable.
4. [E04 — Prove and control release](epics/E04-signed-upgrade-and-rollout/README.md): signed update,
   low-end, reporting, and staged-rollout evidence determines whether widening is safe.

## Parallel work

T01, T02, and T03 can begin in parallel. T04 follows T03's stable read contract. T05 requires T01,
T04, and T02's frozen payload contract. Acceptance tests are added with each ticket, while T07 owns
the final integrated matrix. No signed rollout work starts before T07 passes.

## Rollout gates

- Automated data, collision, retry, resource, and privacy matrix green on the release head.
- Internal store-signed in-place upgrade green on physical iOS and Android devices.
- Android source-path and backup behavior plus low-end timing/memory evidence recorded.
- Final public-store production-identity upgrade green on both platforms.
- Outcome reporting has a reliable denominator; widening begins around 1%, then 5%, and proceeds
  only under the normal release decision process.

## Replanning notes

Ticket decomposition may change when current default-branch code moves, provided P01–P04, epic
outcomes, and D01–D04 remain intact. Any contrary device evidence, privacy boundary change, new
imported data, changed collision precedence, user-visible migration flow, or source-deletion plan
requires renewed board approval.
