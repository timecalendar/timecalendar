## 1. Make overlap packing identity-stable and total

- [x] 1.1 Refactor `mobile/src/features/calendar/data/overlap-layout.ts` to accept finite positive-duration intervals with stable source/event identity, copy rather than mutate inputs, sort by start/end/ordinal identity, and return placement keyed by identity without any input-index fallback. Verify invalid/equal/reversed/non-finite rejection and identity reconnection in `overlap-layout.test.ts`.
- [x] 1.2 Preserve strict half-open overlap and lowest-free-column reuse while finalizing each maximal transitive cluster before assigning its minimum column count and exact equal fractional bounds. Verify adjacency, nested/chained clusters, identical bounds, column reuse, minimum concurrency, and non-covering time-overlap pairs.
- [x] 1.3 Add seeded property/permutation coverage that maps results by identity and proves the same order/column/count/bounds for every permutation, plus deterministic invariants over generated valid interval sets. Reach 100% statement and branch coverage for the pure overlap module without weakening the repository thresholds.

## 2. Publish complete prepared placement

- [x] 2.1 Extend the immutable timeline tile/page presentation with stable overlap placement for positive intervals, computed from every retained interval in each civil day after filtering/validation and before renderer viewport clipping; keep T10 points on their existing point path. Verify recursive immutability, original UID, and complete off-screen/transitive cluster participation in the presentation suite.
- [x] 2.2 Ensure presentation replacement recomputes packing only when complete event inputs change, while scroll, viewport changes, and zoom reuse the same column/fraction result. Add focused tests at minimum/default/maximum zoom and across viewport ranges proving identities never reshuffle.
- [x] 2.3 Extend the Calendar repository contract to reject input-index/title/locale tie-breaks, viewport-scoped packing, renderer-owned sorting, per-frame clustering/database work/React writes, hidden density caps, compatibility renderers, and extra native motion owners. Run `mobile/calendar-owned-shell.contract.test.ts` as the CI proof test.

## 3. Render stable equal-width non-covering tiles

- [x] 3.1 Update the owned canvas to project prepared `startX`/`endX` within the existing civil-date lane and retain the outer separator inset, T10 live vertical geometry, appearance, content priority, and original-identity callback. Verify exact one/two/three/five-column frames and positive-area non-intersection in `owned-calendar-shell.test.tsx`.
- [x] 3.2 Prove adjacent events regain the complete available lane, simultaneous events remain side by side, and scrolling or live/settled zoom changes only pixel projection rather than column assignment. Preserve movement-owned press cancellation and the existing one-pager/one-scroll/one-pinch hierarchy.

## 4. Disambiguate conflicting effective targets

- [x] 4.1 Add a pure target-conflict planner over prepared horizontal spans and T10 platform-minimum interaction rectangles, producing deterministic positive-area connected components without a count threshold. Verify direct singleton, chained conflicts, boundary-touch non-conflict, point/tiny/ordinary mixtures, day-edge clamping, and stable ordering at 100% statements/branches.
- [x] 4.2 Render singleton components as the existing direct event button and multi-event components as unchanged visual tiles plus one localized chooser trigger; remove competing underlying hit/semantic targets without hiding a visual event. Verify exact pointer and accessibility node counts for both paths.
- [x] 4.3 Add a feature-owned accessible React Native modal listing each conflict identity once in stable start/end/identity order with its complete existing label. Verify modal semantics/focus containment inputs, Cancel/Back, one-shot original-UID activation, no sibling activation, and dismissal on committed page/presentation replacement.
- [x] 4.4 Add typed English/French chooser title, trigger, hint, and cancel copy with catalog parity tests; preserve every event's full title/time/location/checklist meaning without duplicating child visual semantics.

## 5. Extend fabricated density and interaction proof

- [x] 5.1 Make `mobile/src/test-support/calendar-dense-week.ts` date/zone deterministic and identify adjacent, two-way, three-way, five-way, identical-bound, point, and tiny-target cases using fabricated content only. Verify reversing fixture input preserves every identity's layout and activation outcome.
- [x] 5.2 Add Calendar screen/renderer interaction tests that open every crowded identity through either its direct target or explicit chooser, preserve synced/personal details authority, cancel during pager/scroll/pinch ownership, and retain stable placement after page-away/back and zoom.
- [x] 5.3 Record a reproducible aggregate measurement for the identified fixture: input events, largest cluster, computed placements, mounted visual nodes, committed semantic nodes before and while the chooser is open, activation outcomes, and proof that gesture frames only project prepared geometry. Label it first populated evidence, not a supported-density or p50/p95 claim.

## 6. Reconcile current architecture guidance and canonical evidence

- [x] 6.1 Update `docs/mobile/architecture-book/calendar.md` and `testing.md` with identity-stable positive-interval packing, adjacency, complete pre-clipping clusters, equal-width columns, scroll/zoom stability, explicit target-conflict choice, and honest host-versus-device evidence; append the required dated `CHANGELOG.md` entry without adding an ADR.
- [ ] 6.2 Update the canonical T11 execution-evidence section with the exact tested revision, fabricated fixture identity/counts, frame/node/activation measurements, command outcomes, and missing physical-device accessibility/target-feel evidence. Do not add a QA or human merge gate; final native acceptance remains in the planned final-device slice.
- [x] 6.3 Confirm no approved decision was displaced and no sensitive surface changed. If implementation needs API/generated contract, migration, native/store/EAS/Firebase, deploy/CI/infrastructure, legacy Flutter, or a different renderer/semantic ownership boundary, stop and return the issue to the Founding Engineer before editing it.

## 7. Get local green and exact-head CI proof

- [x] 7.1 Run every edited Jest suite by exact path, including overlap/property, presentation, target-conflict, renderer, Calendar screen, i18n, fixture, and repository-contract tests; run focused coverage for introduced pure logic and record suite/test/coverage results.
- [ ] 7.2 From `mobile/`, run `npx tsc --noEmit`, `npm run lint`, scoped `npx prettier --check` over every changed source/test/catalog/Markdown file, `npm run react-doctor:changed`, and `npm test -- --coverage`; resolve failures without suppressions, timeout inflation, or weakened assertions.
- [ ] 7.3 Run `npx openspec validate read-simultaneous-classes-side-by-side --strict`, the disclosure scan, and any established Maestro selector/harness static checks affected by fixture or selector changes. Keep the existing three top-level journeys and record that this host provides no physical-device evidence.
- [ ] 7.4 Push the exact implementation head and require green CI on that same revision. Record check names/results plus the identified fabricated density/frame/node evidence and any missing native-device evidence before handing to Simplifier; no separate QA or human merge gate applies.
