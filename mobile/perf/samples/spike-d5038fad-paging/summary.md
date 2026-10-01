# spike-d5038fad-paging

- Device: ONEPLUS A6003, Android 15, 60 Hz, Physical size: 1080x2280, Physical density: 450
- Package: fr.samuelprak.timecalendar.perf 4.0.0
- URL: timecalendar-perf://dev-paging-spike?android=paging
- Recorded: 2026-10-01T22:50:12.118Z
- Cold launch TotalTime: 7637 ms
- Android views in the activity: 665 after launch, 726 after all scenarios

| Scenario | Frames | p50 ms | p95 ms | p99 ms | Max ms | ≤16 ms | >33 ms | Janky (HWUI) | Gesture ms (achieved/planned) | Probe before → after | Thread CPU ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| swipe-forward-20 | 231 | 17 | 40 | 48 | 73 | 49.8% | 18 | 15.58% | 7131/5858 | settled=2026-09-28 page=0 base=0 pph=60 cross=0 settle=0 rebase=0 pageMounts=0 commit=0.0/0.0ms → settled=2026-12-28 page=13 base=0 pph=60 cross=13 settle=1 rebase=0 pageMounts=18 commit=32.4/73.2ms | mecalendar.perf 3081.2, RenderThread 1900.9, mqt_v_js 1680.1, Jit thread pool 162.9 |
| fling-5 | 126 | 16 | 44 | 53 | 53 | 51.6% | 13 | 17.46% | 5607/4358 | settled=2026-12-28 page=13 base=0 pph=60 cross=13 settle=1 rebase=0 pageMounts=18 commit=32.4/73.2ms → settled=2027-02-01 page=18 base=0 pph=60 cross=18 settle=6 rebase=0 pageMounts=23 commit=40.8/73.2ms | mecalendar.perf 2131.3, mqt_v_js 1803.1, RenderThread 1158.3, hades 112.9 |
