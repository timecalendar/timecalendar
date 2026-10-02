# cand555-4

- Device: ONEPLUS A6003, Android 15, 60 Hz, Physical size: 1080x2280, Physical density: 450
- Package: fr.samuelprak.timecalendar.perf 4.0.0
- URL: timecalendar-perf://calendar?focusDate=2026-10-05
- Recorded: 2026-10-02T09:30:32.784Z
- Cold launch TotalTime: 7528 ms
- Android views in the activity: 802 after launch, 396 after all scenarios

| Scenario | Frames | p50 ms | p95 ms | p99 ms | Max ms | ≤16 ms | >33 ms | Janky (HWUI) | Gesture ms (achieved/planned) | Probe before → after | Thread CPU ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| swipe-forward-20 | 301 | 15 | 27 | 48 | 53 | 71.8% | 13 | 8.97% | 7180/5858 | Monday, October 5th, 2026 → Monday, January 18th, 2027 | mecalendar.perf 3035.5, mqt_v_js 2466.1, RenderThread 2044.4, Jit thread pool 162.6 |
| swipe-back-20 | 310 | 15 | 31 | 42 | 61 | 74.2% | 12 | 10% | 7152/5858 | Monday, January 18th, 2027 → Monday, September 28th, 2026 | mecalendar.perf 3029.3, mqt_v_js 2653.8, RenderThread 2150.2, Jit thread pool 141.4 |
| reversal-10 | 287 | 16 | 31 | 40 | 48 | 53.3% | 11 | 10.1% | 6556/5288 | Monday, September 28th, 2026 → Monday, September 28th, 2026 | mecalendar.perf 2662.8, RenderThread 2511.2, mqt_v_js 1726.4, binder:30462_2 83.5 |
| diagonal-20 | 357 | 15 | 38 | 89 | 109 | 78.7% | 24 | 13.17% | 27078/25808 | Monday, September 28th, 2026 → Monday, February 15th, 2027 | mecalendar.perf 5679.2, mqt_v_js 5678.7, RenderThread 2427.2, hades 308.3 |
| fling-5 | 224 | 14 | 19 | 23 | 61 | 87.1% | 2 | 5.8% | 5603/4358 | Monday, February 15th, 2027 → Monday, March 22nd, 2027 | mecalendar.perf 2024.5, RenderThread 1608.8, mqt_v_js 1547.9, binder:30462_4 47.7 |
