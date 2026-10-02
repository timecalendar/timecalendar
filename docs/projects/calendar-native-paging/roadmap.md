---
kind: roadmap
status: approved
---

# Roadmap

## Sequencing principles

- Retire the largest uncertainty first. E02 proves the native ScrollView owner on real devices
  before the production cutover commits to it.
- Ship cheap independent wins immediately (E01). They also make later measurements cleaner.
- Keep pure logic separate from risky native behaviour. E03 can be built and tested in parallel
  with the spike because it does not depend on how paging feels.
- `main` may carry unfinished Calendar work (owner, 2026-10-01). Device evidence gates releases,
  not merges (D08).

## Epic order and dependencies

1. E01 — Quick wins and planning housekeeping (done: #437, #436)
2. E02 — Prove native ScrollView paging on device (done: #441, #442; verdict continue, see evidence/E02-spike.md). Depends on E01, so the harness measures a
   compiled shell.
3. E03 — Page identity and windowed data in `calendar/data` (done: #438, #439, #440).
4. E04 — The Calendar pages on the native ScrollView (source merged; Android P01 chain gate failed). Depends on E02's owner continue verdict and E03's index, store, and presentation.
5. E05 — Pinch and paging within the frame budget (source merged; exact-revision device evidence pending). Depends on E04.
6. E06 — Accessible paging and focus (source merged; physical assistive-technology verdict pending). Depends on E04.
7. E07 — Cleanup, soak and release evidence (T14 merged; T15 Android diagnostics recorded, release blocked). Depends on E05 and E06 acceptance.

## Parallel work

- E02 and E03 run in parallel after E01.
- Within E03, T06 and T07 run in parallel after T05.
- E05 and E06 run in parallel after E04.
- Within E04, T09 and T10 run in parallel after T08.

## Rollout gates

| Gate | Condition | On failure |
| --- | --- | --- |
| Spike verdict (end of E02) | `evidence/E02-spike.md` records the P02 miss and the owner's instruction to continue implementation | The continue instruction does not satisfy P01 or P02 release acceptance |
| Frame budget (end of E05) | The P02 table is met on the OnePlus 6 and the iPhone | If missed by more than 2×, re-open D04 |
| Release (E07) | No preview, production, or OTA release carrying the new owner reaches users without exact-revision evidence and the owner's go verdict | Hold distribution while a gate fails or remains unknown |

## Replanning notes

- E04 is planned against the spike outcome. Spike findings may split T08 or move work between T08
  and T11 without owner approval, provided the epic outcomes hold.
- The tile text behaviour during pinch (round 2, question 1) shapes T11 only.
- The iOS evidence route defaults to OTA onto a TestFlight preview build. Turning on the Reanimated
  flags requires a new binary, which ships through EAS.
