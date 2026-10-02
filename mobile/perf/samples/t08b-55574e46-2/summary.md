# cand555-2

- Device: ONEPLUS A6003, Android 15, 60 Hz, Physical size: 1080x2280, Physical density: 450
- Package: fr.samuelprak.timecalendar.perf 4.0.0
- URL: timecalendar-perf://calendar?focusDate=2026-10-05
- Recorded: 2026-10-02T09:25:12.770Z
- Cold launch TotalTime: 7583 ms
- Android views in the activity: 802 after launch, 396 after all scenarios

| Scenario | Frames | p50 ms | p95 ms | p99 ms | Max ms | ≤16 ms | >33 ms | Janky (HWUI) | Gesture ms (achieved/planned) | Probe before → after | Thread CPU ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| swipe-forward-20 | 339 | 14 | 25 | 44 | 48 | 75.2% | 11 | 9.14% | 7134/5858 | Monday, October 5th, 2026 → Monday, January 25th, 2027 | mecalendar.perf 3221.9, mqt_v_js 2750.4, RenderThread 2306.6, Jit thread pool 205.5 |
| swipe-back-20 | 339 | 14 | 29 | 44 | 57 | 77% | 13 | 8.55% | 7097/5858 | Monday, January 25th, 2027 → Monday, October 5th, 2026 | mecalendar.perf 3150, mqt_v_js 2670.5, RenderThread 2344.5, Jit thread pool 136.2 |
| reversal-10 | 287 | 16 | 28 | 40 | 44 | 56.1% | 9 | 10.45% | 6579/5288 | Monday, October 5th, 2026 → Monday, October 5th, 2026 | mecalendar.perf 2649.3, RenderThread 2453.1, mqt_v_js 1763.4, Profile Saver 102.6 |
| diagonal-20 | 352 | 14 | 32 | 85 | 97 | 74.7% | 16 | 13.92% | 27078/25808 | Monday, October 5th, 2026 → Monday, February 22nd, 2027 | mecalendar.perf 5583.1, mqt_v_js 5336.6, RenderThread 2458.3, hades 190.2 |
| fling-5 | 232 | 14 | 18 | 23 | 32 | 90.1% | 0 | 5.17% | 5660/4358 | Monday, February 22nd, 2027 → Monday, March 29th, 2027 | mecalendar.perf 1935.2, mqt_v_js 1658.7, RenderThread 1641.5, hades 108.6 |
