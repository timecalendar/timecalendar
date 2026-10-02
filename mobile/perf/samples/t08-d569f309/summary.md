# t08-d569f309

- Device: ONEPLUS A6003, Android 15, 60 Hz, Physical size: 1080x2280, Physical density: 450
- Package: fr.samuelprak.timecalendar.perf 4.0.0
- URL: timecalendar-perf://calendar?focusDate=2026-10-05
- Recorded: 2026-10-02T01:40:40.139Z
- Cold launch TotalTime: 7567 ms
- Android views in the activity: 712 after launch, 396 after all scenarios

| Scenario | Frames | p50 ms | p95 ms | p99 ms | Max ms | ≤16 ms | >33 ms | Janky (HWUI) | Gesture ms (achieved/planned) | Probe before → after | Thread CPU ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| swipe-forward-20 | 299 | 15 | 27 | 53 | 57 | 73.2% | 13 | 8.36% | 7123/5858 | Monday, October 5th, 2026 → Monday, October 5th, 2026 | mecalendar.perf 3034.9, mqt_v_js 2407.5, RenderThread 2014.8, Jit thread pool 199.7 |
| swipe-back-20 | 318 | 14 | 34 | 46 | 57 | 77.4% | 17 | 8.49% | 7111/5858 | Monday, October 5th, 2026 → Monday, October 5th, 2026 | mecalendar.perf 2948.1, mqt_v_js 2301.7, RenderThread 2227.5, HeapTaskDaemon 130.1 |
| fling-5 | 234 | 15 | 31 | 53 | 61 | 74.8% | 11 | 5.13% | 5643/4358 | Monday, October 5th, 2026 → Monday, November 9th, 2026 | mecalendar.perf 2262.4, RenderThread 1968.2, mqt_v_js 1770.3, Jit thread pool 84.1 |
| reversal-10 | 264 | 15 | 38 | 48 | 48 | 66.7% | 17 | 12.88% | 6570/5288 | Monday, November 9th, 2026 → Monday, November 9th, 2026 | mecalendar.perf 2703, RenderThread 2118, mqt_v_js 1492.1, HeapTaskDaemon 89.9 |
| diagonal-20 | 376 | 14 | 44 | 69 | 85 | 78.2% | 22 | 11.97% | 27084/25808 | Monday, November 9th, 2026 → Monday, March 29th, 2027 | mecalendar.perf 4968.3, mqt_v_js 4154.7, RenderThread 2348.1, binder:18768_2 177.2 |
| vertical-scroll | 125 | 14 | 21 | 25 | 31 | 91.2% | 0 | 5.6% | 4977/3728 | Monday, March 29th, 2027 → Monday, March 29th, 2027 | mecalendar.perf 1070.9, RenderThread 1026.8, mqt_v_js 448, HeapTaskDaemon 175.2 |
| pinch-3s | 176 | 17 | 24 | 36 | 42 | 47.2% | 3 | 2.27% | 4290/3008 | Monday, March 29th, 2027 → Monday, March 29th, 2027 | mecalendar.perf 2731.8, RenderThread 782.6, mqt_v_js 395.2, Jit thread pool 33.7 |
