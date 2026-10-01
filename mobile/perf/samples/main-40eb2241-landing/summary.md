# main-40eb2241-landing

- Device: ONEPLUS A6003, Android 15, 60 Hz, Physical size: 1080x2280, Physical density: 450
- Package: fr.samuelprak.timecalendar.perf 4.0.0
- URL: timecalendar-perf://calendar?focusDate=2026-10-05
- Recorded: 2026-10-01T22:43:33.256Z
- Cold launch TotalTime: 7544 ms
- Android views in the activity: 692 after launch, 495 after all scenarios

| Scenario | Frames | p50 ms | p95 ms | p99 ms | Max ms | ≤16 ms | >33 ms | Janky (HWUI) | Gesture ms (achieved/planned) | Probe before → after | Thread CPU ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| swipe-forward-20 | 309 | 15 | 31 | 105 | 150 | 86.1% | 13 | 4.53% | 7066/5858 | Monday, October 5th, 2026 → Monday, November 9th, 2026 | mqt_v_js 6582.3, mecalendar.perf 2890.8, RenderThread 1361.1, hades 276.6 |
| swipe-back-20 | 302 | 15 | 30 | 121 | 150 | 86.4% | 13 | 3.97% | 7051/5858 | Monday, November 9th, 2026 → Monday, October 5th, 2026 | mqt_v_js 7132.3, mecalendar.perf 2683.6, RenderThread 1316.5, HeapTaskDaemon 313.3 |
| fling-5 | 112 | 16 | 48 | 129 | 150 | 52.7% | 10 | 8.04% | 5596/4358 | Monday, October 5th, 2026 → Monday, October 26th, 2026 | mqt_v_js 3816.7, mecalendar.perf 1961.9, RenderThread 742.5, HeapTaskDaemon 140.8 |
| reversal-10 | 315 | 18 | 25 | 30 | 48 | 34.3% | 2 | 5.71% | 6592/5288 | Monday, October 26th, 2026 → Monday, October 26th, 2026 | mecalendar.perf 3460.9, RenderThread 2530, mqt_v_js 338.9, Jit thread pool 129.6 |
| diagonal-20 | 916 | 14 | 19 | 25 | 38 | 89.4% | 2 | 4.26% | 27077/25808 | Monday, October 26th, 2026 → Monday, October 26th, 2026 | RenderThread 8214.4, mecalendar.perf 3852.8, mqt_v_js 986.1, binder:29745_3 281.2 |
