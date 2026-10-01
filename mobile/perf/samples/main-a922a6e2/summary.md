# main-a922a6e2

- Device: ONEPLUS A6003, Android 15, 60 Hz, Physical size: 1080x2280, Physical density: 450
- Package: fr.samuelprak.timecalendar.perf 4.0.0
- URL: timecalendar-perf://calendar?focusDate=2026-10-05
- Recorded: 2026-10-01T20:38:13.922Z
- Cold launch TotalTime: 7538 ms
- Android views in the activity: 692 after launch, 495 after all scenarios

| Scenario | Frames | p50 ms | p95 ms | p99 ms | Max ms | ≤16 ms | >33 ms | Janky (HWUI) | Gesture ms (achieved/planned) | Probe before → after | Thread CPU ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| swipe-forward-20 | 293 | 15 | 32 | 150 | 150 | 85.7% | 13 | 5.12% | 7085/5858 | Monday, October 5th, 2026 → Monday, November 9th, 2026 | mqt_v_js 6688.3, mecalendar.perf 2792.2, RenderThread 1293.6, hades 394.4 |
| swipe-back-20 | 330 | 15 | 22 | 109 | 150 | 90.9% | 13 | 3.33% | 7080/5858 | Monday, November 9th, 2026 → Monday, October 5th, 2026 | mqt_v_js 6704.7, mecalendar.perf 2578.3, RenderThread 1330.6, hades 287.3 |
| fling-5 | 98 | 17 | 57 | 150 | 150 | 38.8% | 10 | 8.16% | 5579/4358 | Monday, October 5th, 2026 → Monday, October 26th, 2026 | mqt_v_js 3757.2, mecalendar.perf 1974.7, RenderThread 690.8, HeapTaskDaemon 151.5 |
| vertical-scroll | 148 | 14 | 28 | 32 | 38 | 79.1% | 1 | 5.41% | 5015/3728 | Monday, October 26th, 2026 → Monday, October 26th, 2026 | mecalendar.perf 1220, RenderThread 1139, mqt_v_js 1128.6, binder:29322_3 49.7 |
| pinch-3s | 94 | 46 | 65 | 69 | 69 | 21.3% | 69 | 77.66% | 4261/3008 | Monday, October 26th, 2026 → Monday, October 26th, 2026 | mecalendar.perf 3303.1, mqt_v_js 578.3, RenderThread 576.3, HeapTaskDaemon 121.5 |
