# Technical acceptance research plan

Status: approved evidence policy, 2026-09-12. Product P01–P08 and D01–D08 are approved.
The owner explicitly requires evidence during small implementation slices, with a checklist,
feedback, acceptance and merge for each brick. No separate pre-implementation comparison gate
remains for D04–D06. This plan specifies measurements, not completed results or relaxed thresholds.

## Architecture evidence during implementation

| Evidence                                 | Implementation and experiment                                                                                                                                                                                                                  | Owner tickets / proof                                                                                                                                                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G01 — Runtime, working set and motion    | Implement the approved RN view/Gesture Handler/Reanimated approach. Test one-page flings, reversals, vertical lock, pinch and resizing as they arrive. Compare native pager/scroll motion only if observed behavior fails.                     | T02, T03, T06, T07 and T16 provide focused recordings/traces; T26/T27 establish release timing and retained-resource evidence. Reject wrong/partial frames, accidental presses and unbounded retention in the affected slice. |
| G02 — Native semantics and dense targets | Start with the approved chronological native target tree. Prove off-viewport reachability, labels, native activation geometry and stable focus. If it fails, investigate the alternate same-screen semantic layer through a scoped D06 update. | T09/T10 introduce labels/targets, T11 density, T12 full native traversal, T16 all-day focus, T19/T22/T23 interruptions/recovery. T28 closes the full human matrix. No duplicate or unreachable target is silently accepted.   |
| G03 — Local snapshots and first frames   | Implement bounded local range reads with versioned presentation. Measure rows scanned/returned, memory and query/prepare/commit/present timing. Investigate index alternatives when query evidence warrants them.                              | T09, T17 and T20 demonstrate ordinary/far/update behavior; T21 recovery. T24/T26/T27 prove supported-workload latency/resource limits. No network loader or relabelled stale content.                                         |
| G04 — Pure semantic counterexamples      | Build expected-case fixtures before coding difficult geometry. Cover date-only/timed boundaries, Paris/New York/Tokyo, spring gaps, fall-back backwards clock endpoints and exclusive ends.                                                    | T13–T15 own spanning/DST/all-day demonstrations and properties. A contradiction pauses the affected ticket for product/decision review; approval is not permission to drop a valid event.                                     |

The agent prepares experiments, data, instrumentation and recommendations. The owner or another
human tester performs the recorded native feel/accessibility checks with a build and exact checklist
supplied by the agent. Missing hardware/access is recorded, not turned into fictional evidence.
The [delivery protocol](../delivery.md) governs progression and explicit intermediate deferrals.
Prototype-style checks live inside the relevant implementation slice or outside production paths;
a working accepted brick does not need a second implementation merely for comparison.

## Release acceptance after an implemented renderer exists

Use product sections 13 and 16 as the numerical authority: warm first correct frame 250 ms p95,
usable interaction 500 ms p95, cold first correct local Calendar frame one second p95, subject to
the named release-baseline validation. Record the active display rate and actual missed deadlines;
no average-FPS-only pass. Historical suggested frame percentile/stall rules remain proposals until
the instrumentation experiment validates and the acceptance review approves them.

Candidate protocol: warm up each fixture/action, collect at least 30 independent repetitions per
cell, then validate sample stability and required run count in PF-026. Retain all valid samples;
exclude only documented harness failures with raw evidence, never application stalls. Separate
cold launch from warm entry and query preparation from first presented correct frame. Report
median/p95/p99, missed-frame ratio, longest stall, run dispersion, native/JS memory and nodes.
Repeated measurements must distinguish observer overhead from app work. Do not silently retry a
failed run until it passes or invent a percentage regression margin before a baseline exists.

Select Android platform frame/system traces and memory profiling, and iOS Instruments frame/time/
allocation tooling in the instrumentation spike; record exact installed versions and what each
actually measures. Verify release JS attribution and semantic-node inspection instead of assuming
one profiler exposes all metrics. Tool capability is unverified here (PF-025).

The 30-minute stress sequence alternates paging, scrolling, zoom, mode switches, far jumps and
resize, returns to the same fixture/viewport after warm-up, then measures recovery to a stable
range. Record retained page generations, cache entries, event objects, visual/semantic nodes,
steady-state/peak memory, idle work, thermal and battery context. Numeric tolerance, steady memory,
idle CPU and regression thresholds require measured baselines and explicit review. Monotonic or
unbounded growth already fails the approved product without waiting for a numeric tolerance.

