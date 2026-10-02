# t08-2cc9ff0b

- Device: ONEPLUS A6003, Android 15, 60 Hz, Physical size: 1080x2280, Physical density: 450
- Package: fr.samuelprak.timecalendar.perf 4.0.0
- URL: timecalendar-perf://calendar?focusDate=2026-10-05
- Recorded: 2026-10-02T00:45:45.593Z
- Cold launch TotalTime: 7491 ms
- Android views in the activity: 712 after launch, 396 after all scenarios

| Scenario | Frames | p50 ms | p95 ms | p99 ms | Max ms | ≤16 ms | >33 ms | Janky (HWUI) | Gesture ms (achieved/planned) | Probe before → after | Thread CPU ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| pinch-3s | 97 | 46 | 65 | 85 | 85 | 11.3% | 75 | 74.23% | 4262/3008 | Monday, October 5th, 2026 → Monday, October 5th, 2026 | mecalendar.perf 3309.8, RenderThread 755.7, mqt_v_js 423.4, Jit thread pool 98.3 |
| reversal-10 | 282 | 16 | 38 | 48 | 61 | 62.1% | 17 | 10.99% | 6601/5288 | Monday, October 5th, 2026 → Monday, October 5th, 2026 | mecalendar.perf 2936.4, RenderThread 2150.4, mqt_v_js 1652.9, Jit thread pool 151.9 |
| swipe-forward-20 | 334 | 14 | 31 | 42 | 48 | 74.3% | 11 | 8.08% | 7120/5858 | Monday, October 5th, 2026 → Monday, February 22nd, 2027 | mecalendar.perf 3004.2, mqt_v_js 2779.7, RenderThread 2160.7, HeapTaskDaemon 135.7 |
| swipe-back-20 | 336 | 14 | 31 | 44 | 53 | 78.3% | 14 | 9.23% | 7102/5858 | Monday, February 22nd, 2027 → Monday, October 12th, 2026 | mqt_v_js 3195.7, mecalendar.perf 3017.2, RenderThread 2035.9, Jit thread pool 83.3 |
| fling-5 | 232 | 15 | 38 | 53 | 85 | 73.7% | 14 | 6.03% | 5625/4358 | Monday, October 12th, 2026 → Monday, November 16th, 2026 | mecalendar.perf 2167.9, RenderThread 1957, mqt_v_js 1678.7, HeapTaskDaemon 130.5 |
| diagonal-20 | 378 | 14 | 34 | 65 | 73 | 79.4% | 22 | 11.38% | 27089/25808 | Monday, November 16th, 2026 → Monday, April 5th, 2027 | mecalendar.perf 4871.2, mqt_v_js 4163.2, RenderThread 2317.2, binder:25543_1 141.8 |
| vertical-scroll | 125 | 14 | 16 | 29 | 30 | 96% | 0 | 4% | 4995/3728 | Monday, April 5th, 2027 → Monday, April 5th, 2027 | mecalendar.perf 1072.7, RenderThread 1044.6, mqt_v_js 486.3, binder:25543_1 53.4 |
