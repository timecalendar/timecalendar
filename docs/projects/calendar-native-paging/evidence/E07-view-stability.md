# E07 native-view stability diagnosis

Status: **diagnostic, not a P03 pass**. The exact `151ace57f7e2b1b9803d7d45ede1794718167d7f` OnePlus 6 perf APK exceeds the required ±50 native-view budget in both long-session runs. Hermes JavaScript heap and product heap stability are unknown. The original activity hierarchies are in the private E07 raw archive identified by [E07 release evidence](E07-release.md); the committed [500-crossing](../../../../mobile/perf/samples/e07-151ace57-soak-500/summary.json) and [30-minute](../../../../mobile/perf/samples/e07-151ace57-stress-30m/summary.json) summaries preserve every total view sample.

## Native hierarchy census

`dumpsys activity top` contains a view hierarchy for the perf activity. Counting class names with the same rule as `mobile/perf/lib/gfxinfo.mjs` gives these adjacent samples from the 500-crossing run:

| Raw sample pair | Views | ReactViewGroup change | ReactTextView change | CalendarFocusObserverView change | Other class change |
| --- | ---: | ---: | ---: | ---: | ---: |
| `0000` → `0002` | 803 → 397 | −250 | −138 | −18 | 0 |
| `0007` → `0009` | 848 → 397 | −268 | −166 | −17 | 0 |
| `0015` → `0016` | 855 → 397 | −274 | −166 | −18 | 0 |
| `0029` → `0030` | 605 → 397 | −104 | −104 | 0 | 0 |

All 94 views outside those three classes remain constant in these pairs. The total returns to exactly 397 in **28 of 38** samples, including after the 848 and 855 peaks. The mixed run ranges from 585 to 803; its 803-view initialization sample has 455 React view groups, 236 React text views, 18 focus observers and 94 other views, while its 585-view minimum has 299, 192, 0 and 94 respectively. These repeated contractions are strong evidence that much of the total swing follows rendered content. They do not prove that no native or JavaScript objects are retained.

The renderer mounts the centre page and at most two pages on either side (`MOUNTED_PAGE_RADIUS = 2` in `data/page-window.ts`; `mountedIndexes.map` in `renderer/owned-calendar-shell.tsx`). Each mounted page maps its presentation columns and tiles into React views (`renderer/owned-calendar-page.tsx`); only committed event targets include `CalendarFocusObserverView`. Thus changing event density and which page is committed can change all three variable classes. The page-presentation LRU holds at most 16 **JavaScript presentations** and the window store holds at most six **data chunks**. Those bounded caches do not establish a native-view or Hermes heap bound.

## Measurement interpretation

The previous once-per-minute samples compare different Calendar pages and event densities. They establish the ±50 failure, but cannot separate content churn from retention at the same page. The candidate harness records a fresh UI witness and native hierarchy census at the first observed settle and at each 100-crossing return. A return is comparable only when a fresh settle, the same mode epoch and page index, the visible Calendar mode control, and the complete day or week date-header cells agree before and after the sample. Week headers may contain the exact seven-day set or the exact weekday-only set. Missing, partial or changed UI observations yield `unknown`; no checkpoint is reused across a mode switch. These comparisons are diagnostic and leave the global ±50 check unchanged.

The candidate 30-minute stress sequence changes Day/Week through the existing native view menu every 60 gestures. It first checks that the visible source header matches the settled source page. It then requires a target-mode page mount and two matching reads of the complete visible date-header set at the expected converted page: Week maps to its first day, and Day maps to its containing week. Date nodes need usable on-screen bounds. The observed date keys establish a new page baseline without counting a crossing; native initial placement can produce no settle log. Both directions and gestures in both modes are required for mode coverage. An unavailable or ambiguous menu/UI observation stops the run with a recorded unknown rather than silently claiming coverage. The runner still cannot read Hermes JavaScript heap from `dumpsys meminfo`, and its mixed frame windows cannot satisfy the named P02 gesture gates.

## Bounded UI witness smoke

On 2026-10-02, the installed OnePlus 6 perf package's base APK SHA-256 was `0dddc92023a6c03fa38ed53f061e4b094e93585d4444908e0e35db056e0b4083`. It matched a local P01 diagnostic APK labelled `90a88268`; the APK's full source revision was not independently established in this probe, and it is **not** the `8bebf2df64eb6eef033d190a4864bc8f9fe984cc` harness candidate. The package was already foregrounded. No APK was installed and no app was restarted.

The visible Week header identified page 2981, 2027-02-22 through 2027-02-28. The native menu's Day option produced two complete matching reads of Day page 20871, 2027-02-22. Switching back produced two complete matching reads of Week page 2981. Both transitions had target-mode `CALENDAR_PAGING mount` records and no `settle` record, matching the harness's UI-derived placement rule. The app PID was the same before and after; process start ticks were not sampled, so this smoke does not establish the soak's process-continuity gate. Raw UI XML and logcat are retained outside Git. This is a bounded tooling check, not an exact-revision 500-crossing or 30-minute P03 measurement.

## Next exact-revision device scenario

1. After the P01 worker releases the OnePlus 6 and PC slot, build a private perf APK on PC WSL from the **full candidate SHA** and match its SHA-256 against the installed perf package; use `adb install -r` only if installation is needed.
2. From that exact checkout, run `node perf/soak.mjs --dry-run --mode soak --revision <full-sha> --apk <apk-path>` and the equivalent `--mode stress` plan. Confirm the phone is unlocked and the native Calendar menu/date-header nodes are observable before committing to the 30-minute run.
3. Run the 500-crossing soak, inspect `checkpoints`, `sameStateDiagnostic`, all view totals and class censuses, then review the stress mode-switch witness path. Run the full 30-minute mixed stress only after that candidate and its observation path are reviewed. Keep raw logs outside Git and record one PID/start tick per run.
4. Keep P01, P02, P03, E05/E06 physical checks, Hermes heap and owner release verdict at their independently measured or unknown states. Neither same-state contraction nor an automation unit test substitutes for the product view budget or a release verdict.