The binding phones are Galaxy A16 5G (French-market 4 GB/90 Hz, still subject to floor validation),
iPhone SE 3, Galaxy S23 and iPhone 15 Pro. Minimum OS compatibility smoke targets remain API 24
and iOS 16.4. Add identified physical iOS/Android tablets for compact/medium/expanded resizable
windows; exact tablet models and OS versions must be recorded before booking the final pass.
Human evidence includes French/English, light/dark, Paris/New York/Tokyo, largest text, reduced
motion, increased contrast, VoiceOver/TalkBack/Voice Control/Switch Control, portrait/landscape and
real interruptions. Use representative combined cases plus dedicated adversarial cases; record
coverage explicitly rather than imply an unexecuted Cartesian product passed.

Fixture catalog follows product 16.2, including empty, fabricated normal/dense/supported-worst,
1,000 stress-only, overlap/adjacency/identical starts, short/zero/invalid ranges, all-day and long
spans, DST, malformed/missing text/color, filtering, live replacement and local failure/recovery.
Synthetic p50/p95/p99 labels are forbidden until authorized aggregate evidence supplies the sizes.

## Durable artifacts and quality checks

Code-owned fixture/harness locations are `mobile/src/test-support/owned-calendar/`
and `mobile/scripts/owned-calendar/`. Store content-free reviewed reports under this project's
`research/results/<run-id>/`; large raw traces may use the repository's CI artifact retention with
an immutable URI, checksum and expiry recorded in the report. Raw traces must be available through
acceptance review and archived durably before expiry; a vanished link cannot substantiate a gate.
Never commit private recordings/event data. Device recordings use fabricated fixtures.

Each report identifies author/reviewer, date, source revision, dependency lock checksum, runtime
fingerprint, binary/build type, device/RAM/OS/refresh/thermal conditions, tool versions, fixture
version/seed, exact command/steps, raw-artifact checksums and outcome against each gate. Separate
observations, inferred conclusions and accepted thresholds. Name the accountable engineer and
human accessibility reviewer when the research execution is scheduled; neither is assigned here.

Current mobile commands are `npm test -- --coverage`, `npx tsc --noEmit`, `npm run lint`,
`npx prettier --check .` and `npm run react-doctor`, run from `mobile/` with the installed toolchain.
The zero-finding product gate requires review of React Doctor output because the broad script uses
`--blocking none`; exit code alone is insufficient. Add targeted 100% statement/branch coverage and
property-based verification for the approved pure modules; existing 90% gates are not equivalent.
Property tooling is not selected/installed by this plan. Config changes also run
`npm run test:ios-device-contract` and `npm run verify:ios-device-contract` against the resulting
landscape/resizing contract; the latter currently asserts portrait, so do not treat it as the new
acceptance proof before its coherent update. Every edited test suite must be run.

Maintain the existing three durable Maestro journeys under ADR 057. Renderer state/geometry proofs,
benchmark harnesses and recorded human passes complement them; this project does not silently
expand the top-level E2E inventory. Dependency removal includes lockfile/install, vendor import,
patch, adapter, mocks and suppression audits.

## Complete research-row disposition

The questionnaire remains the preserved discovery record. This map carries its 29 research rows
forward without changing them to resolved merely because a plan exists.

