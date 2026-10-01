---
kind: epic
id: E02
status: planned
traces-to: [P01, P02, P04, P06, D01, D02, D03, D04, D08]
depends-on: [E01]
---

# E02 — Prove native ScrollView paging on device

## Outcome

A repeatable Android performance harness exists, and a dev-only route demonstrates windowed native horizontal ScrollView paging with the shared grid and transform pinch on the OnePlus 6 and an iPhone. The owner records go or kill against the product kill criteria.

## Demonstration

On a release APK built on the PC and on the iPhone: 20 rapid swipes each way land 20 pages away, a mid-fling grab continues, pinch runs during a settle, and the harness prints frame statistics.

## Definition of done

- Evidence file `evidence/E02-spike.md` with the tested revision, device runs, harness output and the owner's go/kill verdict.
- If kill: D01 marked `needs-revision` and the roadmap re-planned toward the owned slot pager.

## In scope

- `mobile/perf/` scripts and a profileable perf build variant.
- A dev-only spike route with fixture tiles; the Reanimated synchronous UI-props flags.
- Spike checklists from R02, R05 (checks 1–2 also on the current build) and R08.

## Out of scope

- Real data, accessibility control relocation, production Calendar changes.

## Risks and boundaries

Android nested arbitration and snap reconciliation are only read from source. The spike route may land on `main` because `main` may be unfinished; it must not be reachable in release navigation.

## Tickets

- T03 — Android performance harness on release APKs (`T03-android-perf-harness.md`)
- T04 — Dev-only spike of windowed native ScrollView paging (`T04-native-scrollview-paging-spike.md`)
