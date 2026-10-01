# main-40eb2241

- Device: ONEPLUS A6003, Android 15, 60 Hz, Physical size: 1080x2280, Physical density: 450
- Package: fr.samuelprak.timecalendar.perf 4.0.0
- URL: timecalendar-perf://calendar?focusDate=2026-10-05
- Recorded: 2026-10-01T22:38:49.703Z
- Cold launch TotalTime: 7584 ms
- Android views in the activity: 692 after launch, 577 after all scenarios

| Scenario | Frames | p50 ms | p95 ms | p99 ms | Max ms | ≤16 ms | >33 ms | Janky (HWUI) | Gesture ms (achieved/planned) | Probe before → after | Thread CPU ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| swipe-forward-20 | 312 | 14 | 24 | 113 | 150 | 87.8% | 11 | 4.81% | 7083/5858 | – → – | mqt_v_js 7069.5, mecalendar.perf 2913.6, RenderThread 1336.5, hades 280.8 |
| swipe-back-20 | 315 | 15 | 24 | 117 | 150 | 88.9% | 12 | 3.49% | 7077/5858 | – → – | mqt_v_js 6837.5, mecalendar.perf 2689.8, RenderThread 1326.5, hades 296.9 |
| fling-5 | 115 | 15 | 53 | 125 | 150 | 62.6% | 6 | 6.96% | 5590/4358 | – → – | mqt_v_js 3846.9, mecalendar.perf 1968.4, RenderThread 741.1, HeapTaskDaemon 135.1 |
| reversal-10 | 300 | 17 | 22 | 29 | 117 | 46.7% | 3 | 5% | 6564/5288 | – → – | mecalendar.perf 3155.6, RenderThread 2201.8, mqt_v_js 1570.1, hades 180.9 |
| diagonal-20 | 915 | 16 | 21 | 27 | 32 | 75% | 0 | 4.59% | 27072/25808 | – → – | RenderThread 10120.4, mecalendar.perf 3852.1, mqt_v_js 1199.5, binder:26881_3 189.7 |
| vertical-scroll | 143 | 18 | 27 | 36 | 38 | 40.6% | 2 | 6.29% | 5014/3728 | – → – | RenderThread 1562.8, mecalendar.perf 1155.9, mqt_v_js 1131.9, binder:26881_2 62.1 |
| pinch-3s | 81 | 61 | 85 | 97 | 97 | 18.5% | 55 | 74.07% | 4290/3008 | – → – | mecalendar.perf 3275.4, RenderThread 653.5, mqt_v_js 484.6, HeapTaskDaemon 46.2 |
