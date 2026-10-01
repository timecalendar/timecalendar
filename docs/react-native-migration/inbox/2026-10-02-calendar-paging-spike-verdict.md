# Calendar native paging: spike verdict recorded as "continue" with a kill criterion tripped

**For:** owner review. **Project:** `docs/projects/calendar-native-paging/`.

The E02 spike on the OnePlus 6 misses P02 by more than 2× on four thresholds, which is kill criterion 4 in `product.md`:
pinch frames within 16.7 ms 12.6% (target ≥95%), page mount 13.6–48.4 ms (≤12), crossing commit 40–47 ms (≤8), about 30 slow frames per fling crossing (≤1).

Per your overnight instruction ("always continue") I recorded the verdict as continue and started E04. The spike still beats `main` by a wide margin: chained swipes 16/20 vs 5/20, diagonals 20/20 vs 0/20, pinch p50 19 ms vs 61 ms, fling p99 44 ms vs 125 ms. The causes are named (per-crossing page render, animated layout `height` during pinch) and are carried into T08 and T11.

**Decide in the morning:** keep the go, or re-plan toward the owned slot pager (D01 → needs-revision).

Also found by the spike: cold-starting the current build straight into a deep link crashes with "Attempted to navigate before mounting the Root Layout component" (`docs/perf/E02-spike-evidence.md`, finding 6).

Evidence: `docs/perf/E02-spike-evidence.md`, `docs/projects/calendar-native-paging/evidence/E02-spike.md`.
