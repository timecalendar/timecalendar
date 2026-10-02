# cand555-5

- Device: ONEPLUS A6003, Android 15, 60 Hz, Physical size: 1080x2280, Physical density: 450
- Package: fr.samuelprak.timecalendar.perf 4.0.0
- URL: timecalendar-perf://calendar?focusDate=2026-10-05
- Recorded: 2026-10-02T09:33:12.257Z
- Cold launch TotalTime: 7496 ms
- Android views in the activity: 802 after launch, 396 after all scenarios

| Scenario | Frames | p50 ms | p95 ms | p99 ms | Max ms | ≤16 ms | >33 ms | Janky (HWUI) | Gesture ms (achieved/planned) | Probe before → after | Thread CPU ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| swipe-forward-20 | 329 | 14 | 27 | 46 | 48 | 74.8% | 12 | 8.21% | 7127/5858 | Monday, October 5th, 2026 → Monday, January 25th, 2027 | mecalendar.perf 3083.3, mqt_v_js 2672.7, RenderThread 2220.4, Jit thread pool 183.5 |
| swipe-back-20 | 335 | 15 | 31 | 42 | 69 | 75.2% | 12 | 9.55% | 7114/5858 | Monday, January 25th, 2027 → Monday, October 5th, 2026 | mecalendar.perf 3174.1, mqt_v_js 2736.2, RenderThread 2382.8, Jit thread pool 134.8 |
| reversal-10 | 301 | 16 | 32 | 42 | 89 | 51.8% | 13 | 10.3% | 6562/5288 | Monday, October 5th, 2026 → Monday, September 28th, 2026 | mecalendar.perf 2839.8, RenderThread 2739.2, mqt_v_js 2354, binder:32481_2 84.5 |
| diagonal-20 | 360 | 15 | 32 | 85 | 89 | 71.7% | 18 | 13.89% | 27119/25808 | Monday, September 28th, 2026 → Monday, February 15th, 2027 | mqt_v_js 5776.1, mecalendar.perf 5658.1, RenderThread 2524.7, hades 200.3 |
| fling-5 | 225 | 14 | 21 | 25 | 61 | 87.1% | 1 | 4.89% | 5680/4358 | Monday, February 15th, 2027 → Monday, March 22nd, 2027 | mecalendar.perf 1943.4, RenderThread 1671.2, mqt_v_js 1579.5, binder:32481_2 63.4 |
