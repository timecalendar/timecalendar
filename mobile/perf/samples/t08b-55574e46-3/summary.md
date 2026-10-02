# cand555-3

- Device: ONEPLUS A6003, Android 15, 60 Hz, Physical size: 1080x2280, Physical density: 450
- Package: fr.samuelprak.timecalendar.perf 4.0.0
- URL: timecalendar-perf://calendar?focusDate=2026-10-05
- Recorded: 2026-10-02T09:27:52.658Z
- Cold launch TotalTime: 7552 ms
- Android views in the activity: 802 after launch, 396 after all scenarios

| Scenario | Frames | p50 ms | p95 ms | p99 ms | Max ms | ≤16 ms | >33 ms | Janky (HWUI) | Gesture ms (achieved/planned) | Probe before → after | Thread CPU ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| swipe-forward-20 | 326 | 14 | 26 | 48 | 53 | 75.2% | 12 | 7.98% | 7097/5858 | Monday, October 5th, 2026 → Monday, January 18th, 2027 | mecalendar.perf 3163.8, mqt_v_js 2570.5, RenderThread 2252.8, Jit thread pool 185.2 |
| swipe-back-20 | 332 | 15 | 30 | 48 | 61 | 72.9% | 14 | 9.94% | 7102/5858 | Monday, January 18th, 2027 → Monday, September 28th, 2026 | mecalendar.perf 3139.2, mqt_v_js 2774.4, RenderThread 2380.6, Jit thread pool 139.5 |
| reversal-10 | 269 | 16 | 32 | 42 | 46 | 52% | 13 | 12.64% | 6597/5288 | Monday, September 28th, 2026 → Monday, September 28th, 2026 | mecalendar.perf 2609.3, RenderThread 2455.9, mqt_v_js 1689.2, Profile Saver 94 |
| diagonal-20 | 365 | 14 | 36 | 81 | 150 | 74.8% | 20 | 13.15% | 27089/25808 | Monday, September 28th, 2026 → Monday, February 15th, 2027 | mqt_v_js 5790.3, mecalendar.perf 5718.5, RenderThread 2614.5, hades 290.1 |
| fling-5 | 223 | 14 | 20 | 22 | 27 | 86.5% | 0 | 6.73% | 5599/4358 | Monday, February 15th, 2027 → Monday, March 22nd, 2027 | mecalendar.perf 1930.2, RenderThread 1658.2, mqt_v_js 1428.7, Jit thread pool 53.3 |