| Rows                                           | Evidence / owner role                                                                                          | Gate timing and present state                                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| P-004                                          | Exact current-failure reproduction, build/device/fixture/video/trace; engineering                              | Baseline research; not reproduced here, no current failure severity invented                           |
| U-002, U-005, U-006, U-008, U-009, U-010       | Opt-in inclusive dogfood/usability, client-local enabled-source counts; product research                       | Workload/design calibration; unavailable, accepted workflows/accessibility do not depend on prevalence |
| PL-003                                         | Galaxy A16 release pass; performance engineer                                                                  | Implementation-time and final release floor; pending                                                   |
| T-011, T-012                                   | Default/min/max zoom against density/readability/device reference; product designer + engineer                 | Before zoom/visual design approval; pending                                                            |
| E-020                                          | Overlap density, target disambiguation/aggregation threshold; designer + accessibility engineer                | G02 and visual approval; pending, no automatic content aggregation authorized                          |
| V-009                                          | Deterministic text/foreground/scrim policy verified against accepted contrast; designer + engineer             | Before visual design approval; pending                                                                 |
| PF-006, PF-007, PF-008, PF-009, PF-010, PF-011 | Aggregate-only production shapes via authorized operator, plus opt-in source counts; data/performance engineer | Before supported-workload baseline; existing access blocker remains, 1,000 stress-only                 |
| PF-018, PF-019, PF-020, PF-022                 | Memory/growth/node/idle budgets from G01–G03 and release baseline; performance engineer                        | Before numerical acceptance approval; pending                                                          |
| PF-025, PF-026                                 | Instrumentation capability, observer overhead, repetitions/variance; performance engineer                      | Before treating comparative results as decisive; pending                                               |
| PF-027                                         | Versioned fixture/script paths and immutable trace/report retention; engineering                               | Proposed above under D08, not yet materialized                                                         |
| PF-028                                         | Reproducible regression threshold from accepted baseline; engineering reviewer                                 | Before release gating, pending; existing hard product targets still bind                               |
| B-009                                          | Utility inventory and deterministic revalidation; engineering                                                  | Inventory available in system audit; tests/properties remain open                                      |
| M-011                                          | Existing workaround inventory; engineering                                                                     | Source audit complete in system audit; removal proof waits for implementation                          |
| M-012                                          | Scoped ADR/OpenSpec supersession; engineering                                                                  | Targets audited; final reconciliation waits for approved target and implementation                     |

Additional explicit design gates are all-day collapsed rows/expanded height, approved reference
screenshot and visual sign-off, tablet/device bookings, DST visual geometry, exact dependency
license/security/maintenance dossier, and an assigned operational owner. These are not extra
product scope; they are evidence needed to implement the existing contract honestly.

## Approval and readiness

Architecture approval is complete. Implementation uses the [ordered roadmap](../roadmap.md), and
all evidence work has a ticket owner. The following mapping carries all 29 original research rows
into execution; the historical questionnaire retains its original discovery labels.

| Research rows                                  | Owning ticket(s)                                                                                                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P-004                                          | T02 captures historical-reproduction limits alongside initial motion evidence; T26 owns any remaining baseline comparison. No remembered failure is promoted to measured fact. |
| U-002, U-005, U-006, U-008, U-009, U-010       | T24 records opt-in/workload evidence or explicit availability limits; T25 applies relevant usability evidence without inventing prevalence.                                    |
| PL-003                                         | T26/T27 measure the proposed Galaxy A16 floor; T28 records the physical acceptance.                                                                                            |
| T-011, T-012                                   | T06 establishes tested initial zoom settings; T25 accepts final populated values.                                                                                              |
| E-020                                          | T11 proves initial dense targets; T24 establishes workload shape; T25 accepts the resulting density behavior.                                                                  |
| V-009                                          | T10 owns deterministic contrast policy; T25 confirms final visual acceptance.                                                                                                  |
| PF-006, PF-007, PF-008, PF-009, PF-010, PF-011 | T24 owns aggregate/privacy/fixture evidence.                                                                                                                                   |
| PF-018, PF-019, PF-020, PF-022                 | T27 accepts resource budgets after measurements; early retention checks belong to T02/T09/T11/T16.                                                                             |
| PF-025, PF-026, PF-027, PF-028                 | T26 owns instrumentation/repetitions/artifacts/regression policy; T27 supplies resource-specific results.                                                                      |
| B-009                                          | Inventory in system audit; T02–T06 and T09–T15 revalidate each introduced pure behavior with tests/properties.                                                                 |
| M-011                                          | T01 removes inventoried workarounds; T29 verifies no vendor remnants.                                                                                                          |
| M-012                                          | T01/T07 reconcile affected current source docs; T29 completes scoped documentation/launch-roadmap reconciliation.                                                              |

The screenshot/visual-reference gate belongs to T25. Tablet/tester bookings and every intermediate
physical-device deferral belong to T28. Dependency evidence starts with runtime selection in T01
and native changes in T07, and the complete maintenance/security/ownership dossier closes in T29.
All required release gates must pass even when earlier slices were accepted on narrower fixtures.
