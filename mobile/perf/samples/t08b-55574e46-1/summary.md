# cand555-1

- Device: ONEPLUS A6003, Android 15, 60 Hz, Physical size: 1080x2280, Physical density: 450
- Package: fr.samuelprak.timecalendar.perf 4.0.0
- URL: timecalendar-perf://calendar?focusDate=2026-10-05
- Recorded: 2026-10-02T09:22:33.063Z
- Cold launch TotalTime: 7600 ms
- Android views in the activity: 802 after launch, 396 after all scenarios

| Scenario | Frames | p50 ms | p95 ms | p99 ms | Max ms | ≤16 ms | >33 ms | Janky (HWUI) | Gesture ms (achieved/planned) | Probe before → after | Thread CPU ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| swipe-forward-20 | 334 | 14 | 26 | 48 | 57 | 76.9% | 13 | 8.08% | 7131/5858 | Monday, October 5th, 2026 → Monday, January 18th, 2027 | mecalendar.perf 3171.7, mqt_v_js 2567.5, RenderThread 2272, Jit thread pool 173.3 |
| swipe-back-20 | 329 | 14 | 32 | 44 | 65 | 73.6% | 16 | 9.73% | 7117/5858 | Monday, January 18th, 2027 → Monday, September 28th, 2026 | mecalendar.perf 3065.4, mqt_v_js 2774.7, RenderThread 2361.4, HeapTaskDaemon 129.1 |
| reversal-10 | 289 | 17 | 31 | 40 | 48 | 47.8% | 13 | 11.42% | 6543/5288 | Monday, September 28th, 2026 → Monday, September 28th, 2026 | mecalendar.perf 2666.2, RenderThread 2646.3, mqt_v_js 1716.7, Profile Saver 105.4 |
| diagonal-20 | 363 | 15 | 34 | 85 | 93 | 69.4% | 21 | 14.05% | 27086/25808 | Monday, September 28th, 2026 → Monday, February 15th, 2027 | mqt_v_js 5757.8, mecalendar.perf 5653.1, RenderThread 2606.1, hades 303.6 |
| fling-5 | 225 | 14 | 19 | 26 | 53 | 84.4% | 1 | 4.44% | 5644/4358 | Monday, February 15th, 2027 → Monday, March 22nd, 2027 | mecalendar.perf 1959.4, RenderThread 1721.9, mqt_v_js 1472.3, binder:24416_1 59.7 |
